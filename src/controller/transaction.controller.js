const Transaction = require('../models/transaction.model.js');
const Wallet = require('../models/wallet.model.js');
const User = require('../models/User.model.js');


const createTransaction = async (req, res) => {
    try {
        console.log(req.user)
        if (req.user && req.user.user_id) {
            req.body.user_id = req.user.user_id;
            req.body.created_by = req.user.user_id;
        }
        if (req.user && req.user.role_id) {
            req.body.role_id = req.user.role_id;
        }
        // Set bank_id if withdraw by bank
        if (req.body.transactionType === 'withdraw' && req.body.payment_method === 'bank' && req.body.bank_id) {
            // bank_id should be provided in the request body
            req.body.bank_id = req.body.bank_id;
        } else {
            req.body.bank_id = undefined;
        }

        // Calculate GST for Recharge transactions
        if (req.body.transactionType === 'Recharge') {
            const baseAmount = Number(req.body.amount);
            if (!isNaN(baseAmount) && baseAmount > 0) {
                // Calculate CGST and SGST (9% each)
                const cgstAmount = (baseAmount * 9) / 100;
                const sgstAmount = (baseAmount * 9) / 100;
                const totalGST = cgstAmount + sgstAmount;
                
                // Set GST fields in request body
                req.body.CGST = cgstAmount;
                req.body.SGST = sgstAmount;
                req.body.TotalGST = totalGST;
                
                // Update the amount to include GST
                req.body.amount = baseAmount + totalGST;
            }
        }

        console.log(req.body, req.user)
        const transaction = new Transaction(req.body);
        await transaction.save();

        const { user_id, amount, transactionType, role_id } = req.body;
        const wallet = await Wallet.findOne({ user_id });
        if (!wallet) {
            const newWallet = new Wallet({ user_id, role_id, amount: Number(amount) });
            await newWallet.save();
            return res.status(201).json({ message: 'Transaction created and wallet updated', transaction, wallet: newWallet, status: 201 });
        }
        let newAmount = Number(wallet.amount);
        const transactionAmount = Number(amount);
        
        if (transactionType === 'deposit' || transactionType === 'Recharge') {
            newAmount += transactionAmount;
        } else if (transactionType === 'registration_fee' || transactionType === 'withdraw') {
            if (newAmount < transactionAmount) {
                return res.status(400).json({ message: 'Insufficient funds in wallet', status: 400 });
            }
            newAmount -= transactionAmount;
        }
        wallet.amount = newAmount;
        wallet.updated_At = new Date();
        await wallet.save();

        // Prepare response with GST details for Recharge transactions
        let responseData = { message: 'Transaction created and wallet updated', transaction, wallet, status: 201 };
        
        if (transactionType === 'Recharge') {
            responseData.gst_details = {
                base_amount: Number(req.body.amount) - (req.body.CGST + req.body.SGST),
                CGST: req.body.CGST,
                SGST: req.body.SGST,
                TotalGST: req.body.TotalGST,
                final_amount: req.body.amount
            };
        }
        
        return res.status(201).json(responseData);
    } catch (error) {
        return res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Admin recharge user wallet
const createTransactionByAdmin = async (req, res) => {
    try {
        const { user_id, amount, payment_method = 'admin_recharge', reference_number } = req.body;
        const adminId = req.user.user_id;

        // Validate required fields
        if (!user_id || !amount) {
            return res.status(400).json({
                success: false,
                message: 'user_id and amount are required'
            });
        }

        // Validate amount and convert to number
        const rechargeAmount = Number(amount);
        if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a valid number greater than 0'
            });
        }

        // Check if user exists
        const user = await User.findOne({ user_id: parseInt(user_id) });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if admin is trying to recharge themselves
        if (parseInt(user_id) === adminId) {
            return res.status(400).json({
                success: false,
                message: 'Admin cannot recharge their own wallet'
            });
        }

        // Create transaction data
        const transactionData = {
            user_id: parseInt(user_id),
            amount: rechargeAmount,
            status: 'completed', // Admin recharge is always completed
            payment_method: payment_method,
            transactionType: 'RechargeByAdmin',
            reference_number: reference_number || `ADMIN_RECHARGE_${Date.now()}`,
            created_by: adminId
        };

        // Create the transaction
        const transaction = new Transaction(transactionData);
        await transaction.save();

        // Update or create wallet
        let wallet = await Wallet.findOne({ user_id: parseInt(user_id) });
        
        if (!wallet) {
            // Create new wallet if it doesn't exist
            wallet = new Wallet({
                user_id: parseInt(user_id),
                role_id: user.role_id,
                amount: rechargeAmount,
                updated_by: adminId
            });
        } else {
            // Update existing wallet - ensure both values are numbers
            const currentAmount = Number(wallet.amount) || 0;
            wallet.amount = currentAmount + rechargeAmount;
            wallet.updated_by = adminId;
        }

        await wallet.save();

        return res.status(201).json({
            success: true,
            message: 'User wallet recharged successfully by admin',
            transaction: {
                TRANSACTION_ID: transaction.TRANSACTION_ID,
                user_id: transaction.user_id,
                amount: transaction.amount,
                status: transaction.status,
                payment_method: transaction.payment_method,
                transactionType: transaction.transactionType,
                reference_number: transaction.reference_number,
                created_by: transaction.created_by,
                created_at: transaction.created_at
            },
            wallet: {
                wallet_id: wallet.wallet_id,
                user_id: wallet.user_id,
                amount: wallet.amount,
                updated_At: wallet.updated_At
            },
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role_id: user.role_id
            },
            status: 201
        });

    } catch (error) {
        console.error('Admin recharge error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getTransactionById = async (req, res) => {
    try {
        console.log(req.params)
        const { id } = req.params;
        const transaction = await Transaction.findOne({ TRANSACTION_ID: id });
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found', status: 404 });
        }

        // Get user details for user_id and created_by
     
        const [user, createdByUser] = await Promise.all([
            User.findOne({ user_id: transaction.user_id }, { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }),
            User.findOne({ user_id: transaction.created_by }, { user_id: 1, name: 1, _id: 0 })
        ]);

        // Get bank details if bank_id exists
        let bankDetails = null;
        if (transaction.bank_id) {
            const AdvisorBankAccountDetails = require('../models/Advisor_bankAccountDetails.model');
            bankDetails = await AdvisorBankAccountDetails.findOne(
                { AccountDetails_id: transaction.bank_id },
                { AccountDetails_id: 1, holdername: 1, bank_name: 1, account_no: 1, _id: 0 }
            );
        }

        const transactionWithDetails = {
            ...transaction.toObject(),
            user: user ? {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                mobile: user.mobile
            } : null,
            created_by_user: createdByUser ? {
                user_id: createdByUser.user_id,
                name: createdByUser.name
            } : null,
            bank_details: bankDetails ? {
                AccountDetails_id: bankDetails.AccountDetails_id,
                holdername: bankDetails.holdername,
                bank_name: bankDetails.bank_name,
                account_no: bankDetails.account_no
            } : null
        };

        return res.status(200).json({ 
            success: true,
            transaction: transactionWithDetails, 
            status: 200 
        });
    } catch (error) {
        console.error('Get transaction by ID error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message 
        });
    }
};

const getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ created_at: -1 });
        
        // Get all unique user IDs from transactions
        const userIds = [...new Set([
            ...transactions.map(t => t.user_id),
            ...transactions.map(t => t.created_by)
        ])];
        
        // Get all unique bank IDs
        const bankIds = [...new Set(transactions.map(t => t.bank_id).filter(id => id))];
        
        // Fetch user details for all user IDs
   
        const users = await User.find(
            { user_id: { $in: userIds } }, 
            { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }
        );
        const userMap = {};
        users.forEach(u => { userMap[u.user_id] = u; });
        
        // Fetch bank details for all bank IDs
        let bankMap = {};
        if (bankIds.length > 0) {
            const AdvisorBankAccountDetails = require('../models/Advisor_bankAccountDetails.model');
            const banks = await AdvisorBankAccountDetails.find(
                { AccountDetails_id: { $in: bankIds } },
                { AccountDetails_id: 1, holdername: 1, bank_name: 1, account_no: 1, _id: 0 }
            );
            banks.forEach(b => { bankMap[b.AccountDetails_id] = b; });
        }
        
        // Map transactions to include user and bank details
        const transactionsWithDetails = transactions.map(transaction => {
            const transactionObj = transaction.toObject();
            return {
                ...transactionObj,
                user: userMap[transaction.user_id] ? {
                    user_id: userMap[transaction.user_id].user_id,
                    name: userMap[transaction.user_id].name,
                    email: userMap[transaction.user_id].email,
                    mobile: userMap[transaction.user_id].mobile
                } : null,
                created_by_user: userMap[transaction.created_by] ? {
                    user_id: userMap[transaction.created_by].user_id,
                    name: userMap[transaction.created_by].name
                } : null,
                bank_details: transaction.bank_id && bankMap[transaction.bank_id] ? {
                    AccountDetails_id: bankMap[transaction.bank_id].AccountDetails_id,
                    holdername: bankMap[transaction.bank_id].holdername,
                    bank_name: bankMap[transaction.bank_id].bank_name,
                    account_no: bankMap[transaction.bank_id].account_no
                } : null
            };
        });

        return res.status(200).json({ 
            success: true,
            transactions: transactionsWithDetails,
            count: transactionsWithDetails.length,
            status: 200 
        });
    } catch (error) {
        console.error('Get all transactions error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message 
        });
    }
};

