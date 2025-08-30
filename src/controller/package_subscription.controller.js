const PackageSubscription = require('../models/package_subscription.model.js');

// create by data 2024-07-14
const createPackageSubscription = async (req, res) => {
    try {
        const data = req.body;
        data.created_by = req.user.user_id;
        const subscription = new PackageSubscription(data);
        await subscription.save();
        res.status(201).json({ message: 'Package subscription created', subscription, status: 201 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// create by data 2024-07-14
const updatePackageSubscription = async (req, res) => {
    try {
        const { PkSubscription_id } = req.body;
        if (!PkSubscription_id) {
            return res.status(400).json({ message: 'PkSubscription_id is required in body', status: 400 });
        }
        const data = req.body;
        data.updated_by = req.user.user_id;
        data.updated_at = new Date();
        const subscription = await PackageSubscription.findOneAndUpdate(
            { PkSubscription_id },
            data,
            { new: true, runValidators: true }
        );
        if (!subscription) {
            return res.status(404).json({ message: 'Package subscription not found', status: 404 });
        }
        res.status(200).json({ message: 'Package subscription updated', subscription, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// create by data 2024-07-14
const getPackageSubscriptionById = async (req, res) => {
    try {
        const { PkSubscription_id } = req.params;
        const subscription = await PackageSubscription.findOne({ PkSubscription_id });
        if (!subscription) {
            return res.status(404).json({ message: 'Package subscription not found', status: 404 });
        }
        res.status(200).json({ subscription, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// create by data 2024-07-14
const getPackageSubscriptionsBySubscribeBy = async (req, res) => {
    try {
        const { subscribe_by } = req.params;
        const subscriptions = await PackageSubscription.find({ subscribe_by: Number(subscribe_by) });
        res.status(200).json({ subscriptions, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// create by data 2024-07-14
const getPackageSubscriptionsByPackageId = async (req, res) => {
    try {
        const { package_id } = req.params;
        const subscriptions = await PackageSubscription.find({ package_id: Number(package_id) });
        res.status(200).json({ subscriptions, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// create by data 2024-07-14
const getAllPackageSubscriptions = async (req, res) => {
    try {
        const subscriptions = await PackageSubscription.find();
        res.status(200).json({ subscriptions, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// create by data 2024-07-14
const getAllActivedPackageSubscriptions = async (req, res) => {
    try {
        const subscriptions = await PackageSubscription.find({ status: 'Actived' });
        res.status(200).json({ subscriptions, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

module.exports = {
    createPackageSubscription,
    updatePackageSubscription,
    getPackageSubscriptionById,
    getPackageSubscriptionsBySubscribeBy,
    getPackageSubscriptionsByPackageId,
    getAllPackageSubscriptions,
    getAllActivedPackageSubscriptions
}; 