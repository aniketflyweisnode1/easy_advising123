const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const {
  createGeneralSetting,
  updateGeneralSetting,
  getGeneralSettingById,
  getAllGeneralSettings
} = require('../../controller/general.setting.controller');

// Create general setting 2025-07-16
router.post('/create', auth, createGeneralSetting);
// Update general setting 2025-07-16
router.put('/update', auth, updateGeneralSetting);
// Get general setting by ID 2025-07-16
router.get('/getById/:setting_id', auth, getGeneralSettingById);
// Get all general settings 2025-07-16
router.get('/getAll', getAllGeneralSettings);

module.exports = router; 