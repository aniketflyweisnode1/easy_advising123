const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const reviewsSchema = new mongoose.Schema({
  reviews_id: {
    type: Number,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: true
  },
  status: {
    type: Number,
    default: 1
  },
  created_by: {
    type: Number,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_by: {
    type: Number,
    ref: 'User'
  },
  updated_at: {
    type: Date
  }
});

reviewsSchema.plugin(AutoIncrement, { inc_field: 'reviews_id' });

const Reviews = mongoose.model('Reviews', reviewsSchema);

module.exports = Reviews; 