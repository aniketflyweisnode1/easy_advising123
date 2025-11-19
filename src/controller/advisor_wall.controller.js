const Wallet = require('../models/wallet.model');
const WithdrawRequest = require('../models/withdraw_request.model');
const Transaction = require('../models/transaction.model');
const ScheduleCall = require('../models/schedule_call.model');

const advisorWallet = async (req, res) => {
    try {
        const user_id = req.user.user_id;

        const formatAmount = (value) => Number((Number(value) || 0).toFixed(2));

        const wallet = await Wallet.findOne({ user_id });
        const wallet_amount = formatAmount(wallet ? wallet.amount : 0);

        const withdrawRequests = await WithdrawRequest.find({ user_id }).sort({ created_at: -1 });
        const pendingWithdraws = withdrawRequests.filter(w => w.last_status === 'Panding');
        const completedWithdraws = withdrawRequests.filter(w => ["Release", "Approved", "Success"].includes(w.last_status));

        const pending_withdraw_amount = formatAmount(pendingWithdraws.reduce((sum, w) => sum + (w.amount || 0), 0));
        const withdraw_amount = formatAmount(completedWithdraws.reduce((sum, w) => sum + (w.amount || 0), 0));

        const calls = await ScheduleCall.find({ advisor_id: user_id })
            .populate({
                path: 'created_by',
                model: 'User',
                localField: 'created_by',
                foreignField: 'user_id',
                select: 'user_id name email mobile role_id profile_image'
            })
            .populate({
                path: 'advisor_id',
                model: 'User',
                localField: 'advisor_id',
                foreignField: 'user_id',
                select: 'user_id name email mobile role_id profile_image'
            });
        const total_earning = formatAmount(
            calls.reduce((sum, c) => {
                if ((c.callStatus || '').toLowerCase() === 'completed') {
                    return sum + (c.Amount || 0);
                }
                return sum;
            }, 0)
        );

        const Withdraw_history = withdrawRequests.map(request => ({
            request_id: request.request_id,
            amount: formatAmount(request.amount),
            last_status: request.last_status,
            transaction_id: request.transaction_id || null,
            created_at: request.created_at,
            updated_at: request.updated_at
        }));

        const Trangection_history = calls
            .filter(call => (call.callStatus || '').toLowerCase() !== 'Pending')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(call => {
                const scheduleObj = call.toObject ? call.toObject() : call;
                const creator = scheduleObj.created_by && typeof scheduleObj.created_by === 'object'
                    ? scheduleObj.created_by
                    : null;
                return {
                    schedule_id: scheduleObj.schedule_id,
                    amount: formatAmount(scheduleObj.Amount),
                    duration: scheduleObj.Call_duration,
                    call_type: scheduleObj.call_type,
                    callStatus: scheduleObj.callStatus,
                    date: scheduleObj.date,
                    time: scheduleObj.time,
                    caller: creator ? {
                        user_id: creator.user_id,
                        name: creator.name,
                        email: creator.email,
                        mobile: creator.mobile,
                        role_id: creator.role_id,
                        profile_image: creator.profile_image || null
                    } : null
                };
            });

        return res.status(200).json({
            success: true,
            message: 'Advisor wallet summary retrieved successfully',
            data: {
                total_earning,
                withdraw_amount,
                wallet_amount,
                pending_withdraw_amount,
                Withdraw_history,
                Trangection_history
            },
            status: 200
        });
    } catch (error) {
        console.error('Advisor wallet error:', error);
        return res.status(500).json({ message: error.message || error, status: 500 });
    }
};

module.exports = { advisorWallet }; 