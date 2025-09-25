
const express = require('express');
const {
    signup,
    login,
    refresh,
    forgetPassword,
    resetPassword,
    logout
} = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forget-password', forgetPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/logout', logout);

module.exports = router;