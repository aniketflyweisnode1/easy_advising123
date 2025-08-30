const City = require('../models/city.model');

const createCity = async (req, res) => {
  try {
    const { state_id, city_name } = req.body;
    if (!state_id || !city_name) return res.status(400).json({ success: false, message: 'state_id and city_name are required' });
    const city = new City({
      state_id,
      city_name,
      created_by: req.user.user_id
    });
    await city.save();
    res.status(201).json({ success: true, data: city });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCity = async (req, res) => {
  try {
    const { city_id, ...rest } = req.body;
    if (!city_id) return res.status(400).json({ success: false, message: 'city_id is required in body' });
    const updateData = { ...rest, updated_by: req.user.user_id, updated_at: new Date() };
    const city = await City.findOneAndUpdate({ city_id }, updateData, { new: true });
    if (!city) return res.status(404).json({ success: false, message: 'City not found' });
    res.status(200).json({ success: true, data: city });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCityById = async (req, res) => {
  try {
    const { city_id } = req.params;
    const city = await City.findOne({ city_id });
    if (!city) return res.status(404).json({ success: false, message: 'City not found' });
    res.status(200).json({ success: true, data: city });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllCities = async (req, res) => {
  try {
    const cities = await City.find();
    res.status(200).json({ success: true, data: cities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createCity, updateCity, getCityById, getAllCities }; 