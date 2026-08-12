const express = require('express');
const Joi = require('joi');
const router = express.Router();
const goalController = require('../controllers/goalController');
const milestoneController = require('../controllers/milestoneController');
const goalMemberController = require('../controllers/goalMemberController');
const auth = require('../middleware/auth');
const { validate, createGoalSchema, updateGoalSchema, createMilestoneSchema, updateMilestoneSchema } = require('../validators/goalValidator');

const inviteSchema = Joi.object({
  userId: Joi.string().hex().length(24),
  username: Joi.string().trim().lowercase().min(3).max(20)
}).or('userId', 'username');

const respondSchema = Joi.object({
  accept: Joi.boolean().required()
});

// All goal routes require auth
router.use(auth);

// Goals CRUD
router.post('/', validate(createGoalSchema), goalController.createGoal);
router.get('/', goalController.getGoals);
router.get('/:goalId', goalController.getGoal);
router.put('/:goalId', validate(updateGoalSchema), goalController.updateGoal);
router.delete('/:goalId', goalController.deleteGoal);

// Shared goals: members, invitations and the per-member leaderboard.
// Declared before the milestone routes purely for readability; the paths do not
// overlap, so order does not affect matching here.
router.get('/invitations/pending', goalMemberController.listInvitations);
router.post('/:goalId/members', validate(inviteSchema), goalMemberController.invite);
router.post('/:goalId/members/respond', validate(respondSchema), goalMemberController.respond);
router.get('/:goalId/leaderboard', goalMemberController.leaderboard);
router.delete('/:goalId/members/:userId', goalMemberController.remove);

// Milestones (nested under goals)
router.post('/:goalId/milestones', validate(createMilestoneSchema), milestoneController.createMilestone);
router.get('/:goalId/milestones', milestoneController.getMilestones);
router.put('/:goalId/milestones/:milestoneId', validate(updateMilestoneSchema), milestoneController.updateMilestone);
router.post('/:goalId/milestones/:milestoneId/complete', milestoneController.completeMilestone);
router.delete('/:goalId/milestones/:milestoneId/complete', milestoneController.uncompleteMilestone);
router.delete('/:goalId/milestones/:milestoneId', milestoneController.deleteMilestone);

module.exports = router;
