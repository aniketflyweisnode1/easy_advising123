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
    default: null
  },
  login_permission_status: {
    type: Boolean,
    default: true
  },
  login_suspended_reason: {
    type: String
  },
  status: {
    type: Number,
    default: 1
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
    type: Number,
    ref: 'State'
  },
  city: {
    type: Number,
    ref: 'City'
  },
  IntroductionVideo: {
    type: String
  },
  Current_Designation: {
    type: Number,
    ref: 'Designation'
  },
  current_company_name: {
    type: Number,
    ref: 'Company'
  },
  expertise_offer: {
    type: String
  },
  Category: [{
    type: Number,
    ref: 'Category'
  }],
  Subcategory: [{
    type: Number,
    ref: 'Subcategory'
  }],
  chat_Rate: {
    type: Number
  },
   audio_Rate: {
    type: Number
  },
  voiceCall_Rate: {
    type: Number
  },
  package_id: {
    type: Number,
    ref: 'Package'
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
  choose_slot: [{
    type: String,
   // enum: ['08.00 AM','09.00 AM','10.00 AM','11.00 AM','12.00 AM','01.00 PM','02.00 PM','03.00 PM','04.00 PM','05.00 PM','06.00 PM','07.00 PM','08.00 PM','09.00 PM','10.00 PM','11.00 PM'],
   // default: ['10.00 AM']
  
  }],
  choose_day: [{
    type: String,
    //enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    //default: ['Mon']
  }],
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
  }
  
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