const express = require('express');
const router = express.Router();
const { createBlog, updateBlog, getBlogsByAuthUser, getBlogById, getAllBlogs } = require('../../controller/blog.controller.js');
const { auth } = require('../../utils/jwtUtils.js');



// Created: 2025-07-14
router.post('/', auth, createBlog);
// Created: 2025-07-14
router.put('/', auth, updateBlog);
// Created: 2025-07-14
router.get('/auth', auth, getBlogsByAuthUser);
// Created: 2025-07-14
router.get('/:id', auth, getBlogById);
// Created: 2025-07-14
router.get('/',  getAllBlogs);

module.exports = router; 