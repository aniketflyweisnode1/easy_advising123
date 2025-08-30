const Tickets = require('../models/tickets.model');

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
        const tickets = await Tickets.find();
        return res.status(200).json({ tickets, status: 200 });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
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