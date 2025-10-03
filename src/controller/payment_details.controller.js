const PaymentDetails = require('../models/payment_details.model');

// Create payment details with authentication
const createPaymentDetails = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    
    // Set user_id and CreateBy from authenticated user
    req.body.user_id = user_id;
    req.body.CreateBy = user_id;
    req.body.CreateAt = new Date();

    const paymentDetails = new PaymentDetails(req.body);
    await paymentDetails.save();

    res.status(201).json({
      success: true,
      message: 'Payment details created successfully',
      data: paymentDetails,
      status: 201
    });
  } catch (error) {
    console.error('Error creating payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment details',
      error: error.message,
      status: 500
    });
  }
};

// Update payment details with authentication
const updatePaymentDetails = async (req, res) => {
  try {
    const { PaymentDetails_id } = req.body;
    const user_id = req.user.user_id;

    if (!PaymentDetails_id) {
      return res.status(400).json({
        success: false,
        message: 'PaymentDetails_id is required',
        status: 400
      });
    }

    req.body.UpdatedBy = user_id;
    req.body.UpdatedAt = new Date();

    const updatedPaymentDetails = await PaymentDetails.findOneAndUpdate(
      { PaymentDetails_id: parseInt(PaymentDetails_id) },
      req.body,
      { new: true }
    );

    if (!updatedPaymentDetails) {
      return res.status(404).json({
        success: false,
        message: 'Payment details not found',
        status: 404
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment details updated successfully',
      data: updatedPaymentDetails,
      status: 200
    });
  } catch (error) {
    console.error('Error updating payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment details',
      error: error.message,
      status: 500
    });
  }
};

// Get payment details by ID with authentication
const getPaymentDetailsById = async (req, res) => {
  try {
    const { PaymentDetails_id } = req.params;

    if (!PaymentDetails_id) {
      return res.status(400).json({
        success: false,
        message: 'PaymentDetails_id is required',
        status: 400
      });
    }

    const paymentDetails = await PaymentDetails.findOne({
      PaymentDetails_id: parseInt(PaymentDetails_id)
    }).populate('user_id', 'name email mobile')
      .populate('CreateBy', 'name email')
      .populate('UpdatedBy', 'name email');

    if (!paymentDetails) {
      return res.status(404).json({
        success: false,
        message: 'Payment details not found',
        status: 404
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment details retrieved successfully',
      data: paymentDetails,
      status: 200
    });
  } catch (error) {
    console.error('Error getting payment details by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving payment details',
      error: error.message,
      status: 500
    });
  }
};

// Get all payment details (no authentication required)
const getAllPaymentDetails = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      Status,
      sort_by = 'CreateAt',
      sort_order = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    // Add search functionality
    if (search) {
      query.$or = [
        { UPI_id: { $regex: search, $options: 'i' } },
        { Bankname: { $regex: search, $options: 'i' } },
        { accountno: { $regex: search, $options: 'i' } },
        { ifsccode: { $regex: search, $options: 'i' } },
        { branchname: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (Status !== undefined) {
      let statusValue;
      if (Status === 'true' || Status === true) {
        statusValue = true;
      } else if (Status === 'false' || Status === false) {
        statusValue = false;
      }
      if (statusValue !== undefined) {
        query.Status = statusValue;
      }
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Get payment details with pagination and filters
    const paymentDetails = await PaymentDetails.find(query)
      .populate('user_id', 'name email mobile')
      .populate('CreateBy', 'name email')
      .populate('UpdatedBy', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalPaymentDetails = await PaymentDetails.countDocuments(query);

    res.status(200).json({
      success: true,
      message: 'Payment details retrieved successfully',
      data: {
        payment_details: paymentDetails,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalPaymentDetails / limit),
          total_items: totalPaymentDetails,
          items_per_page: parseInt(limit)
        }
      },
      status: 200
    });
  } catch (error) {
    console.error('Error getting all payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving payment details',
      error: error.message,
      status: 500
    });
  }
};

// Get payment details by authenticated user
const getPaymentDetailsByAuth = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const paymentDetails = await PaymentDetails.find({ user_id })
      .populate('user_id', 'name email mobile')
      .populate('CreateBy', 'name email')
      .populate('UpdatedBy', 'name email')
      .sort({ CreateAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Payment details retrieved successfully',
      data: paymentDetails,
      status: 200
    });
  } catch (error) {
    console.error('Error getting payment details by auth:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving payment details',
      error: error.message,
      status: 500
    });
  }
};

// Delete payment details with authentication
const deletePaymentDetails = async (req, res) => {
  try {
    const { PaymentDetails_id } = req.params;

    if (!PaymentDetails_id) {
      return res.status(400).json({
        success: false,
        message: 'PaymentDetails_id is required',
        status: 400
      });
    }

    const deletedPaymentDetails = await PaymentDetails.findOneAndDelete({
      PaymentDetails_id: parseInt(PaymentDetails_id)
    });

    if (!deletedPaymentDetails) {
      return res.status(404).json({
        success: false,
        message: 'Payment details not found',
        status: 404
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment details deleted successfully',
      data: deletedPaymentDetails,
      status: 200
    });
  } catch (error) {
    console.error('Error deleting payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting payment details',
      error: error.message,
      status: 500
    });
  }
};

module.exports = {
  createPaymentDetails,
  updatePaymentDetails,
  getPaymentDetailsById,
  getAllPaymentDetails,
  getPaymentDetailsByAuth,
  deletePaymentDetails
};

