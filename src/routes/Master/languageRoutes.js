const express = require('express');
const router = express.Router();
const { 
  createLanguage, 
  updateLanguage, 
  getLanguageById, 
  getAllLanguages 
} = require('../../controller/languageController');
const { auth } = require('../../middleware/authMiddleware');

// Create language (with auth)
router.post('/', auth, createLanguage);

// Update language (with auth)
router.put('/:language_id', auth, updateLanguage);

// Get language by ID (public)
router.get('/:language_id', getLanguageById);

// Get all languages (public)
router.get('/', getAllLanguages);

module.exports = router; 