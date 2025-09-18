const Tickets = require('../models/tickets.model');
const User = require('../models/User.model');
const TicketReply = require('../models/ticket_Reply.model');

// Create ticket
const createTicket = async (req, res) => {
    try {
        if (req.user && req.user.user_id) {
            req.body.created_by = req.user.user_id;
            req.body.user_id = req.user.user_id;
        }
        const ticket = new Tickets(req.body);
        await ticket.save();
        return res.status(201).json({
            message: 'Ticket created successfully',
            ticket,
            status: 201
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Update ticket
const updateTicket = async (req, res) => {
    try {
        const updateData = req.body;
        if (req.user && req.user.user_id) {
            updateData.updated_by = req.user.user_id;
        }
        const ticket = await Tickets.findOneAndUpdate(
            { ticket_id: updateData.ticket_id },
            updateData,
            { new: true }
        );
        if (!ticket) {
            return res.status(404).json({
                message: 'Ticket not found',
                status: 404
            });
        }
        return res.status(200).json({
            message: 'Ticket updated successfully',
            ticket,
            status: 200
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Get ticket by ID
const getTicketById = async (req, res) => {
    try {
        const { ticket_id } = req.params;
        const ticket = await Tickets.findOne({ ticket_id: ticket_id });
        if (!ticket) {
            return res.status(404).json({
                message: 'Ticket not found',
                status: 404
            });
        }
        return res.status(200).json({ ticket, status: 200 });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Get all tickets
const getAllTickets = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, ticket_status } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};
        if (status !== undefined) {
            // Handle different status formats: 'true'/'false', '1'/'0', 1/0
            let statusValue;
            if (status === 'true' || status === true) {
                statusValue = 1;
            } else if (status === 'false' || status === false) {
                statusValue = 0;
            } else {
                statusValue = parseInt(status);
                if (isNaN(statusValue)) {
                    statusValue = undefined;
                }
            }
            if (statusValue !== undefined) {
                query.status = statusValue;
            }
        }
        if (ticket_status) {
            query.ticket_status = ticket_status;
        }

        // Get tickets with pagination
        const tickets = await Tickets.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const totalTickets = await Tickets.countDocuments(query);

        // Get all unique user IDs from tickets
        const userIds = [...new Set([
            ...tickets.map(t => t.user_id),
            ...tickets.map(t => t.created_by),
            ...tickets.map(t => t.updated_by).filter(id => id)
        ])];

        // Fetch user details for all user IDs
        const users = await User.find(
            { user_id: { $in: userIds } },
            { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }
        );
        const userMap = {};
        users.forEach(u => { userMap[u.user_id] = u; });

        // Get all unique ticket IDs
        const ticketIds = tickets.map(t => t.ticket_id);

        // Fetch ticket replies for all tickets
        const ticketReplies = await TicketReply.find(
            { ticket_id: { $in: ticketIds } },
            { ticket_id: 1, reply_id: 1, reply_description: 1, reply_status: 1, created_by: 1, created_at: 1, _id: 0 }
        ).sort({ created_at: 1 });

        // Group replies by ticket_id
        const repliesMap = {};
        ticketReplies.forEach(reply => {
            if (!repliesMap[reply.ticket_id]) {
                repliesMap[reply.ticket_id] = [];
            }
            repliesMap[reply.ticket_id].push({
                ...reply.toObject(),
                created_by_user: userMap[reply.created_by] || null
            });
        });

        // Prepare response with populated data
        const populatedTickets = tickets.map(ticket => ({
            ticket_id: ticket.ticket_id,
            ticket_no: ticket.ticket_no,
            user: userMap[ticket.user_id] || null,
            ticket_status: ticket.ticket_status,
            ticket_Question: ticket.ticket_Question,
            status: ticket.status,
            created_by_user: userMap[ticket.created_by] || null,
            created_at: ticket.created_at,
            updated_by_user: ticket.updated_by ? (userMap[ticket.updated_by] || null) : null,
            updated_at: ticket.updated_at,
            replies: repliesMap[ticket.ticket_id] || []
        }));

        return res.status(200).json({
            success: true,
            message: 'Tickets retrieved successfully',
            data: {
                tickets: populatedTickets,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(totalTickets / limit),
                    total_items: totalTickets,
                    items_per_page: parseInt(limit)
                }
            },
            status: 200
        });
    } catch (error) {
        console.error('Get all tickets error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

module.exports = {
    createTicket,
    updateTicket,
    getTicketById,
    getAllTickets
}; 