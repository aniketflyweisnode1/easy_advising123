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
        // Get URL parameters
        const { date_from, date_to } = req.params;
        
        // Get query parameters
        const { 
            search,
            ticket_id,
            reply_status,
            created_date_from,
            created_date_to,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        // Build query
        const query = {};

        // Add ticket_id filter
        if (ticket_id) {
            query.ticket_id = parseInt(ticket_id);
        }

        // Add reply_status filter
        if (reply_status) {
            query.reply_status = reply_status;
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

        // Build sort object
        const sortObj = {};
        sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

        // Get ticket replies with pagination and sorting
        const ticketReplies = await TicketReply.find(query)
            .sort(sortObj);

        // Get all unique user IDs from ticket replies
        const userIds = [...new Set(ticketReplies.map(tr => tr.created_by))];

        // Fetch user details for all user IDs
        const User = require('../models/User.model');
        const users = await User.find(
            { user_id: { $in: userIds } },
            { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }
        );
        const userMap = {};
        users.forEach(u => { userMap[u.user_id] = u; });

        // Map ticket replies to include user details
        let ticketRepliesWithDetails = ticketReplies.map(ticketReply => {
            const ticketReplyObj = ticketReply.toObject();
            return {
                ...ticketReplyObj,
                created_by_user: userMap[ticketReply.created_by] ? {
                    user_id: userMap[ticketReply.created_by].user_id,
                    name: userMap[ticketReply.created_by].name,
                    email: userMap[ticketReply.created_by].email,
                    mobile: userMap[ticketReply.created_by].mobile
                } : null
            };
        });

        // Apply search filter if provided
        if (search) {
            ticketRepliesWithDetails = ticketRepliesWithDetails.filter(ticketReply => {
                const searchLower = search.toLowerCase();
                const searchTerm = search.toString();
                return (
                    (ticketReply.created_by_user && (
                        ticketReply.created_by_user.name?.toLowerCase().includes(searchLower) ||
                        ticketReply.created_by_user.email?.toLowerCase().includes(searchLower) ||
                        ticketReply.created_by_user.mobile?.includes(searchTerm)
                    )) ||
                    ticketReply.reply_description?.toLowerCase().includes(searchLower) ||
                    ticketReply.reply_status?.toLowerCase().includes(searchLower) ||
                    ticketReply.reply_id?.toString().includes(searchTerm) ||
                    ticketReply.ticket_id?.toString().includes(searchTerm) ||
                    // Search by date (format: YYYY-MM-DD or partial date)
                    (ticketReply.created_at && 
                        ticketReply.created_at.toISOString().split('T')[0].includes(searchTerm)
                    )
                );
            });
        }

        // Get available filter options
        const allTicketReplies = await TicketReply.find({}, { reply_status: 1, ticket_id: 1, _id: 0 });
        const availableReplyStatuses = [...new Set(allTicketReplies.map(tr => tr.reply_status))];
        const availableTicketIds = [...new Set(allTicketReplies.map(tr => tr.ticket_id))];

        return res.status(200).json({
            success: true,
            message: 'Ticket replies retrieved successfully',
            data: {
                ticketReplies: ticketRepliesWithDetails,
                filters: {
                    available_reply_statuses: availableReplyStatuses,
                    available_ticket_ids: availableTicketIds
                }
            },
            status: 200
        });
    } catch (error) {
        console.error('Get all ticket replies error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
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