const updateTransaction = async (req, res) => {
    try {
        const updateData = req.body;
        if (req.user && req.user.user_id) {
            updateData.updated_by = req.user.user_id;
            updateData.user_id = req.user.user_id;
        }
        // Fetch the original transaction
        const originalTransaction = await Transaction.findOne({ TRANSACTION_ID: updateData.id });
        if (!originalTransaction) {
            return res.status(404).json({ message: 'Transaction not found', status: 404 });
        }
        // Update the transaction
        const transaction = await Transaction.findOneAndUpdate(
            { TRANSACTION_ID: updateData.id },
            updateData,
            { new: true }
        );
        const { user_id, amount, transactionType } = updateData;

        console.log(user_id, amount, transactionType);

        const wallet = await Wallet.findOne({ user_id });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found for user and role', status: 404 });
        }
        let newAmount = Number(wallet.amount);
        const oldAmount = Number(originalTransaction.amount);
        // Adjust wallet based on transaction type and amount difference
        if (transactionType === 'deposit') {
            // If increased, add the difference; if decreased, subtract the difference
            newAmount += (Number(amount) - oldAmount);
        } else if (transactionType === 'registration_fee' || transactionType === 'withdraw') {
            // If increased, subtract the difference; if decreased, add the difference
            if (Number(amount) > oldAmount) {
                // Need to subtract more from wallet
                const diff = Number(amount) - oldAmount;
                if (newAmount < diff) {
                    return res.status(400).json({ message: 'Insufficient funds in wallet for update', status: 400 });
                }
                newAmount -= diff;
            } else {
                // Refund the difference
                newAmount += (oldAmount - Number(amount));
            }
        }
        if (newAmount < 0) {
            return res.status(400).json({ message: 'Insufficient funds in wallet after update', status: 400 });
        }
        wallet.amount = newAmount;
        wallet.updated_At = new Date();
        await wallet.save();
        return res.status(200).json({ message: 'Transaction and wallet updated', transaction, status: 200 });
    } catch (error) {
        return res.status(500).json({ message: error.message || error, status: 500 });
    }
};

module.exports = { createTransaction, createTransactionByAdmin, getTransactionById, getAllTransactions, updateTransaction }; 