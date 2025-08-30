const BannerManagement = require('../models/banner_management.model');

// Create banner
const createBanner = async (req, res) => {
  try {
    const data = req.body;
    if (req.user && req.user.user_id) {
      data.created_by = req.user.user_id;
    }
    const banner = new BannerManagement(data);
    await banner.save();
    return res.status(201).json({ message: 'Banner created', banner, status: 201 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Update banner
const updateBanner = async (req, res) => {
  try {
    const { banner_id, ...updateData } = req.body;
    if (req.user && req.user.user_id) {
      updateData.updated_by = req.user.user_id;
      updateData.updated_at = new Date();
    }
    const banner = await BannerManagement.findOneAndUpdate({ banner_id }, updateData, { new: true });
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found', status: 404 });
    }
    return res.status(200).json({ message: 'Banner updated', banner, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Get banner by ID
const getBannerById = async (req, res) => {
  try {
    const { banner_id } = req.params;
    const banner = await BannerManagement.findOne({ banner_id });
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found', status: 404 });
    }
    return res.status(200).json({ banner, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Get all banners
const getAllBanners = async (req, res) => {
  try {
    const banners = await BannerManagement.find();
    return res.status(200).json({ banners, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

module.exports = { createBanner, updateBanner, getBannerById, getAllBanners }; 