const FileSend = require('../models/file_send.model');

const createFileSend = async (req, res) => {
    try {
        const { user_to, user_from, fileUrl, status, schedule_call_id } = req.body;
        const createdBy = req.user?.user_id;

        if (!createdBy) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
                status: 401
            });
        }

        if (!user_to || !user_from || !fileUrl) {
            return res.status(400).json({
                success: false,
                message: 'user_to, user_from and fileUrl are required',
                status: 400
            });
        }

        const fileSend = new FileSend({
            user_to: Number(user_to),
            user_from: Number(user_from),
            fileUrl,
            schedule_call_id: schedule_call_id ? Number(schedule_call_id) : undefined,
            status: status !== undefined ? Boolean(status) : true,
            created_by: Number(createdBy)
        });

        await fileSend.save();

        return res.status(201).json({
            success: true,
            message: 'File sent record created successfully',
            data: fileSend,
            status: 201
        });
    } catch (error) {
        console.error('Create file send error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

const updateFileSend = async (req, res) => {
    try {
        const { file_Send_id, schedule_call_id, ...rest } = req.body;
        const updateData = { ...rest };
        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
                status: 401
            });
        }

        if (!file_Send_id) {
            return res.status(400).json({
                success: false,
                message: 'file_Send_id is required',
                status: 400
            });
        }

        if (schedule_call_id !== undefined) {
            updateData.schedule_call_id = schedule_call_id ? Number(schedule_call_id) : null;
        }

        updateData.updated_by = Number(userId);

        const updatedFileSend = await FileSend.findOneAndUpdate(
            { file_Send_id: Number(file_Send_id) },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedFileSend) {
            return res.status(404).json({
                success: false,
                message: 'File send record not found',
                status: 404
            });
        }

        return res.status(200).json({
            success: true,
            message: 'File send record updated successfully',
            data: updatedFileSend,
            status: 200
        });
    } catch (error) {
        console.error('Update file send error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

const getFileSendById = async (req, res) => {
    try {
        const { file_Send_id } = req.params;
        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
                status: 401
            });
        }

        const fileSend = await FileSend.findOne({ file_Send_id: Number(file_Send_id) });

        if (!fileSend) {
            return res.status(404).json({
                success: false,
                message: 'File send record not found',
                status: 404
            });
        }

        return res.status(200).json({
            success: true,
            message: 'File send record retrieved successfully',
            data: fileSend,
            status: 200
        });
    } catch (error) {
        console.error('Get file send by id error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

const getAllFileSends = async (req, res) => {
    try {
        const { user_to, user_from, status, schedule_call_id } = req.query;

        const query = {};

        if (user_to) {
            query.user_to = Number(user_to);
        }

        if (user_from) {
            query.user_from = Number(user_from);
        }

        if (status !== undefined) {
            if (status === 'true' || status === true) {
                query.status = true;
            } else if (status === 'false' || status === false) {
                query.status = false;
            }
        }

        if (schedule_call_id) {
            query.schedule_call_id = Number(schedule_call_id);
        }

        const fileSends = await FileSend.find(query).sort({ created_at: -1 });

        return res.status(200).json({
            success: true,
            message: 'File send records retrieved successfully',
            data: fileSends,
            status: 200
        });
    } catch (error) {
        console.error('Get all file sends error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

const deleteFileSend = async (req, res) => {
    try {
        const { file_Send_id } = req.params;

        if (!file_Send_id) {
            return res.status(400).json({
                success: false,
                message: 'file_Send_id is required',
                status: 400
            });
        }

        const deleted = await FileSend.findOneAndDelete({ file_Send_id: Number(file_Send_id) });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'File send record not found',
                status: 404
            });
        }

        return res.status(200).json({
            success: true,
            message: 'File send record deleted successfully',
            status: 200
        });
    } catch (error) {
        console.error('Delete file send error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

const getFileSendByAuth = async (req, res) => {
    try {
        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
                status: 401
            });
        }

        const fileSends = await FileSend.find({
            $or: [
                { user_to: Number(userId) },
                { user_from: Number(userId) },
                { created_by: Number(userId) }
            ]
        }).sort({ created_at: -1 });

        return res.status(200).json({
            success: true,
            message: 'File send records for user retrieved successfully',
            data: fileSends,
            status: 200
        });
    } catch (error) {
        console.error('Get file send by auth error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

const getFileSendByScheduleCallId = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const { schedule_call_id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
                status: 401
            });
        }

        if (!schedule_call_id) {
            return res.status(400).json({
                success: false,
                message: 'schedule_call_id is required',
                status: 400
            });
        }

        const fileSends = await FileSend.find({
            schedule_call_id: Number(schedule_call_id)
        }).sort({ created_at: -1 });

        return res.status(200).json({
            success: true,
            message: 'File send records for schedule call retrieved successfully',
            data: fileSends,
            status: 200
        });
    } catch (error) {
        console.error('Get file send by schedule call id error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

module.exports = {
    createFileSend,
    updateFileSend,
    getFileSendById,
    getAllFileSends,
    deleteFileSend,
    getFileSendByAuth,
    getFileSendByScheduleCallId
};

