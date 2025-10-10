const Wallet = require('../models/wallet.model.js');

// Create Wallet
const createWallet = async (req, res) => {
    try {
        const { user_id, role_id, amount } = req.body;
        
        // Validate required fields
        if (!user_id || !role_id) {
            return res.status(400).json({ 
                success: false,
                message: 'user_id and role_id are required',
                status: 400 
            });
        }
        
        // Check if wallet already exists for this user
        const existingWallet = await Wallet.findOne({ user_id: user_id });
        if (existingWallet) {
            return res.status(400).json({ 
                success: false,
                message: 'Wallet already exists for this user',
                status: 400 
            });
        }
        
        // Create wallet
        const walletData = {
            user_id: Array.isArray(user_id) ? user_id : [user_id],
            role_id,
            amount: amount || 0,
            status: 1
        };
        
        const wallet = new Wallet(walletData);
        await wallet.save();
        
        // Populate and return
        const populatedWallet = await Wallet.findOne({ wallet_id: wallet.wallet_id })
            .populate({ 
                path: 'user_id', 
                model: 'User', 
                localField: 'user_id', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id' 
            })
            .populate({ 
                path: 'role_id', 
                model: 'Role', 
                localField: 'role_id', 
                foreignField: 'role_id', 
                select: 'role_id role_name description' 
            });
        
        return res.status(201).json({ 
            success: true,
            message: 'Wallet created successfully',
            wallet: populatedWallet, 
            status: 201 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message || error, 
            status: 500 
        });
    }
};

// Get Wallet by wallet_id
const getWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const wallet = await Wallet.findOne({ wallet_id: id })
            .populate({ 
                path: 'user_id', 
                model: 'User', 
                localField: 'user_id', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'role_id', 
                model: 'Role', 
                localField: 'role_id', 
                foreignField: 'role_id', 
                select: 'role_id role_name description' 
            })
            .populate({ 
                path: 'updated_by', 
                model: 'User', 
                localField: 'updated_by', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id' 
            });
            
        if (!wallet) {
            return res.status(404).json({ 
                success: false,
                message: 'Wallet not found', 
                status: 404 
            });
        }
        
        return res.status(200).json({ 
            success: true,
            wallet, 
            status: 200 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message || error, 
            status: 500 
        });
    }
};

// Update Wallet
const updateWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Check if wallet exists
        const existingWallet = await Wallet.findOne({ wallet_id: id });
        if (!existingWallet) {
            return res.status(404).json({ 
                success: false,
                message: 'Wallet not found', 
                status: 404 
            });
        }
        
        // Set updated_by from authenticated user
        if (req.user && req.user.user_id) {
            updateData.updated_by = req.user.user_id;
        }
        updateData.updated_At = new Date();
        
        // Update wallet
        const wallet = await Wallet.findOneAndUpdate(
            { wallet_id: id },
            updateData,
            { new: true, runValidators: true }
        )
            .populate({ 
                path: 'user_id', 
                model: 'User', 
                localField: 'user_id', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'role_id', 
                model: 'Role', 
                localField: 'role_id', 
                foreignField: 'role_id', 
                select: 'role_id role_name description' 
            })
            .populate({ 
                path: 'updated_by', 
                model: 'User', 
                localField: 'updated_by', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id' 
            });
        
        return res.status(200).json({ 
            success: true,
            message: 'Wallet updated successfully', 
            wallet, 
            status: 200 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message || error, 
            status: 500 
        });
    }
};

// Get Wallet by user_id
const getWalletByUserId = async (req, res) => {
    try {
        const { user_id } = req.params;
        const wallet = await Wallet.findOne({ user_id: user_id })
            .populate({ 
                path: 'user_id', 
                model: 'User', 
                localField: 'user_id', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'role_id', 
                model: 'Role', 
                localField: 'role_id', 
                foreignField: 'role_id', 
                select: 'role_id role_name description' 
            })
            .populate({ 
                path: 'updated_by', 
                model: 'User', 
                localField: 'updated_by', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id' 
            });
            
        if (!wallet) {
            return res.status(404).json({ 
                success: false,
                message: 'Wallet not found for this user', 
                status: 404 
            });
        }
        
        return res.status(200).json({ 
            success: true,
            wallet, 
            status: 200 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message || error, 
            status: 500 
        });
    }
};

// Get All Wallets
const getAllWallet = async (req, res) => {
    try {
        const { status, role_id, sort_by = 'created_At', sort_order = 'desc' } = req.query;
        
        // Build query
        const query = {};
        if (status !== undefined) {
            query.status = parseInt(status);
        }
        if (role_id !== undefined) {
            query.role_id = parseInt(role_id);
        }
        
        // Build sort object
        const sortObj = {};
        sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;
        
        // Get all wallets with populated references
        const wallets = await Wallet.find(query)
            .populate({ 
                path: 'user_id', 
                model: 'User', 
                localField: 'user_id', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'role_id', 
                model: 'Role', 
                localField: 'role_id', 
                foreignField: 'role_id', 
                select: 'role_id role_name description' 
            })
            .populate({ 
                path: 'updated_by', 
                model: 'User', 
                localField: 'updated_by', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id' 
            })
            .sort(sortObj);
        
        // Get statistics
        const stats = {
            total_wallets: wallets.length,
            total_balance: wallets.reduce((sum, wallet) => sum + (wallet.amount || 0), 0),
            active_wallets: wallets.filter(w => w.status === 1).length,
            inactive_wallets: wallets.filter(w => w.status === 0).length
        };
        
        return res.status(200).json({ 
            success: true,
            wallets, 
            statistics: stats,
            status: 200 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message || error, 
            status: 500 
        });
    }
};

