const express = require('express')
require('dotenv').config()
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { Pool } = require('pg')

const app = express()
const PORT = process.env.PORT || 5000;

const pool = new Pool({
    user: process.env.DB_USER,
    host : process.env.DB_HOST,
    database : process.env.DB_DATABASE,
    password : process.env.DB_PASSWORD,
    port : process.env.DB_PORT
})

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))

app.use(express.json())
app.use(cookieParser())

pool.connect((err)=>{
    if(err){
        console.log(err)
    }
    console.log('Database connected!')
})


const authCheck = async (req,res,next)=>{
    const userData = req.cookies.UserData;

    if(!userData){
        return res.status(400).json({success:false,msg : 'Unauthorized access!'})
    }
    
    const now = new Date();
    const expiresAt = new Date(userData.expiresAt);

    if(now > expiresAt){
        try{
            const result = await pool.query('SELECT UID FROM users WHERE username = $1',[userData.username])
            const UID = result.rows[0].uid;

            if(UID){
                 await pool.query('UPDATE expenses SET active = 0 WHERE uid = $1', [UID]);
            }
        }catch(err){
            console.log(`Error : ${err}`)
        }
        return res.status(401).json({ success: false, msg: 'Session expired. Please login again.' });
    }

    next();
}


app.post('/income',async (req,res)=>{
    try{
        const { userData } = req.body

        if(!userData || userData.username === '' || !userData.income){
            return res.status(400).json({success:false,msg : 'Invalid user data!'})
        }

        const query = ' INSERT INTO users(username,income) VALUES ($1,$2)'
        await pool.query(query,[userData.username,userData.income])

        res.cookie('UserData',userData,{
            secure: false,
            maxAge : 7 * 24 * 60 * 60 * 1000
        })

        return res.status(200).json({success:true , msg : 'Income set!'})
    }catch(err){
        return res.status(500).json({success : false, msg: 'Error occured while setting income!'})
    }
})

app.post('/expenses',authCheck,async (req,res)=>{
    try{
        const { formData } = req.body;

        const user = req.cookies.UserData;

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

app.get('/getData',authCheck,async (req,res)=>{
    try{
        const user = req.cookies.UserData;

        const result = await pool.query('SELECT UID FROM users WHERE username = $1',[user.username]);

        const UID = result.rows[0].uid;

        const data = await pool.query('SELECT * FROM users WHERE UID = $1',[UID])

        return res.status(200).json({success:true,data : data.rows[0]})

    }catch(err){
        return res.status(500).json({success:false,msg : 'Error occured while fetching data!'})
    }
})

app.get('/getExpenses',authCheck,async (req,res)=>{
    try{
        const user = req.cookies.UserData;

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

app.get('/getBalance',authCheck,async (req,res)=>{
    try{

        const username = req.cookies.UserData.username;
        const TotalIncome = req.cookies.UserData.income;


        const result = await pool.query('SELECT UID FROM users WHERE username = $1',[username]);

        const UID = result.rows[0].uid;

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

app.get('/getDailyExpense',authCheck,async (req,res)=>{
    try{

        const username = req.cookies.UserData.username;

        const result = await pool.query('SELECT UID FROM users WHERE username = $1',[username]);

        const UID = result.rows[0].uid;


        const query = 'SELECT SUM(amount),day FROM expenses WHERE uid = $1 AND active = 1 GROUP BY day'

        const result1 = await pool.query(query,[UID]);

        return res.status(200).json({success:true,data : result1.rows})

    }catch(err){
        return res.status(500).json({success:false,message: `Error while fetching chart data : ${err}`});
    }
})

app.get('/getExpenseByCategory',authCheck,async (req,res)=>{
    try{

        const username = req.cookies.UserData.username;

        const result = await pool.query('SELECT UID FROM users WHERE username = $1',[username]);

        const UID = result.rows[0].uid;


        const query = 'SELECT SUM(amount),category FROM expenses WHERE uid = $1 AND active = 1 GROUP BY category;'

        const result1 = await pool.query(query,[UID]);

        return res.status(200).json({success:true,data : result1.rows})

    }catch(err){
        return res.status(500).json({success:false,message: `Error while fetching chart data : ${err}`});
    }
})

app.listen(PORT,()=>{
    console.log(`Server is listening at port ${PORT}....`);
})