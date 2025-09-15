const Subcategory = require('../models/subcategory.model.js');
const Category = require('../models/category.model.js');

const createSubcategory = async (req, res) => {
  try {
    const { category_id, subcategory_name, description } = req.body;
    const created_By = req.user.user_id;

    if (!category_id || !subcategory_name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category ID, subcategory name, and description are required'
      });
    }

    const existingCategory = await Category.findOne({ category_id: parseInt(category_id) });
    if (!existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    const existingSubcategory = await Subcategory.findOne({
      subcategory_name,
      category_id: parseInt(category_id)
    });
    if (existingSubcategory) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory with this name already exists in this category'
      });
    }

    const subcategory = new Subcategory({
      category_id: parseInt(category_id),
      subcategory_name,
      description,
      created_By
    });

    const savedSubcategory = await subcategory.save();

    // Fetch category details
    const category = await Category.findOne({ category_id: savedSubcategory.category_id });
    
    const subcategoryWithCategory = {
      ...savedSubcategory.toObject(),
      category_details: category || null
    };

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: subcategoryWithCategory
    });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subcategory',
      error: error.message
    });
  }
};

const updateSubcategory = async (req, res) => {
  try {
    const { subcategory_id, category_id, subcategory_name, description, status } = req.body;
    const updated_By = req.user.user_id;

    if (!subcategory_id) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory ID is required'
      });
    }

    const updateData = {
      updated_By,
      updated_At: new Date()
    };

    if (category_id) {
      const existingCategory = await Category.findOne({ category_id: parseInt(category_id) });
      if (!existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
      updateData.category_id = parseInt(category_id);
    }

    if (subcategory_name) {
      const existingSubcategory = await Subcategory.findOne({
        subcategory_name,
        category_id: category_id || (await Subcategory.findOne({ subcategory_id: parseInt(subcategory_id) }))?.category_id,
        subcategory_id: { $ne: parseInt(subcategory_id) }
      });
      if (existingSubcategory) {
        return res.status(400).json({
          success: false,
          message: 'Subcategory with this name already exists in this category'
        });
      }
      updateData.subcategory_name = subcategory_name;
    }

    if (description) {
      updateData.description = description;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    const updatedSubcategory = await Subcategory.findOneAndUpdate(
      { subcategory_id: parseInt(subcategory_id) },
      updateData,
      { new: true }
    );

    if (!updatedSubcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Fetch category details
    const category = await Category.findOne({ category_id: updatedSubcategory.category_id });
    
    const subcategoryWithCategory = {
      ...updatedSubcategory.toObject(),
      category_details: category || null
    };

    res.status(200).json({
      success: true,
      message: 'Subcategory updated successfully',
      data: subcategoryWithCategory
    });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subcategory',
      error: error.message
    });
  }
};

const getSubcategoryById = async (req, res) => {
  try {
    const { subcategory_id } = req.params;

    if (!subcategory_id) {
      return res.status(400).json({
        success: false,
        message: 'Subcategory ID is required'
      });
    }

    const subcategory = await Subcategory.findOne({
      subcategory_id: parseInt(subcategory_id)
    });

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    // Fetch category details
    const category = await Category.findOne({ category_id: subcategory.category_id });
    
    const subcategoryWithCategory = {
      ...subcategory.toObject(),
      category_details: category || null
    };

    res.status(200).json({
      success: true,
      message: 'Subcategory retrieved successfully',
      data: subcategoryWithCategory
    });
  } catch (error) {
    console.error('Error getting subcategory by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving subcategory',
      error: error.message
    });
  }
};

const getAllSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.find()
      .sort({ created_At: -1 });

    // Fetch category details for each subcategory
    const subcategoriesWithCategories = await Promise.all(
      subcategories.map(async (subcategory) => {
        const category = await Category.findOne({ category_id: subcategory.category_id });
        return {
          ...subcategory.toObject(),
          category_details: category || null
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Subcategories retrieved successfully',
      data: subcategoriesWithCategories
    });
  } catch (error) {
    console.error('Error getting all subcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving subcategories',
      error: error.message
    });
  }
};

const getSubcategoriesByCategoryId = async (req, res) => {
  try {
    const { category_id } = req.params;

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    const category = await Category.findOne({ category_id: parseInt(category_id) });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const subcategories = await Subcategory.find({
      category_id: parseInt(category_id)
    }).sort({ created_At: -1 });

    // Fetch category details for each subcategory
    const subcategoriesWithCategories = await Promise.all(
      subcategories.map(async (subcategory) => {
        const category = await Category.findOne({ category_id: subcategory.category_id });
        return {
          ...subcategory.toObject(),
          category_details: category || null
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Subcategories retrieved successfully',
      data: subcategoriesWithCategories
    });
  } catch (error) {
    console.error('Error getting subcategories by category ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving subcategories',
      error: error.message
    });
  }
};

module.exports = {
  createSubcategory,
  updateSubcategory,
  getSubcategoryById,
  getAllSubcategories,
  getSubcategoriesByCategoryId
}; 