// Get Wallet by Authenticated User
const getWalletByAuth = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const wallet = await Wallet.findOne({ user_id: user_id })
            .populate({ 
                path: 'user_id', 
                model: 'User', 
                localField: 'user_id', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'role_id', 
                model: 'Role', 
                localField: 'role_id', 
                foreignField: 'role_id', 
                select: 'role_id role_name description' 
            })
            .populate({ 
                path: 'updated_by', 
                model: 'User', 
                localField: 'updated_by', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id' 
            });
            
        if (!wallet) {
            return res.status(404).json({ 
                success: false,
                message: 'Wallet not found for this user', 
                status: 404 
            });
        }
        
        return res.status(200).json({ 
            success: true,
            wallet, 
            status: 200 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message || error, 
            status: 500 
        });
    }
};

// Add Money to Wallet
const addMoney = async (req, res) => {
    try {
        const { user_id, amount } = req.body;
        
        if (!user_id || !amount) {
            return res.status(400).json({ 
                success: false,
                message: 'user_id and amount are required',
                status: 400 
            });
        }
        
        if (amount <= 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Amount must be greater than 0',
                status: 400 
            });
        }
        
        const wallet = await Wallet.findOne({ user_id: user_id });
        if (!wallet) {
            return res.status(404).json({ 
                success: false,
                message: 'Wallet not found for this user',
                status: 404 
            });
        }
        
        // Add money
        const updatedWallet = await Wallet.findOneAndUpdate(
            { user_id: user_id },
            { 
                amount: wallet.amount + parseFloat(amount),
                updated_by: req.user ? req.user.user_id : null,
                updated_At: new Date()
            },
            { new: true, runValidators: true }
        )
            .populate({ 
                path: 'user_id', 
                model: 'User', 
                localField: 'user_id', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'role_id', 
                model: 'Role', 
                localField: 'role_id', 
                foreignField: 'role_id', 
                select: 'role_id role_name description' 
            });
        
        return res.status(200).json({ 
            success: true,
            message: `Successfully added ${amount} to wallet`,
            wallet: updatedWallet,
            added_amount: parseFloat(amount),
            previous_balance: wallet.amount,
            current_balance: updatedWallet.amount,
            status: 200 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message || error, 
            status: 500 
        });
    }
};

// Deduct Money from Wallet
const deductMoney = async (req, res) => {
    try {
        const { user_id, amount } = req.body;
        
        if (!user_id || !amount) {
            return res.status(400).json({ 
                success: false,
                message: 'user_id and amount are required',
                status: 400 
            });
        }
        
        if (amount <= 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Amount must be greater than 0',
                status: 400 
            });
        }
        
        const wallet = await Wallet.findOne({ user_id: user_id });
        if (!wallet) {
            return res.status(404).json({ 
                success: false,
                message: 'Wallet not found for this user',
                status: 404 
            });
        }
        
        if (wallet.amount < parseFloat(amount)) {
            return res.status(400).json({ 
                success: false,
                message: 'Insufficient wallet balance',
                current_balance: wallet.amount,
                requested_amount: parseFloat(amount),
                status: 400 
            });
        }
        
        // Deduct money
        const updatedWallet = await Wallet.findOneAndUpdate(
            { user_id: user_id },
            { 
                amount: wallet.amount - parseFloat(amount),
                updated_by: req.user ? req.user.user_id : null,
                updated_At: new Date()
            },
            { new: true, runValidators: true }
        )
            .populate({ 
                path: 'user_id', 
                model: 'User', 
                localField: 'user_id', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'role_id', 
                model: 'Role', 
                localField: 'role_id', 
                foreignField: 'role_id', 
                select: 'role_id role_name description' 
            });
        
        return res.status(200).json({ 
            success: true,
            message: `Successfully deducted ${amount} from wallet`,
            wallet: updatedWallet,
            deducted_amount: parseFloat(amount),
            previous_balance: wallet.amount,
            current_balance: updatedWallet.amount,
            status: 200 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message || error, 
            status: 500 
        });
    }
};

// Delete Wallet
const deleteWallet = async (req, res) => {
    try {
        const { id } = req.params;
        
        const wallet = await Wallet.findOneAndDelete({ wallet_id: id });
        if (!wallet) {
            return res.status(404).json({ 
                success: false,
                message: 'Wallet not found', 
                status: 404 
            });
        }
        
        return res.status(200).json({ 
            success: true,
            message: 'Wallet deleted successfully',
            status: 200 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message || error, 
            status: 500 
        });
    }
};

module.exports = { 
    createWallet,
    getWallet, 
    updateWallet, 
    getWalletByUserId, 
    getAllWallet,
    getWalletByAuth,
    addMoney,
    deductMoney,
    deleteWallet
}; 