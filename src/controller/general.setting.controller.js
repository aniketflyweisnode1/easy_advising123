const GeneralSetting = require('../models/general.setting.model');

// Create general setting
const createGeneralSetting = async (req, res) => {
    try {
        if (req.user && req.user.user_id) {
            req.body.created_by = req.user.user_id;
        }
        const generalSetting = new GeneralSetting(req.body);
        await generalSetting.save();
        return res.status(201).json({
            message: 'General setting created successfully',
            generalSetting,
            status: 201
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Update general setting
const updateGeneralSetting = async (req, res) => {
    try {
        const updateData = req.body;
        if (req.user && req.user.user_id) {
            updateData.updated_by = req.user.user_id;
        }
        const generalSetting = await GeneralSetting.findOneAndUpdate(
            { setting_id: updateData.setting_id },
            updateData,
            { new: true }
        );
        if (!generalSetting) {
            return res.status(404).json({
                message: 'General setting not found',
                status: 404
            });
        }
        return res.status(200).json({
            message: 'General setting updated successfully',
            generalSetting,
            status: 200
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Get general setting by ID
const getGeneralSettingById = async (req, res) => {
    try {
        const { setting_id } = req.params;
        const generalSetting = await GeneralSetting.findOne({ setting_id });
        if (!generalSetting) {
            return res.status(404).json({
                message: 'General setting not found',
                status: 404
            });
        }
        return res.status(200).json({ generalSetting, status: 200 });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Get all general settings
const getAllGeneralSettings = async (req, res) => {
    try {
        const generalSettings = await GeneralSetting.find();
        return res.status(200).json({ generalSettings, status: 200 });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

module.exports = {
    createGeneralSetting,
    updateGeneralSetting,
    getGeneralSettingById,
    getAllGeneralSettings
}; 