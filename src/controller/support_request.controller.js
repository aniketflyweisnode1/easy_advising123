const SupportRequest = require('../models/support_request.model');
const User = require('../models/User.model');

// Create Support Request
const createSupportRequest = async (req, res) => {
  try {
    const { user_id, mobileno, Emailaddress, Status } = req.body;
    
    if (!user_id || !mobileno || !Emailaddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'user_id, mobileno, and Emailaddress are required',
        status: 400
      });
    }

    const data = {
      user_id: parseInt(user_id),
      mobileno,
      Emailaddress,
      Status: Status !== undefined ? Status : true,
      CreateBy: req.user.user_id,
      CreateAt: new Date()
    };

    const supportRequest = await SupportRequest.create(data);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Support request created successfully', 
      data: supportRequest,
      status: 201
    });
  } catch (error) {
    console.error('Create support request error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error',
      status: 500
    });
  }
};

// Update Support Request
const updateSupportRequest = async (req, res) => {
  try {
    const { Support_Request_id, user_id, mobileno, Emailaddress, Status } = req.body;
    
    if (!Support_Request_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Support_Request_id is required',
        status: 400
      });
    }

    const updateData = {
      UpdatedBy: req.user.user_id,
      UpdatedAt: new Date()
    };

    if (user_id !== undefined) updateData.user_id = parseInt(user_id);
    if (mobileno !== undefined) updateData.mobileno = mobileno;
    if (Emailaddress !== undefined) updateData.Emailaddress = Emailaddress;
    if (Status !== undefined) updateData.Status = Status;

    const supportRequest = await SupportRequest.findOneAndUpdate(
      { Support_Request_id: parseInt(Support_Request_id) },
      updateData,
      { new: true, runValidators: true }
    );

    if (!supportRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Support request not found',
        status: 404
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Support request updated successfully', 
      data: supportRequest,
      status: 200
    });
  } catch (error) {
    console.error('Update support request error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error',
      status: 500
    });
  }
};

// Get Support Request by ID
const getSupportRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supportRequest = await SupportRequest.findOne({ 
      Support_Request_id: parseInt(id) 
    });

    if (!supportRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Support request not found',
        status: 404
      });
    }

    // Populate user details
    const [user, createdByUser, updatedByUser] = await Promise.all([
      User.findOne({ user_id: supportRequest.user_id }, { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }),
      User.findOne({ user_id: supportRequest.CreateBy }, { user_id: 1, name: 1, email: 1, _id: 0 }),
      supportRequest.UpdatedBy ? User.findOne({ user_id: supportRequest.UpdatedBy }, { user_id: 1, name: 1, email: 1, _id: 0 }) : null
    ]);

    const supportRequestWithDetails = {
      ...supportRequest.toObject(),
      user: user ? {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        mobile: user.mobile
      } : null,
      created_by_user: createdByUser ? {
        user_id: createdByUser.user_id,
        name: createdByUser.name,
        email: createdByUser.email
      } : null,
      updated_by_user: updatedByUser ? {
        user_id: updatedByUser.user_id,
        name: updatedByUser.name,
        email: updatedByUser.email
      } : null
    };

    return res.status(200).json({ 
      success: true, 
      data: supportRequestWithDetails,
      status: 200
    });
  } catch (error) {
    console.error('Get support request by ID error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error',
      status: 500
    });
  }
};

// Get All Support Requests
const getAllSupportRequests = async (req, res) => {
  try {
    const {
      search,
      status,
      user_id,
      created_date_from,
      created_date_to,
      updated_date_from,
      updated_date_to,
      sort_by = 'CreateAt',
      sort_order = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Add status filter
    if (status !== undefined) {
      let statusValue;
      if (status === 'true' || status === true) {
        statusValue = true;
      } else if (status === 'false' || status === false) {
        statusValue = false;
      } else {
        statusValue = status;
      }
      query.Status = statusValue;
    }

    // Add user_id filter
    if (user_id) {
      query.user_id = parseInt(user_id);
    }

    // Add created date range filter
    if (created_date_from || created_date_to) {
      query.CreateAt = {};
      if (created_date_from) {
        query.CreateAt.$gte = new Date(created_date_from);
      }
      if (created_date_to) {
        query.CreateAt.$lt = new Date(new Date(created_date_to).getTime() + 24 * 60 * 60 * 1000);
      }
    }

    // Add updated date range filter
    if (updated_date_from || updated_date_to) {
      query.UpdatedAt = {};
      if (updated_date_from) {
        query.UpdatedAt.$gte = new Date(updated_date_from);
      }
      if (updated_date_to) {
        query.UpdatedAt.$lt = new Date(new Date(updated_date_to).getTime() + 24 * 60 * 60 * 1000);
      }
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Get support requests with pagination and filters
    const supportRequests = await SupportRequest.find(query)
      .sort(sortObj);

    // Get all unique user IDs
    const userIds = [...new Set([
      ...supportRequests.map(r => r.user_id),
      ...supportRequests.map(r => r.CreateBy),
      ...supportRequests.map(r => r.UpdatedBy).filter(id => id)
    ])];

    // Fetch user details for all user IDs
    const users = await User.find(
      { user_id: { $in: userIds } },
      { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }
    );
    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u; });

    // Map support requests to include populated details
    let requestsWithDetails = supportRequests.map(request => {
      const requestObj = request.toObject();
      return {
        ...requestObj,
        user: userMap[request.user_id] ? {
          user_id: userMap[request.user_id].user_id,
          name: userMap[request.user_id].name,
          email: userMap[request.user_id].email,
          mobile: userMap[request.user_id].mobile
        } : null,
        created_by_user: userMap[request.CreateBy] ? {
          user_id: userMap[request.CreateBy].user_id,
          name: userMap[request.CreateBy].name,
          email: userMap[request.CreateBy].email
        } : null,
        updated_by_user: request.UpdatedBy && userMap[request.UpdatedBy] ? {
          user_id: userMap[request.UpdatedBy].user_id,
          name: userMap[request.UpdatedBy].name,
          email: userMap[request.UpdatedBy].email
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
          request.mobileno?.includes(searchTerm) ||
          request.Emailaddress?.toLowerCase().includes(searchLower) ||
          request.Support_Request_id?.toString().includes(searchTerm) ||
          (request.CreateAt && 
            request.CreateAt.toISOString().split('T')[0].includes(searchTerm)
          ) ||
          (request.UpdatedAt && 
            request.UpdatedAt.toISOString().split('T')[0].includes(searchTerm)
          )
        );
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Support requests retrieved successfully',
      data: {
        requests: requestsWithDetails
      },
      status: 200
    });
  } catch (error) {
    console.error('Get all support requests error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      status: 500
    });
  }
};

