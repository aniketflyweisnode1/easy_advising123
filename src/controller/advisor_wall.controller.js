const Wallet = require('../models/wallet.model');
const WithdrawRequest = require('../models/withdraw_request.model');
const Transaction = require('../models/transaction.model');
const ScheduleCall = require('../models/schedule_call.model');

const advisorWallet = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        // Current balance
        const wallet = await Wallet.findOne({ user_id });
        const current_balance = wallet ? wallet.amount : 0;

        // Pending withdraw requests
        const pending_withdraws = await WithdrawRequest.find({ user_id, last_status: 'Panding' });
        const pending_withdraw_amount = pending_withdraws.reduce((sum, w) => sum + (w.amount || 0), 0);

        // Total withdraw amount (all successful/approved/released)
        const completed_withdraws = await WithdrawRequest.find({ user_id, last_status: { $in: ["Release", "Approved", "Success"] } });
        const total_withdraw_amount = completed_withdraws.reduce((sum, w) => sum + (w.amount || 0), 0);

        // Total earning (sum of all ScheduleCall.Amount for this advisor)
        const calls = await ScheduleCall.find({ advisor_id: user_id });
        const total_earning = calls.reduce((sum, c) => sum + (c.Amount || 0), 0);

        // Withdraw transactions
        const withdraw_transactions = await Transaction.find({ user_id, transactionType: 'withdraw' }).sort({ transaction_date: -1 });

        // Earning transactions (from ScheduleCall, not Transaction table)
        const earning_transactions = calls.filter(c => c.Amount > 0).map(c => ({
            schedule_id: c.schedule_id,
            amount: c.Amount,
            call_type: c.call_type,
            date: c.date,
            time: c.time
        }));

        res.status(200).json({
            current_balance,
            pending_withdraw_amount,
            total_withdraw_amount,
            total_earning,
            withdraw_transactions,
            earning_transactions,
            status: 200
        });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

module.exports = { advisorWallet }; 