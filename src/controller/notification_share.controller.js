const NotificationShare = require('../models/notification_share.model');
const User = require('../models/User.model');
const Role = require('../models/role.model');
const Notification = require('../models/notification.model');
const Blog = require('../models/blog.model');

// Create notification share
const createNotificationShare = async (req, res) => {
    try {
        if (req.user && req.user.user_id) {
            req.body.created_by = req.user.user_id;
        }
        const notificationShare = new NotificationShare(req.body);
        await notificationShare.save();
        return res.status(201).json({
            message: 'Notification share created successfully',
            notificationShare,
            status: 201
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Create notification share by role_id
const createNotificationShareByRole = async (req, res) => {
    try {
        const { notification_id, blog_id, role_id } = req.body;
        const created_by = req.user?.user_id;

        // Validate required fields
        if (!notification_id || !blog_id || !role_id) {
            return res.status(400).json({
                success: false,
                message: 'notification_id, blog_id, and role_id are required',
                status: 400
            });
        }

        // Check if role exists
        const role = await Role.findOne({ role_id: parseInt(role_id) });
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found',
                status: 404
            });
        }

        // Get all users with the specified role_id
        const users = await User.find(
            { role_id: parseInt(role_id) },
            { user_id: 1, name: 1, email: 1, _id: 0 }
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No users found with the specified role',
                status: 404
            });
        }

        // Extract user_ids
        const user_ids = users.map(user => user.user_id);

        // Create notification share
        const notificationShareData = {
            notification_id: parseInt(notification_id),
            blog_id: parseInt(blog_id),
            user_id: user_ids,
            viewbyUser: 0,
            status: 1,
            created_by: created_by
        };

        const notificationShare = new NotificationShare(notificationShareData);
        await notificationShare.save();

        return res.status(201).json({
            success: true,
            message: `Notification share created successfully for ${users.length} users with role: ${role.name}`,
            data: {
                notificationShare,
                role: {
                    role_id: role.role_id,
                    name: role.name,
                    description: role.description
                },
                users: users.map(user => ({
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email
                })),
                total_users: users.length
            },
            status: 201
        });

    } catch (error) {
        console.error('Create notification share by role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

// Update notification share
const updateNotificationShare = async (req, res) => {
    try {
        const updateData = req.body;
        if (req.user && req.user.user_id) {
            updateData.updated_by = req.user.user_id;
        }
        const notificationShare = await NotificationShare.findOneAndUpdate(
            { share_id: updateData.share_id },
            updateData,
            { new: true }
        );
        if (!notificationShare) {
            return res.status(404).json({
                message: 'Notification share not found',
                status: 404
            });
        }
        return res.status(200).json({
            message: 'Notification share updated successfully',
            notificationShare,
            status: 200
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Get notification share by ID
const getNotificationShareById = async (req, res) => {
    try {
        const { share_id } = req.params;
        const notificationShare = await NotificationShare.findOne({ share_id: share_id });
        if (!notificationShare) {
            return res.status(404).json({
                message: 'Notification share not found',
                status: 404
            });
        }
        return res.status(200).json({ notificationShare, status: 200 });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            status: 500
        });
    }
};

// Get all notification shares
const getAllNotificationShares = async (req, res) => {
    try {
        const {
            search,
            status,
            role_id,
            notification_id,
            blog_id,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        // Build query
        const query = {};

        // Add status filter
        if (status !== undefined) {
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

        // Add notification_id filter
        if (notification_id) {
            query.notification_id = parseInt(notification_id);
        }

        // Add blog_id filter
        if (blog_id) {
            query.blog_id = parseInt(blog_id);
        }

        // Build sort object
        const sortObj = {};
        sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

        // Get notification shares with filters
        const notificationShares = await NotificationShare.find(query)
            .sort(sortObj)
            ;

        // Get all unique user IDs from notification shares
        const userIds = [...new Set([
            ...notificationShares.flatMap(ns => ns.user_id),
            ...notificationShares.map(ns => ns.created_by),
            ...notificationShares.map(ns => ns.updated_by).filter(id => id)
        ])];

        // Get all unique notification IDs
        const notificationIds = [...new Set(notificationShares.map(ns => ns.notification_id))];

        // Get all unique blog IDs
        const blogIds = [...new Set(notificationShares.map(ns => ns.blog_id))];

        // Fetch user details for all user IDs
        const users = await User.find(
            { user_id: { $in: userIds } },
            { user_id: 1, name: 1, email: 1, mobile: 1, role_id: 1, status: 1, _id: 0 }
        );
        const userMap = {};
        users.forEach(u => { userMap[u.user_id] = u; });

        // Fetch role details for users
        const roleIds = [...new Set(users.map(u => u.role_id).filter(id => id))];
        const roles = await Role.find(
            { role_id: { $in: roleIds } },
            { role_id: 1, name: 1, description: 1, _id: 0 }
        );
        const roleMap = {};
        roles.forEach(r => { roleMap[r.role_id] = r; });

        // Map notification shares to include populated details
        let notificationSharesWithDetails = notificationShares.map(notificationShare => {
            const notificationShareObj = notificationShare.toObject();

            // Populate users with role information
            const populatedUsers = notificationShare.user_id.map(userId => {
                const user = userMap[userId];
                if (user) {
                    return {
                        user_id: user.user_id,
                        name: user.name,
                        email: user.email,
                        mobile: user.mobile,
                        status: user.status,
                        role: roleMap[user.role_id] || null
                    };
                }
                return null;
            }).filter(user => user !== null);

            return {
                ...notificationShareObj,
                users: populatedUsers,
                created_by_user: userMap[notificationShare.created_by] ? {
                    user_id: userMap[notificationShare.created_by].user_id,
                    name: userMap[notificationShare.created_by].name,
                    email: userMap[notificationShare.created_by].email,
                    mobile: userMap[notificationShare.created_by].mobile,
                    role: roleMap[userMap[notificationShare.created_by].role_id] || null
                } : null,
                updated_by_user: notificationShare.updated_by && userMap[notificationShare.updated_by] ? {
                    user_id: userMap[notificationShare.updated_by].user_id,
                    name: userMap[notificationShare.updated_by].name,
                    email: userMap[notificationShare.updated_by].email,
                    mobile: userMap[notificationShare.updated_by].mobile,
                    role: roleMap[userMap[notificationShare.updated_by].role_id] || null
                } : null,
                total_users: populatedUsers.length
            };
        });

        // Apply role_id filter if provided
        if (role_id) {
            notificationSharesWithDetails = notificationSharesWithDetails.filter(ns =>
                ns.users.some(user => user.role && user.role.role_id === parseInt(role_id))
            );
        }

        // Apply search filter if provided
        if (search) {
            notificationSharesWithDetails = notificationSharesWithDetails.filter(ns => {
                const searchLower = search.toLowerCase();
                return (
                    ns.users.some(user =>
                        user.name?.toLowerCase().includes(searchLower) ||
                        user.email?.toLowerCase().includes(searchLower) ||
                        user.mobile?.includes(search)
                    ) ||
                    (ns.created_by_user && (
                        ns.created_by_user.name?.toLowerCase().includes(searchLower) ||
                        ns.created_by_user.email?.toLowerCase().includes(searchLower)
                    )) ||
                    ns.share_id?.toString().includes(search) ||
                    ns.notification_id?.toString().includes(search) ||
                    ns.blog_id?.toString().includes(search)
                );
            });
        }

        // Get available filter options
        const allNotificationShares = await NotificationShare.find({}, { notification_id: 1, blog_id: 1, _id: 0 });
        const availableNotificationIds = [...new Set(allNotificationShares.map(ns => ns.notification_id))];
        const availableBlogIds = [...new Set(allNotificationShares.map(ns => ns.blog_id))];

        return res.status(200).json({
            success: true,
            message: 'Notification shares retrieved successfully',
            data: {
                notificationShares: notificationSharesWithDetails,
                filters: {
                    available_notification_ids: availableNotificationIds,
                    available_blog_ids: availableBlogIds,
                    available_roles: Object.values(roleMap)
                }
            },
            status: 200
        });

    } catch (error) {
        console.error('Get all notification shares error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

// Get notification shares by authenticated user
const getNotificationShareByAuth = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
                status: 401
            });
        }

        const {
            status,
            notification_id,
            blog_id,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        const query = {
            user_id: { $in: [Number(userId)] }
        };

        if (status !== undefined) {
            let statusValue;
            if (status === 'true' || status === true) {
                statusValue = 1;
            } else if (status === 'false' || status === false) {
                statusValue = 0;
            } else {
                const parsed = parseInt(status);
                statusValue = isNaN(parsed) ? undefined : parsed;
            }
            if (statusValue !== undefined) {
                query.status = statusValue;
            }
        }

        if (notification_id) {
            query.notification_id = parseInt(notification_id);
        }

        if (blog_id) {
            query.blog_id = parseInt(blog_id);
        }

        const sortObj = {};
        sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

        const notificationShares = await NotificationShare.find(query)
            .sort(sortObj);

        const recipientIds = notificationShares.flatMap(ns => ns.user_id || []);

        const userIds = [...new Set([
            userId,
            ...recipientIds,
            ...notificationShares.map(ns => ns.created_by),
            ...notificationShares.map(ns => ns.updated_by).filter(Boolean)
        ])];

        const users = await User.find(
            { user_id: { $in: userIds } },
            { user_id: 1, name: 1, email: 1, mobile: 1, role_id: 1, status: 1, _id: 0 }
        );
        const userMap = {};
        users.forEach(u => { userMap[u.user_id] = u; });

        const roleIds = [...new Set(users.map(u => u.role_id).filter(Boolean))];
        const roles = await Role.find(
            { role_id: { $in: roleIds } },
            { role_id: 1, name: 1, description: 1, _id: 0 }
        );
        const roleMap = {};
        roles.forEach(r => { roleMap[r.role_id] = r; });

        const notificationIds = [...new Set(notificationShares.map(ns => ns.notification_id).filter(Boolean))];
        const blogIds = [...new Set(notificationShares.map(ns => ns.blog_id).filter(Boolean))];

        const notifications = notificationIds.length > 0
            ? await Notification.find(
                { notification_id: { $in: notificationIds } },
                { notification_id: 1, content: 1, otherinfo: 1, status: 1, created_By: 1, _id: 0 }
            )
            : [];
        const blogs = blogIds.length > 0
            ? await Blog.find(
                { blog_id: { $in: blogIds } },
                { blog_id: 1, title: 1, bannerimage: 1, status: 1, created_By: 1, _id: 0 }
            )
            : [];

        const notificationMap = {};
        notifications.forEach(notification => { notificationMap[notification.notification_id] = notification; });

        const blogMap = {};
        blogs.forEach(blog => { blogMap[blog.blog_id] = blog; });

        const sharesWithDetails = notificationShares.map(share => {
            const shareObj = share.toObject();
            const recipients = (shareObj.user_id || []).map(recipientId => {
                const recipientUser = userMap[recipientId];
                if (!recipientUser) {
                    return { user_id: recipientId };
                }
                return {
                    user_id: recipientUser.user_id,
                    name: recipientUser.name,
                    email: recipientUser.email,
                    mobile: recipientUser.mobile,
                    role: roleMap[recipientUser.role_id] || null
                };
            });
            return {
                ...shareObj,
                notification_details: notificationMap[share.notification_id] || null,
                blog_details: blogMap[share.blog_id] || null,
                recipients,
                created_by_user: userMap[share.created_by] ? {
                    user_id: userMap[share.created_by].user_id,
                    name: userMap[share.created_by].name,
                    email: userMap[share.created_by].email,
                    mobile: userMap[share.created_by].mobile,
                    role: roleMap[userMap[share.created_by].role_id] || null
                } : null,
                updated_by_user: share.updated_by && userMap[share.updated_by] ? {
                    user_id: userMap[share.updated_by].user_id,
                    name: userMap[share.updated_by].name,
                    email: userMap[share.updated_by].email,
                    mobile: userMap[share.updated_by].mobile,
                    role: roleMap[userMap[share.updated_by].role_id] || null
                } : null
            };
        });

        return res.status(200).json({
            success: true,
            message: 'Notification shares retrieved successfully',
            data: {
                notificationShares: sharesWithDetails
            },
            status: 200
        });
    } catch (error) {
        console.error('Get notification shares by auth error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

const markNotificationShareViewed = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const { share_id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
                status: 401
            });
        }

        if (!share_id) {
            return res.status(400).json({
                success: false,
                message: 'share_id is required',
                status: 400
            });
        }

        const share = await NotificationShare.findOne({
            share_id: parseInt(share_id),

        });


        share.viewbyUser = 1;
        share.updated_by = Number(userId);
        share.updated_at = new Date();
        await share.save();

        return res.status(200).json({
            success: true,
            message: hasViewed ? 'Notification share already marked as viewed' : 'Notification share marked as viewed',
            data: {
                share_id: share.share_id,
                total_views: share.viewbyUser,
                viewed_by: share.viewed_by
            },
            status: 200
        });
    } catch (error) {
        console.error('Mark notification share viewed error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

const markAllNotificationSharesViewed = async (req, res) => {
    try {
        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
                status: 401
            });
        }

        const filter = {
            user_id: { $in: [Number(userId)] },
            $or: [
                { viewed_by: { $exists: false } },
                { viewed_by: { $nin: [Number(userId)] } }
            ]
        };

        const update = {
            $addToSet: { viewed_by: Number(userId) },
            $inc: { viewbyUser: 1 },
            $set: {
                updated_by: Number(userId),
                updated_at: new Date()
            }
        };

        const result = await NotificationShare.updateMany(filter, update);
        const matchedCount = result?.matchedCount ?? result?.n ?? 0;
        const modifiedCount = result?.modifiedCount ?? result?.nModified ?? 0;

        return res.status(200).json({
            success: true,
            message: modifiedCount > 0
                ? 'All notification shares marked as viewed'
                : 'No notification shares required updating',
            data: {
                totalMatched: matchedCount,
                totalUpdated: modifiedCount
            },
            status: 200
        });
    } catch (error) {
        console.error('Mark all notification shares viewed error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

module.exports = {
    createNotificationShare,
    createNotificationShareByRole,
    updateNotificationShare,
    getNotificationShareById,
    getAllNotificationShares,
    getNotificationShareByAuth,
    markNotificationShareViewed,
    markAllNotificationSharesViewed
}; 