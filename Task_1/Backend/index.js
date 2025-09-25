
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { logger, morganStream } = require('./utils/logger');
const morgan = require('morgan');
const swaggerDocs = require('./swagger');

const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(morgan('combined', { stream: morganStream }));

// Routes

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware

app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ success: false, msg: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server is listening at port ${PORT}....`);
    swaggerDocs(app, PORT);
});