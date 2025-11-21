const cron = require('node-cron');
const moment = require('moment');
const ScheduleCall = require('../models/schedule_call.model');
const ReasonSummary = require('../models/reason_summary.model');
const { generateAgoraToken, generateAgoraChannelName } = require('./AgoraToken');

const SCHEDULE_CALL_STATUSES_FOR_CANCELLATION = ['Pending', 'Upcoming'];
const SCHEDULE_CALL_STATUSES_FOR_REFRESH = ['Pending', 'Upcoming'];

const parseScheduleDateTime = (scheduleCall) => {
    if (!scheduleCall?.date) {
        return null;
    }

    const datePart = moment(scheduleCall.date).format('YYYY-MM-DD');
    const timePart = (scheduleCall.time || '00:00').trim();
    const formats = [
        'YYYY-MM-DD HH:mm',
        'YYYY-MM-DD H:mm',
        'YYYY-MM-DD hh:mm A',
        'YYYY-MM-DD h:mm A',
        'YYYY-MM-DD HH:mm:ss',
        'YYYY-MM-DD hh:mm:ss A'
    ];

    const combined = `${datePart} ${timePart}`;

    const parsed = moment(combined, formats, true);
    if (parsed.isValid()) {
        return parsed;
    }

    // Fallback to using the stored date directly
    return moment(scheduleCall.date);
};

const cancelUnjoinedScheduleCalls = async () => {
    const now = moment();

    try {
        const candidateCalls = await ScheduleCall.find({
            schedule_type: 'Schedule',
            JoinStatus: false,
            callStatus: 'Pending',
        }).lean();

        for (const schedule of candidateCalls) {
            const scheduledMoment = parseScheduleDateTime(schedule);

            if (!scheduledMoment || now.diff(scheduledMoment, 'minutes') < 15) {
                continue;
            }

            await ScheduleCall.findOneAndUpdate(
                { schedule_id: schedule.schedule_id },
                {
                    callStatus: 'Not Answered',
                    summary_status: 1,
                    summary_type: 'Reason',
                    updated_by: 0,
                    updated_at: new Date()
                }
            );

            const existingReason = await ReasonSummary.findOne({
                schedule_call_id: schedule.schedule_id
            }).lean();

            if (!existingReason) {
                await ReasonSummary.create({
                    schedule_call_id: schedule.schedule_id,
                    adviser_name_id: schedule.advisor_id,
                    user_name_id: schedule.created_by,
                    category_id: schedule.category_id || null,
                    subCategory_id: schedule.subCategory_id || null,
                    date: schedule.date,
                    time: schedule.time,
                    summary: 'Not answered',
                    summary_type: 'Reason',
                    status: 1,
                    created_by: schedule.created_by,
                    created_at: new Date()
                });
            }
        }
    } catch (error) {
        console.error('Cron job error (auto-cancel schedule calls):', error);
    }
};

const refreshAgoraCredentialsForUpcomingCalls = async () => {
    const now = moment();

    try {
        const candidateCalls = await ScheduleCall.find({
            schedule_type: 'Schedule',
            JoinStatus: false,
            tokenRefreshed: { $ne: true },
            callStatus: { $in: SCHEDULE_CALL_STATUSES_FOR_REFRESH }
        }).lean();

        for (const schedule of candidateCalls) {
            const scheduledMoment = parseScheduleDateTime(schedule);

            if (!scheduledMoment) {
                continue;
            }

            const minutesUntilStart = scheduledMoment.diff(now, 'minutes');

            if (minutesUntilStart > 5 || minutesUntilStart < 0) {
                continue;
            }

            const channelName = generateAgoraChannelName(
                schedule.schedule_id,
                schedule.advisor_id,
                schedule.created_by
            );

            const { userToken, advisorToken } = generateAgoraToken(
                channelName,
                schedule.created_by,
                schedule.advisor_id
            );

            await ScheduleCall.findOneAndUpdate(
                { schedule_id: schedule.schedule_id },
                {
                    agoraChannelName: channelName,
                    userAgoraToken: userToken,
                    advisorAgoraToken: advisorToken,
                    tokenRefreshed: true,
                    updated_at: new Date()
                }
            );
        }
    } catch (error) {
        console.error('Cron job error (refresh Agora credentials):', error);
    }
};

const registerCronJobs = () => {
    cron.schedule('* * * * *', cancelUnjoinedScheduleCalls);
    cron.schedule('* * * * *', refreshAgoraCredentialsForUpcomingCalls);
};
module.exports = registerCronJobs;

