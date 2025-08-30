const express = require('express');
const router = express.Router();
const { createCity, updateCity, getCityById, getAllCities } = require('../../controller/city.controller');
const { auth } = require('../../utils/jwtUtils');

router.post('/', auth, createCity);
router.put('/', auth, updateCity);
router.get('/:city_id', getCityById);
router.get('/', getAllCities);

module.exports = router; 