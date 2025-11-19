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

        const calls = await ScheduleCall.find({ advisor_id: user_id });
        const total_earning = formatAmount(calls.reduce((sum, c) => sum + (c.Amount || 0), 0));

        const Withdraw_history = withdrawRequests.map(request => ({
            request_id: request.request_id,
            amount: formatAmount(request.amount),
            last_status: request.last_status,
            transaction_id: request.transaction_id || null,
            created_at: request.created_at,
            updated_at: request.updated_at
        }));

        const Trangection_history = calls
            .filter(c => c.Amount > 0)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(call => ({
                schedule_id: call.schedule_id,
                amount: formatAmount(call.Amount),
                call_type: call.call_type,
                callStatus: call.callStatus,
                date: call.date,
                time: call.time
            }));

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