const Package = require('../models/package.model');
const User = require('../models/User.model');

// Create package approval request (by advisor/user)
const createPackageApproval = async (req, res) => {
  try {
    const {
      packege_name,
      Chat_price,
      Chat_minute,
      Chat_Schedule,
      Chat_discription,
      Audio_price,
      Audio_minute,
      Audio_Schedule,
      Audio_discription,
      Video_price,
      Video_minute,
      Video_Schedule,
      Video_discription,
      status
    } = req.body;

    // Validate required fields
    if (!packege_name) {
      return res.status(400).json({
        success: false,
        message: 'packege_name is required'
      });
    }

    // Create package with pending approval
    const packageObj = new Package({
      packege_name,
      Chat_price: Chat_price || 0,
      Chat_minute: Chat_minute || 0,
      Chat_Schedule: Chat_Schedule || 0,
      Chat_discription: Chat_discription || '',
      Audio_price: Audio_price || 0,
      Audio_minute: Audio_minute || 0,
      Audio_Schedule: Audio_Schedule || 0,
      Audio_discription: Audio_discription || '',
      Video_price: Video_price || 0,
      Video_minute: Video_minute || 0,
      Video_Schedule: Video_Schedule || 0,
      Video_discription: Video_discription || '',
      approve_status: false, // Pending approval by default
      status: status !== undefined ? status : 1,
      created_by: req.user.user_id
    });

    await packageObj.save();

    res.status(201).json({
      success: true,
      message: 'Package approval request created successfully',
      data: packageObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update package approval (before approval)
const updatePackageApproval = async (req, res) => {
  try {
    const {
      package_id,
      packege_name,
      Chat_price,
      Chat_minute,
      Chat_Schedule,
      Chat_discription,
      Audio_price,
      Audio_minute,
      Audio_Schedule,
      Audio_discription,
      Video_price,
      Video_minute,
      Video_Schedule,
      Video_discription,
      status
    } = req.body;

    // Validate package_id
    if (!package_id) {
      return res.status(400).json({
        success: false,
        message: 'package_id is required'
      });
    }

    // Check if package exists
    const existingPackage = await Package.findOne({ package_id });
    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    // Check if user is the creator
    if (existingPackage.created_by !== req.user.user_id && req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this package'
      });
    }

    // Build update data
    const updateData = {
      updated_by: req.user.user_id,
      updated_at: new Date()
    };

    // Only update fields that are provided
    if (packege_name !== undefined) updateData.packege_name = packege_name;
    if (Chat_price !== undefined) updateData.Chat_price = Chat_price;
    if (Chat_minute !== undefined) updateData.Chat_minute = Chat_minute;
    if (Chat_Schedule !== undefined) updateData.Chat_Schedule = Chat_Schedule;
    if (Chat_discription !== undefined) updateData.Chat_discription = Chat_discription;
    if (Audio_price !== undefined) updateData.Audio_price = Audio_price;
    if (Audio_minute !== undefined) updateData.Audio_minute = Audio_minute;
    if (Audio_Schedule !== undefined) updateData.Audio_Schedule = Audio_Schedule;
    if (Audio_discription !== undefined) updateData.Audio_discription = Audio_discription;
    if (Video_price !== undefined) updateData.Video_price = Video_price;
    if (Video_minute !== undefined) updateData.Video_minute = Video_minute;
    if (Video_Schedule !== undefined) updateData.Video_Schedule = Video_Schedule;
    if (Video_discription !== undefined) updateData.Video_discription = Video_discription;
    if (status !== undefined) updateData.status = status;

    // Update package
    const packageObj = await Package.findOneAndUpdate(
      { package_id },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Package updated successfully',
      data: packageObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get package by ID (with user details)
const getPackageApprovalById = async (req, res) => {
  try {
    const { package_id } = req.params;

    const packageObj = await Package.findOne({ package_id });

    if (!packageObj) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    // Get creator and approver details
    const [creator, approver] = await Promise.all([
      User.findOne({ user_id: packageObj.created_by }, { user_id: 1, name: 1, email: 1, mobile: 1, role_id: 1, _id: 0 }),
      packageObj.approve_by ? User.findOne({ user_id: packageObj.approve_by }, { user_id: 1, name: 1, email: 1, role_id: 1, _id: 0 }) : Promise.resolve(null)
    ]);

    const packageWithDetails = {
      ...packageObj.toObject(),
      created_by_details: creator ? {
        user_id: creator.user_id,
        name: creator.name,
        email: creator.email,
        mobile: creator.mobile,
        role_id: creator.role_id
      } : null,
      approve_by_details: approver ? {
        user_id: approver.user_id,
        name: approver.name,
        email: approver.email,
        role_id: approver.role_id
      } : null
    };

    res.status(200).json({
      success: true,
      message: 'Package retrieved successfully',
      data: packageWithDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all package approvals (Admin view - with filters)
const getAllPackageApprovals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      approve_status,
      status,
      sort_by = 'created_at',
      sort_order = 'desc',
      search
    } = req.query;

    // Build query
    const query = {};

    // Filter by approval status
    if (approve_status !== undefined) {
      query.approve_status = approve_status === 'true';
    }

    // Filter by status
    if (status !== undefined) {
      query.status = parseInt(status);
    }

    // Search by package name
    if (search) {
      query.packege_name = { $regex: search, $options: 'i' };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Get packages
    const packages = await Package.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalPackages = await Package.countDocuments(query);

    // Get user details for all packages
    const userIds = [...new Set([
      ...packages.map(p => p.created_by),
      ...packages.map(p => p.approve_by).filter(id => id)
    ])];

    const users = await User.find(
      { user_id: { $in: userIds } },
      { user_id: 1, name: 1, email: 1, mobile: 1, role_id: 1, _id: 0 }
    );

    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u; });

    // Map packages with user details
    const packagesWithDetails = packages.map(pkg => {
      const pkgObj = pkg.toObject();
      return {
        ...pkgObj,
        created_by_details: userMap[pkg.created_by] || null,
        approve_by_details: pkg.approve_by && userMap[pkg.approve_by] ? userMap[pkg.approve_by] : null
      };
    });

    // Calculate statistics
    const stats = {
      total: totalPackages,
      pending_approval: await Package.countDocuments({ approve_status: false }),
      approved: await Package.countDocuments({ approve_status: true }),
      active: await Package.countDocuments({ status: 1 }),
      inactive: await Package.countDocuments({ status: 0 })
    };

    // Pagination info
    const totalPages = Math.ceil(totalPackages / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Package approvals retrieved successfully',
      data: packagesWithDetails,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: totalPackages,
        limit: parseInt(limit),
        has_next_page: parseInt(page) < totalPages,
        has_prev_page: parseInt(page) > 1
      },
      statistics: stats,
      status: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get packages by authenticated user
const getPackageApprovalsByAuth = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const {
      page = 1,
      limit = 10,
      approve_status,
      status,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Build query for user's packages
    const query = { created_by: userId };

    // Filter by approval status
    if (approve_status !== undefined) {
      query.approve_status = approve_status === 'true';
    }

    // Filter by status
    if (status !== undefined) {
      query.status = parseInt(status);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Get packages
    const packages = await Package.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalPackages = await Package.countDocuments(query);

    // Get approver details
    const approverIds = [...new Set(packages.map(p => p.approve_by).filter(id => id))];
    const approvers = await User.find(
      { user_id: { $in: approverIds } },
      { user_id: 1, name: 1, email: 1, role_id: 1, _id: 0 }
    );

    const approverMap = {};
    approvers.forEach(u => { approverMap[u.user_id] = u; });

    // Map packages with approver details
    const packagesWithDetails = packages.map(pkg => {
      const pkgObj = pkg.toObject();
      return {
        ...pkgObj,
        approve_by_details: pkg.approve_by && approverMap[pkg.approve_by] ? approverMap[pkg.approve_by] : null
      };
    });

    // Calculate user's package statistics
    const userStats = {
      total: await Package.countDocuments({ created_by: userId }),
      pending_approval: await Package.countDocuments({ created_by: userId, approve_status: false }),
      approved: await Package.countDocuments({ created_by: userId, approve_status: true }),
      active: await Package.countDocuments({ created_by: userId, status: 1 }),
      inactive: await Package.countDocuments({ created_by: userId, status: 0 })
    };

    // Pagination info
    const totalPages = Math.ceil(totalPackages / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Your package approvals retrieved successfully',
      data: packagesWithDetails,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: totalPackages,
        limit: parseInt(limit),
        has_next_page: parseInt(page) < totalPages,
        has_prev_page: parseInt(page) > 1
      },
      statistics: userStats,
      status: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Approve/Reject package (Admin only) - ONLY updates approval status
const approvePackage = async (req, res) => {
  try {
    const { package_id, approve_status } = req.body;

    // Validate required fields
    if (!package_id) {
      return res.status(400).json({
        success: false,
        message: 'package_id is required'
      });
    }

    if (approve_status === undefined || typeof approve_status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'approve_status is required and must be a boolean (true/false)'
      });
    }

    // Check if package exists
    const existingPackage = await Package.findOne({ package_id });
    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    // Update ONLY approval-related fields
    const updateData = {
      approve_status: approve_status,
      approve_by: req.user.user_id,
      approve_at: new Date(),
      updated_by: req.user.user_id,
      updated_at: new Date()
    };

    const packageObj = await Package.findOneAndUpdate(
      { package_id },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: approve_status ? 'Package approved successfully' : 'Package rejected successfully',
      data: {
        package_id: packageObj.package_id,
        packege_name: packageObj.packege_name,
        approve_status: packageObj.approve_status,
        approve_by: packageObj.approve_by,
        approve_at: packageObj.approve_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete package approval
const deletePackageApproval = async (req, res) => {
  try {
    const { package_id } = req.params;

    // Check if package exists
    const existingPackage = await Package.findOne({ package_id });
    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    // Check if user is the creator or admin
    if (existingPackage.created_by !== req.user.user_id && req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this package'
      });
    }

    // Delete package
    await Package.findOneAndDelete({ package_id });

    res.status(200).json({
      success: true,
      message: 'Package deleted successfully',
      data: {
        package_id: existingPackage.package_id,
        packege_name: existingPackage.packege_name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createPackageApproval,
  updatePackageApproval,
  getPackageApprovalById,
  getAllPackageApprovals,
  getPackageApprovalsByAuth,
  approvePackage,
  deletePackageApproval
};

