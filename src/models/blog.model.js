const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const blogSchema = new mongoose.Schema({
  blog_id: {
    type: Number,
    unique: true
  },
  category: {
    type: Number,
    required: true
  },
  subcategory: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  bannerimage: {
    type: String
  },
  description: {
    type: String
  },
  status: {
    type: Number,
    default: 1
  },
  created_By: {
    type: Number,
    ref: 'User',
    required: true
  },
  created_At: {
    type: Date,
    default: Date.now
  },
  updated_By: {
    type: Number,
    ref: 'User'
  },
  updated_At: {
    type: Date
  }
});

// Add auto-increment plugin for blog_id
blogSchema.plugin(AutoIncrement, { inc_field: 'blog_id' });

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog; 