const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const userSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    unique: true,
 
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  AgreeTermsCondition: {
    type: Boolean,
    default: false
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    sparse: true // allows multiple docs with null/undefined
  },
  user_img: {
    type: String,
    default: null
  },
  password: {
    type: String,
    required: false,
    trim: true
  },
  rememberMe: {
    type: String
  },
  role_id: {
    type: Number,
    ref: 'Role',
    default: 1
  },
  login_permission_status: {
    type: Boolean,
    default: true
  },
  suspended_reason: {
    type: String
  },
  status: {
    type: Number,
    default: 1
  },
  user_online: {
    type: Boolean,
    default: false
  },
  firebase_token: {
    type: String,
    default: null,
    trim: true
  },
  created_by: {
    type: Number,
    ref: 'User',
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_by: {
    type: Number,
    ref: 'User',
    default: null
  },
  updated_on: {
    type: Date,
    default: Date.now
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  DOB: {
    type: Date
  },
  address: {
    type: String
  },
  pincode: {
    type: String
  },
  language: [{
    type: Number,
    ref: 'Language'
  }],
  rating: {
    type: Number
  },
  experience_year: {
    type: Number
  },
  skill: [{
    type: Number,
    ref: 'Skill'
  }],
  description_Bio: {
    type: String
  },
  state: {
    type: String,
    
  },
  city: {
    type: String,
  },
  IntroductionVideo: {
    type: String
  },
  Current_Designation_Name: {
    type: String
  },
  Current_Company_Name: {
    type: String
  },
  expertise_offer: {
    type: String
  },
  Category: {
    type: Number,
    ref: 'Category'
  },
  Subcategory: {
    type: Number,
    ref: 'Subcategory'
  },
  chat_Rate: {
    type: Number,
    default: 0
  },
   audio_Rate: {
    type: Number,
    default: 0
  },
  VideoCall_rate: {
    type: Number,
    default: 0
  },
  package_id: {
    type: Number,
    ref: 'Advisor_Package'
  },
  supporting_Document: {
    type: String
  },
  social_linkdin_link: {
    type: String
  },
  social_instagorm_link: {
    type: String
  },
  social_twitter_link: {
    type: String
  },
  social_facebook_link: {
    type: String
  },
  instant_call: {
    type: Boolean,
    default: false
  },
  applyslots_remainingDays: {
    type: Boolean,
    default: false
  },
  vacation_status: {
    type: Number,
    default: 0
  },
  vacation: {
    type: [String],
    default: []
  },
  slot: [{
    Day_id: {
      type: Number,
      ref: 'choose_day_Advisor'
    },
    times: [{
      type: String
    }]
  }]
  
}, {
  timestamps: false
});

// Auto-increment for user_id
userSchema.plugin(AutoIncrement, { 
  inc_field: 'user_id',
  start_seq: 1
});

// Update the updated_on field before saving
userSchema.pre('save', function(next) {
  this.updated_on = new Date();
  next();
});

// Update the updated_on field before updating
userSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_on: new Date() });
  next();
});

module.exports = mongoose.model('User', userSchema); 