const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/authMiddleware');
const { createSkill, updateSkill, getSkillById, getAllSkills, getAdviserBySkill } = require('../../controller/skill.controller');

// Create skill 2025-07-15
router.post('/create', auth, createSkill);
// Update skill 2025-07-15
router.put('/update', auth, updateSkill);
// Get skill by ID 2025-07-15
router.get('/getById/:skill_id', getSkillById);
// Get all skills 2025-07-15
router.get('/getAll', getAllSkills);
// Get advisers by skill 2025-07-15
router.get('/getAdviserBySkill/:skill_id', auth, getAdviserBySkill);

module.exports = router; 