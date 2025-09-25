const express = require('express');
const { uploadProfilePic } = require('../controllers/uploadController');
const { authenticateAccessToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.post('/profile-pic', authenticateAccessToken, upload.single('profilePic'), uploadProfilePic);

module.exports = router;