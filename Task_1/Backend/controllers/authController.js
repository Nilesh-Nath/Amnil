const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/database');
const { logger } = require('../utils/logger');
const { sendEmail } = require('../utils/email');
const {
    signAccessToken,
    signRefreshToken,
    saveToken,
    getToken,
    deleteToken,
    deleteAllTokens
} = require('../utils/tokenUtils');

const jwt = require('jsonwebtoken')

const { REFRESH_TOKEN_EXP, REFRESH_TOKEN_SECRET , ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXP } = process.env;

const signup = async (req, res) => {
    try {
        const { formData } = req.body;
        const { email, username, password } = formData;

        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (user.rowCount > 0) {
            return res.status(400).json({ success: false, msg: 'User with username already exists!' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.query('INSERT INTO users (username,password,email) VALUES ($1,$2,$3)', [username, hashedPassword, email]);

        logger.info(`New user registered: ${username}`);

        return res.status(200).json({ success: true, msg: 'Account registered!' });

    } catch (err) {
        logger.error(`Signup error: ${err}`);
        return res.status(500).json({ success: false, msg: 'Registration failed' });
    }
};

const refresh = async (req, res) => {
    console.log('🟡 Refresh endpoint called');
    console.log('🟡 Cookies received:', req.cookies);
    
    const token = req.cookies.refreshToken;
    console.log('🟡 Refresh token from cookie:', token);
    console.log('🟡 Token exists:', !!token);
    console.log('🟡 Token length:', token ? token.length : 'N/A');

    if (!token) {
        console.log('🔴 No refresh token in cookies');
        return res.status(401).json({ success: false, msg: 'No refresh token provided' });
    }

    try {
        console.log('🟡 Looking up token in database...');
        const storedToken = await getToken(token);
        console.log('🟡 Stored token found:', !!storedToken);
        
        if (storedToken) {
            console.log('🟡 Stored token details:', {
                uid: storedToken.uid,
                expires: storedToken.exp_date,
                tokenLength: storedToken.token?.length
            });
        }

        if (!storedToken) {
            console.log('🔴 Token not found in database');
            return res.status(401).json({ success: false, msg: 'Token not found in database' });
        }

        // Check if token is expired
        const now = new Date();
        const expiry = new Date(storedToken.exp_date);
        console.log('🟡 Current time:', now);
        console.log('🟡 Token expiry:', expiry);
        console.log('🟡 Token expired:', now > expiry);

        if (now > expiry) {
            console.log('🔴 Token is expired');
            await deleteToken(token);
            return res.status(401).json({ success: false, msg: 'Token expired' });
        }

        console.log('🟡 Verifying JWT...');
        console.log('🟡 REFRESH_TOKEN_SECRET exists:', !!REFRESH_TOKEN_SECRET);
        
        const payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
        console.log('🟢 JWT verified successfully:', payload);

        const { rows } = await pool.query('SELECT uid, username FROM Users WHERE uid = $1', [payload.uid]);
        const user = rows[0];
        console.log('🟡 User found:', !!user);

        if (!user) {
            console.log('🔴 User not found for uid:', payload.uid);
            await deleteAllTokens(payload.uid);
            return res.status(401).json({ success: false, msg: 'User not found' });
        }

        console.log('🟢 Generating new tokens...');
        const newAccessToken = signAccessToken(user);
        const newRefreshToken = signRefreshToken(user);

        console.log('🟡 Deleting old token...');
        await deleteToken(token);

        console.log('🟡 Saving new token...');
        const expire_at = new Date();
        expire_at.setDate(expire_at.getDate() + parseInt(REFRESH_TOKEN_EXP, 10));
        await saveToken(user, newRefreshToken, expire_at);

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * parseInt(REFRESH_TOKEN_EXP, 10)
        });

        console.log('🟢 Refresh successful');
        return res.status(200).json({ success: true, accessToken: newAccessToken, user: user });

    } catch (err) {
        console.error('🔴 Refresh error details:', err);
        console.error('🔴 Error name:', err.name);
        console.error('🔴 Error message:', err.message);
        
        if (err.name === 'JsonWebTokenError') {
            console.log('🔴 JWT verification failed - invalid token format');
        } else if (err.name === 'TokenExpiredError') {
            console.log('🔴 JWT verification failed - token expired');
        }

        await deleteToken(token);
        return res.status(403).json({ success: false, msg: 'Invalid or expired refresh token' });
    }
}

const login = async (req, res) => {
    try {
        const { username, password } = req.body.formData;
        
        const user = await pool.query('SELECT * FROM Users WHERE username = $1', [username]);

        if (user.rowCount == 0) {
            return res.status(400).json({ success: false, msg: 'Username not found!' });
        }
        
        const validPass = await bcrypt.compare(password, user.rows[0].password);

        if (!validPass) {
            return res.status(402).json({ success: false, msg: 'Password Incorrect!' });
        }

        console.log('🟢 User authenticated:', user.rows[0].uid, user.rows[0].username);

        const accessToken = signAccessToken(user.rows[0]);
        const refreshToken = signRefreshToken(user.rows[0]);

        console.log('🟢 Tokens generated:');
        console.log('Access Token Length:', accessToken.length);
        console.log('Refresh Token:', refreshToken); // Log full token for debugging
        console.log('Refresh Token Length:', refreshToken.length);

        const exp_at = new Date();
        exp_at.setDate(exp_at.getDate() + parseInt(REFRESH_TOKEN_EXP, 10));
        
        console.log('🟢 Expiry date calculated:', exp_at);
        console.log('🟢 REFRESH_TOKEN_EXP:', REFRESH_TOKEN_EXP);

        // Add try-catch around saveToken
        try {
            await saveToken(user.rows[0], refreshToken, exp_at);
            console.log('🟢 Token saved successfully to database');
        } catch (saveError) {
            console.error('🔴 Error saving token:', saveError);
            return res.status(500).json({ success: false, msg: 'Failed to save refresh token' });
        }

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * parseInt(REFRESH_TOKEN_EXP, 10)
        });

        console.log('🟢 Cookie set with maxAge:', 1000 * 60 * 60 * 24 * parseInt(REFRESH_TOKEN_EXP, 10));

        logger.info(`User logged in: ${username}`);
        
        return res.status(200).json({
            success: true,
            msg: 'Logging in ...',
            accessToken: accessToken,
            user: {
                uid: user.rows[0].uid,
                username: user.rows[0].username
            }
        });

    } catch (err) {
        console.error('🔴 Login error:', err);
        logger.error(`Login error: ${err}`);
        return res.status(500).json({ success: false, msg: 'Login failed' });
    }
}

