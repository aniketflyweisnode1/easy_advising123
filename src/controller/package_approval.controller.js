const Package = require('../models/package.model');
const AdvisorPackage = require('../models/Advisor_Package.model');
const User = require('../models/User.model');

// Create package approval request (by advisor/user)
const createPackageApproval = async (req, res) => {
  try {
    const {
      advisor_id,
      Basic_packege_name,
      Economy_packege_name,
      Pro_packege_name,
      Basic_minute,
      Basic_Schedule,
      Basic_discription,
      Basic_price,
      Basic_packageExpriyDays,
      Economy_minute,
      Economy_Schedule,
      Economy_discription,
      Economy_price,
      Economy_packageExpriyDays,
      Pro_minute,
      Pro_Schedule,
      Pro_discription,
      Pro_price,
      Pro_packageExpriyDays,
      status
    } = req.body;

    // Validate required fields
    if (!advisor_id) {
      return res.status(400).json({
        success: false,
        message: 'advisor_id is required'
      });
    }

    // Create advisor package with pending approval
    const packageObj = new AdvisorPackage({
      advisor_id,
      Basic_packege_name: Basic_packege_name || 'Basic',
      Economy_packege_name: Economy_packege_name || 'Economy',
      Pro_packege_name: Pro_packege_name || 'Pro',
      Basic_minute: Basic_minute || 0,
      Basic_Schedule: Basic_Schedule || 0,
      Basic_discription: Basic_discription || '',
      Basic_price: Basic_price || 0,
      Basic_packageExpriyDays: Basic_packageExpriyDays || 30,
      Economy_minute: Economy_minute || 0,
      Economy_Schedule: Economy_Schedule || 0,
      Economy_discription: Economy_discription || '',
      Economy_price: Economy_price || 0,
      Economy_packageExpriyDays: Economy_packageExpriyDays || 60,
      Pro_minute: Pro_minute || 0,
      Pro_Schedule: Pro_Schedule || 0,
      Pro_discription: Pro_discription || '',
      Pro_price: Pro_price || 0,
      Pro_packageExpriyDays: Pro_packageExpriyDays || 90,
      approve_status: false, // Pending approval by default
      status: status !== undefined ? status : true,
      created_by: req.user.user_id
    });

    await packageObj.save();

    res.status(201).json({
      success: true,
      message: 'Advisor package approval request created successfully',
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
      Advisor_Package_id,
      advisor_id,
      Basic_packege_name,
      Economy_packege_name,
      Pro_packege_name,
      Basic_minute,
      Basic_Schedule,
      Basic_discription,
      Basic_price,
      Basic_packageExpriyDays,
      Economy_minute,
      Economy_Schedule,
      Economy_discription,
      Economy_price,
      Economy_packageExpriyDays,
      Pro_minute,
      Pro_Schedule,
      Pro_discription,
      Pro_price,
      Pro_packageExpriyDays,
      status
    } = req.body;

    // Validate Advisor_Package_id
    if (!Advisor_Package_id) {
      return res.status(400).json({
        success: false,
        message: 'Advisor_Package_id is required'
      });
    }

    // Check if package exists
    const existingPackage = await AdvisorPackage.findOne({ Advisor_Package_id });
    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: 'Advisor package not found'
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
    if (advisor_id !== undefined) updateData.advisor_id = advisor_id;
    if (Basic_packege_name !== undefined) updateData.Basic_packege_name = Basic_packege_name;
    if (Economy_packege_name !== undefined) updateData.Economy_packege_name = Economy_packege_name;
    if (Pro_packege_name !== undefined) updateData.Pro_packege_name = Pro_packege_name;
    if (Basic_minute !== undefined) updateData.Basic_minute = Basic_minute;
    if (Basic_Schedule !== undefined) updateData.Basic_Schedule = Basic_Schedule;
    if (Basic_discription !== undefined) updateData.Basic_discription = Basic_discription;
    if (Basic_price !== undefined) updateData.Basic_price = Basic_price;
    if (Basic_packageExpriyDays !== undefined) updateData.Basic_packageExpriyDays = Basic_packageExpriyDays;
    if (Economy_minute !== undefined) updateData.Economy_minute = Economy_minute;
    if (Economy_Schedule !== undefined) updateData.Economy_Schedule = Economy_Schedule;
    if (Economy_discription !== undefined) updateData.Economy_discription = Economy_discription;
    if (Economy_price !== undefined) updateData.Economy_price = Economy_price;
    if (Economy_packageExpriyDays !== undefined) updateData.Economy_packageExpriyDays = Economy_packageExpriyDays;
    if (Pro_minute !== undefined) updateData.Pro_minute = Pro_minute;
    if (Pro_Schedule !== undefined) updateData.Pro_Schedule = Pro_Schedule;
    if (Pro_discription !== undefined) updateData.Pro_discription = Pro_discription;
    if (Pro_price !== undefined) updateData.Pro_price = Pro_price;
    if (Pro_packageExpriyDays !== undefined) updateData.Pro_packageExpriyDays = Pro_packageExpriyDays;
    if (status !== undefined) updateData.status = status;

    // Update package
    const packageObj = await AdvisorPackage.findOneAndUpdate(
      { Advisor_Package_id },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Advisor package updated successfully',
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
    const { Advisor_Package_id } = req.params;

    const packageObj = await AdvisorPackage.findOne({ Advisor_Package_id });

    if (!packageObj) {
      return res.status(404).json({
        success: false,
        message: 'Advisor package not found'
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
      message: 'Advisor package retrieved successfully',
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
      query.status = status === 'true';
    }

    // Search by package name
    if (search) {
      query.$or = [
        { Basic_packege_name: { $regex: search, $options: 'i' } },
        { Economy_packege_name: { $regex: search, $options: 'i' } },
        { Pro_packege_name: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Get packages
    const packages = await AdvisorPackage.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalPackages = await AdvisorPackage.countDocuments(query);

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
      pending_approval: await AdvisorPackage.countDocuments({ approve_status: false }),
      approved: await AdvisorPackage.countDocuments({ approve_status: true }),
      active: await AdvisorPackage.countDocuments({ status: true }),
      inactive: await AdvisorPackage.countDocuments({ status: false })
    };

    // Pagination info
    const totalPages = Math.ceil(totalPackages / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Advisor package approvals retrieved successfully',
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
      query.status = status === 'true';
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Get packages
    const packages = await AdvisorPackage.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalPackages = await AdvisorPackage.countDocuments(query);

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
      total: await AdvisorPackage.countDocuments({ created_by: userId }),
      pending_approval: await AdvisorPackage.countDocuments({ created_by: userId, approve_status: false }),
      approved: await AdvisorPackage.countDocuments({ created_by: userId, approve_status: true }),
      active: await AdvisorPackage.countDocuments({ created_by: userId, status: true }),
      inactive: await AdvisorPackage.countDocuments({ created_by: userId, status: false })
    };

    // Pagination info
    const totalPages = Math.ceil(totalPackages / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Your advisor package approvals retrieved successfully',
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
    const { Advisor_Package_id, approve_status } = req.body;

    // Validate required fields
    if (!Advisor_Package_id) {
      return res.status(400).json({
        success: false,
        message: 'Advisor_Package_id is required'
      });
    }

    if (approve_status === undefined || typeof approve_status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'approve_status is required and must be a boolean (true/false)'
      });
    }

    // Check if package exists
    const existingPackage = await AdvisorPackage.findOne({ Advisor_Package_id });
    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: 'Advisor package not found'
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

    const packageObj = await AdvisorPackage.findOneAndUpdate(
      { Advisor_Package_id },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: approve_status ? 'Advisor package approved successfully' : 'Advisor package rejected successfully',
      data: {
        Advisor_Package_id: packageObj.Advisor_Package_id,
        advisor_id: packageObj.advisor_id,
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
    const { Advisor_Package_id } = req.params;

    // Check if package exists
    const existingPackage = await AdvisorPackage.findOne({ Advisor_Package_id });
    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: 'Advisor package not found'
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
    await AdvisorPackage.findOneAndDelete({ Advisor_Package_id });

    res.status(200).json({
      success: true,
      message: 'Advisor package deleted successfully',
      data: {
        Advisor_Package_id: existingPackage.Advisor_Package_id,
        advisor_id: existingPackage.advisor_id
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

