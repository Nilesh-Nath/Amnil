const express = require('express')
require('dotenv').config()
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const swaggerDocs = require('./swagger.js')

const morgan = require('morgan')
const winston = require('winston')

const multer = require('multer');
const sharp = require('sharp');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;

const app = express()
const PORT = process.env.PORT || 5000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
})

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}))

const pool = new Pool({
    user: process.env.DB_USER,
    host : process.env.DB_HOST,
    database : process.env.DB_DATABASE,
    password : process.env.DB_PASSWORD,
    port : process.env.DB_PORT
})

const {
    ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
    ACCESS_TOKEN_EXP,
    REFRESH_TOKEN_EXP,
    SENDER_EMAIL,
    SENDER_EMAIL_PASSWORD
} = process.env;

// in build middlewares

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))

app.use(express.json())
app.use(cookieParser())

// DB connection test

pool.connect((err)=>{
    if(err){
        console.log(err)
    }
    console.log('Database connected!')
})

// Helper methods


function signAccessToken(user){
    const { uid , username } = user
    return jwt.sign({ uid : uid , username : username },ACCESS_TOKEN_SECRET,{expiresIn : ACCESS_TOKEN_EXP});
}

function signRefreshToken(user){
    const { uid ,username } = user
    return jwt.sign({uid:uid,username: username},REFRESH_TOKEN_SECRET,{expiresIn: `${REFRESH_TOKEN_EXP}d`});
}

async function saveToken(user, refreshToken , expdate){
    
    const { uid } = user;
    
    const query = 'INSERT INTO Refresh_token (UID,Token,Exp_date) VALUES ($1,$2,$3)'

    await pool.query(query,[uid,refreshToken,expdate]);
}

async function getToken(token){
    const query = 'SELECT * FROM Refresh_token WHERE token = $1'
    const { rows } = await pool.query(query,[token])
    return rows[0]
}

async function deleteAllTokens(uid){
    await pool.query("DELETE FROM Refresh_token WHERE UID = $1",[uid])
}

async function deleteToken(token){
    const query = "DELETE FROM refresh_token WHERE token = $1"
    await pool.query(query,[token])
}

async function sendEmail(to,subject,text){
    console.log(SENDER_EMAIL)
    console.log(SENDER_EMAIL_PASSWORD)
    const transporter = nodemailer.createTransport({
        service : 'gmail',
          port: 587,
         secure: false,
        auth : {
            user : SENDER_EMAIL,
            pass : SENDER_EMAIL_PASSWORD
        }
    })

    await transporter.sendMail({
        from : SENDER_EMAIL,
        to,
        subject,
        text
    })
}


// middleware

// const authCheck = async (req,res,next)=>{
//     const userData = req.cookies.UserData;

//     if(!userData){
//         return res.status(400).json({success:false,msg : 'Unauthorized access!'})
//     }
    
//     const now = new Date();
//     const expiresAt = new Date(userData.expiresAt);

//     if(now > expiresAt){
//         try{
//             const result = await pool.query('SELECT UID FROM users WHERE username = $1',[userData.username])
//             const UID = result.rows[0].uid;

//             if(UID){
//                  await pool.query('UPDATE expenses SET active = 0 WHERE uid = $1', [UID]);
//             }
//         }catch(err){
//             console.log(`Error : ${err}`)
//         }
//         return res.status(401).json({ success: false, msg: 'Session expired. Please login again.' });
//     }

//     next();
// }

const authenticateAccessToken = async (req,res,next)=>{
    const header = req.headers["authorization"]

    if(!header) return res.status(401).json({success:false,msg : 'No autherization header'})

    const token = header.split(" ")[1]

    if(!token) return res.json(401).json({success:false,msg : 'Bad auth request'})
    
    jwt.verify(token,ACCESS_TOKEN_SECRET,(err,payload)=>{
        if(err) return res.status(400).json({msg : 'Invalid token'})
        req.user = payload
        next()
    })
}


// Helper: upload buffer to Cloudinary (returns upload result)
function uploadBufferToCloudinary(buffer, folder = 'profile_pics') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// Auth

app.post('/signup',async (req,res)=>{
    try{
        const { formData } = req.body;
        const { email , username, password } = formData;
        
        const user = await pool.query('SELECT * FROM users WHERE username = $1',[username])

        if(user.rowCount > 0){
            return res.status(400).json({success:false,msg : 'User with username already exists!'});
        }

        const salt = await bcrypt.genSalt(12);
        
        const hashedPassword = await bcrypt.hash(password,salt)
        
        await pool.query('INSERT INTO users (username,password,email) VALUES ($1,$2,$3)',[ username, hashedPassword , email]);

        logger.info(`New user registered: ${username}`)

        return res.status(200).json({success:true,msg : 'Account registered!'})

    }catch(err){
        logger.error(`Signup error: ${err}`)
        console.log(`Err : ${err}`)
    }
})

