const pool = require('../config/database');
const { logger } = require('../utils/logger');

const addIncome = async (req, res) => {
    try {
        const { userData } = req.body;
        const { uid } = req.user;

        if (!userData || !userData.income || userData.income < 0) {
            return res.status(400).json({ success: false, msg: 'Please enter valid income!' });
        }

        const query = 'INSERT INTO income(uid,income) VALUES ($1,$2)';
        await pool.query(query, [uid, userData.income]);

        return res.status(200).json({ success: true, msg: 'Income set!' });
    } catch (err) {
        return res.status(500).json({ success: false, msg: `Error : ${err}` });
    }
};

const addExpense = async (req, res) => {
    try {
        const { formData } = req.body;
        const user = req.user;

        if (!formData || !user || !user.username) {
            return res.status(400).json({ success: false, msg: 'Invalid input or missing user data!' });
        }

        const result = await pool.query('SELECT UID FROM users WHERE username = $1', [user.username]);
        const UID = result.rows[0].uid;

        const expenses = await pool.query('SELECT SUM(amount) FROM expenses WHERE UID = $1 AND active = 1', [UID]);
        const total = Number(expenses.rows[0].sum) + Number(formData.amount);

        if (total > user.income) {
            return res.status(400).json({ success: false, msg: `Limit reached for expense!` });
        }

        const query = 'INSERT INTO expenses (UID,category,amount,day,description) VALUES($1,$2,$3,$4,$5)';
        await pool.query(query, [UID, formData.category, formData.amount, formData.day, formData.description]);

        return res.status(200).json({ success: true, msg: 'Expense recorded successfully.' });

    } catch (err) {
        return res.status(500).json({ success: false, msg: `Error occurred while recording expenses: ${err}` });
    }
};

const getAllExpenses = async (req, res) => {
    try {
        const UID = req.user.uid;
        const limit = parseInt(req.query.limit) || 2;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const CountQuery = await pool.query('SELECT COUNT(*) FROM Expenses WHERE UID = $1', [UID]);
        const totalItems = parseInt(CountQuery.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        const { rows } = await pool.query('SELECT * FROM Expenses WHERE uid = $1 ORDER BY date,eid DESC LIMIT $2 OFFSET $3', [UID, limit, offset]);

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (err) {
        return res.status(500).json({ success: false, msg: `Error: ${err}` });
    }
};

const getExpenses = async (req, res) => {
    try {
        const user = req.user;
        const result = await pool.query('SELECT UID FROM users WHERE username = $1', [user.username]);
        const UID = result.rows[0].uid;

        const data = await pool.query('SELECT * FROM expenses WHERE UID = $1 AND active = 1', [UID]);

        return res.status(200).json({ success: true, data: data.rows });

    } catch (err) {
        return res.status(500).json({ success: false, msg: 'Error occurred while fetching data!' });
    }
};

const updateExpense = async (req, res) => {
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
};

const deleteExpense = async (req, res) => {
    try {
        const eid = req.params.eid;
        await pool.query('DELETE FROM expenses WHERE eid = $1', [eid]);
        res.status(200).json({ success: true, message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error deleting expense' });
    }
};

const getBalance = async (req, res) => {
    try {
        const UID = req.user.uid;

        const result = await pool.query('SELECT income FROM income WHERE uid = $1', [UID]);
        const TotalIncome = result.rows[0].income;

        const result1 = await pool.query('SELECT SUM(amount) FROM expenses WHERE uid = $1 AND active = 1', [UID]);
        const TotalExpenses = result1.rows[0].sum || 0;
        const Savings = TotalIncome - TotalExpenses;

        const data = {
            TotalIncome,
            TotalExpenses,
            Savings
        };

        return res.status(200).json({ success: true, data });

    } catch (err) {
        res.status(500).json({ success: false, message: `Error while fetching details: ${err}` });
    }
};

const getDailyExpense = async (req, res) => {
    try {
        const username = req.user.username;
        const result = await pool.query('SELECT UID FROM users WHERE username = $1', [username]);
        const UID = result.rows[0].uid;

        const query = 'SELECT SUM(amount),day FROM expenses WHERE uid = $1 AND active = 1 GROUP BY day';
        const result1 = await pool.query(query, [UID]);

        return res.status(200).json({ success: true, data: result1.rows });

    } catch (err) {
        return res.status(500).json({ success: false, message: `Error while fetching chart data: ${err}` });
    }
};

const getExpenseByCategory = async (req, res) => {
    try {
        const username = req.user.username;
        const result = await pool.query('SELECT UID FROM users WHERE username = $1', [username]);
        const UID = result.rows[0].uid;

        const query = 'SELECT SUM(amount),category FROM expenses WHERE uid = $1 AND active = 1 GROUP BY category;';
        const result1 = await pool.query(query, [UID]);

        return res.status(200).json({ success: true, data: result1.rows });

    } catch (err) {
        return res.status(500).json({ success: false, message: `Error while fetching chart data: ${err}` });
    }
};

module.exports = {
    addIncome,
    addExpense,
    getAllExpenses,
    getExpenses,
    updateExpense,
    deleteExpense,
    getBalance,
    getDailyExpense,
    getExpenseByCategory
};