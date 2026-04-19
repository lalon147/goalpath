const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const milestoneController = require('../controllers/milestoneController');
const auth = require('../middleware/auth');
const { validate, createGoalSchema, updateGoalSchema, createMilestoneSchema, updateMilestoneSchema } = require('../validators/goalValidator');

// All goal routes require auth
router.use(auth);

// Goals CRUD
router.post('/', validate(createGoalSchema), goalController.createGoal);
router.get('/', goalController.getGoals);
router.get('/:goalId', goalController.getGoal);
router.put('/:goalId', validate(updateGoalSchema), goalController.updateGoal);
router.delete('/:goalId', goalController.deleteGoal);

// Milestones (nested under goals)
router.post('/:goalId/milestones', validate(createMilestoneSchema), milestoneController.createMilestone);
router.get('/:goalId/milestones', milestoneController.getMilestones);
router.put('/:goalId/milestones/:milestoneId', validate(updateMilestoneSchema), milestoneController.updateMilestone);
router.post('/:goalId/milestones/:milestoneId/complete', milestoneController.completeMilestone);
router.delete('/:goalId/milestones/:milestoneId', milestoneController.deleteMilestone);

module.exports = router;
