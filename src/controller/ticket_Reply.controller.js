const TicketReply = require('../models/ticket_Reply.model');

// Create ticket reply
const createTicketReply = async (req, res) => {
    try {
        if (req.user && req.user.user_id) {
            req.body.created_by = req.user.user_id;
        }
        const ticketReply = new TicketReply(req.body);
        await ticketReply.save();
        return res.status(201).json({
            message: 'Ticket reply created successfully',
            ticketReply,
            status: 201
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Update ticket reply
const updateTicketReply = async (req, res) => {
    try {
        const updateData = req.body;
        if (req.user && req.user.user_id) {
            updateData.updated_by = req.user.user_id;
        }
        const ticketReply = await TicketReply.findOneAndUpdate(
            { reply_id: updateData.reply_id },
            updateData,
            { new: true }
        );
        if (!ticketReply) {
            return res.status(404).json({
                message: 'Ticket reply not found',
                status: 404
            });
        }
        return res.status(200).json({
            message: 'Ticket reply updated successfully',
            ticketReply,
            status: 200
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Get ticket reply by ID
const getTicketReplyById = async (req, res) => {
    try {
        const { reply_id } = req.params;
        const ticketReply = await TicketReply.findOne({ reply_id: reply_id });
        if (!ticketReply) {
            return res.status(404).json({
                message: 'Ticket reply not found',
                status: 404
            });
        }
        return res.status(200).json({ ticketReply, status: 200 });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Get all ticket replies
const getAllTicketReplies = async (req, res) => {
    try {
        const ticketReplies = await TicketReply.find();
        return res.status(200).json({ ticketReplies, status: 200 });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

module.exports = {
    createTicketReply,
    updateTicketReply,
    getTicketReplyById,
    getAllTicketReplies
}; 