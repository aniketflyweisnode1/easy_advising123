const PackageSubscription = require('../models/package_subscription.model.js');
const AdvisorPackage = require('../models/Advisor_Package.model.js');

// create by data 2024-07-14
const createPackageSubscription = async (req, res) => {
    try {
        const data = req.body;
        data.created_by = req.user.user_id;
        
        // Validate required fields
        if (!data.package_id) {
            return res.status(400).json({ 
                message: 'package_id is required', 
                status: 400 
            });
        }
        
        // Get advisor package details to set remaining values
        const packageDetails = await AdvisorPackage.findOne({ Advisor_Package_id: data.package_id });
        
        if (!packageDetails) {
            return res.status(404).json({ 
                message: 'Advisor package not found', 
                status: 404 
            });
        }
        
        // Set remaining values from advisor package (use Basic package as default)
        data.Remaining_minute = packageDetails.Basic_minute || 0;
        data.Remaining_Schedule = packageDetails.Basic_Schedule || 0;
        
        // Set default Subscription_status if not provided
        if (!data.Subscription_status) {
            data.Subscription_status = 'Panding';
        }
        
        // Validate Subscription_status enum values
        const validStatuses = ['Actived', 'Expired', 'Panding'];
        if (!validStatuses.includes(data.Subscription_status)) {
            return res.status(400).json({ 
                message: `Invalid Subscription_status. Must be one of: ${validStatuses.join(', ')}`, 
                status: 400 
            });
        }
        
        const subscription = new PackageSubscription(data);
        await subscription.save();
        
        res.status(201).json({ 
            message: 'Advisor package subscription created', 
            subscription, 
            package_details: {
                Advisor_Package_id: packageDetails.Advisor_Package_id,
                advisor_id: packageDetails.advisor_id,
                Basic_packege_name: packageDetails.Basic_packege_name,
                Basic_minute: packageDetails.Basic_minute,
                Basic_Schedule: packageDetails.Basic_Schedule,
                Basic_price: packageDetails.Basic_price,
                Economy_packege_name: packageDetails.Economy_packege_name,
                Economy_minute: packageDetails.Economy_minute,
                Economy_Schedule: packageDetails.Economy_Schedule,
                Economy_price: packageDetails.Economy_price,
                Pro_packege_name: packageDetails.Pro_packege_name,
                Pro_minute: packageDetails.Pro_minute,
                Pro_Schedule: packageDetails.Pro_Schedule,
                Pro_price: packageDetails.Pro_price
            },
            status: 201 
        });
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
        const subscriptions = await PackageSubscription.find({ Subscription_status: 'Actived' });
        res.status(200).json({ subscriptions, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Update subscription status specifically
const updateSubscriptionStatus = async (req, res) => {
    try {
        const { PkSubscription_id, Subscription_status } = req.body;
        
        if (!PkSubscription_id) {
            return res.status(400).json({ message: 'PkSubscription_id is required', status: 400 });
        }
        
        if (!Subscription_status) {
            return res.status(400).json({ message: 'Subscription_status is required', status: 400 });
        }
        
        // Validate Subscription_status enum values
        const validStatuses = ['Actived', 'Expired', 'Panding', 'InActive'];
        if (!validStatuses.includes(Subscription_status)) {
            return res.status(400).json({ 
                message: `Invalid Subscription_status. Must be one of: ${validStatuses.join(', ')}`, 
                status: 400 
            });
        }
        
        // Update subscription status
        const subscription = await PackageSubscription.findOneAndUpdate(
            { PkSubscription_id },
            { 
                Subscription_status,
                updated_by: req.user.user_id,
                updated_at: new Date()
            },
            { new: true, runValidators: true }
        );
        
        if (!subscription) {
            return res.status(404).json({ message: 'Package subscription not found', status: 404 });
        }
        
        res.status(200).json({ 
            message: 'Subscription status updated successfully', 
            subscription, 
            status: 200 
        });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Get subscriptions by status
const getSubscriptionsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        
        // Validate status parameter
        const validStatuses = ['Actived', 'Expired', 'Panding', 'InActive'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 
                status: 400 
            });
        }
        
        const subscriptions = await PackageSubscription.find({ Subscription_status: status });
        res.status(200).json({ 
            subscriptions, 
            count: subscriptions.length,
            status: 200 
        });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

// Get subscription with advisor package details
const getSubscriptionWithPackageDetails = async (req, res) => {
    try {
        const { PkSubscription_id } = req.params;
        
        const subscription = await PackageSubscription.findOne({ PkSubscription_id });
        if (!subscription) {
            return res.status(404).json({ 
                message: 'Package subscription not found', 
                status: 404 
            });
        }
        
        // Get advisor package details
        const packageDetails = await AdvisorPackage.findOne({ 
            Advisor_Package_id: subscription.package_id 
        });
        
        if (!packageDetails) {
            return res.status(404).json({ 
                message: 'Advisor package not found', 
                status: 404 
            });
        }
        
        res.status(200).json({ 
            subscription,
            package_details: {
                Advisor_Package_id: packageDetails.Advisor_Package_id,
                advisor_id: packageDetails.advisor_id,
                Basic_packege_name: packageDetails.Basic_packege_name,
                Basic_minute: packageDetails.Basic_minute,
                Basic_Schedule: packageDetails.Basic_Schedule,
                Basic_discription: packageDetails.Basic_discription,
                Basic_price: packageDetails.Basic_price,
                Basic_packageExpriyDays: packageDetails.Basic_packageExpriyDays,
                Economy_packege_name: packageDetails.Economy_packege_name,
                Economy_minute: packageDetails.Economy_minute,
                Economy_Schedule: packageDetails.Economy_Schedule,
                Economy_discription: packageDetails.Economy_discription,
                Economy_price: packageDetails.Economy_price,
                Economy_packageExpriyDays: packageDetails.Economy_packageExpriyDays,
                Pro_packege_name: packageDetails.Pro_packege_name,
                Pro_minute: packageDetails.Pro_minute,
                Pro_Schedule: packageDetails.Pro_Schedule,
                Pro_discription: packageDetails.Pro_discription,
                Pro_price: packageDetails.Pro_price,
                Pro_packageExpriyDays: packageDetails.Pro_packageExpriyDays,
                status: packageDetails.status,
                approve_status: packageDetails.approve_status
            },
            status: 200 
        });
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
    getAllActivedPackageSubscriptions,
    updateSubscriptionStatus,
    getSubscriptionsByStatus,
    getSubscriptionWithPackageDetails
}; 