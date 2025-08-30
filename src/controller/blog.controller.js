const Blog = require('../models/blog.model');
const User = require('../models/User.model');

const createBlog = async (req, res) => {
    try {
      const data = req.body;
      data.created_By = req.user.user_id;
      const blog = new Blog(data);
      await blog.save();
      // Fetch the user name for created_By
      const user = await User.findOne({ user_id: req.user.user_id }, { name: 1, user_id: 1, _id: 0 });
      const blogObj = blog.toObject();
      blogObj.created_By = { id: user.user_id, name: user.name };
      res.status(201).json({ message: 'Blog created', blog: blogObj, status: 201 });
    } catch (error) {
      res.status(500).json({ message: error.message || error, status: 500 });
    }
  };
  
  const updateBlog = async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ message: 'id is required in body', status: 400 });
      }
      const data = req.body;
      data.updated_By = req.user.user_id;
      data.updated_At = new Date();
      const blog = await Blog.findOneAndUpdate(
        { blog_id: id },
        data,
        { new: true, runValidators: true }
      );
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found', status: 404 });
      }
      res.status(200).json({ message: 'Blog updated', blog, status: 200 });
    } catch (error) {
      res.status(500).json({ message: error.message || error, status: 500 });
    }
  };
  
  const getBlogsByAuthUser = async (req, res) => {
    try {
      const userId = req.user.user_id;
      const blogs = await Blog.find({ created_By: userId });
      res.status(200).json({ blogs, status: 200 });
    } catch (error) {
      res.status(500).json({ message: error.message || error, status: 500 });
    }
  };
  
  const getBlogById = async (req, res) => {
    try {
      const { id } = req.params;
      const blog = await Blog.findOne({ blog_id: id });
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found', status: 404 });
      }
      res.status(200).json({ blog, status: 200 });
    } catch (error) {
      res.status(500).json({ message: error.message || error, status: 500 });
    }
  };
  
  const getAllBlogs = async (req, res) => {
    try {
      const blogs = await Blog.find().sort({ blog_id: -1 });
      // Get all unique user ids from blogs
      const userIds = [...new Set(blogs.map(blog => blog.created_By))];
      // Fetch user names for all user ids
      const users = await User.find({ user_id: { $in: userIds } }, { user_id: 1, name: 1, _id: 0 });
      const userMap = {};
      users.forEach(u => { userMap[u.user_id] = u.name; });
      // Map blogs to include created_By as { id, name }
      const blogsWithCreator = blogs.map(blog => {
        const blogObj = blog.toObject();
        blogObj.created_By = { id: blog.created_By, name: userMap[blog.created_By] || null };
        return blogObj;
      });
      res.status(200).json({ blogs: blogsWithCreator, status: 200 });
    } catch (error) {
      res.status(500).json({ message: error.message || error, status: 500 });
    }
  };

module.exports = {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  getBlogsByAuthUser
}; 