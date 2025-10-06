const Category = require('../models/category.model.js');
const User = require('../models/User.model.js');

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

const getAll = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCategoryAll = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getAllCategories = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status,
      sort_by = 'created_At',
      sort_order = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    // Add search functionality
    if (search) {
      query.$or = [
        { category_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (status !== undefined) {
      let statusValue;
      if (status === 'true' || status === true) {
        statusValue = 1;
      } else if (status === 'false' || status === false) {
        statusValue = 0;
      } else {
        statusValue = parseInt(status);
        if (isNaN(statusValue)) {
          statusValue = undefined;
        }
      }
      if (statusValue !== undefined) {
        query.status = statusValue;
      }
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Get categories with pagination and filters
    const categories = await Category.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalCategories = await Category.countDocuments(query);

    // Get adviser counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        // Count advisers with this category
        const adviserCount = await User.countDocuments({
          role_id: 2, // Adviser role
          Category: { $in: [category.category_id] }
        });

        // Get active adviser count
        const activeAdviserCount = await User.countDocuments({
          role_id: 2, // Adviser role
          Category: { $in: [category.category_id] },
          status: 1 // Active status
        });

        // Get inactive adviser count
        const inactiveAdviserCount = await User.countDocuments({
          role_id: 2, // Adviser role
          Category: { $in: [category.category_id] },
          status: 0 // Inactive status
        });

        return {
          ...category.toObject(),
          adviser_count: adviserCount,
          active_adviser_count: activeAdviserCount,
          inactive_adviser_count: inactiveAdviserCount
        };
      })
    );

    // Get all categories for filter options (without pagination)
    const allCategories = await Category.find({}, { category_id: 1, category_name: 1, _id: 0 });

    return res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: {
        categories: categoriesWithCounts,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalCategories / limit),
          total_items: totalCategories,
          items_per_page: parseInt(limit)
        },
        filters: {
          available_categories: allCategories
        }
      },
      status: 200
    });
  } catch (error) {
    console.error('Error getting all categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      status: 500
    });
  }
};

module.exports = {
  createCategory,
  updateCategory,
  getCategoryById,
  getAllCategories,
  getAll,
  getCategoryAll
}; 