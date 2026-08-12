const express = require('express');
const Joi = require('joi');
const router = express.Router();
const friendController = require('../controllers/friendController');
const auth = require('../middleware/auth');
const { validate } = require('../validators/authValidator');

// Either identifier is enough, but one of them has to be there.
const sendRequestSchema = Joi.object({
  userId: Joi.string().hex().length(24),
  username: Joi.string().trim().lowercase().min(3).max(20)
}).or('userId', 'username');

router.use(auth);

router.get('/', friendController.list);
router.get('/search', friendController.search);
router.get('/requests', friendController.listRequests);
router.post('/requests', validate(sendRequestSchema), friendController.sendRequest);
router.post('/requests/:friendshipId/accept', friendController.accept);
router.post('/requests/:friendshipId/decline', friendController.decline);
router.delete('/:friendshipId', friendController.remove);

module.exports = router;
