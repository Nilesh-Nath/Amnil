const express = require('express');
const { getUserData } = require('../controllers/userController');
const { authenticateAccessToken } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authenticateAccessToken, getUserData);

module.exports = router;