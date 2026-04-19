const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const habitLogController = require('../controllers/habitLogController');
const auth = require('../middleware/auth');
const { validate, createHabitSchema, updateHabitSchema, logHabitSchema, updateLogSchema } = require('../validators/habitValidator');

router.use(auth);

// Habits CRUD
router.post('/', validate(createHabitSchema), habitController.createHabit);
router.get('/', habitController.getHabits);
router.get('/:habitId', habitController.getHabit);
router.put('/:habitId', validate(updateHabitSchema), habitController.updateHabit);
router.delete('/:habitId', habitController.deleteHabit);

// Habit logs
router.post('/:habitId/log', validate(logHabitSchema), habitLogController.logHabit);
router.get('/:habitId/logs', habitLogController.getLogs);
router.put('/:habitId/logs/:logId', validate(updateLogSchema), habitLogController.updateLog);
router.delete('/:habitId/logs/:logId', habitLogController.deleteLog);

module.exports = router;
