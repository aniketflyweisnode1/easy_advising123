const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const bannerManagementSchema = new mongoose.Schema({
  banner_id: {
    type: Number,
    unique: true
  },
  banner_title: {
    type: String,
    required: true
  },
  FormDate: {
    type: Date,
    required: true
  },
  ToDate: {
    type: Date,
    required: true
  },
  FeatureImage: {
    type: String
  },
  Activetion: {
    type: Boolean,
    default: true
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

bannerManagementSchema.plugin(AutoIncrement, { inc_field: 'banner_id', start_seq: 1 });

module.exports = mongoose.model('BannerManagement', bannerManagementSchema); 