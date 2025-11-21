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
        // Get URL parameters
        const { date_from, date_to } = req.params;
        
        // Get query parameters
        const { 
            status, 
            ticket_status,
            search,
            created_date_from,
            created_date_to,
            updated_date_from,
            updated_date_to,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        // Build query
        const query = {};
        
        // Add status filter
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
        
        // Add ticket_status filter
        if (ticket_status) {
            query.ticket_status = ticket_status;
        }

        // Add date range filters
        // Priority: URL params (date_from, date_to) > query params (created_date_from, created_date_to)
        const fromDate = date_from || created_date_from;
        const toDate = date_to || created_date_to;
        
        if (fromDate || toDate) {
            query.created_at = {};
            if (fromDate) {
                query.created_at.$gte = new Date(fromDate);
            }
            if (toDate) {
                query.created_at.$lt = new Date(new Date(toDate).getTime() + 24 * 60 * 60 * 1000); // Add 1 day to include the entire day
            }
        }

        // Add updated date range filter
        if (updated_date_from || updated_date_to) {
            query.updated_at = {};
            if (updated_date_from) {
                query.updated_at.$gte = new Date(updated_date_from);
            }
            if (updated_date_to) {
                query.updated_at.$lt = new Date(new Date(updated_date_to).getTime() + 24 * 60 * 60 * 1000);
            }
        }

        // Build sort object
        const sortObj = {};
        sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

        // Get tickets with pagination and sorting
        const tickets = await Tickets.find(query)
            .sort(sortObj);

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
        let populatedTickets = tickets.map(ticket => ({
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

        // Apply search filter if provided
        if (search) {
            populatedTickets = populatedTickets.filter(ticket => {
                const searchLower = search.toLowerCase();
                const searchTerm = search.toString();
                return (
                    (ticket.user && (
                        ticket.user.name?.toLowerCase().includes(searchLower) ||
                        ticket.user.email?.toLowerCase().includes(searchLower) ||
                        ticket.user.mobile?.includes(searchTerm)
                    )) ||
                    (ticket.created_by_user && (
                        ticket.created_by_user.name?.toLowerCase().includes(searchLower) ||
                        ticket.created_by_user.email?.toLowerCase().includes(searchLower)
                    )) ||
                    ticket.ticket_Question?.toLowerCase().includes(searchLower) ||
                    ticket.ticket_status?.toLowerCase().includes(searchLower) ||
                    ticket.ticket_no?.toLowerCase().includes(searchLower) ||
                    ticket.ticket_id?.toString().includes(searchTerm) ||
                    // Search by date (format: YYYY-MM-DD or partial date)
                    (ticket.created_at && 
                        ticket.created_at.toISOString().split('T')[0].includes(searchTerm)
                    ) ||
                    (ticket.updated_at && 
                        ticket.updated_at.toISOString().split('T')[0].includes(searchTerm)
                    )
                );
            });
        }

        // Get available filter options
        const allTickets = await Tickets.find({}, { ticket_status: 1, _id: 0 });
        const availableTicketStatuses = [...new Set(allTickets.map(t => t.ticket_status))];

        return res.status(200).json({
            success: true,
            message: 'Tickets retrieved successfully',
            data: {
                tickets: populatedTickets,
                filters: {
                    available_ticket_statuses: availableTicketStatuses
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