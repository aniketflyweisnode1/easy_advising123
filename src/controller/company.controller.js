const Company = require('../models/company.model');

// Create Company
const createCompany = async (req, res) => {
  try {
    const { company_name } = req.body;
    if (!company_name) return res.status(400).json({ success: false, message: 'company_name is required' });
    const company = new Company({
      company_name,
      created_by: req.user.user_id
    });
    await company.save();
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Company
const updateCompany = async (req, res) => {
  try {
    const { company_id, ...rest } = req.body;
    if (!company_id) return res.status(400).json({ success: false, message: 'company_id is required in body' });
    const updateData = { ...rest, updated_by: req.user.user_id, updated_at: new Date() };
    const company = await Company.findOneAndUpdate({ company_id }, updateData, { new: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Company by ID
const getCompanyById = async (req, res) => {
  try {
    const { company_id } = req.params;
    const company = await Company.findOne({ company_id });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Companies
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createCompany, updateCompany, getCompanyById, getAllCompanies }; 