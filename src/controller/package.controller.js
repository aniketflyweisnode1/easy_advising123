const Package = require('../models/package.model');

const createPackage = async (req, res) => {
  try {
    const { packege_name } = req.body;
    if (!packege_name) return res.status(400).json({ success: false, message: 'packege_name is required' });
    const packageObj = new Package({
      packege_name,
      created_by: req.user.user_id
    });
    await packageObj.save();
    res.status(201).json({ success: true, data: packageObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePackage = async (req, res) => {
  try {
    const { package_id, ...rest } = req.body;
    if (!package_id) return res.status(400).json({ success: false, message: 'package_id is required in body' });
    const updateData = { ...rest, updated_by: req.user.user_id, updated_at: new Date() };
    const packageObj = await Package.findOneAndUpdate({ package_id }, updateData, { new: true });
    if (!packageObj) return res.status(404).json({ success: false, message: 'Package not found' });
    res.status(200).json({ success: true, data: packageObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPackageById = async (req, res) => {
  try {
    const { package_id } = req.params;
    const packageObj = await Package.findOne({ package_id });
    if (!packageObj) return res.status(404).json({ success: false, message: 'Package not found' });
    res.status(200).json({ success: true, data: packageObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find();
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createPackage, updatePackage, getPackageById, getAllPackages }; 