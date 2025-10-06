const Package = require('../models/package.model');

const createPackage = async (req, res) => {
  try {
    const { packege_name, price, minute, Schedule, discription, status } = req.body;
    
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
      price: price || 0,
      minute: minute || 0,
      Schedule: Schedule || 0,
      discription: discription || '',
      status: status !== undefined ? status : 1,
      created_by: req.user.user_id
    });
    
    await packageObj.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Package created successfully',
      data: packageObj 
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
    const { package_id, packege_name, price, minute, Schedule, discription, status } = req.body;
    
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
    if (price !== undefined) updateData.price = price;
    if (minute !== undefined) updateData.minute = minute;
    if (Schedule !== undefined) updateData.Schedule = Schedule;
    if (discription !== undefined) updateData.discription = discription;
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

const getPackageById = async (req, res) => {
  try {
    const { package_id } = req.params;
    
    const packageObj = await Package.findOne({ package_id });
    
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
    
    // Get all packages
    const packages = await Package.find(query).sort(sortObj);
    
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