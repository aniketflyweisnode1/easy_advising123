const Wallet = require('../models/wallet.model.js');

const getWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const wallet = await Wallet.findOne({ wallet_id: id });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found', status: 404 });
        }
        return res.status(200).json({ wallet, status: 200 });
    } catch (error) {
        return res.status(500).json({ message: error.message || error, status: 500 });
    }
};

const updateWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        if (req.user && req.user.user_id) {
            updateData.updated_by = req.user.user_id;
        }
        
        const wallet = await Wallet.findOneAndUpdate(
            { wallet_id: id },
            updateData,
            { new: true }
        );
        
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found', status: 404 });
        }
        
        return res.status(200).json({ message: 'Wallet updated successfully', wallet, status: 200 });
    } catch (error) {
        return res.status(500).json({ message: error.message || error, status: 500 });
    }
};

const getWalletByUserId = async (req, res) => {
    try {
        const { user_id } = req.params;
        const wallet = await Wallet.findOne({ user_id: user_id });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found for this user', status: 404 });
        }
        return res.status(200).json({ wallet, status: 200 });
    } catch (error) {
        return res.status(500).json({ message: error.message || error, status: 500 });
    }
};

const getAllWallet = async (req, res) => {
    try {
        const wallets = await Wallet.find();
        return res.status(200).json({ wallets, status: 200 });
    } catch (error) {
        return res.status(500).json({ message: error.message || error, status: 500 });
    }
};

const getWalletByAuth = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const wallet = await Wallet.findOne({ user_id: user_id });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found for this user', status: 404 });
        }
        return res.status(200).json({ wallet, status: 200 });
    } catch (error) {
        return res.status(500).json({ message: error.message || error, status: 500 });
    }
};

module.exports = { 
    getWallet, 
    updateWallet, 
    getWalletByUserId, 
    getAllWallet ,
    getWalletByAuth
}; 