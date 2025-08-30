const ScheduleCall = require('../models/schedule_call.model.js');

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

// Get all
const getAllScheduleCalls = async (req, res) => {
    try {
        const schedules = await ScheduleCall.find();
        
        // Get all unique user ids from schedules (advisor_id and created_by)
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
        
        res.status(200).json({ schedules: schedulesWithNames, status: 200 });
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