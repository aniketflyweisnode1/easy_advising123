const Faq = require('../models/faq.model');
const User = require('../models/User.model');
const Role = require('../models/role.model');

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

        // Get user details
        const userIds = [faq.postby_user_id, faq.created_by, faq.updated_by].filter(id => id);
        const users = await User.find(
            { user_id: { $in: userIds } },
            { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }
        );
        const userMap = {};
        users.forEach(u => { userMap[u.user_id] = u; });

        // Get role details
        const role = await Role.findOne(
            { role_id: faq.role_id },
            { role_id: 1, name: 1, description: 1, _id: 0 }
        );

        // Map FAQ to include user and role details
        const faqWithDetails = {
            ...faq.toObject(),
            postby_user: userMap[faq.postby_user_id] ? {
                user_id: userMap[faq.postby_user_id].user_id,
                name: userMap[faq.postby_user_id].name,
                email: userMap[faq.postby_user_id].email,
                mobile: userMap[faq.postby_user_id].mobile
            } : null,
            created_by_user: userMap[faq.created_by] ? {
                user_id: userMap[faq.created_by].user_id,
                name: userMap[faq.created_by].name,
                email: userMap[faq.created_by].email,
                mobile: userMap[faq.created_by].mobile
            } : null,
            updated_by_user: faq.updated_by && userMap[faq.updated_by] ? {
                user_id: userMap[faq.updated_by].user_id,
                name: userMap[faq.updated_by].name,
                email: userMap[faq.updated_by].email,
                mobile: userMap[faq.updated_by].mobile
            } : null,
            role: role ? {
                role_id: role.role_id,
                name: role.name,
                description: role.description
            } : null
        };

        return res.status(200).json({ 
            success: true,
            message: 'FAQ retrieved successfully',
            data: { faq: faqWithDetails },
            status: 200 
        });
    } catch (error) {
        console.error('Get FAQ by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

// Get all FAQs
const getAllFaqs = async (req, res) => {
    try {
    const { 
            search, 
            status,
            faq_status,
            role_id,
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

        // Add faq_status filter
        if (faq_status) {
            query.faq_status = faq_status;
        }

        // Add role_id filter
        if (role_id) {
            query.role_id = parseInt(role_id);
        }

        // Build sort object
        const sortObj = {};
        sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

        // Get FAQs with filters
        const faqs = await Faq.find(query)
            .sort(sortObj)
            ;

        // Get all unique user IDs from FAQs
        const userIds = [...new Set([
            ...faqs.map(f => f.postby_user_id),
            ...faqs.map(f => f.created_by),
            ...faqs.map(f => f.updated_by).filter(id => id)
        ])];

        // Get all unique role IDs
        const roleIds = [...new Set(faqs.map(f => f.role_id))];

        // Fetch user details for all user IDs
        const users = await User.find(
            { user_id: { $in: userIds } },
            { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }
        );
        const userMap = {};
        users.forEach(u => { userMap[u.user_id] = u; });

        // Fetch role details for all role IDs
        const roles = await Role.find(
            { role_id: { $in: roleIds } },
            { role_id: 1, name: 1, description: 1, _id: 0 }
        );
        const roleMap = {};
        roles.forEach(r => { roleMap[r.role_id] = r; });

        // Map FAQs to include user and role details
        let faqsWithDetails = faqs.map(faq => {
            const faqObj = faq.toObject();
            return {
                ...faqObj,
                postby_user: userMap[faq.postby_user_id] ? {
                    user_id: userMap[faq.postby_user_id].user_id,
                    name: userMap[faq.postby_user_id].name,
                    email: userMap[faq.postby_user_id].email,
                    mobile: userMap[faq.postby_user_id].mobile
                } : null,
                created_by_user: userMap[faq.created_by] ? {
                    user_id: userMap[faq.created_by].user_id,
                    name: userMap[faq.created_by].name,
                    email: userMap[faq.created_by].email,
                    mobile: userMap[faq.created_by].mobile
                } : null,
                updated_by_user: faq.updated_by && userMap[faq.updated_by] ? {
                    user_id: userMap[faq.updated_by].user_id,
                    name: userMap[faq.updated_by].name,
                    email: userMap[faq.updated_by].email,
                    mobile: userMap[faq.updated_by].mobile
                } : null,
                role: roleMap[faq.role_id] ? {
                    role_id: roleMap[faq.role_id].role_id,
                    name: roleMap[faq.role_id].name,
                    description: roleMap[faq.role_id].description
                } : null
            };
        });

        // Apply search filter if provided
        if (search) {
            faqsWithDetails = faqsWithDetails.filter(faq => {
                const searchLower = search.toLowerCase();
                const searchTerm = search.toString();
                return (
                    (faq.postby_user && (
                        faq.postby_user.name?.toLowerCase().includes(searchLower) ||
                        faq.postby_user.email?.toLowerCase().includes(searchLower) ||
                        faq.postby_user.mobile?.includes(searchTerm)
                    )) ||
                    (faq.created_by_user && (
                        faq.created_by_user.name?.toLowerCase().includes(searchLower) ||
                        faq.created_by_user.email?.toLowerCase().includes(searchLower)
                    )) ||
                    (faq.role && 
                        faq.role.name?.toLowerCase().includes(searchLower)
                    ) ||
                    faq.faq_Question?.toLowerCase().includes(searchLower) ||
                    faq.faq_Answer?.toLowerCase().includes(searchLower) ||
                    faq.faq_status?.toLowerCase().includes(searchLower) ||
                    faq.faq_no?.toLowerCase().includes(searchLower) ||
                    faq.faq_id?.toString().includes(searchTerm) ||
                    // Search by date (format: YYYY-MM-DD or partial date)
                    (faq.created_at && 
                        faq.created_at.toISOString().split('T')[0].includes(searchTerm)
                    ) ||
                    (faq.updated_at && 
                        faq.updated_at.toISOString().split('T')[0].includes(searchTerm)
                    )
                );
            });
        }

        // Get available filter options
        const allFaqs = await Faq.find({}, { faq_status: 1, role_id: 1, _id: 0 });
        const availableFaqStatuses = [...new Set(allFaqs.map(f => f.faq_status))];
        const availableRoleIds = [...new Set(allFaqs.map(f => f.role_id))];
        const availableRoles = await Role.find(
            { role_id: { $in: availableRoleIds } },
            { role_id: 1, name: 1, _id: 0 }
        );

        return res.status(200).json({
            success: true,
            message: 'FAQs retrieved successfully',
            data: {
                faqs: faqsWithDetails,
                filters: {
                    available_faq_statuses: availableFaqStatuses,
                    available_roles: availableRoles
                }
            },
            status: 200
        });
    } catch (error) {
        console.error('Get all FAQs error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
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