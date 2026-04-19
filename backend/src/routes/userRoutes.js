const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { validate, updateProfileSchema, changePasswordSchema } = require('../validators/authValidator');

router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, validate(updateProfileSchema), userController.updateProfile);
router.post('/change-password', auth, validate(changePasswordSchema), userController.changePassword);

module.exports = router;
