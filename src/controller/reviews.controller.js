const Reviews = require('../models/reviews.model');
const User = require('../models/User.model');
const createReview = async (req, res) => {
  try {
    const { description, user_id } = req.body;
    if (!description || !user_id) return res.status(400).json({ success: false, message: 'description and user_id are required' });
    const review = new Reviews({
      description,
      user_id,
      created_by: req.user.user_id
    });
    await review.save();
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const { reviews_id } = req.body;
    const updateData = { ...req.body, updated_by: req.user.user_id, updated_at: new Date() };
    const review = await Reviews.findOneAndUpdate({ reviews_id }, updateData, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReviewById = async (req, res) => {
  try {
    const { reviews_id } = req.params;
    const review = await Reviews.findOne({ reviews_id });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    // Get user details for user_id and created_by

    const [user, createdByUser] = await Promise.all([
      User.findOne({ user_id: review.user_id }, { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }),
      User.findOne({ user_id: review.created_by }, { user_id: 1, name: 1, _id: 0 })
    ]);

    const reviewWithDetails = {
      ...review.toObject(),
      user: user ? {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        mobile: user.mobile
      } : null,
      created_by_user: createdByUser ? {
        user_id: createdByUser.user_id,
        name: createdByUser.name
      } : null
    };

    res.status(200).json({ 
      success: true, 
      data: reviewWithDetails 
    });
  } catch (error) {
    console.error('Get review by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const reviews = await Reviews.find().sort({ created_at: -1 });
    
    // Get all unique user IDs from reviews
    const userIds = [...new Set([
      ...reviews.map(r => r.user_id),
      ...reviews.map(r => r.created_by)
    ])];
    
    // Fetch user details for all user IDs
  
    const users = await User.find(
      { user_id: { $in: userIds } }, 
      { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }
    );
    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u; });
    
    // Map reviews to include user details
    const reviewsWithDetails = reviews.map(review => {
      const reviewObj = review.toObject();
      return {
        ...reviewObj,
        user: userMap[review.user_id] ? {
          user_id: userMap[review.user_id].user_id,
          name: userMap[review.user_id].name,
          email: userMap[review.user_id].email,
          mobile: userMap[review.user_id].mobile
        } : null,
        created_by_user: userMap[review.created_by] ? {
          user_id: userMap[review.created_by].user_id,
          name: userMap[review.created_by].name
        } : null
      };
    });

    res.status(200).json({ 
      success: true, 
      data: reviewsWithDetails,
      count: reviewsWithDetails.length
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

module.exports = { createReview, updateReview, getReviewById, getAllReviews }; 