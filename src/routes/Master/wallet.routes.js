const express = require('express');
const router = express.Router();
const { auth } = require('../../utils/jwtUtils.js');
const { 
    createWallet,
    getWallet, 
    updateWallet, 
    getWalletByUserId, 
    getAllWallet,
    getWalletByAuth,
    addMoney,
    deductMoney,
    deleteWallet
} = require('../../controller/wallet.controller.js');

// POST / - Create wallet
router.post('/', auth, createWallet);

// GET / - Get all wallets
router.get('/', auth, getAllWallet);

// GET /auth/wallet - Get wallet by authenticated user
router.get('/auth/wallet', auth, getWalletByAuth);

// GET /user/:user_id - Get wallet by user_id
router.get('/user/:user_id', auth, getWalletByUserId);

// GET /:id - Get wallet by wallet_id
router.get('/:id', auth, getWallet);

// PUT /:id - Update wallet
router.put('/:id', auth, updateWallet);

// POST /add-money - Add money to wallet
router.post('/add-money', auth, addMoney);

// POST /deduct-money - Deduct money from wallet
router.post('/deduct-money', auth, deductMoney);

// DELETE /:id - Delete wallet
router.delete('/:id', auth, deleteWallet);

module.exports = router; 