app.post("/login",async (req,res)=>{
    try{
        const { username , password } = req.body.formData;
        
        const user = await pool.query('SELECT * FROM Users WHERE username = $1',[username])

        if(user.rowCount == 0){
            return res.status(400).json({success:false,msg : 'Username not found!'})
        }
        
        const validPass = await bcrypt.compare(password,user.rows[0].password)

        if(!validPass){
            return res.status(402).json({success:false,msg : 'Password Incorrect!'})
        }

        const accessToken = signAccessToken(user.rows[0])
        const refreshToken = signRefreshToken(user.rows[0])

        const exp_at = new Date()
        exp_at.setDate(exp_at.getDate() + parseInt(REFRESH_TOKEN_EXP,10)) 
        await saveToken(user.rows[0],refreshToken,exp_at)

        res.cookie("refreshToken",refreshToken ,{
            httpOnly: true,
            secure : false,
            sameSite : 'lax',
            maxAge : 1000 * 60 * 60 * 24 * parseInt(REFRESH_TOKEN_EXP , 10)
        })
        logger.info(`User logged in: ${username}`)
        return res.status(200).json({success:true,msg : 'Logging in ...' , accessToken : accessToken, user: {
        uid: user.rows[0].uid,
        username: user.rows[0].username
    }})

    }catch(err){
        logger.error(`Login error: ${err}`)
        console.log(`Err : ${err}`)
    }
})

app.post('/refresh',async (req,res)=>{
    const token = req.cookies.refreshToken;

    if(!token){
        return res.status(401).json({success:false,msg : 'Invalid Token'})
    }

    const storedToken = await getToken(token)

    if(!storedToken) return res.json({msg : 'No token found!'})
    
    try{
        const payload = jwt.verify(token,REFRESH_TOKEN_SECRET)
        const { rows } = await pool.query('SELECT uid,username FROM Users WHERE uid = $1',[payload.uid])

        const user = rows[0]

        if(!user) {
            await deleteAllTokens(payload.uid)
            res.status(401).json({success:false,  msg : 'No user found!'})
        }

        const newAccessToken = signAccessToken(user)
        await deleteToken(payload.uid)

        const newRefreshToken = signRefreshToken(user)

        const expire_at = new Date()
        expire_at.setDate(expire_at.getDate() + parseInt(REFRESH_TOKEN_EXP,10))
        await saveToken(user,newRefreshToken,expire_at)

        res.cookie("refreshToken",newRefreshToken,{
            httpOnly:true,
            secure:false,
            sameSite : 'lax',
            maxAge : 1000 * 60 * 60 * 24 * parseInt(REFRESH_TOKEN_EXP,10)
        })

        res.status(200).json({success:true,accessToken : newAccessToken,user:user})

    }catch(err){

        await deleteToken(token)
        console.log(`Err : ${err}`)
        return res.status(403).json({ success: false, msg: 'Invalid or expired refresh token' });
    }

})

app.post('/forget-password',async (req,res)=>{
    const { email } = req.body;
    
    try{
        const user = await pool.query('SELECT * FROM users WHERE email = $1',[email])

        if(user.rows.length === 0) return res.status(401).json({success:false,msg : 'No user found!'})
        
        const resetToken = crypto.randomBytes(32).toString('hex')
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
        
        const reset_token_expiry = new Date(Date.now() + 1000 * 60 * 15);

        await pool.query('UPDATE users SET reset_token = $1 , rest_token_expiry = $2 WHERE email = $3',[hashedToken,reset_token_expiry,user.rows[0].email])

        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

        await sendEmail(user.rows[0].email,'Reset your password',`Click here : ${resetLink}`);

        return res.status(200).json({success:true,msg : 'Reset link sent to your email'})

    }catch(err){
        console.log(`Err : ${err}`)
        return res.status(500).json({success:false,msg : 'Something went wrong.'})
    }

})

