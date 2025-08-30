const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const CategorySchema = new mongoose.Schema({
  category_id: {
    type: Number,
    unique: true
  },
  category_name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
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
}, {
  collection: 'categories'
});

CategorySchema.plugin(AutoIncrement, { inc_field: 'category_id' });

module.exports = mongoose.model('Category', CategorySchema); 