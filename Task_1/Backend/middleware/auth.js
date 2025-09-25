const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET } = process.env;

const authenticateAccessToken = async (req, res, next) => {
    const header = req.headers["authorization"];

    if (!header) return res.status(401).json({ success: false, msg: 'No authorization header' });

    const token = header.split(" ")[1];

    if (!token) return res.status(401).json({ success: false, msg: 'Bad auth request' });

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, payload) => {
        if (err) return res.status(400).json({ msg: 'Invalid token' });
        req.user = payload;
        next();
    });
};

module.exports = { authenticateAccessToken };