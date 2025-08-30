const express = require('express');
const router = express.Router();
const { createDesignation, updateDesignation, getDesignationById, getAllDesignations } = require('../../controller/designation.controller');
const { auth } = require('../../utils/jwtUtils');

router.post('/', auth, createDesignation);
router.put('/', auth, updateDesignation);
router.get('/:designation_id', getDesignationById);
router.get('/', getAllDesignations);

module.exports = router; 