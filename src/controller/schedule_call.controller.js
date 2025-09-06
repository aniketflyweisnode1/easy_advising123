const ScheduleCall = require('../models/schedule_call.model.js');
const User = require('../models/User.model.js');

// Create Schedule Call
const createScheduleCall = async (req, res) => {
    try {
        const data = req.body;
        data.created_by = req.user.user_id;
        const schedule = new ScheduleCall(data);
        await schedule.save();
        res.status(201).json({ message: 'Schedule call created', schedule, status: 201 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Update Schedule Call
const updateScheduleCall = async (req, res) => {
    try {
        const { schedule_id } = req.body;
        if (!schedule_id) {
            return res.status(400).json({ message: 'schedule_id is required in body', status: 400 });
        }
        const data = req.body;
        data.updated_by = req.user.user_id;
        data.updated_at = new Date();
        const schedule = await ScheduleCall.findOneAndUpdate(
            { schedule_id },
            data,
            { new: true, runValidators: true }
        );
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule call not found', status: 404 });
        }
        res.status(200).json({ message: 'Schedule call updated', schedule, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Get by ID
const getScheduleCallById = async (req, res) => {
    try {
        const { schedule_id } = req.params;
        const schedule = await ScheduleCall.findOne({ schedule_id });
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule call not found', status: 404 });
        }
        res.status(200).json({ schedule, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Get all with pagination, search, and sorting
const getAllScheduleCalls = async (req, res) => {
    try {
        // Extract query parameters
        const {
            page = 1,
            limit = 10,
            search = '',
            call_type = '',
            callStatus = '',
            approval_status = '',
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        // Convert page and limit to numbers
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build search filter
        let searchFilter = {};
        
        // If search term is provided, we'll need to search in user names
        // For now, we'll search in basic fields and then filter by user names
        if (search) {
            searchFilter = {
                $or: [
                    { call_type: { $regex: search, $options: 'i' } },
                    { callStatus: { $regex: search, $options: 'i' } },
                    { summary_type: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Add other filters
        if (call_type) {
            searchFilter.call_type = call_type;
        }
        if (callStatus) {
            searchFilter.callStatus = callStatus;
        }
        if (approval_status !== '') {
            searchFilter.approval_status = approval_status === 'true';
        }

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get total count for pagination
        const totalCount = await ScheduleCall.countDocuments(searchFilter);

        // Get schedules with pagination and sorting
        let schedules = await ScheduleCall.find(searchFilter)
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum);

        // If search term is provided, we need to filter by user names
        if (search) {
            // Get all unique user ids from schedules
            const advisorIds = [...new Set(schedules.map(schedule => schedule.advisor_id))];
            const creatorIds = [...new Set(schedules.map(schedule => schedule.created_by))];
            const allUserIds = [...new Set([...advisorIds, ...creatorIds])];

            // Fetch users that match the search term
            const matchingUsers = await User.find({
                user_id: { $in: allUserIds },
                name: { $regex: search, $options: 'i' }
            }, { user_id: 1, name: 1, _id: 0 });

            const matchingUserIds = matchingUsers.map(u => u.user_id);

            // Filter schedules to include only those with matching advisor or creator names
            schedules = schedules.filter(schedule => 
                matchingUserIds.includes(schedule.advisor_id) || 
                matchingUserIds.includes(schedule.created_by)
            );
        }
        
        // Get all unique user ids from filtered schedules
        const advisorIds = [...new Set(schedules.map(schedule => schedule.advisor_id))];
        const creatorIds = [...new Set(schedules.map(schedule => schedule.created_by))];
        const allUserIds = [...new Set([...advisorIds, ...creatorIds])];
        
        // Fetch user names for all user ids
        const users = await User.find({ user_id: { $in: allUserIds } }, { user_id: 1, name: 1, _id: 0 });
        const userMap = {};
        users.forEach(u => { userMap[u.user_id] = u.name; });
        
        // Map schedules to include advisor_id and created_by as { user_id, name }
        const schedulesWithNames = schedules.map(schedule => {
            const scheduleObj = schedule.toObject();
            scheduleObj.advisor_id = { user_id: schedule.advisor_id, name: userMap[schedule.advisor_id] || null };
            scheduleObj.created_by = { user_id: schedule.created_by, name: userMap[schedule.created_by] || null };
            return scheduleObj;
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        // Response with pagination metadata
        res.status(200).json({
            schedules: schedulesWithNames,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNextPage,
                hasPrevPage
            },
            filters: {
                search,
                call_type,
                callStatus,
                approval_status,
                sortBy,
                sortOrder
            },
            status: 200
        });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};


// Get by creator
const getScheduleCallsByCreator = async (req, res) => {
    try {
        const creatorId = req.user.user_id;
        const schedules = await ScheduleCall.find({ created_by: creatorId });
        res.status(200).json({ schedules, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Get by advisor
const getScheduleCallsByAdvisor = async (req, res) => {
    try {
        const { advisor_id } = req.params;
        const schedules = await ScheduleCall.find({ advisor_id });
        res.status(200).json({ schedules, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

module.exports = {
    createScheduleCall,
    updateScheduleCall,
    getScheduleCallById,
    getAllScheduleCalls,
    getScheduleCallsByCreator,
    getScheduleCallsByAdvisor
}; 