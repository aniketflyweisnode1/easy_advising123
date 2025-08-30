const express = require('express');
const router = express.Router();
const { createCompany, updateCompany, getCompanyById, getAllCompanies } = require('../../controller/company.controller');
const { auth } = require('../../utils/jwtUtils');

router.post('/', auth, createCompany);
router.put('/', auth, updateCompany);
router.get('/:company_id', getCompanyById);
router.get('/', getAllCompanies);

module.exports = router; 