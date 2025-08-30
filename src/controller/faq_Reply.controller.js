const FaqReply = require('../models/faq_Reply.model');

// Create FAQ reply
const createFaqReply = async (req, res) => {
    try {
        if (req.user && req.user.user_id) {
            req.body.created_by = req.user.user_id;
        }
        const faqReply = new FaqReply(req.body);
        await faqReply.save();
        return res.status(201).json({
            message: 'FAQ reply created successfully',
            faqReply,
            status: 201
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Update FAQ reply
const updateFaqReply = async (req, res) => {
    try {
        const updateData = req.body;
        if (req.user && req.user.user_id) {
            updateData.updated_by = req.user.user_id;
        }
        const faqReply = await FaqReply.findOneAndUpdate(
            { faqreply_id: updateData.faqreply_id },
            updateData,
            { new: true }
        );
        if (!faqReply) {
            return res.status(404).json({
                message: 'FAQ reply not found',
                status: 404
            });
        }
        return res.status(200).json({
            message: 'FAQ reply updated successfully',
            faqReply,
            status: 200
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Get FAQ reply by ID
const getFaqReplyById = async (req, res) => {
    try {
        const { faqreply_id } = req.params;
        const faqReply = await FaqReply.findOne({ faqreply_id: faqreply_id });
        if (!faqReply) {
            return res.status(404).json({
                message: 'FAQ reply not found',
                status: 404
            });
        }
        return res.status(200).json({ faqReply, status: 200 });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Get all FAQ replies
const getAllFaqReplies = async (req, res) => {
    try {
        const faqReplies = await FaqReply.find();
        return res.status(200).json({ faqReplies, status: 200 });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

module.exports = {
    createFaqReply,
    updateFaqReply,
    getFaqReplyById,
    getAllFaqReplies
}; 