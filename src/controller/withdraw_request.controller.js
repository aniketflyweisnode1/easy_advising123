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
    // Get URL parameters
    const { last_status, date_from, date_to } = req.params;
    
    // Get query parameters
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status,
      method_id,
      user_id,
      created_date_from,
      created_date_to,
      updated_date_from,
      updated_date_to,
      amount_min,
      amount_max,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    // Add status filter
    if (status !== undefined) {
      let statusValue;
      if (status === 'true' || status === true) {
        statusValue = 1;
      } else if (status === 'false' || status === false) {
        statusValue = 0;
      } else {
        statusValue = parseInt(status);
        if (isNaN(statusValue)) {
          statusValue = undefined;
        }
      }
      if (statusValue !== undefined) {
        query.status = statusValue;
      }
    }

    // Add last_status filter (support multiple statuses)
    if (last_status) {
      if (Array.isArray(last_status)) {
        // Handle array of statuses
        query.last_status = { $in: last_status };
      } else if (typeof last_status === 'string' && last_status.includes(',')) {
        // Handle comma-separated statuses
        const statusArray = last_status.split(',').map(s => s.trim());
        query.last_status = { $in: statusArray };
      } else {
        // Handle single status
        query.last_status = last_status;
      }
    }

    // Add method_id filter
    if (method_id) {
      query.method_id = parseInt(method_id);
    }

    // Add user_id filter
    if (user_id) {
      query.user_id = parseInt(user_id);
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

    // Add updated date range filter
    if (updated_date_from || updated_date_to) {
      query.updated_at = {};
      if (updated_date_from) {
        query.updated_at.$gte = new Date(updated_date_from);
      }
      if (updated_date_to) {
        query.updated_at.$lt = new Date(new Date(updated_date_to).getTime() + 24 * 60 * 60 * 1000); // Add 1 day to include the entire day
      }
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Get requests with pagination and filters
    const requests = await WithdrawRequest.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalRequests = await WithdrawRequest.countDocuments(query);
    
    // Get all unique user IDs from requests (including updated_by)
    const userIds = [...new Set([
      ...requests.map(r => r.user_id),
      ...requests.map(r => r.created_by),
      ...requests.map(r => r.updated_by).filter(id => id)
    ])];
    
    // Get all unique method IDs
    const methodIds = [...new Set(requests.map(r => r.method_id))];
    
    // Get all unique transaction IDs
    const transactionIds = [...new Set(requests.map(r => r.transaction_id).filter(id => id))];
    
    // Fetch user details for all user IDs
    const users = await User.find(
      { user_id: { $in: userIds } }, 
      { user_id: 1, name: 1, email: 1, mobile: 1, status: 1, login_permission_status: 1, _id: 0 }
    );
    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u; });
    
    // Fetch withdraw method details for all method IDs
    const WithdrawMethod = require('../models/withdraw_method.model');
    const withdrawMethods = await WithdrawMethod.find(
      { method_id: { $in: methodIds } },
      { method_id: 1, method_name: 1, description: 1, status: 1, _id: 0 }
    );
    const methodMap = {};
    withdrawMethods.forEach(m => { methodMap[m.method_id] = m; });
    
    // Fetch transaction details for all transaction IDs
    let transactionMap = {};
    if (transactionIds.length > 0) {
      const transactions = await Transaction.find(
        { TRANSACTION_ID: { $in: transactionIds } },
        { TRANSACTION_ID: 1, amount: 1, status: 1, transaction_date: 1, payment_method: 1, transactionType: 1, _id: 0 }
      );
      transactions.forEach(t => { transactionMap[t.TRANSACTION_ID] = t; });
    }
    
    // Map requests to include all populated details
    let requestsWithDetails = requests.map(request => {
      const requestObj = request.toObject();
      return {
        ...requestObj,
        user: userMap[request.user_id] ? {
          user_id: userMap[request.user_id].user_id,
          name: userMap[request.user_id].name,
          email: userMap[request.user_id].email,
          mobile: userMap[request.user_id].mobile,
          status: userMap[request.user_id].status,
          login_permission_status: userMap[request.user_id].login_permission_status
        } : null,
        created_by_user: userMap[request.created_by] ? {
          user_id: userMap[request.created_by].user_id,
          name: userMap[request.created_by].name,
          email: userMap[request.created_by].email,
          mobile: userMap[request.created_by].mobile
        } : null,
        updated_by_user: request.updated_by && userMap[request.updated_by] ? {
          user_id: userMap[request.updated_by].user_id,
          name: userMap[request.updated_by].name,
          email: userMap[request.updated_by].email,
          mobile: userMap[request.updated_by].mobile
        } : null,
        withdraw_method: methodMap[request.method_id] ? {
          method_id: methodMap[request.method_id].method_id,
          method_name: methodMap[request.method_id].method_name,
          description: methodMap[request.method_id].description,
          status: methodMap[request.method_id].status
        } : null,
        transaction_details: request.transaction_id && transactionMap[request.transaction_id] ? {
          TRANSACTION_ID: transactionMap[request.transaction_id].TRANSACTION_ID,
          amount: transactionMap[request.transaction_id].amount,
          status: transactionMap[request.transaction_id].status,
          transaction_date: transactionMap[request.transaction_id].transaction_date,
          payment_method: transactionMap[request.transaction_id].payment_method,
          transactionType: transactionMap[request.transaction_id].transactionType
        } : null
      };
    });

    // Apply search filter if provided
    if (search) {
      requestsWithDetails = requestsWithDetails.filter(request => {
        const searchLower = search.toLowerCase();
        const searchTerm = search.toString();
        return (
          (request.user && (
            request.user.name?.toLowerCase().includes(searchLower) ||
            request.user.email?.toLowerCase().includes(searchLower) ||
            request.user.mobile?.includes(searchTerm)
          )) ||
          (request.withdraw_method && 
            request.withdraw_method.method_name?.toLowerCase().includes(searchLower)
          ) ||
          request.amount?.toString().includes(searchTerm) ||
          request.details?.toLowerCase().includes(searchLower) ||
          request.last_status?.toLowerCase().includes(searchLower) ||
          request.request_id?.toString().includes(searchTerm) ||
          (request.transaction_details && 
            request.transaction_details.TRANSACTION_ID?.toString().includes(searchTerm)
          ) ||
          // Search by date (format: YYYY-MM-DD or partial date)
          (request.created_at && 
            request.created_at.toISOString().split('T')[0].includes(searchTerm)
          ) ||
          (request.updated_at && 
            request.updated_at.toISOString().split('T')[0].includes(searchTerm)
          )
        );
      });
    }

    // Get available filter options
    const allRequests = await WithdrawRequest.find({}, { last_status: 1, method_id: 1, _id: 0 });
    const availableStatuses = [...new Set(allRequests.map(r => r.last_status))];
    const availableMethods = await WithdrawMethod.find(
      { method_id: { $in: [...new Set(allRequests.map(r => r.method_id))] } },
      { method_id: 1, method_name: 1, _id: 0 }
    );

    return res.status(200).json({ 
      success: true,
      message: 'Withdraw requests retrieved successfully',
      data: {
        requests: requestsWithDetails,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalRequests / limit),
          total_items: totalRequests,
          items_per_page: parseInt(limit)
        },
        filters: {
          available_statuses: availableStatuses,
          available_methods: availableMethods
        }
      },
      status: 200 
    });
  } catch (error) {
    console.error('Get all withdraw requests error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message,
      status: 500 
    });
  }
};

module.exports = { createWithdrawRequest, updateWithdrawRequest, getWithdrawRequestById, getAllWithdrawRequests }; 