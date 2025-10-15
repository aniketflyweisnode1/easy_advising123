const Package = require('../models/package.model');

const createPackage = async (req, res) => {
  try {
    const { 
      Basic_packege_name = 'Basic', 
      Economy_packege_name = 'Economy', 
      Pro_packege_name = 'Pro', 
      Basic_minute, 
      Economy_minute, 
      Pro_minute, 
      Basic_Schedule, 
      Economy_Schedule, 
      Pro_Schedule, 
      Basic_discription,
      Economy_discription,
      Pro_discription,
      Basic_packageExpriyDays,
      Economy_packageExpriyDays,
      Pro_packageExpriyDays,
      status 
    } = req.body;
    
   
    // Validate required fields
    if (!Basic_packege_name || !Economy_packege_name || !Pro_packege_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Basic_packege_name, Economy_packege_name, Pro_packege_name are required' 
      });
    }
    
    // Create package with all fields
    const packageObj = new Package({
      // Package names
      Basic_packege_name, 
      Economy_packege_name, 
      Pro_packege_name, 
      
      // Basic package fields
      Basic_minute: Basic_minute || 0,
      Basic_Schedule: Basic_Schedule || 0,
      Basic_discription: Basic_discription || '',
      Basic_packageExpriyDays: Basic_packageExpriyDays || 30,
      
      // Economy package fields
      Economy_minute: Economy_minute || 0,
      Economy_Schedule: Economy_Schedule || 0,
      Economy_discription: Economy_discription || '',
      Economy_packageExpriyDays: Economy_packageExpriyDays || 60,
      
      // Pro package fields
      Pro_minute: Pro_minute || 0,
      Pro_Schedule: Pro_Schedule || 0,
      Pro_discription: Pro_discription || '',
      Pro_packageExpriyDays: Pro_packageExpriyDays || 90,
      
     
      status: status !== undefined ? status : 1,
      created_by: req.user.user_id
    });
    
    const package = await Package.findOne();
    if(!package){
    await packageObj.save();
    }else{
      return res.status(400).json({ 
        success: false, 
        message: 'Package already exists Package Id : '+ packageObj.package_id
      });
    }
    // Populate the created package with user references
    const populatedPackage = await Package.findOne({ package_id: packageObj.package_id })
      .populate({ 
        path: 'created_by', 
        model: 'User', 
        localField: 'created_by', 
        foreignField: 'user_id', 
        select: 'user_id name email mobile role_id' 
      });
    
    res.status(201).json({ 
      success: true, 
      message: 'Package created successfully',
      data: populatedPackage 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const updatePackage = async (req, res) => {
  try {
    const { 
      package_id, 
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
      Basic_packageExpriyDays,
      Economy_packageExpriyDays,
      Pro_packageExpriyDays,
      approve_status,
      status 
    } = req.body;
    
    // Validate package_id
    if (!package_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'package_id is required in body' 
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
    if (Basic_packageExpriyDays !== undefined) updateData.Basic_packageExpriyDays = Basic_packageExpriyDays;
    
    // Economy package fields
    if (Economy_minute !== undefined) updateData.Economy_minute = Economy_minute;
    if (Economy_Schedule !== undefined) updateData.Economy_Schedule = Economy_Schedule;
    if (Economy_discription !== undefined) updateData.Economy_discription = Economy_discription;
    if (Economy_packageExpriyDays !== undefined) updateData.Economy_packageExpriyDays = Economy_packageExpriyDays;
    
    // Pro package fields
    if (Pro_minute !== undefined) updateData.Pro_minute = Pro_minute;
    if (Pro_Schedule !== undefined) updateData.Pro_Schedule = Pro_Schedule;
    if (Pro_discription !== undefined) updateData.Pro_discription = Pro_discription;
    if (Pro_packageExpriyDays !== undefined) updateData.Pro_packageExpriyDays = Pro_packageExpriyDays;
    
    // Approval fields
    if (approve_status !== undefined) updateData.approve_status = approve_status;
    
    if (status !== undefined) updateData.status = status;
    
    // Update package
    const packageObj = await Package.findOneAndUpdate(
      { package_id }, 
      updateData, 
      { new: true, runValidators: true }
    )
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
      .populate({ 
        path: 'approve_by', 
        model: 'User', 
        localField: 'approve_by', 
        foreignField: 'user_id', 
        select: 'user_id name email mobile role_id' 
      });
    
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

const getPackageById = async (req, res) => {
  try {
    const { package_id } = req.params;
    
    // Get package by ID
    const packageObj = await Package.findOne({ package_id })
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
      .populate({ 
        path: 'approve_by', 
        model: 'User', 
        localField: 'approve_by', 
        foreignField: 'user_id', 
        select: 'user_id name email mobile role_id' 
      });
    
    if (!packageObj) {
      return res.status(404).json({ 
        success: false, 
        message: 'Package not found' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Package retrieved successfully',
      data: packageObj 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const getAllPackages = async (req, res) => {
  try {
    // Get query parameters for filtering
    const { status, sort_by = 'created_at', sort_order = 'desc' } = req.query;
    
    // Build query
    const query = {};
    
    if (status !== undefined) {
      query.status = parseInt(status);
    }
    
    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;
    
    // Get all packages with populated references
    const packages = await Package.find(query)
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
      .populate({ 
        path: 'approve_by', 
        model: 'User', 
        localField: 'approve_by', 
        foreignField: 'user_id', 
        select: 'user_id name email mobile role_id' 
      })
      .sort(sortObj);
    
    // Get statistics
    const stats = {
      total_packages: packages.length,
      active_packages: packages.filter(p => p.status === 1).length,
      inactive_packages: packages.filter(p => p.status === 0).length
    };
    
    res.status(200).json({ 
      success: true, 
      message: 'Packages retrieved successfully',
      data: packages,
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

// Approve package
const approvePackage = async (req, res) => {
  try {
    const { package_id } = req.params;
    const { approve_status } = req.body;
    const adminId = req.user.user_id;

    // Validate package_id
    if (!package_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'package_id is required' 
      });
    }

    // Validate approve_status
    if (approve_status === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'approve_status is required' 
      });
    }

    if (typeof approve_status !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        message: 'approve_status must be a boolean value' 
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

    // Update package approval
    const updateData = {
      approve_status: approve_status,
      approve_by: adminId,
      approve_at: new Date(),
      updated_by: adminId,
      updated_at: new Date()
    };

    const packageObj = await Package.findOneAndUpdate(
      { package_id }, 
      updateData, 
      { new: true, runValidators: true }
    )
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
      .populate({ 
        path: 'approve_by', 
        model: 'User', 
        localField: 'approve_by', 
        foreignField: 'user_id', 
        select: 'user_id name email mobile role_id' 
      });

    res.status(200).json({ 
      success: true, 
      message: `Package ${approve_status ? 'approved' : 'rejected'} successfully`,
      data: packageObj 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Delete package
const deletePackage = async (req, res) => {
  try {
    const { package_id } = req.params;
    const adminId = req.user.user_id;

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

    // Delete package
    const deletedPackage = await Package.findOneAndDelete({ package_id });

    res.status(200).json({ 
      success: true, 
      message: 'Package deleted successfully',
      data: {
        package_id: deletedPackage.package_id,
        packege_name: deletedPackage.packege_name,
        deleted_by: adminId,
        deleted_at: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = { createPackage, updatePackage, getPackageById, getAllPackages, approvePackage, deletePackage }; 