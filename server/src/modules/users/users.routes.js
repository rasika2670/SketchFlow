const { Router } = require('express');
const usersController = require('./users.controller');
const { authenticate } = require('../../middleware/auth');

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/profile', usersController.getProfile);
router.put('/profile', usersController.updateProfile);
router.get('/search', usersController.searchUsers);

module.exports = router;
