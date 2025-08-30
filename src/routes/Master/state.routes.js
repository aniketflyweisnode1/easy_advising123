const express = require('express');
const router = express.Router();
const { createState, updateState, getStateById, getAllStates } = require('../../controller/state.controller');
const { auth } = require('../../utils/jwtUtils');

router.post('/', auth, createState);
router.put('/', auth, updateState);
router.get('/:state_id', getStateById);
router.get('/', getAllStates);

module.exports = router; 