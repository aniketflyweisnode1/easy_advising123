const Skill = require('../models/skill.model');
const User = require('../models/User.model');

// Create skill
const createSkill = async (req, res) => {
  try {
    const data = req.body;
    if (req.user && req.user.user_id) {
      data.created_by = req.user.user_id;
    }
    const skill = new Skill(data);
    await skill.save();
    return res.status(201).json({ message: 'Skill created', skill, status: 201 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Update skill
const updateSkill = async (req, res) => {
  try {
    const { skill_id, ...updateData } = req.body;
    if (req.user && req.user.user_id) {
      updateData.updated_by = req.user.user_id;
      updateData.updated_at = new Date();
    }
    const skill = await Skill.findOneAndUpdate({ skill_id }, updateData, { new: true });
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found', status: 404 });
    }
    return res.status(200).json({ message: 'Skill updated', skill, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Get skill by ID
const getSkillById = async (req, res) => {
  try {
    const { skill_id } = req.params;
    const skill = await Skill.findOne({ skill_id });
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found', status: 404 });
    }
    return res.status(200).json({ skill, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Get all skills
const getAllSkills = async (req, res) => {
  try {
    const { 
      search, 
      status,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Add search functionality
    if (search) {
      query.$or = [
        { skill_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
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

    // Get skills with pagination and filters
    const skills = await Skill.find(query)
      .sort(sortObj);

    // Get skills with adviser counts
    const skillsWithCounts = await Promise.all(
      skills.map(async (skill) => {
        // Count advisers with this skill
        const adviserCount = await User.countDocuments({
          role_id: 2, // Adviser role
          skill: { $in: [skill.skill_id] }
        });

        // Get active adviser count
        const activeAdviserCount = await User.countDocuments({
          role_id: 2, // Adviser role
          skill: { $in: [skill.skill_id] },
          status: 1 // Active status
        });

        // Get inactive adviser count
        const inactiveAdviserCount = await User.countDocuments({
          role_id: 2, // Adviser role
          skill: { $in: [skill.skill_id] },
          status: 0 // Inactive status
        });

        return {
          ...skill.toObject(),
          adviser_count: adviserCount,
          active_adviser_count: activeAdviserCount,
          inactive_adviser_count: inactiveAdviserCount
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Skills retrieved successfully',
      data: {
        skills: skillsWithCounts
      },
      status: 200
    });
  } catch (error) {
    console.error('Error getting all skills:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      status: 500
    });
  }
};

// Get advisers by skill
const getAdviserBySkill = async (req, res) => {
  try {
    const { skill_id } = req.params;
    const advisers = await User.find({ role_id: 2, skill: Number(skill_id) });
    return res.status(200).json({ advisers, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

module.exports = { createSkill, updateSkill, getSkillById, getAllSkills, getAdviserBySkill }; 