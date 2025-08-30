const Goal = require('../models/goal.model.js');


const createGoal = async (req, res) => {
    try {
        if (req.user && req.user.user_id) {
            req.body.created_By = req.user.user_id;
        }
        const goal = new Goal(req.body);
        await goal.save();
        return res.status(201).json({ message: 'Goal created', goal, status: 201 });
    } catch (error) {
        return res.status(500).json({ message: error.message || error, status: 500 });
    }
};


const getGoalById = async (req, res) => {
    try {
        const { id } = req.params;
        const goal = await Goal.findOne({goal_id: id});
        if (!goal) {
            return res.status(404).json({ message: 'Goal not found', status: 404 });
        }
        return res.status(200).json({ goal, status: 200 });
    } catch (error) {
        return res.status(500).json({ message: error.message || error, status: 500 });
    }
};

const getAllGoals = async (req, res) => {
    try {
        const goals = await Goal.find();
        return res.status(200).json({ goals, status: 200 });
    } catch (error) {
        return res.status(500).json({ message: error.message || error, status: 500 });
    }
};


const updateGoal = async (req, res) => {
    try {

        req.body.Updated_At = new Date();
        const { goal_id } = req.body;
        if (req.user && req.user.user_id) {
            req.body.Updated_By = req.user.user_id;
        }
        const goal = await Goal.findOneAndUpdate({goal_id: goal_id}, req.body, { new: true });
        if (!goal) {
            return res.status(404).json({ message: 'Goal not found', status: 404 });
        }
        return res.status(200).json({ message: 'Goal updated', goal, status: 200 });
    } catch (error) {
        return res.status(500).json({ message: error.message || error, status: 500 });
    }
};


const getMyGoals = async (req, res) => {
    try {
        const user_id = req.user && req.user.user_id;
        if (!user_id) {
            return res.status(401).json({ message: 'Unauthorized: No user ID in token', status: 401 });
        }
        const goals = await Goal.find({ created_By: user_id });
        return res.status(200).json({ goals, status: 200 });
    } catch (error) {
        return res.status(500).json({ message: error.message || error, status: 500 });
    }
};

module.exports = { createGoal, getGoalById, getAllGoals, updateGoal, getMyGoals }; 