const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const { createBanner, updateBanner, getBannerById, getAllBanners } = require('../../controller/banner_management.controller');

// Create banner 2025-07-15
router.post('/create', auth, createBanner);
// Update banner 2025-07-15
router.put('/update', auth, updateBanner);
// Get banner by ID 2025-07-15
router.get('/getById/:banner_id', getBannerById);
// Get all banners 2025-07-15
router.get('/getAll', getAllBanners);

module.exports = router; 