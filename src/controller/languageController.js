const Language = require('../models/language.model');

// Create language (with auth)
const createLanguage = async (req, res) => {
  try {
    const { name, code } = req.body;
    const created_by = req.user.user_id;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Language name and code are required'
      });
    }

    // Check if language name already exists
    const existingLanguageByName = await Language.findOne({ name });
    if (existingLanguageByName) {
      return res.status(400).json({
        success: false,
        message: 'Language with this name already exists'
      });
    }

    // Check if language code already exists
    const existingLanguageByCode = await Language.findOne({ code: code.toUpperCase() });
    if (existingLanguageByCode) {
      return res.status(400).json({
        success: false,
        message: 'Language with this code already exists'
      });
    }

    // Create new language
    const newLanguage = new Language({
      name,
      code: code.toUpperCase(),
      created_by,
      updated_by: created_by
    });

    await newLanguage.save();

    return res.status(201).json({
      success: true,
      message: 'Language created successfully',
      data: {
        language_id: newLanguage.language_id,
        name: newLanguage.name,
        code: newLanguage.code,
        status: newLanguage.status,
        created_by: newLanguage.created_by,
        created_at: newLanguage.created_at,
        updated_by: newLanguage.updated_by,
        updated_on: newLanguage.updated_on
      }
    });

  } catch (error) {
    console.error('Create language error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update language (with auth)
const updateLanguage = async (req, res) => {
  try {
    const { language_id } = req.params;
    const { name, code, status } = req.body;
    const updated_by = req.user.user_id;

    // Find language by language_id
    const language = await Language.findOne({ language_id: parseInt(language_id) });
    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found'
      });
    }

    // Check if new name already exists (if name is being updated)
    if (name && name !== language.name) {
      const existingLanguage = await Language.findOne({ name });
      if (existingLanguage) {
        return res.status(400).json({
          success: false,
          message: 'Language with this name already exists'
        });
      }
    }

    // Check if new code already exists (if code is being updated)
    if (code && code.toUpperCase() !== language.code) {
      const existingLanguage = await Language.findOne({ code: code.toUpperCase() });
      if (existingLanguage) {
        return res.status(400).json({
          success: false,
          message: 'Language with this code already exists'
        });
      }
    }

    // Update language
    const updateData = {
      updated_by,
      updated_on: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (status !== undefined) updateData.status = status;

    const updatedLanguage = await Language.findOneAndUpdate(
      { language_id: parseInt(language_id) },
      updateData,
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Language updated successfully',
      data: {
        language_id: updatedLanguage.language_id,
        name: updatedLanguage.name,
        code: updatedLanguage.code,
        status: updatedLanguage.status,
        created_by: updatedLanguage.created_by,
        created_at: updatedLanguage.created_at,
        updated_by: updatedLanguage.updated_by,
        updated_on: updatedLanguage.updated_on
      }
    });

  } catch (error) {
    console.error('Update language error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get language by ID
const getLanguageById = async (req, res) => {
  try {
    const { language_id } = req.params;

    const language = await Language.findOne({ language_id: parseInt(language_id) });
    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Language retrieved successfully',
      data: {
        language_id: language.language_id,
        name: language.name,
        code: language.code,
        status: language.status,
        created_by: language.created_by,
        created_at: language.created_at,
        updated_by: language.updated_by,
        updated_on: language.updated_on
      }
    });

  } catch (error) {
    console.error('Get language by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all languages
const getAllLanguages = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status !== undefined) {
      query.status = parseInt(status);
    }

    // Get languages with pagination
    const languages = await Language.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalLanguages = await Language.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Languages retrieved successfully',
      data: {
        languages: languages.map(language => ({
          language_id: language.language_id,
          name: language.name,
          code: language.code,
          status: language.status,
          created_by: language.created_by,
          created_at: language.created_at,
          updated_by: language.updated_by,
          updated_on: language.updated_on
        })),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalLanguages / limit),
          total_items: totalLanguages,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all languages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createLanguage,
  updateLanguage,
  getLanguageById,
  getAllLanguages
}; 