app.post('/reset-password/:token',async (req,res)=>{
    const {token} = req.params;

    const  { password } = req.body;

    try{
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
        const user = await pool.query('SELECT * FROM users WHERE reset_token = $1',[hashedToken])

        if(user.rows.length === 0) return res.status(400).json({success:false,msg : 'Invalid token!'})

        const now = new Date()

        if(now > user.rows[0].rest_token_expiry) return res.status(400).json({success:false,msg : 'Expired token!'})
        
        const salt = await bcrypt.genSalt(12)
        const hashedPassword = await bcrypt.hash(password,salt)

        await pool.query('UPDATE users SET password = $1 , reset_token = NULL , rest_token_expiry = NULL WHERE UID = $2',[hashedPassword , user.rows[0].uid])

        return res.status(200).json({success:true,msg : 'Password reset successfully.'})

    }catch(err){
        console.log(`Err : ${err}`)
        return res.status(500).json({success:false,msg : 'Something went wrong!'})
    }
})

app.post('/income',authenticateAccessToken,async (req,res)=>{
    try{
        const { userData } = req.body
        const { uid } = req.user

        if(!userData || !userData.income || userData.income < 0){
            return res.status(400).json({success:false,msg : 'Please enter valid income!'})
        }

        const query = ' INSERT INTO income(uid,income) VALUES ($1,$2)'
        await pool.query(query,[uid,userData.income])

        return res.status(200).json({success:true , msg : 'Income set!'})
    }catch(err){
        return res.status(500).json({success : false, msg: `Error : ${err}`})
    }
})

app.post('/expenses',authenticateAccessToken,async (req,res)=>{
    try{
        const { formData } = req.body;

        const user = req.user;

        if (!formData || !user || !user.username) {
            return res.status(400).json({ success: false, msg: 'Invalid input or missing user data!' });
        }
        
        const result = await pool.query('SELECT UID FROM users WHERE username = $1',[user.username])
        
        const UID = result.rows[0].uid;

        const expenses = await pool.query('SELECT SUM(amount) FROM expenses WHERE UID = $1 AND active = 1',[UID])

        var total = Number(expenses.rows[0].sum) + Number(formData.amount)
       
        if(total > user.income){
            return res.status(400).json({success:false,msg : `Limit reached for expense !`})
        }

        const query = 'INSERT INTO expenses (UID,category,amount,day,description) VALUES($1,$2,$3,$4,$5)'
        
        await pool.query(query,[UID,formData.category,formData.amount,formData.day,formData.description])

        return res.status(200).json({ success: true, msg: 'Expense recorded successfully.' });

    }catch(err){
        return res.status(500).json({success:false,msg : `Error occured while recording expenses : ${err}.`})
    }
})

app.post('/logout',async (req,res)=>{
    try{
        const token = req.cookies.refreshToken;
        console.log(token)
        if(!token){
            return res.status(401).json({success:false,msg : 'Token not found!'})
        }

        await deleteToken(token)

        res.clearCookie('refreshToken',{
            httpOnly:true,
            secure:false,
            sameSite: 'lax'
        })

        return res.status(200).json({success:true,msg : 'Logged out!'})

    }catch(err){
        return res.status(500).json({success:false,msg : `${err}`})
    }
})

// app.get('/getData',authenticateAccessToken,async (req,res)=>{
//     try{
//         const user = req.user;

//         const result = await pool.query('SELECT UID FROM users WHERE username = $1',[user.username]);

//         const UID = result.rows[0].uid;

//         const data = await pool.query('SELECT * FROM users WHERE UID = $1',[UID])

//         return res.status(200).json({success:true,data : data.rows[0]})

//     }catch(err){
//         return res.status(500).json({success:false,msg : 'Error occured while fetching data!'})
//     }
// })

app.get('/getAllExpenses',authenticateAccessToken,async (req,res)=>{
    try{
        const UID = req.user.uid;
        const limit = parseInt(req.query.limit) || 2;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const CountQuery = await pool.query('SELECT COUNT(*) FROM Expenses WHERE UID = $1',[UID])
        const totalItems = parseInt(CountQuery.rows[0].count);
        const totalPages = Math.ceil(totalItems/limit);

        const { rows } = await pool.query('SELECT * FROM Expenses WHERE uid = $1 ORDER BY date,eid DESC LIMIT $2 OFFSET $3',[UID,limit,offset])

        return res.status(200).json({success:true,data : rows, pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }})

    }catch(err){
        return res.status(500).json({success:false,msg : `Err : ${err}`})
    }
})

app.get('/getData',authenticateAccessToken,async (req,res)=>{
    try{
        const UID = req.user.uid;

        const data = await pool.query('SELECT * FROM users WHERE UID = $1',[UID])

        return res.status(200).json({success:true,data : data.rows[0]})

    }catch(err){
        return res.status(500).json({success:false,msg : 'Error occured while fetching data!'})
    }
})

