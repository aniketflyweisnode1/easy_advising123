const Category = require('../models/category.model.js');

const createCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body;
    const created_By = req.user.user_id;

    if (!category_name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category name and description are required'
      });
    }
    const existingCategory = await Category.findOne({ category_name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }
    const category = new Category({
      category_name,
      description,
      created_By
    });

    const savedCategory = await category.save();
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: savedCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { category_id, category_name, description, status } = req.body;
    const updated_By = req.user.user_id;

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    const updateData = {
      updated_By,
      updated_At: new Date()
    };

    if (category_name) {
      const existingCategory = await Category.findOne({
        category_name,
        category_id: { $ne: parseInt(category_id) }
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
      updateData.category_name = category_name;
    }

    if (description) {
      updateData.description = description;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    const updatedCategory = await Category.findOneAndUpdate(
      { category_id: parseInt(category_id) },
      updateData,
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { category_id } = req.params;

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    const category = await Category.findOne({
      category_id: parseInt(category_id)
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: category
    });
  } catch (error) {
    console.error('Error getting category by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving category',
      error: error.message
    });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ created_At: -1 });

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories
    });
  } catch (error) {
    console.error('Error getting all categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving categories',
      error: error.message
    });
  }
};

module.exports = {
  createCategory,
  updateCategory,
  getCategoryById,
  getAllCategories
}; 