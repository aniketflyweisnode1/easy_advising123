const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const fileSendSchema = new mongoose.Schema({
    file_Send_id: {
        type: Number,
        unique: true
    },
    user_to: {
        type: Number,
        ref: 'User',
        required: true
    },
    user_from: {
        type: Number,
        ref: 'User',
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    schedule_call_id: {
        type: Number,
        ref: 'ScheduleCall'
    },
    status: {
        type: Boolean,
        default: true
    },
    created_by: {
        type: Number,
        ref: 'User',
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_by: {
        type: Number,
        ref: 'User'
    },
    updated_at: {
        type: Date
    }
}, {
    timestamps: false
});

fileSendSchema.plugin(AutoIncrement, {
    inc_field: 'file_Send_id',
    start_seq: 1
});

fileSendSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});

fileSendSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
});

module.exports = mongoose.model('FileSend', fileSendSchema);

