const AdvisorBankAccountDetails = require('../models/Advisor_bankAccountDetails.model');

// Create bank account details (only one active per user)
const createBankAccountDetails = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        // Set created_by
        req.body.created_by = user_id;
        // Deactivate other active accounts for this user
        await AdvisorBankAccountDetails.updateMany({ created_by: user_id, status: 1 }, { $set: { status: 0 } });
        // Create new
        const details = new AdvisorBankAccountDetails(req.body);
        await details.save();
        res.status(201).json({ message: 'Bank account details created', details, status: 201 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Update bank account details (only one active per user)
const updateBankAccountDetails = async (req, res) => {
    try {
        const { AccountDetails_id } = req.body;
        const user_id = req.user.user_id;
        req.body.updated_by = user_id;
        req.body.updated_at = new Date();
        // If status is being set to 1, deactivate others
        if (req.body.status === 1) {
            await AdvisorBankAccountDetails.updateMany({ created_by: user_id, status: 1, AccountDetails_id: { $ne: AccountDetails_id } }, { $set: { status: 0 } });
        }
        const details = await AdvisorBankAccountDetails.findOneAndUpdate(
            { AccountDetails_id, created_by: user_id },
            req.body,
            { new: true }
        );
        if (!details) {
            return res.status(404).json({ message: 'Bank account details not found', status: 404 });
        }
        res.status(200).json({ message: 'Bank account details updated', details, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Get bank account details for authenticated user
const getBankAccountDetailsByAuth = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const details = await AdvisorBankAccountDetails.find({ created_by: user_id });
        res.status(200).json({ details, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Get all bank account details (admin use)
const getAllBankAccountDetails = async (req, res) => {
    try {
        const details = await AdvisorBankAccountDetails.find();
        res.status(200).json({ details, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Get bank account details by id
const getBankAccountDetailsById = async (req, res) => {
    try {
        const { AccountDetails_id } = req.params;
        const details = await AdvisorBankAccountDetails.findOne({ AccountDetails_id });
        if (!details) {
            return res.status(404).json({ message: 'Bank account details not found', status: 404 });
        }
        res.status(200).json({ details, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

module.exports = {
    createBankAccountDetails,
    updateBankAccountDetails,
    getBankAccountDetailsByAuth,
    getAllBankAccountDetails,
    getBankAccountDetailsById
}; 