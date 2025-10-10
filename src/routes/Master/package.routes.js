const express = require('express');
const router = express.Router();
const { createPackage, updatePackage, getPackageById, getAllPackages } = require('../../controller/package.controller');
const { auth } = require('../../utils/jwtUtils');

router.post('/', auth, createPackage);
router.put('/', auth, updatePackage);
router.get('/:package_id', auth, getPackageById);
router.get('/',  getAllPackages);

module.exports = router; 