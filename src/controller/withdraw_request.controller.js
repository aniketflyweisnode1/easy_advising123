const WithdrawRequest = require('../models/withdraw_request.model');
const Transaction = require('../models/transaction.model');
const Wallet = require('../models/wallet.model');
const User = require('../models/User.model');

// Create withdraw request
const createWithdrawRequest = async (req, res) => {
  try {
    const data = req.body;
    if (req.user && req.user.user_id) {
      data.created_by = req.user.user_id;
      data.user_id = req.user.user_id;
    }
    const request = new WithdrawRequest(data);
    await request.save();
    return res.status(201).json({ message: 'Withdraw request created', request, status: 201 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Update withdraw request
// Update withdraw request
const updateWithdrawRequest = async (req, res) => {
  try {
    const { request_id, ...updateData } = req.body;
    
    // Validate request_id
    if (!request_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Request ID is required', 
        status: 400 
      });
    }

    // Find the withdraw request
    const request = await WithdrawRequest.findOne({ request_id });
    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: 'Withdraw request not found', 
        status: 404 
      });
    }

    // Prepare update data with audit fields
    const finalUpdateData = {
      ...updateData,
      updated_by: req.user?.user_id || null,
      updated_at: new Date()
    };

    // If status is Release or Approved, create transaction and deduct from wallet
    if (updateData.last_status && ["Release", "Approved"].includes(updateData.last_status)) {
      const wallet = await Wallet.findOne({ user_id: request.user_id });
      const requestAmount = Number(request.amount);
      const walletAmount = Number(wallet?.amount) || 0;
      
      if (!wallet || walletAmount < requestAmount) {
        return res.status(400).json({ 
          success: false,
          message: 'Insufficient funds in wallet', 
          status: 400 
        });
      }
      
      // Deduct from wallet - ensure both values are numbers
      wallet.amount = walletAmount - requestAmount;
      wallet.updated_At = new Date();
      await wallet.save();
      
      // Create transaction
      const transaction = new Transaction({
        user_id: request.user_id,
        amount: requestAmount,
        status: 'completed',
        payment_method: 'withdraw',
        transactionType: 'withdraw',
        transaction_date: new Date(),
        created_by: req.user.user_id
      });
      await transaction.save();
      
      // Update withdraw request with transaction_id
      finalUpdateData.transaction_id = transaction.TRANSACTION_ID;
    }

    // Update the withdraw request
    const updatedRequest = await WithdrawRequest.findOneAndUpdate(
      { request_id },
      finalUpdateData,
      { new: true, runValidators: true }
    );

    if (!updatedRequest) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to update withdraw request', 
        status: 500 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Withdraw request updated successfully', 
      data: updatedRequest,
      status: 200 
    });
  } catch (error) {
    console.error('Update withdraw request error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error', 
      error: error.message,
      status: 500 
    });
  }
};
// Get withdraw request by ID
const getWithdrawRequestById = async (req, res) => {
  try {
    const { request_id } = req.params;
    const request = await WithdrawRequest.findOne({ request_id });
    if (!request) {
      return res.status(404).json({ message: 'Withdraw request not found', status: 404 });
    }

    // Get user details for user_id and created_by
    const User = require('../models/User.model');
    const [user, createdByUser] = await Promise.all([
      User.findOne({ user_id: request.user_id }, { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }),
      User.findOne({ user_id: request.created_by }, { user_id: 1, name: 1, _id: 0 })
    ]);

    // Get withdraw method details
    const WithdrawMethod = require('../models/withdraw_method.model');
    const withdrawMethod = await WithdrawMethod.findOne(
      { method_id: request.method_id },
      { method_id: 1, method_name: 1, description: 1, _id: 0 }
    );

    // Get transaction details if exists
    let transactionDetails = null;
    if (request.transaction_id) {
      transactionDetails = await Transaction.findOne(
        { TRANSACTION_ID: request.transaction_id },
        { TRANSACTION_ID: 1, amount: 1, status: 1, transaction_date: 1, _id: 0 }
      );
    }

    const requestWithDetails = {
      ...request.toObject(),
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
      withdraw_method: withdrawMethod ? {
        method_id: withdrawMethod.method_id,
        method_name: withdrawMethod.method_name,
        description: withdrawMethod.description
      } : null,
      transaction_details: transactionDetails ? {
        TRANSACTION_ID: transactionDetails.TRANSACTION_ID,
        amount: transactionDetails.amount,
        status: transactionDetails.status,
        transaction_date: transactionDetails.transaction_date
      } : null
    };

    return res.status(200).json({ 
      success: true,
      request: requestWithDetails, 
      status: 200 
    });
  } catch (error) {
    console.error('Get withdraw request by ID error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get all withdraw requests
const getAllWithdrawRequests = async (req, res) => {
  try {
    const requests = await WithdrawRequest.find().sort({ created_at: -1 });
    
    // Get all unique user IDs from requests
    const userIds = [...new Set([
      ...requests.map(r => r.user_id),
      ...requests.map(r => r.created_by)
    ])];
    
    // Get all unique method IDs
    const methodIds = [...new Set(requests.map(r => r.method_id))];
    
    // Get all unique transaction IDs
    const transactionIds = [...new Set(requests.map(r => r.transaction_id).filter(id => id))];
    
    // Fetch user details for all user IDs

    const users = await User.find(
      { user_id: { $in: userIds } }, 
      { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }
    );
    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u; });
    
    // Fetch withdraw method details for all method IDs
    const WithdrawMethod = require('../models/withdraw_method.model');
    const withdrawMethods = await WithdrawMethod.find(
      { method_id: { $in: methodIds } },
      { method_id: 1, method_name: 1, description: 1, _id: 0 }
    );
    const methodMap = {};
    withdrawMethods.forEach(m => { methodMap[m.method_id] = m; });
    
    // Fetch transaction details for all transaction IDs
    let transactionMap = {};
    if (transactionIds.length > 0) {
      const transactions = await Transaction.find(
        { TRANSACTION_ID: { $in: transactionIds } },
        { TRANSACTION_ID: 1, amount: 1, status: 1, transaction_date: 1, _id: 0 }
      );
      transactions.forEach(t => { transactionMap[t.TRANSACTION_ID] = t; });
    }
    
    // Map requests to include user, method, and transaction details
    const requestsWithDetails = requests.map(request => {
      const requestObj = request.toObject();
      return {
        ...requestObj,
        user: userMap[request.user_id] ? {
          user_id: userMap[request.user_id].user_id,
          name: userMap[request.user_id].name,
          email: userMap[request.user_id].email,
          mobile: userMap[request.user_id].mobile
        } : null,
        created_by_user: userMap[request.created_by] ? {
          user_id: userMap[request.created_by].user_id,
          name: userMap[request.created_by].name
        } : null,
        withdraw_method: methodMap[request.method_id] ? {
          method_id: methodMap[request.method_id].method_id,
          method_name: methodMap[request.method_id].method_name,
          description: methodMap[request.method_id].description
        } : null,
        transaction_details: request.transaction_id && transactionMap[request.transaction_id] ? {
          TRANSACTION_ID: transactionMap[request.transaction_id].TRANSACTION_ID,
          amount: transactionMap[request.transaction_id].amount,
          status: transactionMap[request.transaction_id].status,
          transaction_date: transactionMap[request.transaction_id].transaction_date
        } : null
      };
    });

    return res.status(200).json({ 
      success: true,
      requests: requestsWithDetails,
      count: requestsWithDetails.length,
      status: 200 
    });
  } catch (error) {
    console.error('Get all withdraw requests error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};

module.exports = { createWithdrawRequest, updateWithdrawRequest, getWithdrawRequestById, getAllWithdrawRequests }; 