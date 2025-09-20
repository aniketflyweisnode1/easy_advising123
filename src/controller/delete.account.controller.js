const DeleteAccount = require('../models/delete.account.model');
const User = require('../models/User.model');

// Create delete account request
const createDeleteAccount = async (req, res) => {
    try {
        if (req.user && req.user.user_id) {
            req.body.created_by = req.user.user_id;
            req.body.user_id = req.user.user_id;
        }
        const deleteAccount = new DeleteAccount(req.body);
        await deleteAccount.save();
        return res.status(201).json({
            message: 'Delete account request created successfully',
            deleteAccount,
            status: 201
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Update delete account request
const updateDeleteAccount = async (req, res) => {
    try {
        const updateData = req.body;
        if (req.user && req.user.user_id) {
            updateData.updated_by = req.user.user_id;
        }
        const deleteAccount = await DeleteAccount.findOneAndUpdate(
            { Daccountid_id: updateData.Daccountid_id },
            updateData,
            { new: true }
        );
        if (!deleteAccount) {
            return res.status(404).json({
                message: 'Delete account request not found',
                status: 404
            });
        }
        // Removed user status update logic from here
        return res.status(200).json({
            message: 'Delete account request updated successfully',
            deleteAccount,
            status: 200
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// New API: update_delete_status
const updateDeleteStatus = async (req, res) => {
    try {
        const { Daccountid_id, Delete_status } = req.body;
        if (!Daccountid_id || !Delete_status) {
            return res.status(400).json({
                message: 'Daccountid_id and Delete_status are required',
                status: 400
            });
        }
        const deleteAccount = await DeleteAccount.findOneAndUpdate(
            { Daccountid_id },
            { Delete_status },
            { new: true }
        );
        if (!deleteAccount) {
            return res.status(404).json({
                message: 'Delete account request not found',
                status: 404
            });
        }
        // If Delete_status is Approve, update user status and login_permission_status
        if (Delete_status === 'Approve') {
            await User.findOneAndUpdate(
                { user_id: deleteAccount.user_id },
                { status: 0, login_permission_status: false }
            );
        }
        return res.status(200).json({
            message: 'Delete status updated successfully',
            deleteAccount,
            status: 200
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// New API: activateAccount
const activateAccount = async (req, res) => {
    try {
        const { user_id } = req.body;
        if (!user_id) {
            return res.status(400).json({
                message: 'user_id is required',
                status: 400
            });
        }
        // Check if there is a delete account request with Delete_status 'active' for this user
        const deleteRequest = await DeleteAccount.findOne({ user_id, Delete_status: { $in: ['Approve'] } });
        if (!deleteRequest) {
            return res.status(400).json({
                message: 'No delete account request with status active found for this user',
                status: 400
            });
        }
        const user = await User.findOneAndUpdate(
            { user_id },
            { status: 1, login_permission_status: true },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                status: 404
            });
        }
        // Update DeleteAccount model: set Delete_status to 'Active' and status to 1
        await DeleteAccount.updateMany(
            { user_id },
            { Delete_status: 'Active', status: 1 }
        );
        return res.status(200).json({
            message: 'Account activated successfully',
            user,
            status: 200
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Get delete account request by ID
const getDeleteAccountById = async (req, res) => {
    try {
        const { Daccountid_id } = req.params;
        console.log(Daccountid_id)
        const deleteAccount = await DeleteAccount.findOne({ Daccountid_id });
        if (!deleteAccount) {
            return res.status(404).json({
                message: 'Delete account request not found',
                status: 404
            });
        }
        return res.status(200).json({ deleteAccount, status: 200 });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Get all delete account requests
const getAllDeleteAccounts = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, Delete_status } = req.query;
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
        if (Delete_status) {
            query.Delete_status = Delete_status;
        }

        // Get delete accounts with pagination
        const deleteAccounts = await DeleteAccount.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const totalDeleteAccounts = await DeleteAccount.countDocuments(query);

        // Get all unique user IDs from delete accounts
        const userIds = [...new Set([
            ...deleteAccounts.map(da => da.user_id),
            ...deleteAccounts.map(da => da.created_by),
            ...deleteAccounts.map(da => da.updated_by).filter(id => id)
        ])];

        // Fetch user details for all user IDs
        const users = await User.find(
            { user_id: { $in: userIds } },
            { user_id: 1, name: 1, email: 1, mobile: 1, status: 1, login_permission_status: 1, _id: 0 }
        );
        const userMap = {};
        users.forEach(u => { userMap[u.user_id] = u; });

        // Prepare response with populated data
        const populatedDeleteAccounts = deleteAccounts.map(deleteAccount => ({
            Daccountid_id: deleteAccount.Daccountid_id,
            user: userMap[deleteAccount.user_id] || null,
            Delete_account_Reason: deleteAccount.Delete_account_Reason,
            Delete_status: deleteAccount.Delete_status,
            status: deleteAccount.status,
            created_by_user: userMap[deleteAccount.created_by] || null,
            created_at: deleteAccount.created_at,
            updated_by_user: deleteAccount.updated_by ? (userMap[deleteAccount.updated_by] || null) : null,
            updated_at: deleteAccount.updated_at
        }));

        return res.status(200).json({
            success: true,
            message: 'Delete account requests retrieved successfully',
            data: {
                deleteAccounts: populatedDeleteAccounts,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(totalDeleteAccounts / limit),
                    total_items: totalDeleteAccounts,
                    items_per_page: parseInt(limit)
                }
            },
            status: 200
        });
    } catch (error) {
        console.error('Get all delete accounts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

module.exports = {
    createDeleteAccount,
    updateDeleteAccount,
    getDeleteAccountById,
    getAllDeleteAccounts,
    updateDeleteStatus,
    activateAccount
}; 