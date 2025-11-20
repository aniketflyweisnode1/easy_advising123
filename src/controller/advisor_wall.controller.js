const Wallet = require('../models/wallet.model');
const WithdrawRequest = require('../models/withdraw_request.model');
const WithdrawMethod = require('../models/withdraw_method.model');
const Transaction = require('../models/transaction.model');
const ScheduleCall = require('../models/schedule_call.model');
const CallType = require('../models/call_type.model');

const advisorWallet = async (req, res) => {
    try {
        const user_id = req.user.user_id;

        const formatAmount = (value) => Number((Number(value) || 0).toFixed(2));

        const wallet = await Wallet.findOne({ user_id: { $in: [user_id] } });
        const wallet_amount = formatAmount(wallet ? wallet.amount : 0);
        const wallet_hold_amount = formatAmount(wallet ? wallet.hold_amount : 0);

        const withdrawRequests = await WithdrawRequest.find({ user_id }).sort({ created_at: -1 });
        const methodIds = [...new Set(withdrawRequests.map(req => req.method_id).filter(Boolean))];
        let methodMap = {};
        if (methodIds.length > 0) {
            const methods = await WithdrawMethod.find(
                { method_id: { $in: methodIds } },
                { method_id: 1, method_name: 1, status: 1 }
            );
            methods.forEach(method => {
                methodMap[method.method_id] = {
                    method_id: method.method_id,
                    method_name: method.method_name,
                    status: method.status
                };
            });
        }
        const pendingWithdraws = withdrawRequests.filter(w => w.last_status === 'Pending');
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
        const callTypes = await CallType.find({ adviser_id: user_id });
        const adminCommissionMap = {};
        callTypes.forEach(type => {
            adminCommissionMap[(type.mode_name || '').toLowerCase()] = Number(type.admin_commission) || 0;
        });

        const defaultAdminCommission = 30;

        const total_earning = formatAmount(
            calls.reduce((sum, c) => {
                if ((c.callStatus || '').toLowerCase() === 'completed') {
                    const amount = Number(c.Amount) || 0;
                    const adminRate = adminCommissionMap[(c.call_type || '').toLowerCase()] ?? defaultAdminCommission;
                    const adminCut = amount * (adminRate / 100);
                    const advisorShare = amount - adminCut;
                    return sum + advisorShare;
                }
                return sum;
            }, 0)
        );

        const Withdraw_history = withdrawRequests.map(request => ({
            request_id: request.request_id,
            amount: formatAmount(request.amount),
            last_status: request.last_status,
            transaction_id: request.transaction_id || null,
            method: methodMap[request.method_id] || null,
            created_at: request.created_at,
            updated_at: request.updated_at
        }));

        const Trangection_history = calls
            .filter(call => (call.callStatus || '').toLowerCase() !== 'pending')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(call => {
                const scheduleObj = call.toObject ? call.toObject() : call;
                const creator = scheduleObj.created_by && typeof scheduleObj.created_by === 'object'
                    ? scheduleObj.created_by
                    : null;
                const rawAmount = Number(scheduleObj.Amount) || 0;
                const adminRate = adminCommissionMap[(scheduleObj.call_type || '').toLowerCase()] ?? defaultAdminCommission;
                const adminCut = rawAmount * (adminRate / 100);
                const advisorShare = rawAmount - adminCut;
                return {
                    schedule_id: scheduleObj.schedule_id,
                    amount: formatAmount(advisorShare),
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
                wallet_hold_amount,
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