// Delete Support Request
const deleteSupportRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const supportRequest = await SupportRequest.findOneAndDelete({ 
      Support_Request_id: parseInt(id) 
    });

    if (!supportRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Support request not found',
        status: 404
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Support request deleted successfully',
      status: 200
    });
  } catch (error) {
    console.error('Delete support request error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error',
      status: 500
    });
  }
};

// Get Support Requests by Authenticated User
const getSupportRequestsByAuth = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        status: 401
      });
    }

    const {
      search,
      status,
      created_date_from,
      created_date_to,
      updated_date_from,
      updated_date_to,
      sort_by = 'CreateAt',
      sort_order = 'desc'
    } = req.query;

    // Build query - filter by authenticated user
    const query = {
      $or: [
        { user_id: userId },
        { CreateBy: userId }
      ]
    };

    // Add status filter
    if (status !== undefined) {
      let statusValue;
      if (status === 'true' || status === true) {
        statusValue = true;
      } else if (status === 'false' || status === false) {
        statusValue = false;
      } else {
        statusValue = status;
      }
      query.Status = statusValue;
    }

    // Add created date range filter
    if (created_date_from || created_date_to) {
      query.CreateAt = {};
      if (created_date_from) {
        query.CreateAt.$gte = new Date(created_date_from);
      }
      if (created_date_to) {
        query.CreateAt.$lt = new Date(new Date(created_date_to).getTime() + 24 * 60 * 60 * 1000);
      }
    }

    // Add updated date range filter
    if (updated_date_from || updated_date_to) {
      query.UpdatedAt = {};
      if (updated_date_from) {
        query.UpdatedAt.$gte = new Date(updated_date_from);
      }
      if (updated_date_to) {
        query.UpdatedAt.$lt = new Date(new Date(updated_date_to).getTime() + 24 * 60 * 60 * 1000);
      }
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Get support requests with pagination and filters
    const supportRequests = await SupportRequest.find(query)
      .sort(sortObj);

    // Get all unique user IDs
    const userIds = [...new Set([
      ...supportRequests.map(r => r.user_id),
      ...supportRequests.map(r => r.CreateBy),
      ...supportRequests.map(r => r.UpdatedBy).filter(id => id)
    ])];

    // Fetch user details for all user IDs
    const users = await User.find(
      { user_id: { $in: userIds } },
      { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }
    );
    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u; });

    // Map support requests to include populated details
    let requestsWithDetails = supportRequests.map(request => {
      const requestObj = request.toObject();
      return {
        ...requestObj,
        user: userMap[request.user_id] ? {
          user_id: userMap[request.user_id].user_id,
          name: userMap[request.user_id].name,
          email: userMap[request.user_id].email,
          mobile: userMap[request.user_id].mobile
        } : null,
        created_by_user: userMap[request.CreateBy] ? {
          user_id: userMap[request.CreateBy].user_id,
          name: userMap[request.CreateBy].name,
          email: userMap[request.CreateBy].email
        } : null,
        updated_by_user: request.UpdatedBy && userMap[request.UpdatedBy] ? {
          user_id: userMap[request.UpdatedBy].user_id,
          name: userMap[request.UpdatedBy].name,
          email: userMap[request.UpdatedBy].email
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
          request.mobileno?.includes(searchTerm) ||
          request.Emailaddress?.toLowerCase().includes(searchLower) ||
          request.Support_Request_id?.toString().includes(searchTerm) ||
          (request.CreateAt && 
            request.CreateAt.toISOString().split('T')[0].includes(searchTerm)
          ) ||
          (request.UpdatedAt && 
            request.UpdatedAt.toISOString().split('T')[0].includes(searchTerm)
          )
        );
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Your support requests retrieved successfully',
      data: {
        requests: requestsWithDetails
      },
      status: 200
    });
  } catch (error) {
    console.error('Get support requests by auth error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      status: 500
    });
  }
};

module.exports = {
  createSupportRequest,
  updateSupportRequest,
  getSupportRequestById,
  getAllSupportRequests,
  deleteSupportRequest,
  getSupportRequestsByAuth
};

