const Filter = require('../models/filter.model.js');
const User = require('../models/User.model.js');
const Blog = require('../models/blog.model.js');

// Create Filter
const createFilter = async (req, res) => {
    try {
        const data = req.body;
        data.created_by = req.user.user_id;
        const filter = new Filter(data);
        await filter.save();
        res.status(201).json({ message: 'Filter created', filter, status: 201 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Update Filter
const updateFilter = async (req, res) => {
    try {
        const { filter_id } = req.body;
        if (!filter_id) {
            return res.status(400).json({ message: 'filter_id is required in body', status: 400 });
        }
        const data = req.body;
        data.updated_by = req.user.user_id;
        data.updated_at = new Date();
        const filter = await Filter.findOneAndUpdate(
            { filter_id },
            data,
            { new: true, runValidators: true }
        );
        if (!filter) {
            return res.status(404).json({ message: 'Filter not found', status: 404 });
        }
        res.status(200).json({ message: 'Filter updated', filter, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Get by Auth User
const getFiltersByAuthUser = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const filters = await Filter.find({ created_by: userId });
        res.status(200).json({ filters, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Get All
const getAllFilters = async (req, res) => {
    try {
        const filters = await Filter.find();
        res.status(200).json({ filters, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Get by ID
const getFilterById = async (req, res) => {
    try {
        const { filter_id } = req.params;
        const filter = await Filter.findOne({ filter_id });
        if (!filter) {
            return res.status(404).json({ message: 'Filter not found', status: 404 });
        }
        res.status(200).json({ filter, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// filter_view: get advisors and blogs by filter (or all if no filter), status 1, full details
const filterView = async (req, res) => {
    try {
        const { category_id, subcategory_id, role_id = 2 } = req.body;
        // Build user query
        let userQuery = { status: 1 };
        if (role_id) {
            userQuery.role_id = role_id;
        }
        if (category_id && Array.isArray(category_id) && category_id.length > 0) {
            userQuery.Category = { $in: category_id };
        }
        if (subcategory_id && Array.isArray(subcategory_id) && subcategory_id.length > 0) {
            userQuery.Subcategory = { $in: subcategory_id };
        }
        // Build blog query
        let blogQuery = { status: 1 };
        if (category_id && Array.isArray(category_id) && category_id.length > 0) {
            blogQuery.category = { $in: category_id };
        }
        if (subcategory_id && Array.isArray(subcategory_id) && subcategory_id.length > 0) {
            blogQuery.subcategory = { $in: subcategory_id };
        }
        // Get users and blogs
        const advisors = await User.find(userQuery);
        const blogs = await Blog.find(blogQuery);
        res.status(200).json({ advisors, blogs, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

module.exports = {
    createFilter,
    updateFilter,
    getFiltersByAuthUser,
    getAllFilters,
    getFilterById,
    filterView
}; 