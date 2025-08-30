const express = require('express');
const router = express.Router();
const { auth } = require('../../utils/jwtUtils.js');
const { getWallet, getWalletByAuth, updateWallet, getWalletByUserId, getAllWallet } = require('../../controller/wallet.controller.js');

// /:id - getwallet - Created: 2025-07-14
router.get('/:id', auth, getWallet);

// /:id - updatewallet - Created: 2025-07-14
// router.put('/:id', auth, updateWallet);


// /auth/wallet - getwalletbyauth - Created: 2025-01-27
router.get('/auth/wallet', auth, getWalletByAuth);

// /user/:user_id - getwalletbyuserId - Created: 2025-07-14
router.get('/user/:user_id', auth, getWalletByUserId);

// / - getallwallet - Created: 2025-07-14
router.get('/', auth, getAllWallet);

module.exports = router; 