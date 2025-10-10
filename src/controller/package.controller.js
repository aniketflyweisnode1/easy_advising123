const Package = require('../models/package.model');

const createPackage = async (req, res) => {
  try {
    const { 
      packege_name, 
      Chat_minute, 
      Chat_Schedule, 
      Chat_discription,
      Audio_minute, 
      Audio_Schedule, 
      Audio_discription,
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
    
    // Create package with all fields
    const packageObj = new Package({
      packege_name, 
      // Chat fields
      Chat_minute: Chat_minute || 0,
      Chat_Schedule: Chat_Schedule || 0,
      Chat_discription: Chat_discription || '',
      // Audio fields
      Audio_minute: Audio_minute || 0,
      Audio_Schedule: Audio_Schedule || 0,
      Audio_discription: Audio_discription || '',
      // Video fields
      Video_minute: Video_minute || 0,
      Video_Schedule: Video_Schedule || 0,
      Video_discription: Video_discription || '',
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
      packege_name, 
      Chat_minute, 
      Chat_Schedule, 
      Chat_discription,
      Audio_minute, 
      Audio_Schedule, 
      Audio_discription,
      Video_minute, 
      Video_Schedule, 
      Video_discription,
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
    if (packege_name !== undefined) updateData.packege_name = packege_name;
    
    // Chat fields
    if (Chat_minute !== undefined) updateData.Chat_minute = Chat_minute;
    if (Chat_Schedule !== undefined) updateData.Chat_Schedule = Chat_Schedule;
    if (Chat_discription !== undefined) updateData.Chat_discription = Chat_discription;
    
    // Audio fields
    if (Audio_minute !== undefined) updateData.Audio_minute = Audio_minute;
    if (Audio_Schedule !== undefined) updateData.Audio_Schedule = Audio_Schedule;
    if (Audio_discription !== undefined) updateData.Audio_discription = Audio_discription;
    
    // Video fields
    if (Video_minute !== undefined) updateData.Video_minute = Video_minute;
    if (Video_Schedule !== undefined) updateData.Video_Schedule = Video_Schedule;
    if (Video_discription !== undefined) updateData.Video_discription = Video_discription;
    
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

module.exports = { createPackage, updatePackage, getPackageById, getAllPackages }; 