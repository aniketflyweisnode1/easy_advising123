const express = require('express');
const router = express.Router();
const { createCategory,  updateCategory, getCategoryById, getAllCategories, getAll, getCategoryAll } = require('../../controller/category.controller.js');
const { auth } = require('../../utils/jwtUtils.js');


// Created: 2025-07-05
router.post('/create', auth, createCategory);

// Created: 2025-07-05
router.put('/update', auth, updateCategory);

// Created: 2025-07-05
router.get('/:category_id', getCategoryById);

// Created: 2025-07-05
router.get('/', getAllCategories);

router.get('/all', getAll);

router.get('/Categoryall', getCategoryAll);

module.exports = router; 