const express = require('express');
const router = express.Router();
const { auth } = require('../../utils/jwtUtils.js');
const {
    createFilter,
    updateFilter,
    getFiltersByAuthUser,
    getAllFilters,
    getFilterById,
    filterView
} = require('../../controller/filter.controller.js');

// Create 2025-07-14
router.post('/create', auth, createFilter);
// Update 2025-07-14
router.put('/update', auth, updateFilter);
// Get by auth user 2025-07-14
router.get('/getByAuth', auth, getFiltersByAuthUser);
// Get all 2025-07-14
router.get('/getAll', auth, getAllFilters);
// Get by id 2025-07-14
router.get('/getById/:filter_id', auth, getFilterById);
// Filter view 2025-07-14
router.post('/filter_view', auth, filterView);

module.exports = router; 