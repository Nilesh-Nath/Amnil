const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const {
    ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
    ACCESS_TOKEN_EXP,
    REFRESH_TOKEN_EXP
} = process.env;

function signAccessToken(user) {
    const { uid, username } = user;
    return jwt.sign({ uid, username }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXP });
}

function signRefreshToken(user) {
    const { uid, username } = user;
    return jwt.sign({ uid, username }, REFRESH_TOKEN_SECRET, { expiresIn: `${REFRESH_TOKEN_EXP}d` });
}

async function saveToken(user, refreshToken, expdate) {
    const { uid } = user;
    const query = 'INSERT INTO Refresh_token (uid,token,exp_date) VALUES ($1,$2,$3)';
    await pool.query(query, [uid, refreshToken, expdate]);
}

async function getToken(token) {
    const query = 'SELECT * FROM Refresh_token WHERE token = $1';
    const { rows } = await pool.query(query, [token]);
    return rows[0];
}

async function deleteAllTokens(uid) {
    await pool.query("DELETE FROM Refresh_token WHERE UID = $1", [uid]);
}

async function deleteToken(token) {
    const query = "DELETE FROM refresh_token WHERE token = $1";
    await pool.query(query, [token]);
}

module.exports = {
    signAccessToken,
    signRefreshToken,
    saveToken,
    getToken,
    deleteAllTokens,
    deleteToken
};