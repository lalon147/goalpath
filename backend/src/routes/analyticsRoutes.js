const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/goals/:goalId', analyticsController.getGoalProgress);
router.get('/habits/:habitId', analyticsController.getHabitStats);

module.exports = router;
