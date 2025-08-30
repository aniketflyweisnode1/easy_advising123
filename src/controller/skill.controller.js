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
    const skills = await Skill.find();
    return res.status(200).json({ skills, status: 200 });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
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