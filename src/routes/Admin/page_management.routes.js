const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const { createPageByRole, createPage, updatePage, getPageById, getAllPages } = require('../../controller/page_management.controller');

// Create page (with auth) 2025-07-17
router.post('/create', auth, createPage);

router.post('/createbyrole', auth, createPageByRole);

// Update page (with auth, id in body) 2025-07-17
router.put('/update', auth, updatePage);

// Get page by ID 2025-07-17
router.get('/getById/:id', getPageById);

// Get all pages 2025-07-17
router.get('/getAll', getAllPages);

module.exports = router; 