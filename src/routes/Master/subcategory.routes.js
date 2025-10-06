const express =  require('express');
const router = express.Router();
const { 
  createSubcategory, 
  updateSubcategory, 
  getSubcategoryById, 
  getAllSubcategories,
  getSubcategoriesByCategoryId,
  getAllSubcategoriesAll
} =  require('../../controller/subcategory.controller.js');
const { auth } =  require('../../utils/jwtUtils.js');



// Created: 2025-07-05
router.post('/create', auth, createSubcategory);

// Created: 2025-07-05
router.put('/update', auth, updateSubcategory);

// Created: 2025-07-05
router.get('/:subcategory_id', getSubcategoryById);

// Created: 2025-07-05
router.get('/', getAllSubcategories);

// Created: 2025-07-05
router.get('/by-category/:category_id', getSubcategoriesByCategoryId);

// Created: 2025-07-05
router.get('/Subcategoriesall', getAllSubcategoriesAll);

module.exports = router; 