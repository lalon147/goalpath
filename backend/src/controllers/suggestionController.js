const asyncHandler = require('../middleware/asyncHandler');
const suggestionService = require('../services/suggestionService');

exports.suggest = asyncHandler(async (req, res) => {
  if (!suggestionService.isAvailable()) {
    // Not an error the user caused — the clients fall back to their built-in
    // engine when they see this, so it must be distinguishable from a failure.
    return res.status(503).json({
      success: false,
      error: {
        code: 'SUGGESTIONS_UNAVAILABLE',
        message: 'AI suggestions are not configured on this server'
      }
    });
  }

  const { kind, title, category, description, weeks } = req.body;

  try {
    let data;
    if (kind === 'habits') {
      data = { habits: await suggestionService.suggestHabits({ title, category }) };
    } else if (kind === 'daily-practice') {
      data = await suggestionService.suggestDailyPractice({ title, category, description, weeks });
    } else {
      data = { milestones: await suggestionService.suggestMilestones({ title, category, description }) };
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err.code === 'SUGGESTION_REFUSED' || err.code === 'SUGGESTION_EMPTY') {
      return res.status(422).json({
        success: false,
        error: { code: err.code, message: err.message }
      });
    }
    throw err;
  }
});
