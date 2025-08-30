const express = require('express');
const router = express.Router();
const { createReview, updateReview, getReviewById, getAllReviews } = require('../../controller/reviews.controller');
const { auth } = require('../../utils/jwtUtils');

router.post('/', auth, createReview);
router.put('/', auth, updateReview);
router.get('/:reviews_id', getReviewById);
router.get('/', getAllReviews);

module.exports = router; 