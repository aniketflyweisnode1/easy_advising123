const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const generalSettingSchema = new mongoose.Schema({
  setting_id: {
    type: Number,
    unique: true
  },
  user_app_name: String,
  adviser_app_name: String,
  currency: String,
  posted_on: {
    type: Date,
    default: Date.now
  },
  app_language: [{
    type: Number,
    ref: 'Language'
  }],
  app_logo: String,
  commission_chat: Number,
  commission_audio: Number,
  commission_video: Number,
  payment_gst: Number,
  currency_symbol: {
    type: String,
    default: '₹'
  },
  payment_mathod: [{
    type: Number,
    ref: 'PaymentMethod'
  }],
  apple_link: String,
  website_link: String,
  youtube_link: String,
  facebook_link: String,
  linkedin_link: String,
  instagram_link: String,
  firebase_api_key: String,
  firebase_batabase_url: String,
  firebase_auth_domain: String,
  firebase_project_id: String,
  firebase_storage_bucket: String,
  firebase_messaging_sender_id: String,
  firebase_app_id: String,
  firebase_measurement_id: String,
  site_address: String,
  sitemobilenumber: String,
  package_basic_session: Number,
  package_basic_duration: Number,
  package_economy_session: Number,
  package_economy_duration: Number,
  package_pro_session: Number,
  package_pro_duration: Number,
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
}, {
  timestamps: false
});

generalSettingSchema.plugin(AutoIncrement, {
  inc_field: 'setting_id',
  start_seq: 1
});

generalSettingSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

generalSettingSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: new Date() });
  next();
});

module.exports = mongoose.model('GeneralSetting', generalSettingSchema); 