const AdvisorPackage = require('../models/Advisor_Package.model');
const Package = require('../models/package.model');
const User = require('../models/User.model');

// Create Advisor Package
const createAdvisorPackage = async (req, res) => {
  try {
    const {
      Chat_price,
      Audio_price,
      Video_price,
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

    // If package_id is provided, fetch package details
    let packageData = {};

    const packageDetails = await Package.findOne();
    if (packageDetails) {
      packageData = {
        packege_name: packageDetails.packege_name,
        Chat_minute: packageDetails.Chat_minute,
        Chat_Schedule: packageDetails.Chat_Schedule,
        Chat_discription: packageDetails.Chat_discription,
        Audio_minute: packageDetails.Audio_minute,
        Audio_Schedule: packageDetails.Audio_Schedule,
        Audio_discription: packageDetails.Audio_discription,
        Video_minute: packageDetails.Video_minute,
        Video_Schedule: packageDetails.Video_Schedule,
        Video_discription: packageDetails.Video_discription
      };
    }
 


    // Create advisor package with merged data (body overrides package defaults)
    const advisorPackage = new AdvisorPackage({
      advisor_id,
      packege_name: packageData.packege_name,
      Chat_minute: packageData.Chat_minute ,
      Chat_Schedule:  packageData.Chat_Schedule,
      Chat_discription: packageData.Chat_discription,
      Chat_price: Chat_price || 0,
      Audio_minute: packageData.Audio_minute,
      Audio_Schedule: packageData.Audio_Schedule,
      Audio_discription: packageData.Audio_discription,
      Audio_price: Audio_price || 0,
      Video_minute: packageData.Video_minute,
      Video_Schedule: packageData.Video_Schedule,
      Video_discription: packageData.Video_discription,
      Video_price: Video_price || 0,
      status: true,
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
    const { Advisor_Package_id, Chat_price, Audio_price, Video_price } = req.body;

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
      Chat_price: Chat_price || 0,
      Audio_price: Audio_price || 0,
      Video_price: Video_price || 0,
      updated_by: req.user.user_id,
      updated_at: new Date()
    };



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