// const login = async (req, res) => {
//     try {
//         const { username, password } = req.body.formData;

//         const user = await pool.query('SELECT * FROM Users WHERE username = $1', [username]);

//         if (user.rowCount == 0) {
//             return res.status(400).json({ success: false, msg: 'Username not found!' });
//         }

//         const validPass = await bcrypt.compare(password, user.rows[0].password);

//         if (!validPass) {
//             return res.status(402).json({ success: false, msg: 'Password Incorrect!' });
//         }

//         const accessToken = signAccessToken(user.rows[0]);
//         const refreshToken = signRefreshToken(user.rows[0]);

//         const exp_at = new Date();
//         exp_at.setDate(exp_at.getDate() + parseInt(REFRESH_TOKEN_EXP, 10));


//         await saveToken(user.rows[0], refreshToken, exp_at);

//         res.cookie("refreshToken", refreshToken, {
//             httpOnly: true,
//             secure: false,
//             sameSite: 'lax',
//             maxAge: 1000 * 60 * 60 * 24 * parseInt(REFRESH_TOKEN_EXP, 10)
//         });

//         logger.info(`User logged in: ${username}`);

//         return res.status(200).json({
//             success: true,
//             msg: 'Logging in ...',
//             accessToken: accessToken,
//             user: {
//                 uid: user.rows[0].uid,
//                 username: user.rows[0].username
//             }
//         });

//     } catch (err) {
//         logger.error(`Login error: ${err}`);
//         return res.status(500).json({ success: false, msg: 'Login failed' });
//     }
// };

// const refresh = async (req,res)=>{
//     const token = req.cookies.refreshToken;

//     if(!token){
//         return res.status(401).json({success:false,msg : 'Invalid Token'})
//     }

//     const storedToken = await getToken(token)

//     if(!storedToken) return res.json({msg : 'No token found!'})
    
//     try{
//         const payload = jwt.verify(token,REFRESH_TOKEN_SECRET)
//         const { rows } = await pool.query('SELECT uid,username FROM Users WHERE uid = $1',[payload.uid])

//         const user = rows[0]

//         if(!user) {
//             await deleteAllTokens(payload.uid)
//             res.status(401).json({success:false,  msg : 'No user found!'})
//         }

//         const newAccessToken = signAccessToken(user)
//         await deleteToken(payload.uid)

//         const newRefreshToken = signRefreshToken(user)

//         const expire_at = new Date()
//         expire_at.setDate(expire_at.getDate() + parseInt(REFRESH_TOKEN_EXP,10))
//         await saveToken(user,newRefreshToken,expire_at)

//         res.cookie("refreshToken",newRefreshToken,{
//             httpOnly:true,
//             secure:false,
//             sameSite : 'lax',
//             maxAge : 1000 * 60 * 60 * 24 * parseInt(REFRESH_TOKEN_EXP,10)
//         })

//         res.status(200).json({success:true,accessToken : newAccessToken,user:user})

//     }catch(err){

//         await deleteToken(token)
//         console.log(`Err : ${err}`)
//         return res.status(403).json({ success: false, msg: 'Invalid or expired refresh token' });
//     }
// }

const forgetPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) return res.status(401).json({ success: false, msg: 'No user found!' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        const reset_token_expiry = new Date(Date.now() + 1000 * 60 * 15);

        await pool.query('UPDATE users SET reset_token = $1 , rest_token_expiry = $2 WHERE email = $3', [hashedToken, reset_token_expiry, user.rows[0].email]);

        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

        await sendEmail(user.rows[0].email, 'Reset your password', `Click here : ${resetLink}`);

        return res.status(200).json({ success: true, msg: 'Reset link sent to your email' });

    } catch (err) {
        return res.status(500).json({ success: false, msg: 'Something went wrong.' });
    }
};

const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await pool.query('SELECT * FROM users WHERE reset_token = $1', [hashedToken]);

        if (user.rows.length === 0) return res.status(400).json({ success: false, msg: 'Invalid token!' });

        const now = new Date();

        if (now > user.rows[0].rest_token_expiry) return res.status(400).json({ success: false, msg: 'Expired token!' });

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.query('UPDATE users SET password = $1 , reset_token = NULL , rest_token_expiry = NULL WHERE UID = $2', [hashedPassword, user.rows[0].uid]);

        return res.status(200).json({ success: true, msg: 'Password reset successfully.' });

    } catch (err) {
        return res.status(500).json({ success: false, msg: 'Something went wrong!' });
    }
};

const logout = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token) {
            return res.status(401).json({ success: false, msg: 'Token not found!' });
        }

        await deleteToken(token);

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax'
        });

        return res.status(200).json({ success: true, msg: 'Logged out!' });

    } catch (err) {
        return res.status(500).json({ success: false, msg: `${err}` });
    }
};

module.exports = {
    signup,
    login,
    refresh,
    forgetPassword,
    resetPassword,
    logout
};
