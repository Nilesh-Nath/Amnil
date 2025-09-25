const express = require('express');
const {
    addIncome,
    addExpense,
    getAllExpenses,
    getExpenses,
    updateExpense,
    deleteExpense,
    getBalance,
    getDailyExpense,
    getExpenseByCategory
} = require('../controllers/expenseController');
const { authenticateAccessToken } = require('../middleware/auth');

const router = express.Router();

router.post('/income', authenticateAccessToken, addIncome);
router.post('/', authenticateAccessToken, addExpense);
router.get('/all', authenticateAccessToken, getAllExpenses);
router.get('/', authenticateAccessToken, getExpenses);
router.put('/:eid', authenticateAccessToken, updateExpense);
router.delete('/:eid', authenticateAccessToken, deleteExpense);
router.get('/balance', authenticateAccessToken, getBalance);
router.get('/daily', authenticateAccessToken, getDailyExpense);
router.get('/by-category', authenticateAccessToken, getExpenseByCategory);

module.exports = router;
