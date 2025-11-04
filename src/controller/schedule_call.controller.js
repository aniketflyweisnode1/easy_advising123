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
                console.log(data.call_type, data.advisor_id);
                if (!data.call_type || !data.advisor_id) {
                    console.log('call_type and advisor_id are required for Instant and Schedule calls');
                    return res.status(400).json({
                        message: 'call_type and advisor_id are required for Instant and Schedule calls',
                        status: 400
                    });
                }

                // Get call type details to calculate minimum balance
                const advisorRate = await User.findOne({
                    user_id: data.advisor_id
                });
                console.log(advisorRate);
                if (data.call_type === 'Chat') {
                    data.perminRate = advisorRate.chat_Rate;
                } else if (data.call_type === 'Audio') {
                    data.perminRate = advisorRate.audio_Rate;
                } else if (data.call_type === 'Video') {
                    data.perminRate = advisorRate.VideoCall_rate;
                }


            }
            // callType.price_per_minute
            // Calculate minimum balance required based on schedule type
            let minimumBalanceRequired;
            let callTypeDescription;

            if (data.schedule_type === 'Instant') {
                minimumBalanceRequired = 5 * data.perminRate; // 5 minutes for Instant
                callTypeDescription = '5 minutes';
            } else if (data.schedule_type === 'Schedule') {
                minimumBalanceRequired = 30 * data.perminRate; // 30 minutes for Schedule
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

            // Calculate available balance (amount - hold_amount)
            const availableBalance = userWallet.amount;

            // Check if wallet has sufficient available balance for minimum required minutes
            if (availableBalance < minimumBalanceRequired) {
                return res.status(400).json({
                    message: `Insufficient wallet balance for ${data.schedule_type} call. Required: ₹${minimumBalanceRequired} (${callTypeDescription} × ₹${data.perminRate}/min)`,
                    status: 400,
                    schedule_type: data.schedule_type,
                    required_balance: minimumBalanceRequired,
                    current_balance: userWallet.amount,
                    hold_amount: userWallet.hold_amount || 0,
                    available_balance: availableBalance,
                    price_per_minute: data.perminRate,
                    minimum_minutes: data.schedule_type === 'Instant' ? 5 : 30
                });
            }

            // Check if wallet has enough balance for other scheduled calls (hold amount)
            const otherScheduledCalls = await ScheduleCall.find({
                created_by: data.created_by,
                schedule_type: 'Schedule',
                callStatus: { $in: ['Pending', 'Upcoming'] }
            });

            let totalHoldAmount = 0;
            for (const scheduledCall of otherScheduledCalls) {
                // Estimate hold amount for scheduled calls (assuming 30 minutes average)
                // Use the scheduled call's perminRate if available, otherwise use current perminRate
                const callRate = scheduledCall.perminRate || data.perminRate;
                totalHoldAmount += 30 * callRate;
            }

            // Calculate new hold amount for this call
            const newHoldAmount = data.schedule_type === 'Schedule' 
                ? 30 * data.perminRate 
                : (data.Call_duration ? data.Call_duration * data.perminRate : minimumBalanceRequired);

            const totalRequiredBalance = minimumBalanceRequired;
            if (availableBalance < totalRequiredBalance) {
                return res.status(400).json({
                    message: `Insufficient wallet balance for ${data.schedule_type} call and other scheduled calls. Required: ₹${totalRequiredBalance}`,
                    status: 400,
                    schedule_type: data.schedule_type,
                    call_required: minimumBalanceRequired,
                    scheduled_calls_hold: totalHoldAmount,
                    new_call_hold: newHoldAmount,
                    total_required: totalRequiredBalance,
                    current_balance: userWallet.amount,
                    hold_amount: userWallet.hold_amount || 0,
                    available_balance: availableBalance
                });
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
    
    // Calculate hold_amount for scheduled calls (estimate for Schedule type, actual for Instant)
    let holdAmount = 0;
    if (data.schedule_type === 'Schedule' && data.perminRate) {
        // For scheduled calls, estimate hold amount (30 minutes average)
        holdAmount = 30 * data.perminRate;
    } else if (data.schedule_type === 'Instant' && data.perminRate && data.Call_duration) {
        // For instant calls, use actual duration
        holdAmount = data.Call_duration * data.perminRate;
    } else if (data.perminRate && data.Call_duration) {
        // If Call_duration is provided, use it
        holdAmount = data.Call_duration * data.perminRate;
    }
    
    // Add hold_amount to user's wallet if not using package subscription
    if (holdAmount > 0 && !data.package_Subscription_id) {
        const userWallet = await Wallet.findOne({ user_id: { $in: [data.created_by] } });
        if (userWallet) {
            // Verify wallet has sufficient balance for hold_amount
            if (userWallet.amount < holdAmount) {
                return res.status(400).json({
                    message: `Insufficient wallet balance to hold amount. Current: ₹${userWallet.amount}, Required: ₹${holdAmount}`,
                    status: 400,
                    current_balance: userWallet.amount,
                    hold_amount_required: holdAmount
                });
            }
            
            // Deduct from amount and add to hold_amount (auto balance: amount decreases, hold_amount increases)
            await Wallet.findOneAndUpdate(
                { user_id: { $in: [data.created_by] } },
                {
                    $inc: { 
                        amount: -holdAmount,      // Deduct from available amount
                        hold_amount: holdAmount   // Add to hold_amount
                    },
                    updated_At: new Date(),
                    updated_by: req.user.user_id
                }
            );
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
        
        // Get existing schedule call to check previous values
        const existingSchedule = await ScheduleCall.findOne({ schedule_id });
        if (!existingSchedule) {
            return res.status(404).json({ message: 'Schedule call not found', status: 404 });
        }
        
        const data = req.body;
        data.updated_by = req.user.user_id;
        data.updated_at = new Date();
        
        // Calculate hold_amount if Call_duration and perminRate are provided
        let newHoldAmount = 0;
        if (data.Call_duration && data.perminRate) {
            newHoldAmount = data.Call_duration * data.perminRate;
        } else if (data.Call_duration && existingSchedule.perminRate) {
            newHoldAmount = data.Call_duration * existingSchedule.perminRate;
        } else if (existingSchedule.Call_duration && data.perminRate) {
            newHoldAmount = existingSchedule.Call_duration * data.perminRate;
        } else if (existingSchedule.Call_duration && existingSchedule.perminRate) {
            newHoldAmount = existingSchedule.Call_duration * existingSchedule.perminRate;
        }
        
        // Calculate previous hold amount
        let previousHoldAmount = 0;
        if (existingSchedule.Call_duration && existingSchedule.perminRate) {
            previousHoldAmount = existingSchedule.Call_duration * existingSchedule.perminRate;
        }
        
        // Update wallet hold_amount if not using package subscription
        if (!existingSchedule.package_Subscription_id && existingSchedule.created_by) {
            const userWallet = await Wallet.findOne({ user_id: { $in: [existingSchedule.created_by] } });
            if (userWallet) {
                const holdAmountDifference = newHoldAmount - previousHoldAmount;
                if (holdAmountDifference !== 0) {
                    // If difference is positive, deduct from amount and add to hold_amount
                    // If difference is negative, add back to amount and reduce hold_amount
                    await Wallet.findOneAndUpdate(
                        { user_id: { $in: [existingSchedule.created_by] } },
                        {
                            $inc: { 
                                amount: -holdAmountDifference,      // Adjust amount (decrease if positive diff, increase if negative)
                                hold_amount: holdAmountDifference   // Adjust hold_amount
                            },
                            updated_At: new Date(),
                            updated_by: req.user.user_id
                        }
                    );
                }
            }
        }
        
        // Release hold_amount if call is completed or cancelled
        if ((data.callStatus === 'Completed' || data.callStatus === 'Cancelled') && 
            previousHoldAmount > 0 && 
            !existingSchedule.package_Subscription_id && 
            existingSchedule.created_by) {
            const userWallet = await Wallet.findOne({ user_id: { $in: [existingSchedule.created_by] } });
            if (userWallet && userWallet.hold_amount >= previousHoldAmount) {
                // Release hold_amount: add back to amount, reduce hold_amount
                await Wallet.findOneAndUpdate(
                    { user_id: { $in: [existingSchedule.created_by] } },
                    {
                        $inc: { 
                            amount: previousHoldAmount,        // Add back to amount
                            hold_amount: -previousHoldAmount   // Reduce hold_amount
                        },
                        updated_At: new Date(),
                        updated_by: req.user.user_id
                    }
                );
            }
        }
        
        const schedule = await ScheduleCall.findOneAndUpdate(
            { schedule_id },
            data,
            { new: true, runValidators: true }
        );

        // Re-fetch with populated references
        const populated = await ScheduleCall.findOne({ schedule_id })
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
                path: 'package_Subscription_id',
                model: 'PackageSubscription',
                localField: 'package_Subscription_id',
                foreignField: 'PkSubscription_id',
                select: 'PkSubscription_id package_id Remaining_minute Remaining_Schedule Subscription_status Expire_status'
            });

        res.status(200).json({ message: 'Schedule call updated', schedule: populated, status: 200 });
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
        const availableCallStatuses = ['Pending', 'Accepted', 'Completed', 'Cancelled', 'Upcoming', 'Ongoing', 'Not Answered'];

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
        const availableCallStatuses = ['Pending', 'Accepted', 'Completed', 'Cancelled', 'Upcoming', 'Ongoing', 'Not Answered'];

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

// Get schedule calls by authenticated user (creator)
const getSchedulecallByuserAuth = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            callStatus,
            date_from,
            date_to,
            advisor_name,
            call_type,
            schedule_type,
            approval_status,
            status,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        const userId = req.user.user_id;
        const skip = (page - 1) * limit;

        // Build query - filter by authenticated user as creator
        const query = { created_by: userId };

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

        // Get schedules with filters and pagination
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

        // If name search is provided, filter by advisor names
        let filteredSchedules = schedules;
        if (search || advisor_name) {
            filteredSchedules = schedules.filter(schedule => {
                const advisor = schedule.advisor_id;

                let matchesSearch = true;
                let matchesAdvisorName = true;

                if (search) {
                    const searchLower = search.toLowerCase();
                    matchesSearch = (
                        (advisor && advisor.name && advisor.name.toLowerCase().includes(searchLower)) ||
                        (advisor && advisor.email && advisor.email.toLowerCase().includes(searchLower))
                    );
                }

                if (advisor_name) {
                    matchesAdvisorName = advisor && advisor.name &&
                        advisor.name.toLowerCase().includes(advisor_name.toLowerCase());
                }

                return matchesSearch && matchesAdvisorName;
            });
        }

        // Get available call statuses for filter options
        const availableCallStatuses = ['Pending', 'Accepted', 'Completed', 'Cancelled', 'Upcoming', 'Ongoing', 'Not Answered'];

        return res.status(200).json({
            success: true,
            message: 'Your schedule calls retrieved successfully',
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
        console.error('Get schedule calls by user auth error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            status: 500
        });
    }
};

// Get schedule calls by authenticated advisor
const getSchedulecallByAdvisorAuth = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            callStatus,
            date_from,
            date_to,
            creator_name,
            call_type,
            schedule_type,
            approval_status,
            status,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        const advisorId = req.user.user_id;
        const skip = (page - 1) * limit;

        // Build query - filter by authenticated advisor
        const query = { advisor_id: advisorId };

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

        // Get schedules with filters and pagination
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

        // If name search is provided, filter by creator names
        let filteredSchedules = schedules;
        if (search || creator_name) {
            filteredSchedules = schedules.filter(schedule => {
                const creator = schedule.created_by;

                let matchesSearch = true;
                let matchesCreatorName = true;

                if (search) {
                    const searchLower = search.toLowerCase();
                    matchesSearch = (
                        (creator && creator.name && creator.name.toLowerCase().includes(searchLower)) ||
                        (creator && creator.email && creator.email.toLowerCase().includes(searchLower))
                    );
                }

                if (creator_name) {
                    matchesCreatorName = creator && creator.name &&
                        creator.name.toLowerCase().includes(creator_name.toLowerCase());
                }

                return matchesSearch && matchesCreatorName;
            });
        }

        // Get available call statuses for filter options
        const availableCallStatuses = ['Pending', 'Accepted', 'Completed', 'Cancelled', 'Upcoming', 'Ongoing', 'Not Answered'];

        return res.status(200).json({
            success: true,
            message: 'Schedule calls for advisor retrieved successfully',
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
        console.error('Get schedule calls by advisor auth error:', error);
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

        // Get advisor details to get rate per minute based on call_type
        const advisor = await User.findOne({ user_id: scheduleCall.advisor_id });
        if (!advisor) {
            return res.status(404).json({
                message: 'Advisor not found',
                status: 404
            });
        }

        // Get rate per minute based on call type
        let pricePerMinute;
        if (scheduleCall.call_type === 'Chat') {
            pricePerMinute = advisor.chat_Rate;
        } else if (scheduleCall.call_type === 'Audio') {
            pricePerMinute = advisor.audio_Rate;
        } else if (scheduleCall.call_type === 'Video') {
            pricePerMinute = advisor.VideoCall_rate;
        } else {
            // Fallback to stored perminRate if available
            pricePerMinute = scheduleCall.perminRate;
        }

        // Use stored perminRate if available and advisor rates are not set
        if (!pricePerMinute && scheduleCall.perminRate) {
            pricePerMinute = scheduleCall.perminRate;
        }

        if (!pricePerMinute || pricePerMinute <= 0) {
            return res.status(400).json({
                message: 'Invalid rate per minute. Please set advisor rates or perminRate',
                status: 400
            });
        }

        // Get call type details for commission calculation (optional, for commission rates)
        const callType = await CallType.findOne({ 
            mode_name: scheduleCall.call_type 
        });

        // Check if Call_duration already exists in the schedule call
        let finalCallDuration = Call_duration;
        let durationInMinutes;



        // Calculate call amount based on duration
        console.log("print durationInMinutes", Call_duration);
        if (callType) {
            console.log("print callType.price_per_minute", callType.price_per_minute);
        }
        console.log("print pricePerMinute", pricePerMinute);

        // Calculate total amount using the price per minute
        const totalAmount = parseFloat(Call_duration) * pricePerMinute;
        console.log("print totalAmount", totalAmount);

        // Validate totalAmount
        if (isNaN(totalAmount) || totalAmount < 0) {
            return res.status(400).json({
                message: 'Invalid amount calculation',
                call_duration: Call_duration,
                price_per_minute: pricePerMinute,
                status: 400
            });
        }
        // Check if this is a package subscription call
        if (scheduleCall.package_Subscription_id && scheduleCall.package_Subscription_id > 0) {
            // For package subscription calls, only update specific fields without payment processing
            const updateData = {
                Call_duration: finalCallDuration || Call_duration,
                perminRate: pricePerMinute,
                Amount: totalAmount,
                summary_type: 'Succeeded',
                summary_status: 1,
                updated_by: userId,
                updated_at: new Date()
            };
            
            if (callStatus) {
                updateData.callStatus = callStatus;
            }
            
            const updatedScheduleCall = await ScheduleCall.findOneAndUpdate(
                { schedule_id },
                updateData,
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
            console.log("print callStatus", callStatus);
            
            // Calculate new hold_amount based on updated duration
            const newHoldAmount = (finalCallDuration || Call_duration) * pricePerMinute;
            const previousHoldAmount = scheduleCall.Call_duration && scheduleCall.perminRate 
                ? scheduleCall.Call_duration * scheduleCall.perminRate 
                : 0;
            
            // Update wallet hold_amount if not using package subscription
            if (!scheduleCall.package_Subscription_id && scheduleCall.created_by) {
                const userWallet = await Wallet.findOne({ user_id: { $in: [scheduleCall.created_by] } });
                if (userWallet) {
                    const holdAmountDifference = newHoldAmount - previousHoldAmount;
                    if (holdAmountDifference !== 0) {
                        await Wallet.findOneAndUpdate(
                            { user_id: { $in: [scheduleCall.created_by] } },
                            {
                                $inc: { hold_amount: holdAmountDifference },
                                updated_At: new Date(),
                                updated_by: userId
                            }
                        );
                    }
                }
            }
            
            // Release hold_amount if call is cancelled
            if (callStatus === 'Cancelled' && previousHoldAmount > 0 && !scheduleCall.package_Subscription_id && scheduleCall.created_by) {
                const userWallet = await Wallet.findOne({ user_id: { $in: [scheduleCall.created_by] } });
                if (userWallet && userWallet.hold_amount >= previousHoldAmount) {
                    // Release hold_amount: add back to amount, reduce hold_amount
                    await Wallet.findOneAndUpdate(
                        { user_id: { $in: [scheduleCall.created_by] } },
                        {
                            $inc: { 
                                amount: previousHoldAmount,        // Add back to amount
                                hold_amount: -previousHoldAmount   // Reduce hold_amount
                            },
                            updated_At: new Date(),
                            updated_by: userId
                        }
                    );
                }
            }
            
            // Update schedule call with duration and amount
            const updateData = {
                Call_duration: finalCallDuration || Call_duration,
                perminRate: pricePerMinute,
                Amount: totalAmount,
                updated_by: userId,
                updated_at: new Date()
            };
            
            if (callStatus) {
                updateData.callStatus = callStatus;
            }
            
            const updatedScheduleCall = await ScheduleCall.findOneAndUpdate(
                { schedule_id },
                updateData,
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
            // Use callType commission rates if available, otherwise use default (80% advisor, 20% admin)
            const advisorCommissionRate = callType?.adviser_commission || 80;
            const adminCommissionRate = callType?.admin_commission || 20;
            const advisorCommission = (totalAmount * advisorCommissionRate) / 100;
            const adminCommission = (totalAmount * adminCommissionRate) / 100;

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

            // Calculate hold_amount that was previously held
            const previousHoldAmount = scheduleCall.Call_duration && scheduleCall.perminRate 
                ? scheduleCall.Call_duration * scheduleCall.perminRate 
                : 0;
            
            // Check if wallet has sufficient balance (amount + hold_amount should cover totalAmount)
            // Since hold_amount was deducted from amount, we need: amount + hold_amount >= totalAmount
            const totalAvailable = userWallet.amount + (userWallet.hold_amount || 0);
            
            if (totalAvailable < totalAmount) {
                return res.status(400).json({
                    message: 'Insufficient wallet balance',
                    status: 400,
                    current_balance: userWallet.amount,
                    hold_amount: userWallet.hold_amount || 0,
                    total_available: totalAvailable,
                    required_amount: totalAmount
                });
            }

            // Release hold_amount if it exists (add back to amount, reduce hold_amount)
            if (previousHoldAmount > 0 && userWallet.hold_amount >= previousHoldAmount) {
                await Wallet.findOneAndUpdate(
                    { user_id: { $in: [scheduleCall.created_by] } },
                    {
                        $inc: { 
                            amount: previousHoldAmount,        // Add back to amount
                            hold_amount: -previousHoldAmount   // Reduce hold_amount
                        },
                        updated_At: new Date(),
                        updated_by: userId
                    }
                );
            }
            
            // Calculate amount to deduct (if hold_amount was less than totalAmount)
            let amountToDeduct = totalAmount;
            if (previousHoldAmount > 0 && previousHoldAmount < totalAmount) {
                amountToDeduct = totalAmount - previousHoldAmount;
            } else if (previousHoldAmount >= totalAmount) {
                amountToDeduct = 0; // Already deducted via hold_amount when created
            }

            // Update user wallet (deduct call amount after releasing hold)
            if (amountToDeduct > 0) {
                await Wallet.findOneAndUpdate(
                    { user_id: { $in: [scheduleCall.created_by] } },
                    {
                        $inc: { amount: -amountToDeduct },
                        updated_At: new Date(),
                        updated_by: userId
                    }
                );
            }

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
    getSchedulecallByuserAuth,
    getSchedulecallByAdvisorAuth,
    endCall
}; 