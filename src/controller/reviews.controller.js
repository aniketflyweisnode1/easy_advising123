const Reviews = require('../models/reviews.model');
const User = require('../models/User.model');
const createReview = async (req, res) => {
  try {
    const { description, user_id, rating, schedule_call_id } = req.body;
    
    // Validate required fields
    if (!description || !user_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'description and user_id are required' 
      });
    }

    // Validate rating if provided (0-5)
    if (rating !== undefined) {
      const ratingNum = Number(rating);
      if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
        return res.status(400).json({ 
          success: false, 
          message: 'rating must be a number between 0 and 5' 
        });
      }
    }

    const reviewData = {
      description,
      user_id,
      rating: rating !== undefined ? Number(rating) : 0, // Default to 0 if not provided
      created_by: req.user.user_id
    };

    if (schedule_call_id !== undefined && schedule_call_id !== null) {
      const scheduleIdNum = Number(schedule_call_id);
      if (!Number.isInteger(scheduleIdNum) || scheduleIdNum <= 0) {
        return res.status(400).json({
          success: false,
          message: 'schedule_call_id must be a positive integer'
        });
      }
      reviewData.schedule_call_id = scheduleIdNum;
    }

    const review = new Reviews(reviewData);
    await review.save();
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const { reviews_id } = req.body;
    
    // Validate rating if provided (0-5)
    if (req.body.rating !== undefined) {
      const ratingNum = Number(req.body.rating);
      if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
        return res.status(400).json({ 
          success: false, 
          message: 'rating must be a number between 0 and 5' 
        });
      }
      req.body.rating = ratingNum;
    }

    // Don't allow updating reviews_id, created_by, or user_id
    const { reviews_id: _, created_by: __, user_id: ___, ...updateData } = req.body;
    updateData.updated_by = req.user.user_id;
    updateData.updated_at = new Date();

    if (updateData.schedule_call_id !== undefined) {
      const scheduleIdNum = Number(updateData.schedule_call_id);
      if (!Number.isInteger(scheduleIdNum) || scheduleIdNum <= 0) {
        return res.status(400).json({
          success: false,
          message: 'schedule_call_id must be a positive integer'
        });
      }
      updateData.schedule_call_id = scheduleIdNum;
    }
    
    const review = await Reviews.findOneAndUpdate({ reviews_id }, updateData, { new: true, runValidators: true });
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

// Get reviews by advisor ID with pagination and filters
const getReviewsByAdvisorId = async (req, res) => {
  try {
    const { advisor_id } = req.params;
    const { 
      status,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Validate advisor_id
    if (!advisor_id) {
      return res.status(400).json({
        success: false,
        message: 'Advisor ID is required'
      });
    }

    // Build query
    const query = { user_id: Number(advisor_id) };

    // Add status filter if provided
    if (status !== undefined) {
      query.status = parseInt(status);
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Get reviews with filters
    const reviews = await Reviews.find(query)
      .sort(sortObj)
      ;

    // Get all unique user IDs from reviews (advisor and reviewers)
    const userIds = [...new Set([
      Number(advisor_id),
      ...reviews.map(r => r.created_by)
    ])];

    // Fetch user details for all user IDs
    const users = await User.find(
      { user_id: { $in: userIds } },
      { user_id: 1, name: 1, email: 1, mobile: 1, profile_image: 1, rating: 1, _id: 0 }
    );
    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u; });

    // Get advisor details
    const advisorDetails = userMap[Number(advisor_id)] || null;

    // Map reviews to include user details
    const reviewsWithDetails = reviews.map(review => {
      const reviewObj = review.toObject();
      return {
        ...reviewObj,
        advisor_details: advisorDetails ? {
          user_id: advisorDetails.user_id,
          name: advisorDetails.name,
          email: advisorDetails.email,
          mobile: advisorDetails.mobile,
          profile_image: advisorDetails.profile_image,
          rating: advisorDetails.rating
        } : null,
        reviewer_details: userMap[review.created_by] ? {
          user_id: userMap[review.created_by].user_id,
          name: userMap[review.created_by].name,
          email: userMap[review.created_by].email,
          mobile: userMap[review.created_by].mobile
        } : null
      };
    });

    // Calculate review statistics
    const allReviews = await Reviews.find(query);
    
    // Filter out reviews with rating 0 for average calculation
    const reviewsWithRating = allReviews.filter(r => r.rating > 0);
    const totalRatings = reviewsWithRating.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = reviewsWithRating.length > 0 ? (totalRatings / reviewsWithRating.length).toFixed(2) : 0;
    
    // Count reviews by rating (including 0)
    const ratingDistribution = {
      5: allReviews.filter(r => r.rating === 5).length,
      4: allReviews.filter(r => r.rating === 4).length,
      3: allReviews.filter(r => r.rating === 3).length,
      2: allReviews.filter(r => r.rating === 2).length,
      1: allReviews.filter(r => r.rating === 1).length,
      0: allReviews.filter(r => r.rating === 0 || !r.rating).length
    };

    const reviewStats = {
      total_reviews: totalReviews,
      active_reviews: await Reviews.countDocuments({ ...query, status: 1 }),
      inactive_reviews: await Reviews.countDocuments({ ...query, status: 0 }),
      average_rating: parseFloat(averageRating),
      total_ratings: totalRatings,
      reviews_with_rating: reviewsWithRating.length,
      reviews_with_zero_rating: ratingDistribution[0],
      rating_distribution: ratingDistribution
    };

    res.status(200).json({
      success: true,
      message: `Reviews for advisor ${advisor_id} retrieved successfully`,
      data: {
        advisor: advisorDetails,
        reviews: reviewsWithDetails,
        statistics: reviewStats
      },
      status: 200
    });
  } catch (error) {
    console.error('Get reviews by advisor ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      status: 500
    });
  }
};

module.exports = { createReview, updateReview, getReviewById, getAllReviews, getReviewsByAdvisorId }; 