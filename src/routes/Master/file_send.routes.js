const express = require('express');
const router = express.Router();
const { auth } = require('../../utils/jwtUtils');
const {
    createFileSend,
    updateFileSend,
    getFileSendById,
    getAllFileSends,
    deleteFileSend,
    getFileSendByAuth,
    getFileSendByScheduleCallId
} = require('../../controller/file_send.controller');

router.post('/create', auth, createFileSend);
router.put('/update', auth, updateFileSend);
router.get('/getById/:file_Send_id', auth, getFileSendById);
router.get('/getAll', getAllFileSends);
router.delete('/delete/:file_Send_id', auth, deleteFileSend);
router.get('/getByAuth', auth, getFileSendByAuth);
router.get('/getByScheduleCall/:schedule_call_id', auth, getFileSendByScheduleCallId);

module.exports = router;

