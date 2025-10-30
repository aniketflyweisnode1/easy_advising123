const express = require('express');
const router = express.Router();
const { 
  createAdvisorPackage, 
  updateAdvisorPackage, 
  getAdvisorPackageById, 
  getAllAdvisorPackages,
  getAdvisorPackageByAuth,
  deleteAdvisorPackage,
  updatePakagebyAdvisor,
  getAdvisorPackageByAdvisorId
} = require('../../controller/advisor_package.controller');
const { auth } = require('../../utils/jwtUtils');

// POST / - Create advisor package (with auth)
router.post('/', auth, createAdvisorPackage);

// GET / - Get all advisor packages
router.get('/', getAllAdvisorPackages);

// GET /auth - Get advisor package by authenticated user (with auth)
router.get('/auth', auth, getAdvisorPackageByAuth);

// GET /:id - Get advisor package by ID (with auth)
router.get('/:id', auth, getAdvisorPackageById);

// PUT / - Update advisor package (with auth)
router.put('/', auth, updateAdvisorPackage);

// PUT /by-advisor - Update single package price by advisor (name, price)
router.put('/by-advisor', auth, updatePakagebyAdvisor);

// GET /by-advisor/:advisor_id - Get advisor package by advisor_id
router.get('/by-advisor/:advisor_id', getAdvisorPackageByAdvisorId);

// DELETE /:id - Delete advisor package
router.delete('/:id', auth, deleteAdvisorPackage);

module.exports = router;

