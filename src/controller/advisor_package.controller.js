const AdvisorPackage = require('../models/Advisor_Package.model');
const Package = require('../models/package.model');
const User = require('../models/User.model');

// Create Advisor Package
const createAdvisorPackage = async (req, res) => {
  try {
    const {
      Basic_packege_name,
      Economy_packege_name,
      Pro_packege_name,
      Basic_minute,
      Economy_minute,
      Pro_minute,
      Basic_Schedule,
      Economy_Schedule,
      Pro_Schedule,
      Basic_discription,
      Economy_discription,
      Pro_discription,
      Basic_price,
      Economy_price,
      Pro_price,
      status
    } = req.body;

    const advisor_id = req.user.user_id;
    const create_by = req.user.user_id;

    // Check if advisor package already exists for this advisor
    const existingPackage = await AdvisorPackage.findOne({ advisor_id });
    if (existingPackage) {
      return res.status(400).json({
        success: false,
        message: 'Advisor package already exists for this advisor'
      });
    }

    // Fetch package details for defaults
    let packageData = {};

    const packageDetails = await Package.findOne();
    if (packageDetails) {
      packageData = {
        Basic_packege_name: packageDetails.Basic_packege_name,
        Economy_packege_name: packageDetails.Economy_packege_name,
        Pro_packege_name: packageDetails.Pro_packege_name,
        Basic_minute: packageDetails.Basic_minute,
        Economy_minute: packageDetails.Economy_minute,
        Pro_minute: packageDetails.Pro_minute,
        Basic_Schedule: packageDetails.Basic_Schedule,
        Economy_Schedule: packageDetails.Economy_Schedule,
        Pro_Schedule: packageDetails.Pro_Schedule,
        Basic_discription: packageDetails.Basic_discription,
        Economy_discription: packageDetails.Economy_discription,
        Pro_discription: packageDetails.Pro_discription
      };
    }
 


    // Create advisor package with merged data (body overrides package defaults)
    const advisorPackage = new AdvisorPackage({
      advisor_id,
      
      // Package names
      Basic_packege_name: Basic_packege_name || packageData.Basic_packege_name || 'Basic',
      Economy_packege_name: Economy_packege_name || packageData.Economy_packege_name || 'Economy',
      Pro_packege_name: Pro_packege_name || packageData.Pro_packege_name || 'Pro',
      
      // Basic package fields
      Basic_minute: Basic_minute !== undefined ? Basic_minute : (packageData.Basic_minute || 0),
      Basic_Schedule: Basic_Schedule !== undefined ? Basic_Schedule : (packageData.Basic_Schedule || 0),
      Basic_discription: Basic_discription || packageData.Basic_discription || '',
      Basic_price: Basic_price || 0,
      
      // Economy package fields
      Economy_minute: Economy_minute !== undefined ? Economy_minute : (packageData.Economy_minute || 0),
      Economy_Schedule: Economy_Schedule !== undefined ? Economy_Schedule : (packageData.Economy_Schedule || 0),
      Economy_discription: Economy_discription || packageData.Economy_discription || '',
      Economy_price: Economy_price || 0,
      
      // Pro package fields
      Pro_minute: Pro_minute !== undefined ? Pro_minute : (packageData.Pro_minute || 0),
      Pro_Schedule: Pro_Schedule !== undefined ? Pro_Schedule : (packageData.Pro_Schedule || 0),
      Pro_discription: Pro_discription || packageData.Pro_discription || '',
      Pro_price: Pro_price || 0,
      
      status: status !== undefined ? status : true,
      created_by: req.user.user_id
    });

    let package = await advisorPackage.save();
console.log(package);
    // Auto-set user's package_id to the newly created Advisor_Package_id
    await User.findOneAndUpdate(
      { user_id: advisor_id },
      { package_id: advisorPackage.Advisor_Package_id },
      { new: true }
    );

    // Populate and return
    const populatedPackage = await AdvisorPackage.findOne({ Advisor_Package_id: advisorPackage.Advisor_Package_id })
      .populate({
        path: 'advisor_id',
        model: 'User',
        localField: 'advisor_id',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id'
      })
      .populate({
        path: 'created_by',
        model: 'User',
        localField: 'created_by',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id'
      });

    res.status(201).json({
      success: true,
      message: 'Advisor package created successfully',
      data: populatedPackage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Advisor Package
const updateAdvisorPackage = async (req, res) => {
  try {
    const { 
      Advisor_Package_id, 
      Basic_packege_name,
      Economy_packege_name,
      Pro_packege_name,
      Basic_minute,
      Economy_minute,
      Pro_minute,
      Basic_Schedule,
      Economy_Schedule,
      Pro_Schedule,
      Basic_discription,
      Economy_discription,
      Pro_discription,
      Basic_price,
      Economy_price,
      Pro_price,
      status
    } = req.body;

    // Validate Advisor_Package_id
    if (!Advisor_Package_id) {
      return res.status(400).json({
        success: false,
        message: 'Advisor_Package_id is required in body'
      });
    }

    // Check if advisor package exists
    const existingPackage = await AdvisorPackage.findOne({ Advisor_Package_id });
    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: 'Advisor package not found'
      });
    }

    // Build update data
    const updateData = {
      updated_by: req.user.user_id,
      updated_at: new Date()
    };

    // Only update fields that are provided
    // Package names
    if (Basic_packege_name !== undefined) updateData.Basic_packege_name = Basic_packege_name;
    if (Economy_packege_name !== undefined) updateData.Economy_packege_name = Economy_packege_name;
    if (Pro_packege_name !== undefined) updateData.Pro_packege_name = Pro_packege_name;
    
    // Basic package fields
    if (Basic_minute !== undefined) updateData.Basic_minute = Basic_minute;
    if (Basic_Schedule !== undefined) updateData.Basic_Schedule = Basic_Schedule;
    if (Basic_discription !== undefined) updateData.Basic_discription = Basic_discription;
    if (Basic_price !== undefined) updateData.Basic_price = Basic_price;
    
    // Economy package fields
    if (Economy_minute !== undefined) updateData.Economy_minute = Economy_minute;
    if (Economy_Schedule !== undefined) updateData.Economy_Schedule = Economy_Schedule;
    if (Economy_discription !== undefined) updateData.Economy_discription = Economy_discription;
    if (Economy_price !== undefined) updateData.Economy_price = Economy_price;
    
    // Pro package fields
    if (Pro_minute !== undefined) updateData.Pro_minute = Pro_minute;
    if (Pro_Schedule !== undefined) updateData.Pro_Schedule = Pro_Schedule;
    if (Pro_discription !== undefined) updateData.Pro_discription = Pro_discription;
    if (Pro_price !== undefined) updateData.Pro_price = Pro_price;
    
    // Status field
    if (status !== undefined) updateData.status = status;



    // Update advisor package
    const advisorPackage = await AdvisorPackage.findOneAndUpdate(
      { Advisor_Package_id },
      updateData,
      { new: true, runValidators: true }
    )
      .populate({
        path: 'advisor_id',
        model: 'User',
        localField: 'advisor_id',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id'
      })
      .populate({
        path: 'created_by',
        model: 'User',
        localField: 'created_by',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id'
      })
      .populate({
        path: 'updated_by',
        model: 'User',
        localField: 'updated_by',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id'
      });

    res.status(200).json({
      success: true,
      message: 'Advisor package updated successfully',
      data: advisorPackage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Advisor Package by ID
const getAdvisorPackageById = async (req, res) => {
  try {
    const { id } = req.params;

    const advisorPackage = await AdvisorPackage.findOne({ Advisor_Package_id: id })
      .populate({
        path: 'advisor_id',
        model: 'User',
        localField: 'advisor_id',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id profile_image'
      })
      .populate({
        path: 'created_by',
        model: 'User',
        localField: 'created_by',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id'
      })
      .populate({
        path: 'updated_by',
        model: 'User',
        localField: 'updated_by',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id'
      });

    if (!advisorPackage) {
      return res.status(404).json({
        success: false,
        message: 'Advisor package not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Advisor package retrieved successfully',
      data: advisorPackage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Advisor Packages
const getAllAdvisorPackages = async (req, res) => {
  try {
    const { status, sort_by = 'created_at', sort_order = 'desc' } = req.query;

    // Build query
    const query = {};
    if (status !== undefined) {
      query.status = status === 'true' || status === true;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Get all advisor packages with populated references
    const advisorPackages = await AdvisorPackage.find(query)
      .populate({
        path: 'advisor_id',
        model: 'User',
        localField: 'advisor_id',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id profile_image'
      })
      .populate({
        path: 'created_by',
        model: 'User',
        localField: 'created_by',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id'
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
      total_packages: advisorPackages.length,
      active_packages: advisorPackages.filter(p => p.status === true).length,
      inactive_packages: advisorPackages.filter(p => p.status === false).length
    };

    res.status(200).json({
      success: true,
      message: 'Advisor packages retrieved successfully',
      data: advisorPackages,
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

// Get Advisor Package by Authenticated User
const getAdvisorPackageByAuth = async (req, res) => {
  try {
    const advisor_id = req.user.user_id;

    const advisorPackage = await AdvisorPackage.findOne({ advisor_id })
      .populate({
        path: 'advisor_id',
        model: 'User',
        localField: 'advisor_id',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id profile_image'
      })
      .populate({
        path: 'created_by',
        model: 'User',
        localField: 'created_by',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id'
      })
      .populate({
        path: 'updated_by',
        model: 'User',
        localField: 'updated_by',
        foreignField: 'user_id',
        select: 'user_id name email mobile role_id'
      });

    if (!advisorPackage) {
      return res.status(404).json({
        success: false,
        message: 'Advisor package not found for this user'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Advisor package retrieved successfully',
      data: advisorPackage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Advisor Package
const deleteAdvisorPackage = async (req, res) => {
  try {
    const { id } = req.params;

    const advisorPackage = await AdvisorPackage.findOneAndDelete({ Advisor_Package_id: id });

    if (!advisorPackage) {
      return res.status(404).json({
        success: false,
        message: 'Advisor package not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Advisor package deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createAdvisorPackage,
  updateAdvisorPackage,
  getAdvisorPackageById,
  getAllAdvisorPackages,
  getAdvisorPackageByAuth,
  deleteAdvisorPackage
};

