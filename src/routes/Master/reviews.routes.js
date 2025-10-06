const express = require('express');
const router = express.Router();
const { createReview, updateReview, getReviewById, getAllReviews, getReviewsByAdvisorId } = require('../../controller/reviews.controller');
const { auth } = require('../../utils/jwtUtils');

router.post('/', auth, createReview);
router.put('/', auth, updateReview);

// Get reviews by advisor ID - must be before /:reviews_id to avoid conflicts
router.get('/advisor/:advisor_id', getReviewsByAdvisorId);

router.get('/:reviews_id', getReviewById);
router.get('/', getAllReviews);

module.exports = router; 