app.get('/getExpenses',authenticateAccessToken,async (req,res)=>{
    try{
        const user = req.user;

        const result = await pool.query('SELECT UID FROM users WHERE username = $1',[user.username]);

        const UID = result.rows[0].uid;

        const data = await pool.query('SELECT * FROM expenses WHERE UID = $1 AND active = 1',[UID])

        return res.status(200).json({success:true,data : data.rows})

    }catch(err){
        return res.status(500).json({success:false,msg : 'Error occured while fetching data!'})
    }
})

app.put('/expenses/:eid', async (req, res) => {
  const { eid } = req.params;
  const { day, category, amount, description } = req.body;

  try {
    await pool.query(
      'UPDATE expenses SET day = $1, category = $2, amount = $3, description = $4 WHERE eid = $5',
      [day, category, amount, description, eid]
    );
    res.status(200).json({ success: true, message: 'Expense updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating expense' });
  }
});



app.delete('/deleteExpense/:eid', async (req, res) => {
  try {
    const eid = req.params.eid;
    await pool.query('DELETE FROM expenses WHERE eid = $1', [eid]);
    res.status(200).json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting expense' });
  }
});

app.get('/getBalance',authenticateAccessToken,async (req,res)=>{
    try{

        const username = req.user.username;
        const UID = req.user.uid;
        
        const result = await pool.query('SELECT income FROM income WHERE uid = $1',[UID]);
        const TotalIncome = result.rows[0].income;

        const result1 = await pool.query('SELECT SUM(amount) FROM expenses WHERE uid = $1 AND active = 1',[UID])

        const TotalExpenses = result1.rows[0].sum || 0;
        const Savings = TotalIncome - TotalExpenses;

        const data = {
            TotalIncome,
            TotalExpenses,
            Savings
        };

        return res.status(200).json({success:true,data})

    }catch(err){
        res.status(500).json({ success: false, message: `Error while fetching details : ${err}` });
    }
})

app.get('/getDailyExpense',authenticateAccessToken,async (req,res)=>{
    try{

        const username = req.user.username;

        const result = await pool.query('SELECT UID FROM users WHERE username = $1',[username]);

        const UID = result.rows[0].uid;


        const query = 'SELECT SUM(amount),day FROM expenses WHERE uid = $1 AND active = 1 GROUP BY day'

        const result1 = await pool.query(query,[UID]);

        return res.status(200).json({success:true,data : result1.rows})

    }catch(err){
        return res.status(500).json({success:false,message: `Error while fetching chart data : ${err}`});
    }
})

app.get('/getExpenseByCategory',authenticateAccessToken,async (req,res)=>{
    try{

        const username = req.user.username;

        const result = await pool.query('SELECT UID FROM users WHERE username = $1',[username]);

        const UID = result.rows[0].uid;


        const query = 'SELECT SUM(amount),category FROM expenses WHERE uid = $1 AND active = 1 GROUP BY category;'

        const result1 = await pool.query(query,[UID]);

        return res.status(200).json({success:true,data : result1.rows})

    }catch(err){
        return res.status(500).json({success:false,message: `Error while fetching chart data : ${err}`});
    }
})

// Upload route

app.post('/uploadProfilePic', authenticateAccessToken, upload.single('profilePic'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const userId = req.user.uid;
    const processedBuffer = await sharp(req.file.buffer)
      .resize(512, 512, { fit: 'cover' }) 
      .webp({ quality: 80 })
      .toBuffer();

    const uploadResult = await uploadBufferToCloudinary(processedBuffer, 'profile_pics');

    const { secure_url: secureUrl, public_id: publicId } = uploadResult;

    const findRes = await pool.query('SELECT profile_pic_public_id FROM users WHERE uid = $1', [userId]);
    const oldPublicId = findRes.rows[0]?.profile_pic_public_id;

    console.log(secureUrl , publicId , userId)

    await pool.query(
      'UPDATE users SET profile_pic_url = $1, profile_pic_public_id = $2 WHERE uid = $3',
      [secureUrl, publicId, userId]
    );

    if (oldPublicId && oldPublicId !== publicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'image' });
      } catch (err) {
        console.warn('Failed to delete previous Cloudinary image:', err.message);
      }
    }

    return res.json({ msg: 'Profile picture uploaded', profilePic: secureUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ msg: 'Failed to upload image', error: err.message });
  }
});

app.get('/getData', authenticateAccessToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query('SELECT uid, username, email, profile_pic_url FROM users WHERE uid=$1', [userId]);
    if (!result.rows[0]) return res.status(404).json({ msg: 'User not found' });
    return res.json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

app.listen(PORT,()=>{
    console.log(`Server is listening at port ${PORT}....`);
    swaggerDocs(app,PORT)
})