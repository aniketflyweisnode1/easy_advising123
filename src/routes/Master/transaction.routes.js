const express = require('express');
const router = express.Router();
const { createTransaction, createTransactionByAdmin, getTransactionById, getAllTransactions, updateTransaction, getTransactionsbyauth } = require('../../controller/transaction.controller');
const { auth } = require('../../middleware/authMiddleware');

router.post('/', auth, createTransaction);
// Admin recharge user wallet
router.post('/admin-recharge', auth, createTransactionByAdmin);
router.get('/:id', auth, getTransactionById);
router.get('/', auth, getAllTransactions);
router.get('/my-transactions', auth, getTransactionsbyauth);
router.put('/', auth, updateTransaction);

// Get transactions with filters as URL parameters
// Basic route with status only
router.get('/status/:status', auth, getAllTransactions);

// Route with status and transactionType
router.get('/status/:status/type/:transactionType', auth, getAllTransactions);

// Route with status, transactionType and date range
router.get('/status/:status/type/:transactionType/:date_from/:date_to', auth, getAllTransactions);

// Route with transactionType only
router.get('/type/:transactionType', auth, getAllTransactions);

// Route with transactionType and date range
router.get('/type/:transactionType/:date_from/:date_to', auth, getAllTransactions);

// Route with user_id only
router.get('/user/:user_id', auth, getAllTransactions);

// Route with user_id and status
router.get('/user/:user_id/status/:status', auth, getAllTransactions);

// Route with user_id, status and transactionType
router.get('/user/:user_id/status/:status/type/:transactionType', auth, getAllTransactions);

// Route with user_id, status, transactionType and date range
router.get('/user/:user_id/status/:status/type/:transactionType/:date_from/:date_to', auth, getAllTransactions);

// Route with user_id and transactionType
router.get('/user/:user_id/type/:transactionType', auth, getAllTransactions);

// Route with user_id, transactionType and date range
router.get('/user/:user_id/type/:transactionType/:date_from/:date_to', auth, getAllTransactions);

module.exports = router; 