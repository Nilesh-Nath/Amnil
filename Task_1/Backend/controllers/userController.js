const pool = require('../config/database');

const getUserData = async (req, res) => {
    try {
        const UID = req.user.uid;
        const data = await pool.query('SELECT * FROM users WHERE UID = $1', [UID]);
        return res.status(200).json({ success: true, data: data.rows[0] });
    } catch (err) {
        return res.status(500).json({ success: false, msg: 'Error occurred while fetching data!' });
    }
};

module.exports = {
    getUserData
};
