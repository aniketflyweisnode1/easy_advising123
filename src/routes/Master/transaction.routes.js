const express = require('express');
const router = express.Router();
const { createTransaction, createTransactionByAdmin, getTransactionById, getAllTransactions, updateTransaction } = require('../../controller/transaction.controller');
const { auth } = require('../../middleware/authMiddleware');

router.post('/', auth, createTransaction);
// Admin recharge user wallet
router.post('/admin-recharge', auth, createTransactionByAdmin);
router.get('/:id', auth, getTransactionById);
router.get('/', auth, getAllTransactions);
router.put('/', auth, updateTransaction);

module.exports = router; 