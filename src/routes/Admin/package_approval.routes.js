const express = require('express');
const router = express.Router();
const {
  getAllPackageApprovals,
  approvePackage,
  deletePackageApproval
} = require('../../controller/package_approval.controller');
const { auth } = require('../../middleware/authMiddleware');


// Get all package approvals (Admin view)
router.get('/getAll', auth, getAllPackageApprovals);

// Approve/Reject package (Admin only)
router.put('/approve', auth, approvePackage);

// Delete package approval
router.delete('/delete/:package_id', auth, deletePackageApproval);

module.exports = router;

