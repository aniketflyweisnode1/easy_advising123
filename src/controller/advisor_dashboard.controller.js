const ScheduleCall = require('../models/schedule_call.model');
const moment = require('moment');

// Advisor Dashboard: counts and upcoming calls
const advisorDashboard = async (req, res) => {
    try {
        const advisor_id = req.user.user_id;
        // Count ScheduleCalls by type
        const [totalChat, totalAudio, totalVideo] = await Promise.all([
            ScheduleCall.countDocuments({ advisor_id, call_type: 'CHAT' }),
            ScheduleCall.countDocuments({ advisor_id, call_type: 'AUDIO' }),
            ScheduleCall.countDocuments({ advisor_id, call_type: 'VIDEO' })
        ]);

        // Upcoming ScheduleCalls in next 24 hours
        const now = new Date();
        const next24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const upcomingCalls = await ScheduleCall.find({
            advisor_id,
            date: { $gte: now, $lte: next24h },
            callStatus: { $in: ['Accepted', 'Upcoming'] }
        }).sort({ date: 1 });

        // Get user details for created_by in upcoming calls
        const User = require('../models/User.model');
        const userIds = [...new Set(upcomingCalls.map(call => call.created_by))];
        
        let userMap = {};
        if (userIds.length > 0) {
            const users = await User.find(
                { user_id: { $in: userIds } }, 
                { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }
            );
            users.forEach(u => { userMap[u.user_id] = u; });
        }

        // Map upcoming calls to include user details
        const upcomingCallsWithDetails = upcomingCalls.map(call => {
            const callObj = call.toObject();
            return {
                ...callObj,
                created_by_user: userMap[call.created_by] ? {
                    user_id: userMap[call.created_by].user_id,
                    name: userMap[call.created_by].name,
                    email: userMap[call.created_by].email,
                    mobile: userMap[call.created_by].mobile
                } : null
            };
        });

        res.status(200).json({
            success: true,
            totalChat,
            totalAudio,
            totalVideo,
            upcomingCalls: upcomingCallsWithDetails,
            count: upcomingCallsWithDetails.length,
            status: 200
        });
    } catch (error) {
        console.error('Advisor dashboard error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message 
        });
    }
};

module.exports = { advisorDashboard }; 