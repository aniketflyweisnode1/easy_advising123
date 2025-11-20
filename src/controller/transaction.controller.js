const Transaction = require('../models/transaction.model.js');
const Wallet = require('../models/wallet.model.js');
const User = require('../models/User.model.js');
const WithdrawRequest = require('../models/withdraw_request.model.js');


const createTransaction = async (req, res) => {
    try {
        if (req.user && req.user.user_id) {
            req.body.user_id = req.user.user_id;
            req.body.created_by = req.user.user_id;
            req.body.method_id = 1;
        }
        if (req.user && req.user.role_id) {
            req.body.role_id = req.user.role_id;
        }
        // Set bank_id if withdraw by bank
        if (req.body.transactionType === 'withdraw') {
            // bank_id should be provided in the request body
            const bankId = await AdvisorBankAccountDetails.findOne({ user_id: req.body.user_id, status: 1 });
            if (!bankId) {
                const newBank = await AdvisorBankAccountDetails.create({
                    status: 1,
                    created_by: req.body.created_by,
                    holdername: req.body.holdername,
                    account_no: req.body.account_no,
                    bank_name: req.body.bank_name,
                    ifsc_code: req.body.ifsc_code,
                    ISFC_code: req.body.ISFC_code,
                    bankaddress: req.body.bankaddress
                });
               req.body.bank_id = newBank.AccountDetails_id
            } else {   
            req.body.bank_id = bankId.AccountDetails_id;
            }
        } else {
            req.body.bank_id = undefined;
        }

        // Set PaymentDetails_id if provided
        if (req.body.PaymentDetails_id) {
            req.body.PaymentDetails_id = req.body.PaymentDetails_id;
        } else {
            req.body.PaymentDetails_id = null;
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

        const { user_id, amount, transactionType, role_id } = req.body;

        // Create withdraw request instead of direct wallet deduction
        if (transactionType === 'withdraw') {
            const withdrawAmount = Number(amount);
            const methodId = 1;

            if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
                return res.status(400).json({
                    message: 'Withdraw amount must be a number greater than 0',
                    status: 400
                });
            }

            if (!methodId) {
                return res.status(400).json({
                    message: 'method_id is required for withdraw transactions',
                    status: 400
                });
            }

            const wallet = await Wallet.findOne({ user_id });
            if (!wallet) {
                return res.status(404).json({
                    message: 'Wallet not found for user',
                    status: 404
                });
            }

            if ((Number(wallet.amount) || 0) < withdrawAmount) {
                return res.status(400).json({
                    message: 'Insufficient funds in wallet',
                    balance: Number(wallet.amount) || 0,
                    requested_amount: withdrawAmount,
                    status: 400
                });
            }

         

            const pendingTransaction = new Transaction({
                user_id,
                amount: withdrawAmount,
                status: 'pending',
                payment_method: 'withdraw',
                transactionType: 'withdraw',
                reference_number: req.body.reference_number || `WITHDRAW_REQ_${withdrawRequest.request_id}`,
                created_by: withdrawData.created_by,
                transaction_date: new Date()
            });
            await pendingTransaction.save();


            const withdrawData = {
                user_id,
                amount: withdrawAmount,
                method_id: 1,
                details: req.body.details || req.body.description || '',
                last_status: 'Pending',
                transaction_id: pendingTransaction.TRANSACTION_ID,
                status: 1,
                created_by: req.body.created_by || user_id
            };

            const withdrawRequest = new WithdrawRequest(withdrawData);
            await withdrawRequest.save();

            return res.status(201).json({
                message: 'Withdraw request submitted successfully',
                withdraw_request: withdrawRequest,
                transaction: pendingTransaction,
                status: 201
            });
        }

        console.log(req.body, req.user)
        const transaction = new Transaction(req.body);
        await transaction.save();

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
        } else if (transactionType === 'registration_fee') {
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

        // Get payment details if PaymentDetails_id exists
        let paymentDetails = null;
        if (transaction.PaymentDetails_id) {
            const PaymentDetails = require('../models/payment_details.model');
            paymentDetails = await PaymentDetails.findOne(
                { PaymentDetails_id: transaction.PaymentDetails_id },
                { PaymentDetails_id: 1, UPI_id: 1, Bankname: 1, accountno: 1, ifsccode: 1, branchname: 1, appToapp: 1, QRpay: 1, Status: 1, _id: 0 }
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
            } : null,
            payment_details: paymentDetails ? {
                PaymentDetails_id: paymentDetails.PaymentDetails_id,
                UPI_id: paymentDetails.UPI_id,
                Bankname: paymentDetails.Bankname,
                accountno: paymentDetails.accountno,
                ifsccode: paymentDetails.ifsccode,
                branchname: paymentDetails.branchname,
                appToapp: paymentDetails.appToapp,
                QRpay: paymentDetails.QRpay,
                Status: paymentDetails.Status
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
        // Get URL parameters
        const { status, transactionType, date_from, date_to, user_id } = req.params;
        
        // Get query parameters
        const { 
            page = 1, 
            limit = 10, 
            search, 
            transaction_type,
            payment_method,
            user_id: query_user_id,
            amount_min,
            amount_max,
            created_date_from,
            created_date_to,
            transaction_date_from,
            transaction_date_to,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        const skip = (page - 1) * limit;

        // Build query
        const query = {};

        // Add status filter (support multiple statuses)
        if (status) {
            if (Array.isArray(status)) {
                // Handle array of statuses
                query.status = { $in: status };
            } else if (typeof status === 'string' && status.includes(',')) {
                // Handle comma-separated statuses
                const statusArray = status.split(',').map(s => s.trim());
                query.status = { $in: statusArray };
            } else {
                // Handle single status
                query.status = status;
            }
        }

        // Add transaction_type filter (priority: URL param > query param)
        const transactionTypeFilter = transactionType || transaction_type;
        if (transactionTypeFilter) {
            if (Array.isArray(transactionTypeFilter)) {
                query.transactionType = { $in: transactionTypeFilter };
            } else if (typeof transactionTypeFilter === 'string' && transactionTypeFilter.includes(',')) {
                const typeArray = transactionTypeFilter.split(',').map(t => t.trim());
                query.transactionType = { $in: typeArray };
            } else {
                query.transactionType = transactionTypeFilter;
            }
        }

        // Add payment_method filter
        if (payment_method) {
            if (Array.isArray(payment_method)) {
                query.payment_method = { $in: payment_method };
            } else if (typeof payment_method === 'string' && payment_method.includes(',')) {
                const methodArray = payment_method.split(',').map(m => m.trim());
                query.payment_method = { $in: methodArray };
            } else {
                query.payment_method = payment_method;
            }
        }

        // Add user_id filter (priority: URL param > query param)
        const userIdFilter = user_id || query_user_id;
        if (userIdFilter) {
            query.user_id = parseInt(userIdFilter);
        }

        // Add amount range filter
        if (amount_min !== undefined || amount_max !== undefined) {
            query.amount = {};
            if (amount_min !== undefined) {
                query.amount.$gte = parseFloat(amount_min);
            }
            if (amount_max !== undefined) {
                query.amount.$lte = parseFloat(amount_max);
            }
        }

        // Add date range filters
        // Priority: URL params (date_from, date_to) > query params (created_date_from, created_date_to)
        const fromDate = date_from || created_date_from;
        const toDate = date_to || created_date_to;
        
        if (fromDate || toDate) {
            query.created_at = {};
            if (fromDate) {
                query.created_at.$gte = new Date(fromDate);
            }
            if (toDate) {
                query.created_at.$lt = new Date(new Date(toDate).getTime() + 24 * 60 * 60 * 1000); // Add 1 day to include the entire day
            }
        }

        // Add transaction_date range filter
        if (transaction_date_from || transaction_date_to) {
            query.transaction_date = {};
            if (transaction_date_from) {
                query.transaction_date.$gte = new Date(transaction_date_from);
            }
            if (transaction_date_to) {
                query.transaction_date.$lt = new Date(new Date(transaction_date_to).getTime() + 24 * 60 * 60 * 1000);
            }
        }

        // Build sort object
        const sortObj = {};
        sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

        // Get transactions with pagination and filters
        const transactions = await Transaction.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const totalTransactions = await Transaction.countDocuments(query);
        
        // Get all unique user IDs from transactions
        const userIds = [...new Set([
            ...transactions.map(t => t.user_id),
            ...transactions.map(t => t.created_by)
        ])];
        
        // Get all unique bank IDs
        const bankIds = [...new Set(transactions.map(t => t.bank_id).filter(id => id))];
        
        // Get all unique payment details IDs
        const paymentDetailsIds = [...new Set(transactions.map(t => t.PaymentDetails_id).filter(id => id))];
        
        // Fetch user details for all user IDs
        const users = await User.find(
            { user_id: { $in: userIds } }, 
            { user_id: 1, name: 1, email: 1, mobile: 1, role_id: 1, status: 1, _id: 0 }
        );
        const userMap = {};
        users.forEach(u => { userMap[u.user_id] = u; });
        
        // Fetch bank details for all bank IDs
        let bankMap = {};
        if (bankIds.length > 0) {
            const AdvisorBankAccountDetails = require('../models/Advisor_bankAccountDetails.model');
            const banks = await AdvisorBankAccountDetails.find(
                { AccountDetails_id: { $in: bankIds } },
                { AccountDetails_id: 1, holdername: 1, bank_name: 1, account_no: 1, ifsc_code: 1, _id: 0 }
            );
            banks.forEach(b => { bankMap[b.AccountDetails_id] = b; });
        }

        // Fetch payment details for all payment details IDs
        let paymentDetailsMap = {};
        if (paymentDetailsIds.length > 0) {
            const PaymentDetails = require('../models/payment_details.model');
            const paymentDetailsArray = await PaymentDetails.find(
                { PaymentDetails_id: { $in: paymentDetailsIds } },
                { PaymentDetails_id: 1, UPI_id: 1, Bankname: 1, accountno: 1, ifsccode: 1, branchname: 1, appToapp: 1, QRpay: 1, Status: 1, _id: 0 }
            );
            paymentDetailsArray.forEach(pd => { paymentDetailsMap[pd.PaymentDetails_id] = pd; });
        }
        
        // Map transactions to include user and bank details
        let transactionsWithDetails = transactions.map(transaction => {
            const transactionObj = transaction.toObject();
            return {
                ...transactionObj,
                user: userMap[transaction.user_id] ? {
                    user_id: userMap[transaction.user_id].user_id,
                    name: userMap[transaction.user_id].name,
                    email: userMap[transaction.user_id].email,
                    mobile: userMap[transaction.user_id].mobile,
                    role_id: userMap[transaction.user_id].role_id,
                    status: userMap[transaction.user_id].status
                } : null,
                created_by_user: userMap[transaction.created_by] ? {
                    user_id: userMap[transaction.created_by].user_id,
                    name: userMap[transaction.created_by].name,
                    email: userMap[transaction.created_by].email,
                    mobile: userMap[transaction.created_by].mobile
                } : null,
                bank_details: transaction.bank_id && bankMap[transaction.bank_id] ? {
                    AccountDetails_id: bankMap[transaction.bank_id].AccountDetails_id,
                    holdername: bankMap[transaction.bank_id].holdername,
                    bank_name: bankMap[transaction.bank_id].bank_name,
                    account_no: bankMap[transaction.bank_id].account_no,
                    ifsc_code: bankMap[transaction.bank_id].ifsc_code
                } : null,
                payment_details: transaction.PaymentDetails_id && paymentDetailsMap[transaction.PaymentDetails_id] ? {
                    PaymentDetails_id: paymentDetailsMap[transaction.PaymentDetails_id].PaymentDetails_id,
                    UPI_id: paymentDetailsMap[transaction.PaymentDetails_id].UPI_id,
                    Bankname: paymentDetailsMap[transaction.PaymentDetails_id].Bankname,
                    accountno: paymentDetailsMap[transaction.PaymentDetails_id].accountno,
                    ifsccode: paymentDetailsMap[transaction.PaymentDetails_id].ifsccode,
                    branchname: paymentDetailsMap[transaction.PaymentDetails_id].branchname,
                    appToapp: paymentDetailsMap[transaction.PaymentDetails_id].appToapp,
                    QRpay: paymentDetailsMap[transaction.PaymentDetails_id].QRpay,
                    Status: paymentDetailsMap[transaction.PaymentDetails_id].Status
                } : null
            };
        });

        // Apply search filter if provided
        if (search) {
            transactionsWithDetails = transactionsWithDetails.filter(transaction => {
                const searchLower = search.toLowerCase();
                const searchTerm = search.toString();
                return (
                    (transaction.user && (
                        transaction.user.name?.toLowerCase().includes(searchLower) ||
                        transaction.user.email?.toLowerCase().includes(searchLower) ||
                        transaction.user.mobile?.includes(searchTerm)
                    )) ||
                    (transaction.created_by_user && (
                        transaction.created_by_user.name?.toLowerCase().includes(searchLower) ||
                        transaction.created_by_user.email?.toLowerCase().includes(searchLower)
                    )) ||
                    (transaction.bank_details && 
                        transaction.bank_details.holdername?.toLowerCase().includes(searchLower)
                    ) ||
                    (transaction.payment_details && (
                        transaction.payment_details.UPI_id?.toLowerCase().includes(searchLower) ||
                        transaction.payment_details.Bankname?.toLowerCase().includes(searchLower) ||
                        transaction.payment_details.accountno?.includes(searchTerm) ||
                        transaction.payment_details.ifsccode?.toLowerCase().includes(searchLower) ||
                        transaction.payment_details.branchname?.toLowerCase().includes(searchLower)
                    )) ||
                    transaction.amount?.toString().includes(searchTerm) ||
                    transaction.status?.toLowerCase().includes(searchLower) ||
                    transaction.transactionType?.toLowerCase().includes(searchLower) ||
                    transaction.payment_method?.toLowerCase().includes(searchLower) ||
                    transaction.reference_number?.toLowerCase().includes(searchLower) ||
                    transaction.TRANSACTION_ID?.toString().includes(searchTerm) ||
                    // Search by date (format: YYYY-MM-DD or partial date)
                    (transaction.created_at && 
                        transaction.created_at.toISOString().split('T')[0].includes(searchTerm)
                    ) ||
                    (transaction.transaction_date && 
                        transaction.transaction_date.toISOString().split('T')[0].includes(searchTerm)
                    )
                );
            });
        }

        // Get available filter options
        const allTransactions = await Transaction.find({}, { status: 1, transactionType: 1, payment_method: 1, _id: 0 });
        const availableStatuses = [...new Set(allTransactions.map(t => t.status))];
        const availableTransactionTypes = [...new Set(allTransactions.map(t => t.transactionType))];
        const availablePaymentMethods = [...new Set(allTransactions.map(t => t.payment_method))];

        return res.status(200).json({ 
            success: true,
            message: 'Transactions retrieved successfully',
            data: {
                transactions: transactionsWithDetails,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(totalTransactions / limit),
                    total_items: totalTransactions,
                    items_per_page: parseInt(limit)
                },
                filters: {
                    available_statuses: availableStatuses,
                    available_transaction_types: availableTransactionTypes,
                    available_payment_methods: availablePaymentMethods
                }
            },
            status: 200 
        });
    } catch (error) {
        console.error('Get all transactions error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500 
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

const getTransactionsbyauth = async (req, res) => {
    try {
        // Get authenticated user ID from middleware
        const authenticatedUserId = req.user.user_id;
        
        if (!authenticatedUserId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
                status: 401
            });
        }

        // Get query parameters
        const { 
            page = 1, 
            limit = 10, 
            search, 
            transaction_type,
            payment_method,
            amount_min,
            amount_max,
            created_date_from,
            created_date_to,
            transaction_date_from,
            transaction_date_to,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        const skip = (page - 1) * limit;

        // Build query - filter by authenticated user's ID
        const query = { user_id: authenticatedUserId };

        // Add transaction_type filter
        if (transaction_type) {
            if (Array.isArray(transaction_type)) {
                query.transactionType = { $in: transaction_type };
            } else if (typeof transaction_type === 'string' && transaction_type.includes(',')) {
                const typeArray = transaction_type.split(',').map(t => t.trim());
                query.transactionType = { $in: typeArray };
            } else {
                query.transactionType = transaction_type;
            }
        }

        // Add payment_method filter
        if (payment_method) {
            if (Array.isArray(payment_method)) {
                query.payment_method = { $in: payment_method };
            } else if (typeof payment_method === 'string' && payment_method.includes(',')) {
                const methodArray = payment_method.split(',').map(m => m.trim());
                query.payment_method = { $in: methodArray };
            } else {
                query.payment_method = payment_method;
            }
        }

        // Add amount range filter
        if (amount_min !== undefined || amount_max !== undefined) {
            query.amount = {};
            if (amount_min !== undefined) {
                query.amount.$gte = parseFloat(amount_min);
            }
            if (amount_max !== undefined) {
                query.amount.$lte = parseFloat(amount_max);
            }
        }

        // Add date range filters
        if (created_date_from || created_date_to) {
            query.created_at = {};
            if (created_date_from) {
                query.created_at.$gte = new Date(created_date_from);
            }
            if (created_date_to) {
                query.created_at.$lt = new Date(new Date(created_date_to).getTime() + 24 * 60 * 60 * 1000);
            }
        }

        // Add transaction_date range filter
        if (transaction_date_from || transaction_date_to) {
            query.transaction_date = {};
            if (transaction_date_from) {
                query.transaction_date.$gte = new Date(transaction_date_from);
            }
            if (transaction_date_to) {
                query.transaction_date.$lt = new Date(new Date(transaction_date_to).getTime() + 24 * 60 * 60 * 1000);
            }
        }

        // Build sort object
        const sortObj = {};
        sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

        // Get transactions with pagination and filters
        const transactions = await Transaction.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const totalTransactions = await Transaction.countDocuments(query);
        
        // Get user details for the authenticated user
        const user = await User.findOne(
            { user_id: authenticatedUserId }, 
            { user_id: 1, name: 1, email: 1, mobile: 1, role_id: 1, status: 1, _id: 0 }
        );
        
        // Get all unique bank IDs from transactions
        const bankIds = [...new Set(transactions.map(t => t.bank_id).filter(id => id))];
        
        // Get all unique payment details IDs from transactions
        const paymentDetailsIds = [...new Set(transactions.map(t => t.PaymentDetails_id).filter(id => id))];
        
        // Fetch bank details for all bank IDs
        let bankMap = {};
        if (bankIds.length > 0) {
            const AdvisorBankAccountDetails = require('../models/Advisor_bankAccountDetails.model');
            const banks = await AdvisorBankAccountDetails.find(
                { AccountDetails_id: { $in: bankIds } },
                { AccountDetails_id: 1, holdername: 1, bank_name: 1, account_no: 1, ifsc_code: 1, _id: 0 }
            );
            banks.forEach(b => { bankMap[b.AccountDetails_id] = b; });
        }

        // Fetch payment details for all payment details IDs
        let paymentDetailsMap = {};
        if (paymentDetailsIds.length > 0) {
            const PaymentDetails = require('../models/payment_details.model');
            const paymentDetailsArray = await PaymentDetails.find(
                { PaymentDetails_id: { $in: paymentDetailsIds } },
                { PaymentDetails_id: 1, UPI_id: 1, Bankname: 1, accountno: 1, ifsccode: 1, branchname: 1, appToapp: 1, QRpay: 1, Status: 1, _id: 0 }
            );
            paymentDetailsArray.forEach(pd => { paymentDetailsMap[pd.PaymentDetails_id] = pd; });
        }
        
        // Map transactions to include user and bank details
        let transactionsWithDetails = transactions.map(transaction => {
            const transactionObj = transaction.toObject();
            return {
                ...transactionObj,
                user: user ? {
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    role_id: user.role_id,
                    status: user.status
                } : null,
                bank_details: transaction.bank_id && bankMap[transaction.bank_id] ? {
                    AccountDetails_id: bankMap[transaction.bank_id].AccountDetails_id,
                    holdername: bankMap[transaction.bank_id].holdername,
                    bank_name: bankMap[transaction.bank_id].bank_name,
                    account_no: bankMap[transaction.bank_id].account_no,
                    ifsc_code: bankMap[transaction.bank_id].ifsc_code
                } : null,
                payment_details: transaction.PaymentDetails_id && paymentDetailsMap[transaction.PaymentDetails_id] ? {
                    PaymentDetails_id: paymentDetailsMap[transaction.PaymentDetails_id].PaymentDetails_id,
                    UPI_id: paymentDetailsMap[transaction.PaymentDetails_id].UPI_id,
                    Bankname: paymentDetailsMap[transaction.PaymentDetails_id].Bankname,
                    accountno: paymentDetailsMap[transaction.PaymentDetails_id].accountno,
                    ifsccode: paymentDetailsMap[transaction.PaymentDetails_id].ifsccode,
                    branchname: paymentDetailsMap[transaction.PaymentDetails_id].branchname,
                    appToapp: paymentDetailsMap[transaction.PaymentDetails_id].appToapp,
                    QRpay: paymentDetailsMap[transaction.PaymentDetails_id].QRpay,
                    Status: paymentDetailsMap[transaction.PaymentDetails_id].Status
                } : null
            };
        });

        // Apply search filter if provided
        if (search) {
            transactionsWithDetails = transactionsWithDetails.filter(transaction => {
                const searchLower = search.toLowerCase();
                const searchTerm = search.toString();
                return (
                    (transaction.user && (
                        transaction.user.name?.toLowerCase().includes(searchLower) ||
                        transaction.user.email?.toLowerCase().includes(searchLower) ||
                        transaction.user.mobile?.includes(searchTerm)
                    )) ||
                    (transaction.bank_details && 
                        transaction.bank_details.holdername?.toLowerCase().includes(searchLower)
                    ) ||
                    (transaction.payment_details && (
                        transaction.payment_details.UPI_id?.toLowerCase().includes(searchLower) ||
                        transaction.payment_details.Bankname?.toLowerCase().includes(searchLower) ||
                        transaction.payment_details.accountno?.includes(searchTerm) ||
                        transaction.payment_details.ifsccode?.toLowerCase().includes(searchLower) ||
                        transaction.payment_details.branchname?.toLowerCase().includes(searchLower)
                    )) ||
                    transaction.amount?.toString().includes(searchTerm) ||
                    transaction.status?.toLowerCase().includes(searchLower) ||
                    transaction.transactionType?.toLowerCase().includes(searchLower) ||
                    transaction.payment_method?.toLowerCase().includes(searchLower) ||
                    transaction.reference_number?.toLowerCase().includes(searchLower) ||
                    transaction.TRANSACTION_ID?.toString().includes(searchTerm) ||
                    (transaction.created_at && 
                        transaction.created_at.toISOString().split('T')[0].includes(searchTerm)
                    ) ||
                    (transaction.transaction_date && 
                        transaction.transaction_date.toISOString().split('T')[0].includes(searchTerm)
                    )
                );
            });
        }

        // Get available filter options for this user's transactions
        const userTransactions = await Transaction.find({ user_id: authenticatedUserId }, { status: 1, transactionType: 1, payment_method: 1, _id: 0 });
        const availableStatuses = [...new Set(userTransactions.map(t => t.status))];
        const availableTransactionTypes = [...new Set(userTransactions.map(t => t.transactionType))];
        const availablePaymentMethods = [...new Set(userTransactions.map(t => t.payment_method))];

        return res.status(200).json({ 
            success: true,
            message: 'User transactions retrieved successfully',
            data: {
                transactions: transactionsWithDetails,
                user: {
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    role_id: user.role_id
                },
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(totalTransactions / limit),
                    total_items: totalTransactions,
                    items_per_page: parseInt(limit)
                },
                filters: {
                    available_statuses: availableStatuses,
                    available_transaction_types: availableTransactionTypes,
                    available_payment_methods: availablePaymentMethods
                }
            },
            status: 200 
        });
    } catch (error) {
        console.error('Get user transactions error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500 
        });
    }
};

// Update isDownloaded status for a transaction
const updateIsDownloaded = async (req, res) => {
    try {
        const { transaction_id, isDownloaded } = req.body;

        // Validate input
        if (!transaction_id) {
            return res.status(400).json({
                success: false,
                message: 'transaction_id is required',
                status: 400
            });
        }

        if (isDownloaded === undefined || typeof isDownloaded !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isDownloaded field is required and must be a boolean value',
                status: 400
            });
        }

        // Check if transaction exists
        const transaction = await Transaction.findOne({ TRANSACTION_ID: parseInt(transaction_id) });
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found',
                status: 404
            });
        }

        // Update the isDownloaded field
        const updatedTransaction = await Transaction.findOneAndUpdate(
            { TRANSACTION_ID: parseInt(transaction_id) },
            { 
                isDownloaded: isDownloaded,
                updated_at: new Date()
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Transaction download status updated successfully',
            transaction: {
                TRANSACTION_ID: updatedTransaction.TRANSACTION_ID,
                user_id: updatedTransaction.user_id,
                isDownloaded: updatedTransaction.isDownloaded,
                updated_at: updatedTransaction.updated_at
            },
            status: 200
        });

    } catch (error) {
        console.error('Update isDownloaded error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

// Update fileDownloadedPath for a transaction
const updateFileDownloadedPath = async (req, res) => {
    try {
        const { transaction_id, fileDownlodedPath } = req.body;

        // Validate input
        if (!transaction_id) {
            return res.status(400).json({
                success: false,
                message: 'transaction_id is required',
                status: 400
            });
        }

        if (fileDownlodedPath === undefined) {
            return res.status(400).json({
                success: false,
                message: 'fileDownlodedPath field is required',
                status: 400
            });
        }

        // Check if transaction exists
        const transaction = await Transaction.findOne({ TRANSACTION_ID: parseInt(transaction_id) });
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found',
                status: 404
            });
        }

        // Update the fileDownlodedPath field
        const updatedTransaction = await Transaction.findOneAndUpdate(
            { TRANSACTION_ID: parseInt(transaction_id) },
            { 
                fileDownlodedPath: fileDownlodedPath,
                updated_at: new Date()
            },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Transaction file download path updated successfully',
            transaction: {
                TRANSACTION_ID: updatedTransaction.TRANSACTION_ID,
                user_id: updatedTransaction.user_id,
                fileDownlodedPath: updatedTransaction.fileDownlodedPath,
                updated_at: updatedTransaction.updated_at
            },
            status: 200
        });

    } catch (error) {
        console.error('Update fileDownloadedPath error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

// Update both isDownloaded and fileDownlodedPath for a transaction
const updateDownloadStatus = async (req, res) => {
    try {
        const { transaction_id, isDownloaded, fileDownlodedPath } = req.body;

        // Validate input
        if (!transaction_id) {
            return res.status(400).json({
                success: false,
                message: 'transaction_id is required',
                status: 400
            });
        }

        if (isDownloaded === undefined && fileDownlodedPath === undefined) {
            return res.status(400).json({
                success: false,
                message: 'At least one field (isDownloaded or fileDownlodedPath) is required',
                status: 400
            });
        }

        if (isDownloaded !== undefined && typeof isDownloaded !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isDownloaded must be a boolean value',
                status: 400
            });
        }

        // Check if transaction exists
        const transaction = await Transaction.findOne({ TRANSACTION_ID: parseInt(transaction_id) });
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found',
                status: 404
            });
        }

        // Build update object
        const updateData = { updated_at: new Date() };
        if (isDownloaded !== undefined) {
            updateData.isDownloaded = isDownloaded;
        }
        if (fileDownlodedPath !== undefined) {
            updateData.fileDownlodedPath = fileDownlodedPath;
        }

        // Update the transaction
        const updatedTransaction = await Transaction.findOneAndUpdate(
            { TRANSACTION_ID: parseInt(transaction_id) },
            updateData,
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Transaction download status updated successfully',
            transaction: {
                TRANSACTION_ID: updatedTransaction.TRANSACTION_ID,
                user_id: updatedTransaction.user_id,
                isDownloaded: updatedTransaction.isDownloaded,
                fileDownlodedPath: updatedTransaction.fileDownlodedPath,
                updated_at: updatedTransaction.updated_at
            },
            status: 200
        });

    } catch (error) {
        console.error('Update download status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

// Get transactions by advisor ID with comprehensive details
const getTransactionsByAdvisorId = async (req, res) => {
    try {
        const { advisor_id } = req.params;
        
        // Validate advisor_id
        if (!advisor_id) {
            return res.status(400).json({
                success: false,
                message: 'Advisor ID is required',
                status: 400
            });
        }

        // Get query parameters
        const { 
            page = 1, 
            limit = 10, 
            search, 
            transaction_type,
            status: transaction_status,
            payment_method,
            amount_min,
            amount_max,
            created_date_from,
            created_date_to,
            transaction_date_from,
            transaction_date_to,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        // Verify advisor exists and is an advisor (role_id = 2)
        const advisor = await User.findOne({ user_id: Number(advisor_id), role_id: 2 });
        if (!advisor) {
            return res.status(404).json({
                success: false,
                message: 'Advisor not found',
                status: 404
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query - filter by advisor's user_id
        const query = { user_id: Number(advisor_id) };

        // Add transaction_type filter
        if (transaction_type) {
            if (Array.isArray(transaction_type)) {
                query.transactionType = { $in: transaction_type };
            } else if (typeof transaction_type === 'string' && transaction_type.includes(',')) {
                const typeArray = transaction_type.split(',').map(t => t.trim());
                query.transactionType = { $in: typeArray };
            } else {
                query.transactionType = transaction_type;
            }
        }

        // Add status filter
        if (transaction_status) {
            if (Array.isArray(transaction_status)) {
                query.status = { $in: transaction_status };
            } else if (typeof transaction_status === 'string' && transaction_status.includes(',')) {
                const statusArray = transaction_status.split(',').map(s => s.trim());
                query.status = { $in: statusArray };
            } else {
                query.status = transaction_status;
            }
        }

        // Add payment_method filter
        if (payment_method) {
            if (Array.isArray(payment_method)) {
                query.payment_method = { $in: payment_method };
            } else if (typeof payment_method === 'string' && payment_method.includes(',')) {
                const methodArray = payment_method.split(',').map(m => m.trim());
                query.payment_method = { $in: methodArray };
            } else {
                query.payment_method = payment_method;
            }
        }

        // Add amount range filter
        if (amount_min !== undefined || amount_max !== undefined) {
            query.amount = {};
            if (amount_min !== undefined) {
                query.amount.$gte = parseFloat(amount_min);
            }
            if (amount_max !== undefined) {
                query.amount.$lte = parseFloat(amount_max);
            }
        }

        // Add date range filters
        if (created_date_from || created_date_to) {
            query.created_at = {};
            if (created_date_from) {
                query.created_at.$gte = new Date(created_date_from);
            }
            if (created_date_to) {
                query.created_at.$lt = new Date(new Date(created_date_to).getTime() + 24 * 60 * 60 * 1000);
            }
        }

        // Add transaction_date range filter
        if (transaction_date_from || transaction_date_to) {
            query.transaction_date = {};
            if (transaction_date_from) {
                query.transaction_date.$gte = new Date(transaction_date_from);
            }
            if (transaction_date_to) {
                query.transaction_date.$lt = new Date(new Date(transaction_date_to).getTime() + 24 * 60 * 60 * 1000);
            }
        }

        // Build sort object
        const sortObj = {};
        sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

        // Get transactions with pagination and filters
        const transactions = await Transaction.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const totalTransactions = await Transaction.countDocuments(query);

        // Get all unique created_by user IDs from transactions
        const createdByUserIds = [...new Set(transactions.map(t => t.created_by))];
        
        // Get all unique bank IDs
        const bankIds = [...new Set(transactions.map(t => t.bank_id).filter(id => id))];
        
        // Get all unique payment details IDs
        const paymentDetailsIds = [...new Set(transactions.map(t => t.PaymentDetails_id).filter(id => id))];
        
        // Fetch created_by user details
        const createdByUsers = await User.find(
            { user_id: { $in: createdByUserIds } }, 
            { user_id: 1, name: 1, email: 1, mobile: 1, role_id: 1, _id: 0 }
        );
        const createdByUserMap = {};
        createdByUsers.forEach(u => { createdByUserMap[u.user_id] = u; });
        
        // Fetch bank details for all bank IDs
        let bankMap = {};
        if (bankIds.length > 0) {
            const AdvisorBankAccountDetails = require('../models/Advisor_bankAccountDetails.model');
            const banks = await AdvisorBankAccountDetails.find(
                { bankAccount_id: { $in: bankIds } },
                { bankAccount_id: 1, account_holder_name: 1, bank_name: 1, account_number: 1, ifsc_code: 1, _id: 0 }
            );
            banks.forEach(b => { bankMap[b.bankAccount_id] = b; });
        }

        // Fetch payment details for all payment details IDs
        let paymentDetailsMap = {};
        if (paymentDetailsIds.length > 0) {
            const PaymentDetails = require('../models/payment_details.model');
            const paymentDetailsArray = await PaymentDetails.find(
                { paymentDetails_id: { $in: paymentDetailsIds } },
                { paymentDetails_id: 1, payment_type: 1, upi_id: 1, qr_code: 1, _id: 0 }
            );
            paymentDetailsArray.forEach(pd => { paymentDetailsMap[pd.paymentDetails_id] = pd; });
        }
        
        // Map transactions to include comprehensive details
        const transactionsWithDetails = transactions.map(transaction => {
            const transactionObj = transaction.toObject();
            return {
                ...transactionObj,
                advisor_details: {
                    user_id: advisor.user_id,
                    name: advisor.name,
                    email: advisor.email,
                    mobile: advisor.mobile,
                    role_id: advisor.role_id
                },
                created_by_details: createdByUserMap[transaction.created_by] ? {
                    user_id: createdByUserMap[transaction.created_by].user_id,
                    name: createdByUserMap[transaction.created_by].name,
                    email: createdByUserMap[transaction.created_by].email,
                    mobile: createdByUserMap[transaction.created_by].mobile,
                    role_id: createdByUserMap[transaction.created_by].role_id
                } : null,
                bank_account_details: transaction.bank_id && bankMap[transaction.bank_id] ? {
                    bankAccount_id: bankMap[transaction.bank_id].bankAccount_id,
                    account_holder_name: bankMap[transaction.bank_id].account_holder_name,
                    bank_name: bankMap[transaction.bank_id].bank_name,
                    account_number: bankMap[transaction.bank_id].account_number,
                    ifsc_code: bankMap[transaction.bank_id].ifsc_code
                } : null,
                payment_details: transaction.PaymentDetails_id && paymentDetailsMap[transaction.PaymentDetails_id] ? {
                    paymentDetails_id: paymentDetailsMap[transaction.PaymentDetails_id].paymentDetails_id,
                    payment_type: paymentDetailsMap[transaction.PaymentDetails_id].payment_type,
                    upi_id: paymentDetailsMap[transaction.PaymentDetails_id].upi_id,
                    qr_code: paymentDetailsMap[transaction.PaymentDetails_id].qr_code
                } : null
            };
        });

        // Calculate transaction summary for advisor
        const allAdvisorTransactions = await Transaction.find({ user_id: Number(advisor_id) });
        const transactionSummary = {
            total_transactions: allAdvisorTransactions.length,
            total_amount: allAdvisorTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0),
            total_gst: allAdvisorTransactions.reduce((sum, txn) => sum + (txn.TotalGST || 0), 0),
            by_status: {
                pending: allAdvisorTransactions.filter(txn => txn.status === 'pending').length,
                completed: allAdvisorTransactions.filter(txn => txn.status === 'completed').length,
                failed: allAdvisorTransactions.filter(txn => txn.status === 'failed').length
            },
            by_type: allAdvisorTransactions.reduce((acc, txn) => {
                acc[txn.transactionType] = (acc[txn.transactionType] || 0) + 1;
                return acc;
            }, {}),
            earnings: {
                total_call_earnings: allAdvisorTransactions
                    .filter(txn => txn.transactionType === 'Call')
                    .reduce((sum, txn) => sum + (txn.amount || 0), 0),
                total_package_earnings: allAdvisorTransactions
                    .filter(txn => txn.transactionType === 'Package_Buy')
                    .reduce((sum, txn) => sum + (txn.amount || 0), 0),
                total_deposits: allAdvisorTransactions
                    .filter(txn => ['deposit', 'RechargeByAdmin', 'Recharge'].includes(txn.transactionType))
                    .reduce((sum, txn) => sum + (txn.amount || 0), 0),
                total_withdrawals: allAdvisorTransactions
                    .filter(txn => txn.transactionType === 'withdraw')
                    .reduce((sum, txn) => sum + (txn.amount || 0), 0)
            },
            call_transactions: allAdvisorTransactions.filter(txn => txn.transactionType === 'Call').length,
            withdrawal_transactions: allAdvisorTransactions.filter(txn => txn.transactionType === 'withdraw').length,
            deposit_transactions: allAdvisorTransactions.filter(txn => ['deposit', 'RechargeByAdmin', 'Recharge'].includes(txn.transactionType)).length
        };

        // Get available filter options for this advisor's transactions
        const availableStatuses = [...new Set(allAdvisorTransactions.map(t => t.status))];
        const availableTransactionTypes = [...new Set(allAdvisorTransactions.map(t => t.transactionType))];
        const availablePaymentMethods = [...new Set(allAdvisorTransactions.map(t => t.payment_method))];

        // Calculate pagination info
        const totalPages = Math.ceil(totalTransactions / parseInt(limit));
        const hasNextPage = parseInt(page) < totalPages;
        const hasPrevPage = parseInt(page) > 1;

        // Get wallet information
        const wallet = await Wallet.findOne({ user_id: Number(advisor_id) });

        return res.status(200).json({ 
            success: true,
            message: `Transactions for advisor ${advisor_id} retrieved successfully`,
            data: {
                advisor: {
                    user_id: advisor.user_id,
                    name: advisor.name,
                    email: advisor.email,
                    mobile: advisor.mobile,
                    role_id: advisor.role_id,
                    rating: advisor.rating,
                    experience_year: advisor.experience_year
                },
                transactions: transactionsWithDetails,
                transaction_summary: transactionSummary,
                wallet: wallet ? {
                    user_id: wallet.user_id,
                    amount: wallet.amount,
                    status: wallet.status,
                    created_At: wallet.created_At,
                    updated_At: wallet.updated_At
                } : null,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: totalPages,
                    total_transactions: totalTransactions,
                    limit: parseInt(limit),
                    has_next_page: hasNextPage,
                    has_prev_page: hasPrevPage,
                    next_page: hasNextPage ? parseInt(page) + 1 : null,
                    prev_page: hasPrevPage ? parseInt(page) - 1 : null
                },
                filters: {
                    available_statuses: availableStatuses,
                    available_transaction_types: availableTransactionTypes,
                    available_payment_methods: availablePaymentMethods
                }
            },
            status: 200 
        });
    } catch (error) {
        console.error('Get transactions by advisor ID error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500 
        });
    }
};

module.exports = { 
    createTransaction, 
    createTransactionByAdmin, 
    getTransactionById, 
    getAllTransactions, 
    updateTransaction, 
    getTransactionsbyauth,
    updateIsDownloaded,
    updateFileDownloadedPath,
    updateDownloadStatus,
    getTransactionsByAdvisorId
}; 