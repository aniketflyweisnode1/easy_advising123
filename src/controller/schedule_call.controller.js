const ScheduleCall = require('../models/schedule_call.model.js');
const Transaction = require('../models/transaction.model.js');
const Wallet = require('../models/wallet.model.js');
const CallType = require('../models/call_type.model.js');
const PackageSubscription = require('../models/package_subscription.model.js');
const User = require('../models/User.model');

// Create Schedule Call
const createScheduleCall = async (req, res) => {
    try {
        const data = req.body;
        data.created_by = req.user.user_id;
        console.log(data.created_by);
        const activeSubscription = await PackageSubscription.findOne({
            subscribe_by: data.created_by,
            Expire_status: false,
            Remaining_Schedule: { $gt: 0 },
            Remaining_minute: { $gt: 5 },
            Subscription_status: 'Actived',
            Expire_status: false
        });

        if (!activeSubscription) {
            // Check wallet balance for both Instant and Schedule calls
            if (data.schedule_type === 'Instant' || data.schedule_type === 'Schedule') {
                // Validate required fields
                if (!data.call_type_id || !data.advisor_id) {
                    return res.status(400).json({
                        message: 'call_type_id and advisor_id are required for Instant and Schedule calls',
                        status: 400
                    });
                }

                // Get call type details to calculate minimum balance
                const callType = await CallType.findOne({
                    call_type_id: data.call_type_id,
                    adviser_id: data.advisor_id
                });
                if (!callType) {
                    return res.status(404).json({
                        message: 'Call type not found Create Advisor call Type First',
                        status: 400
                    });
                }else{
                    data.perminRate = callType.price_per_minute;
                }

                // Calculate minimum balance required based on schedule type
                let minimumBalanceRequired;
                let callTypeDescription;

                if (data.schedule_type === 'Instant') {
                    minimumBalanceRequired = 5 * callType.price_per_minute; // 5 minutes for Instant
                    callTypeDescription = '5 minutes';
                } else if (data.schedule_type === 'Schedule') {
                    minimumBalanceRequired = 30 * callType.price_per_minute; // 30 minutes for Schedule
                    callTypeDescription = '30 minutes';
                }

                // Check user's wallet balance
                const userWallet = await Wallet.findOne({ user_id: { $in: [data.created_by] } });
                if (!userWallet) {
                    return res.status(404).json({
                        message: 'User wallet not found',
                        status: 400
                    });
                }

                // Check if wallet has sufficient balance for minimum required minutes
                if (userWallet.amount < minimumBalanceRequired) {
                    return res.status(400).json({
                        message: `Insufficient wallet balance for ${data.schedule_type} call. Required: ₹${minimumBalanceRequired} (${callTypeDescription} × ₹${callType.price_per_minute}/min)`,
                        status: 400,
                        schedule_type: data.schedule_type,
                        required_balance: minimumBalanceRequired,
                        current_balance: userWallet.amount,
                        price_per_minute: callType.price_per_minute,
                        minimum_minutes: data.schedule_type === 'Instant' ? 5 : 30
                    });
                }

                // Check if wallet has enough balance for other scheduled calls (hold amount)
                const otherScheduledCalls = await ScheduleCall.find({
                    created_by: data.created_by,
                    schedule_type: 'Schedule',
                    callStatus: { $in: ['Panding', 'Upcoming'] }
                });

                let totalHoldAmount = 0;
                for (const scheduledCall of otherScheduledCalls) {
                    const scheduledCallType = await CallType.findOne({
                        call_type_id: scheduledCall.call_type_id,
                        adviser_id: scheduledCall.advisor_id
                    });
                    if (scheduledCallType) {
                        // Estimate hold amount for scheduled calls (assuming 30 minutes average)
                        totalHoldAmount += 30 * scheduledCallType.price_per_minute;
                    }
                }

                const totalRequiredBalance = minimumBalanceRequired + totalHoldAmount;
                if (userWallet.amount < totalRequiredBalance) {
                    return res.status(400).json({
                        message: `Insufficient wallet balance for ${data.schedule_type} call and other scheduled calls. Required: ₹${totalRequiredBalance}`,
                        status: 400,
                        schedule_type: data.schedule_type,
                        call_required: minimumBalanceRequired,
                        scheduled_calls_hold: totalHoldAmount,
                        total_required: totalRequiredBalance,
                        current_balance: userWallet.amount
                    });
                }
            }
        } else {
            // Check Package Subscription availability (if user has subscription package)
            if (data.schedule_type === 'Instant' || data.schedule_type === 'Schedule') {
                // User has active package subscription - set package details and skip wallet deduction
                data.package_Subscription_id = activeSubscription.PkSubscription_id;
                data.remaining_minutes = activeSubscription.Remaining_minute;
                data.remaining_schedule = activeSubscription.Remaining_Schedule;
            }
        }
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
        const schedule = await ScheduleCall.findOne({ schedule_id })
            .populate({ 
                path: 'advisor_id', 
                model: 'User', 
                localField: 'advisor_id', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'created_by', 
                model: 'User', 
                localField: 'created_by', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'updated_by', 
                model: 'User', 
                localField: 'updated_by', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id' 
            })
            .populate({ 
                path: 'skills_id', 
                model: 'Skill', 
                localField: 'skills_id', 
                foreignField: 'skill_id', 
                select: 'skill_id skill_name description use_count' 
            })
            .populate({ 
                path: 'call_type_id', 
                model: 'CallType', 
                localField: 'call_type_id', 
                foreignField: 'call_type_id', 
                select: 'call_type_id mode_name price_per_minute adviser_commission admin_commission description' 
            })
            .populate({ 
                path: 'package_Subscription_id', 
                model: 'PackageSubscription', 
                localField: 'package_Subscription_id', 
                foreignField: 'PkSubscription_id', 
                select: 'PkSubscription_id package_id Remaining_minute Remaining_Schedule Subscription_status Expire_status' 
            });
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
        const { 
            page = 1, 
            limit = 10, 
            search, 
            callStatus, 
            date_from, 
            date_to, 
            advisor_name,
            creator_name,
            call_type,
            schedule_type,
            approval_status,
            status,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;
        
        const skip = (page - 1) * limit;

        // Build query
        const query = {};

        // Add call status filter
        if (callStatus) {
            const statusArray = Array.isArray(callStatus) ? callStatus : [callStatus];
            query.callStatus = { $in: statusArray };
        }

        // Add date range filter
        if (date_from || date_to) {
            query.date = {};
            if (date_from) {
                query.date.$gte = new Date(date_from);
            }
            if (date_to) {
                // Add one day to include the entire end date
                const endDate = new Date(date_to);
                endDate.setDate(endDate.getDate() + 1);
                query.date.$lt = endDate;
            }
        }

        // Add call type filter
        if (call_type) {
            query.call_type = call_type;
        }

        // Add schedule type filter
        if (schedule_type) {
            query.schedule_type = schedule_type;
        }

        // Add approval status filter
        if (approval_status !== undefined) {
            let approvalValue;
            if (approval_status === 'true' || approval_status === true) {
                approvalValue = true;
            } else if (approval_status === 'false' || approval_status === false) {
                approvalValue = false;
            } else {
                approvalValue = approval_status;
            }
            query.approval_status = approvalValue;
        }

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

        // Build sort object
        const sortObj = {};
        sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

        // Get schedules with filters and pagination - with all IDs populated
        console.log(query);
        const schedules = await ScheduleCall.find(query)
            .populate({ 
                path: 'advisor_id', 
                model: 'User', 
                localField: 'advisor_id', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'created_by', 
                model: 'User', 
                localField: 'created_by', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'updated_by', 
                model: 'User', 
                localField: 'updated_by', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id' 
            })
            .populate({ 
                path: 'skills_id', 
                model: 'Skill', 
                localField: 'skills_id', 
                foreignField: 'skill_id', 
                select: 'skill_id skill_name description use_count' 
            })
            .populate({ 
                path: 'call_type_id', 
                model: 'CallType', 
                localField: 'call_type_id', 
                foreignField: 'call_type_id', 
                select: 'call_type_id mode_name price_per_minute adviser_commission admin_commission description' 
            })
            .populate({ 
                path: 'package_Subscription_id', 
                model: 'PackageSubscription', 
                localField: 'package_Subscription_id', 
                foreignField: 'PkSubscription_id', 
                select: 'PkSubscription_id package_id Remaining_minute Remaining_Schedule Subscription_status Expire_status' 
            })
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit));
console.log(schedules);
        // Get total count
        const totalSchedules = await ScheduleCall.countDocuments(query);

        // If name search is provided, filter by user names
        let filteredSchedules = schedules;
        if (search || advisor_name || creator_name) {
            filteredSchedules = schedules.filter(schedule => {
                const advisor = schedule.advisor_id;
                const creator = schedule.created_by;
                
                let matchesSearch = true;
                let matchesAdvisorName = true;
                let matchesCreatorName = true;

                if (search) {
                    const searchLower = search.toLowerCase();
                    matchesSearch = (
                        (advisor && advisor.name && advisor.name.toLowerCase().includes(searchLower)) ||
                        (creator && creator.name && creator.name.toLowerCase().includes(searchLower)) ||
                        (advisor && advisor.email && advisor.email.toLowerCase().includes(searchLower)) ||
                        (creator && creator.email && creator.email.toLowerCase().includes(searchLower))
                    );
                }

                if (advisor_name) {
                    matchesAdvisorName = advisor && advisor.name && 
                        advisor.name.toLowerCase().includes(advisor_name.toLowerCase());
                }

                if (creator_name) {
                    matchesCreatorName = creator && creator.name && 
                        creator.name.toLowerCase().includes(creator_name.toLowerCase());
                }

                return matchesSearch && matchesAdvisorName && matchesCreatorName;
            });
        }

        // Get available call statuses for filter options
        const availableCallStatuses = ['Panding', 'Accepted', 'Completed', 'Cancelled', 'Upcoming', 'Ongoing'];

        return res.status(200).json({
            success: true,
            message: 'Schedule calls retrieved successfully',
            data: {
                schedules: filteredSchedules,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(totalSchedules / limit),
                    total_items: totalSchedules,
                    items_per_page: parseInt(limit)
                },
                filters: {
                    available_call_statuses: availableCallStatuses,
                    available_schedule_types: ['Schedule', 'Instant']
                }
            },
            status: 200
        });
    } catch (error) {
        console.error('Get all schedule calls error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};


// Get by creator
const getScheduleCallsByCreator = async (req, res) => {
    try {
        const creatorId = req.user.user_id;
        const schedules = await ScheduleCall.find({ created_by: creatorId })
            .populate({ 
                path: 'advisor_id', 
                model: 'User', 
                localField: 'advisor_id', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'created_by', 
                model: 'User', 
                localField: 'created_by', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'updated_by', 
                model: 'User', 
                localField: 'updated_by', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id' 
            })
            .populate({ 
                path: 'skills_id', 
                model: 'Skill', 
                localField: 'skills_id', 
                foreignField: 'skill_id', 
                select: 'skill_id skill_name description use_count' 
            })
            .populate({ 
                path: 'call_type_id', 
                model: 'CallType', 
                localField: 'call_type_id', 
                foreignField: 'call_type_id', 
                select: 'call_type_id mode_name price_per_minute adviser_commission admin_commission description' 
            })
            .populate({ 
                path: 'package_Subscription_id', 
                model: 'PackageSubscription', 
                localField: 'package_Subscription_id', 
                foreignField: 'PkSubscription_id', 
                select: 'PkSubscription_id package_id Remaining_minute Remaining_Schedule Subscription_status Expire_status' 
            });
        res.status(200).json({ schedules, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Get by advisor
const getScheduleCallsByAdvisor = async (req, res) => {
    try {
        const { advisor_id } = req.params;
        const schedules = await ScheduleCall.find({ advisor_id })
            .populate({ 
                path: 'advisor_id', 
                model: 'User', 
                localField: 'advisor_id', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'created_by', 
                model: 'User', 
                localField: 'created_by', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'updated_by', 
                model: 'User', 
                localField: 'updated_by', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id' 
            })
            .populate({ 
                path: 'skills_id', 
                model: 'Skill', 
                localField: 'skills_id', 
                foreignField: 'skill_id', 
                select: 'skill_id skill_name description use_count' 
            })
            .populate({ 
                path: 'call_type_id', 
                model: 'CallType', 
                localField: 'call_type_id', 
                foreignField: 'call_type_id', 
                select: 'call_type_id mode_name price_per_minute adviser_commission admin_commission description' 
            })
            .populate({ 
                path: 'package_Subscription_id', 
                model: 'PackageSubscription', 
                localField: 'package_Subscription_id', 
                foreignField: 'PkSubscription_id', 
                select: 'PkSubscription_id package_id Remaining_minute Remaining_Schedule Subscription_status Expire_status' 
            });
        res.status(200).json({ schedules, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Get schedule calls by schedule_type
const getScheduleCallsByType = async (req, res) => {
    try {
        const { schedule_type } = req.params;
        const { 
            page = 1, 
            limit = 10, 
            search, 
            callStatus, 
            date_from, 
            date_to, 
            advisor_name,
            creator_name,
            call_type,
            approval_status,
            status,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        // Validate schedule_type
        if (!['Schedule', 'Instant'].includes(schedule_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid schedule_type. Must be either "Schedule" or "Instant"',
                status: 400
            });
        }

        const skip = (page - 1) * limit;

        // Build query
        const query = { schedule_type };

        // Add call status filter
        if (callStatus) {
            const statusArray = Array.isArray(callStatus) ? callStatus : [callStatus];
            query.callStatus = { $in: statusArray };
        }

        // Add date range filter
        if (date_from || date_to) {
            query.date = {};
            if (date_from) {
                query.date.$gte = new Date(date_from);
            }
            if (date_to) {
                // Add one day to include the entire end date
                const endDate = new Date(date_to);
                endDate.setDate(endDate.getDate() + 1);
                query.date.$lt = endDate;
            }
        }

        // Add call type filter
        if (call_type) {
            query.call_type = call_type;
        }

        // Add approval status filter
        if (approval_status !== undefined) {
            let approvalValue;
            if (approval_status === 'true' || approval_status === true) {
                approvalValue = true;
            } else if (approval_status === 'false' || approval_status === false) {
                approvalValue = false;
            } else {
                approvalValue = approval_status;
            }
            query.approval_status = approvalValue;
        }

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

        // Build sort object
        const sortObj = {};
        sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

        // Get schedules with filters and pagination - with all IDs populated
        const schedules = await ScheduleCall.find(query)
            .populate({ 
                path: 'advisor_id', 
                model: 'User', 
                localField: 'advisor_id', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'created_by', 
                model: 'User', 
                localField: 'created_by', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id profile_image' 
            })
            .populate({ 
                path: 'updated_by', 
                model: 'User', 
                localField: 'updated_by', 
                foreignField: 'user_id', 
                select: 'user_id name email mobile role_id' 
            })
            .populate({ 
                path: 'skills_id', 
                model: 'Skill', 
                localField: 'skills_id', 
                foreignField: 'skill_id', 
                select: 'skill_id skill_name description use_count' 
            })
            .populate({ 
                path: 'call_type_id', 
                model: 'CallType', 
                localField: 'call_type_id', 
                foreignField: 'call_type_id', 
                select: 'call_type_id mode_name price_per_minute adviser_commission admin_commission description' 
            })
            .populate({ 
                path: 'package_Subscription_id', 
                model: 'PackageSubscription', 
                localField: 'package_Subscription_id', 
                foreignField: 'PkSubscription_id', 
                select: 'PkSubscription_id package_id Remaining_minute Remaining_Schedule Subscription_status Expire_status' 
            })
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const totalSchedules = await ScheduleCall.countDocuments(query);

        // If name search is provided, filter by user names
        let filteredSchedules = schedules;
        if (search || advisor_name || creator_name) {
            filteredSchedules = schedules.filter(schedule => {
                const advisor = schedule.advisor_id;
                const creator = schedule.created_by;
                
                let matchesSearch = true;
                let matchesAdvisorName = true;
                let matchesCreatorName = true;

                if (search) {
                    const searchLower = search.toLowerCase();
                    matchesSearch = (
                        (advisor && advisor.name && advisor.name.toLowerCase().includes(searchLower)) ||
                        (creator && creator.name && creator.name.toLowerCase().includes(searchLower)) ||
                        (advisor && advisor.email && advisor.email.toLowerCase().includes(searchLower)) ||
                        (creator && creator.email && creator.email.toLowerCase().includes(searchLower))
                    );
                }

                if (advisor_name) {
                    matchesAdvisorName = advisor && advisor.name && 
                        advisor.name.toLowerCase().includes(advisor_name.toLowerCase());
                }

                if (creator_name) {
                    matchesCreatorName = creator && creator.name && 
                        creator.name.toLowerCase().includes(creator_name.toLowerCase());
                }

                return matchesSearch && matchesAdvisorName && matchesCreatorName;
            });
        }

        // Get available call statuses for filter options
        const availableCallStatuses = ['Panding', 'Accepted', 'Completed', 'Cancelled', 'Upcoming', 'Ongoing'];

        return res.status(200).json({
            success: true,
            message: `${schedule_type} schedule calls retrieved successfully`,
            data: {
                schedule_type: schedule_type,
                schedules: filteredSchedules,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(totalSchedules / limit),
                    total_items: totalSchedules,
                    items_per_page: parseInt(limit)
                },
                filters: {
                    available_call_statuses: availableCallStatuses
                }
            },
            status: 200
        });
    } catch (error) {
        console.error('Get schedule calls by type error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

// End Call and Process Payment
const endCall = async (req, res) => {
    try {
        const { schedule_id, Call_duration, callStatus } = req.body;
        const userId = req.user.user_id;

        if (!schedule_id) {
            return res.status(400).json({
                message: 'schedule_id is required',
                status: 400
            });
        }

        // Find the schedule call
        const scheduleCall = await ScheduleCall.findOne({ schedule_id });
        if (!scheduleCall) {
            return res.status(404).json({
                message: 'Schedule call not found',
                status: 404
            });
        }

        // Validate call duration if provided (should be positive and reasonable)
        if (Call_duration && (Call_duration <= 0 || Call_duration > 86400)) { // Max 24 hours in seconds
            return res.status(400).json({
                message: 'Call duration must be between 1 second and 24 hours',
                status: 400
            });
        }

        // Check if call is already completed
        if (scheduleCall.callStatus === 'Completed') {
            return res.status(400).json({
                message: 'Call is already completed',
                status: 400
            });
        }

        // Get call type details for commission calculation
        const callType = await CallType.findOne({ call_type_id: scheduleCall.call_type_id });
        if (!callType) {
            return res.status(404).json({
                message: 'Call type not found',
                status: 404
            });
        }

        // Check if Call_duration already exists in the schedule call
        let finalCallDuration = Call_duration;
        let durationInMinutes;

       

        // Calculate call amount based on duration
        console.log("print durationInMinutes",Call_duration);
        console.log("print callType.price_per_minute",callType.price_per_minute);
        
        // Validate price_per_minute
        const pricePerMinute = parseFloat(callType.price_per_minute);
        if (isNaN(pricePerMinute) || pricePerMinute < 0) {
            return res.status(400).json({
                message: 'Invalid price_per_minute in call type',
                call_type_id: scheduleCall.call_type_id,
                price_per_minute: callType.price_per_minute,
                status: 400
            });
        }
        
        const totalAmount = parseFloat(Call_duration) * pricePerMinute;
        console.log("print totalAmount",totalAmount);
        
        // Validate totalAmount
        if (isNaN(totalAmount) || totalAmount < 0) {
            return res.status(400).json({
                message: 'Invalid amount calculation',
                call_duration: call_duration,
                price_per_minute: pricePerMinute,
                status: 400
            });
        }
        // Check if this is a package subscription call
        if (scheduleCall.package_Subscription_id && scheduleCall.package_Subscription_id > 0) {
            // For package subscription calls, only update specific fields without payment processing
            const updatedScheduleCall = await ScheduleCall.findOneAndUpdate(
                { schedule_id },
                {
                    Call_duration: finalCallDuration,
                    perminRate: pricePerMinute,
                    Amount: totalAmount,
                    summary_type: 'Succeeded',
                    summary_status: 1,
                    updated_by: userId,
                    updated_at: new Date(),
                    callStatus: callStatus 
                },
                { new: true, runValidators: true }
            );

            return res.status(200).json({
                message: 'Package subscription call completed successfully',
                schedule_call: updatedScheduleCall,
                note: 'No payment processed - using package subscription resources',
                status: 200
            });
        }

        // If call status is not Completed, only update schedule call without payment processing
        if (scheduleCall.callStatus !== 'Completed') {
         console.log("print callStatus",callStatus);
            // Update schedule call with duration and amount (without changing callStatus)
            const updatedScheduleCall = await ScheduleCall.findOneAndUpdate(
                { schedule_id },
                {
                    Call_duration: finalCallDuration,
                    perminRate: pricePerMinute,
                    Amount: totalAmount,
                    callStatus: callStatus,
                    updated_by: userId,
                    updated_at: new Date()
                },
                { new: true, runValidators: true }
            );

            return res.status(200).json({
                message: 'Call duration recorded successfully (no payment processed)',
                schedule_call: updatedScheduleCall,
                note: 'Call status remains unchanged - only duration and amount recorded',
                status: 200
            });
        }

        // Validate that the authenticated user is either the advisor or the creator of the call
        if (scheduleCall.advisor_id !== userId && scheduleCall.created_by !== userId) {
            return res.status(403).json({
                message: 'You are not authorized to end this call',
                status: 403
            });
        }

        // Check if call status allows ending (should be Accepted or Upcoming)
        if (!['Accepted', 'Upcoming'].includes(scheduleCall.callStatus)) {
            return res.status(400).json({
                message: `Call cannot be ended in current status: ${scheduleCall.callStatus}`,
                status: 400
            });
        }

        // Only process payment and complete call if status is Accepted or Upcoming
        if (['Accepted', 'Upcoming'].includes(scheduleCall.callStatus)) {
            // Calculate commissions for payment processing
            const advisorCommission = (totalAmount * callType.adviser_commission) / 100;
            const adminCommission = (totalAmount * callType.admin_commission) / 100;

            // Update schedule call status and duration
            const updatedScheduleCall = await ScheduleCall.findOneAndUpdate(
                { schedule_id },
                {
                    callStatus: callStatus || 'Completed',
                    Call_duration: finalCallDuration,
                    perminRate: pricePerMinute,
                    Amount: totalAmount,
                    updated_by: userId,
                    updated_at: new Date()
                },
                { new: true, runValidators: true }
            );



            // Create transaction for the call
            const transaction = new Transaction({
                user_id: scheduleCall.created_by, // User who made the call
                amount: totalAmount,
                status: 'completed',
                payment_method: 'wallet',
                transactionType: 'Call',
                reference_number: `CALL_${schedule_id}`,
                created_by: userId
            });
            await transaction.save();

            // Deduct amount from user's wallet
            const userWallet = await Wallet.findOne({ user_id: { $in: [scheduleCall.created_by] } });
            if (!userWallet) {
                return res.status(404).json({
                    message: 'User wallet not found',
                    status: 404
                });
            }

            if (userWallet.amount < totalAmount) {
                return res.status(400).json({
                    message: 'Insufficient wallet balance',
                    status: 400
                });
            }

            // Update user wallet (deduct call amount)
            await Wallet.findOneAndUpdate(
                { user_id: { $in: [scheduleCall.created_by] } },
                {
                    amount: userWallet.amount - totalAmount,
                    updated_At: new Date(),
                    updated_by: userId
                }
            );

            // Add commission to advisor's wallet
            const advisorWallet = await Wallet.findOne({ user_id: { $in: [scheduleCall.advisor_id] } });
            if (advisorWallet) {
                await Wallet.findOneAndUpdate(
                    { user_id: { $in: [scheduleCall.advisor_id] } },
                    {
                        amount: advisorWallet.amount + advisorCommission,
                        updated_At: new Date(),
                        updated_by: userId
                    }
                );
            } else {
                // Create advisor wallet if it doesn't exist
                const newAdvisorWallet = new Wallet({
                    user_id: [scheduleCall.advisor_id],
                    role_id: 2, // Assuming role_id 2 is for advisors
                    amount: advisorCommission,
                    created_At: new Date(),
                    updated_At: new Date()
                });
                await newAdvisorWallet.save();
            }

            // Add commission to admin wallet (assuming admin has role_id 1)
            const adminWallet = await Wallet.findOne({ role_id: 1 });
            if (adminWallet) {
                await Wallet.findOneAndUpdate(
                    { role_id: 1 },
                    {
                        amount: adminWallet.amount + adminCommission,
                        updated_At: new Date(),
                        updated_by: userId
                    }
                );
            } else {
                // Create admin wallet if it doesn't exist
                const newAdminWallet = new Wallet({
                    user_id: [1], // Assuming user_id 1 is admin
                    role_id: 1,
                    amount: adminCommission,
                    created_At: new Date(),
                    updated_At: new Date()
                });
                await newAdminWallet.save();
            }

            res.status(200).json({
                message: 'Call ended successfully and payment processed',
                schedule_call: updatedScheduleCall,
                transaction: transaction,
                payment_details: {
                    total_amount: totalAmount,
                    duration_minutes: durationInMinutes,
                    advisor_commission: advisorCommission,
                    admin_commission: adminCommission,
                    user_wallet_deducted: totalAmount,
                    duration_used: finalCallDuration,
                    duration_source: scheduleCall.Call_duration ? 'existing' : 'provided'
                },
                status: 200
            });
        } // End of if block for Accepted/Upcoming status

    } catch (error) {
        console.error('End call error:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};



module.exports = {
    createScheduleCall,
    updateScheduleCall,
    getScheduleCallById,
    getAllScheduleCalls,
    getScheduleCallsByCreator,
    getScheduleCallsByAdvisor,
    getScheduleCallsByType,
    endCall
}; 