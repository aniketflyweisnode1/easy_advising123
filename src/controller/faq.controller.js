const Faq = require('../models/faq.model');

// Create FAQ
const createFaq = async (req, res) => {
    try {
        if (req.user && req.user.user_id) {
            req.body.created_by = req.user.user_id;
            req.body.postby_user_id = req.user.user_id;
        }
        const faq = new Faq(req.body);
        await faq.save();
        return res.status(201).json({
            message: 'FAQ created successfully',
            faq,
            status: 201
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Update FAQ
const updateFaq = async (req, res) => {
    try {
        const updateData = req.body;
        if (req.user && req.user.user_id) {
            updateData.updated_by = req.user.user_id;
        }
        const faq = await Faq.findOneAndUpdate(
            { faq_id: updateData.faq_id },
            updateData,
            { new: true }
        );
        if (!faq) {
            return res.status(404).json({
                message: 'FAQ not found',
                status: 404
            });
        }
        return res.status(200).json({
            message: 'FAQ updated successfully',
            faq,
            status: 200
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Get FAQ by ID
const getFaqById = async (req, res) => {
    try {
        const { faq_id } = req.params;
        const faq = await Faq.findOne({ faq_id: faq_id });
        if (!faq) {
            return res.status(404).json({
                message: 'FAQ not found',
                status: 404
            });
        }
        return res.status(200).json({ faq, status: 200 });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Get all FAQs
const getAllFaqs = async (req, res) => {
    try {
        const faqs = await Faq.find();
        return res.status(200).json({ faqs, status: 200 });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

module.exports = {
    createFaq,
    updateFaq,
    getFaqById,
    getAllFaqs
}; 