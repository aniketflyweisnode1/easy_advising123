const User = require('../models/User.model.js');
const PackageSubscription = require('../models/package_subscription.model.js');
const Transaction = require('../models/transaction.model.js');
const Package = require('../models/package.model.js');
const Wallet = require('../models/wallet.model.js');
const CallType = require('../models/call_type.model.js');

const registerUser = async (req, res) => {
  try {
    const {
      name,
      mobile,
      email,
      password,
      AgreeTermsCondition,
      role_id,
      gender,
      DOB,
      address,
      pincode,
      language,
      rating,
      experience_year,
      skill,
      description_Bio,
      state,
      city,
      IntroductionVideo,
      Current_Designation,
      Current_Designation_Name,
      Current_Company_Name,
      current_company_name,
      expertise_offer,
      Category,
      Subcategory,
      chat_Rate,
      audio_Rate,
      VideoCall_rate,
      package_id,
      firebase_token ,
      supporting_Document,
      social_linkdin_link,
      social_instagorm_link,
      social_twitter_link,
      social_facebook_link,
      choose_slot,
      choose_day,
      instant_call,
      applyslots_remainingDays
    } = req.body;
// console.log( choose_slot,choose_day)
    if (!name || !mobile) {
      return res.status(400).json({ success: false, message: 'name and mobile are required.' });
    }
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already registered.' });
    }
    // Create user with all fields from the model
    const newUser = new User({
      name,
      mobile,
      email,
      password,
      AgreeTermsCondition,
      role_id,
      gender,
      DOB,
      address,
      pincode,
      language,
      rating,
      experience_year,
      skill,
      description_Bio,
      state,
      city,
      IntroductionVideo,
      Current_Designation,
      Current_Designation_Name,
      Current_Company_Name,
      current_company_name,
      expertise_offer,
      Category,
      Subcategory,
      chat_Rate,
      audio_Rate,
      VideoCall_rate,
      package_id,
      supporting_Document,
      social_linkdin_link,
      social_instagorm_link,
      social_twitter_link,
      social_facebook_link,
      choose_slot,
      choose_day,
      firebase_token,
      instant_call,
      applyslots_remainingDays
    });
    await newUser.save();

    // Create wallet for the new user with balance = 0
    await Wallet.create({
      user_id: [newUser.user_id],
      role_id: newUser.role_id, // Default role_id if not provided (assuming 3 is user role)
      amount: 0,
      status: 1,
      created_At: new Date(),
      updated_At: new Date()
    });

    // If package_id is set, create a PackageSubscription entry for this user
    if (package_id) {
      await PackageSubscription.create({
        package_id,
        subscribe_by: newUser.user_id,
        status: 'Actived',
        created_by: newUser.user_id
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: newUser
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.user.user_id })
      .populate({ path: 'language', model: 'Language', localField: 'language', foreignField: 'language_id', select: 'language_id name' })
      .populate({ path: 'skill', model: 'Skill', localField: 'skill', foreignField: 'skill_id', select: 'skill_id skill_name' })
      .populate({ path: 'state', model: 'State', localField: 'state', foreignField: 'state_id', select: 'state_id state_name' })
      .populate({ path: 'city', model: 'City', localField: 'city', foreignField: 'city_id', select: 'city_id city_name' })
      .populate({ path: 'Current_Designation', model: 'Designation', localField: 'Current_Designation', foreignField: 'designation_id', select: 'designation_id designation_name' })
      .populate({ path: 'current_company_name', model: 'Company', localField: 'current_company_name', foreignField: 'company_id', select: 'company_id company_name' })
      .populate({ path: 'Category', model: 'Category', localField: 'Category', foreignField: 'category_id', select: 'category_id category_name' })
      .populate({ path: 'Subcategory', model: 'Subcategory', localField: 'Subcategory', foreignField: 'subcategory_id', select: 'subcategory_id subcategory_name' })
      .populate({ path: 'package_id', model: 'Package', localField: 'package_id', foreignField: 'package_id', select: 'package_id package_name' });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.user_id;
    delete updateData.role_id;
    delete updateData.created_by;
    delete updateData.created_at;
    delete updateData.updated_by;
    delete updateData.mobile;
    delete updateData.email;

    // Check if user exists
    const existingUser = await User.findOne({ user_id: userId });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }



    // Update the user
    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      { 
        ...updateData,
        updated_by: userId,
        updated_on: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const logout = async (req, res) => {
  try {
    // Update user_online status to false
    if (req.user && req.user.user_id) {
      await User.findOneAndUpdate(
        { user_id: req.user.user_id },
        { user_online: false, updated_by: req.user.user_id }
      );
    }

    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ message: 'Logout failed', status: 500 });
            }
            return res.status(200).json({ message: 'Logged out successfully', status: 200 });
        });
        return;
    }
    return res.status(200).json({ message: 'Logged out successfully. Please remove token on client.', status: 200 });
} catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
}
};

const getUsersByRoleId = async (req, res) => {
    try {
        const { role_id } = req.params;
        if (!role_id) {
            return res.status(400).json({ message: 'role_id is required', status: 400 });
        }
        const users = await User.find({ role_id: Number(role_id) });
        res.status(200).json({ users, status: 200 });
    } catch (error) {
        res.status(500).json({ message: error.message || error, status: 500 });
    }
};

const getUserFullDetails = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // User full details with all populated fields
    const user = await User.findOne({ user_id: Number(user_id) })
      .populate({ path: 'language', model: 'Language', localField: 'language', foreignField: 'language_id', select: 'language_id name' })
      .populate({ path: 'skill', model: 'Skill', localField: 'skill', foreignField: 'skill_id', select: 'skill_id skill_name' })
      .populate({ path: 'state', model: 'State', localField: 'state', foreignField: 'state_id', select: 'state_id state_name' })
      .populate({ path: 'city', model: 'City', localField: 'city', foreignField: 'city_id', select: 'city_id city_name' })
      .populate({ path: 'Current_Designation', model: 'Designation', localField: 'Current_Designation', foreignField: 'designation_id', select: 'designation_id designation_name' })
      .populate({ path: 'current_company_name', model: 'Company', localField: 'current_company_name', foreignField: 'company_id', select: 'company_id company_name' })
      .populate({ path: 'Category', model: 'Category', localField: 'Category', foreignField: 'category_id', select: 'category_id category_name' })
      .populate({ path: 'Subcategory', model: 'Subcategory', localField: 'Subcategory', foreignField: 'subcategory_id', select: 'subcategory_id subcategory_name' })
      .populate({ path: 'package_id', model: 'Package', localField: 'package_id', foreignField: 'package_id', select: 'package_id package_name' });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found', 
        status: 404 
      });
    }

         // Appointments: all schedule_call where advisor_id or created_by is user
     const appointments = await require('../models/schedule_call.model').find({ 
       $or: [ 
         { advisor_id: Number(user_id) }, 
         { created_by: Number(user_id) } 
       ] 
     });

    // Get user details for appointments (advisor_id and created_by)
    const appointmentUserIds = [...new Set([
      ...appointments.map(apt => apt.advisor_id),
      ...appointments.map(apt => apt.created_by)
    ])];
    
         // Get all unique skill IDs, package IDs, and call type IDs from appointments
     const skillIds = [...new Set(appointments.map(apt => apt.skills_id))];
     const appointmentPackageIds = [...new Set(appointments.map(apt => apt.package_id))];
     const callTypeIds = [...new Set(appointments.map(apt => apt.call_type_id))];
     
     // Fetch all related data in parallel
     const [appointmentUsers, skills, appointmentPackages, callTypes] = await Promise.all([
       User.find(
         { user_id: { $in: appointmentUserIds } }, 
         { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }
       ),
       require('../models/skill.model').find(
         { skill_id: { $in: skillIds } },
         { skill_id: 1, skill_name: 1, _id: 0 }
       ),
       Package.find(
         { package_id: { $in: appointmentPackageIds } },
         { package_id: 1, package_name: 1, price: 1, _id: 0 }
       ),
       require('../models/call_type.model').find(
         { call_type_id: { $in: callTypeIds } },
         { call_type_id: 1, mode_name: 1, price_per_minute: 1, adviser_commission: 1, admin_commission: 1, _id: 0 }
       )
     ]);
    
    const appointmentUserMap = {};
    appointmentUsers.forEach(u => { appointmentUserMap[u.user_id] = u; });
    
    const skillMap = {};
    skills.forEach(s => { skillMap[s.skill_id] = s; });
    
         const appointmentPackageMap = {};
     appointmentPackages.forEach(p => { appointmentPackageMap[p.package_id] = p; });
     
     const callTypeMap = {};
     callTypes.forEach(ct => { callTypeMap[ct.call_type_id] = ct; });

     // Map appointments with user details, skills, packages, call types, and duration
     const appointmentsWithDetails = appointments.map(appointment => {
      const appointmentObj = appointment.toObject();
      return {
        ...appointmentObj,
        advisor_details: appointmentUserMap[appointment.advisor_id] ? {
          user_id: appointmentUserMap[appointment.advisor_id].user_id,
          name: appointmentUserMap[appointment.advisor_id].name,
          email: appointmentUserMap[appointment.advisor_id].email,
          mobile: appointmentUserMap[appointment.advisor_id].mobile
        } : null,
        created_by_details: appointmentUserMap[appointment.created_by] ? {
          user_id: appointmentUserMap[appointment.created_by].user_id,
          name: appointmentUserMap[appointment.created_by].name,
          email: appointmentUserMap[appointment.created_by].email,
          mobile: appointmentUserMap[appointment.created_by].mobile
        } : null,
        skill_details: skillMap[appointment.skills_id] ? {
          skill_id: skillMap[appointment.skills_id].skill_id,
          skill_name: skillMap[appointment.skills_id].skill_name
        } : null,
        package_details: appointmentPackageMap[appointment.package_id] ? {
          package_id: appointmentPackageMap[appointment.package_id].package_id,
          package_name: appointmentPackageMap[appointment.package_id].package_name,
          price: appointmentPackageMap[appointment.package_id].price
        } : null,
        call_type_details: callTypeMap[appointment.call_type_id] ? {
          call_type_id: callTypeMap[appointment.call_type_id].call_type_id,
          mode_name: callTypeMap[appointment.call_type_id].mode_name,
          price_per_minute: callTypeMap[appointment.call_type_id].price_per_minute,
          adviser_commission: callTypeMap[appointment.call_type_id].adviser_commission,
          admin_commission: callTypeMap[appointment.call_type_id].admin_commission
        } : null,
        duration_info: {
          Call_duration: appointment.Call_duration || null,
          perminRate: appointment.perminRate || null,
          Amount: appointment.Amount || null,
          duration_minutes: appointment.Call_duration || 0,
          total_amount: appointment.Amount || 0,
          rate_per_minute: appointment.perminRate || 0
        }
      };
    });

    // Wallet: all transactions where user_id is user
    const userTransaction = await Transaction.find({ user_id: Number(user_id) }).sort({ created_at: -1 });

    // Get user details for transactions (created_by)
    const transactionUserIds = [...new Set(userTransaction.map(txn => txn.created_by))];
    
    // Get bank account IDs and payment details IDs from transactions
    const bankIds = [...new Set(userTransaction.map(txn => txn.bank_id).filter(id => id))];
    const paymentDetailsIds = [...new Set(userTransaction.map(txn => txn.PaymentDetails_id).filter(id => id))];
    
    // Fetch all related data in parallel
    const [transactionUsers, bankAccounts, paymentDetails] = await Promise.all([
      User.find(
        { user_id: { $in: transactionUserIds } }, 
        { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }
      ),
      bankIds.length > 0 ? require('../models/Advisor_bankAccountDetails.model').find(
        { bankAccount_id: { $in: bankIds } }
      ) : Promise.resolve([]),
      paymentDetailsIds.length > 0 ? require('../models/payment_details.model').find(
        { paymentDetails_id: { $in: paymentDetailsIds } }
      ) : Promise.resolve([])
    ]);
    
    // Create maps for efficient lookup
    const transactionUserMap = {};
    transactionUsers.forEach(u => { transactionUserMap[u.user_id] = u; });
    
    const bankAccountMap = {};
    bankAccounts.forEach(b => { bankAccountMap[b.bankAccount_id] = b; });
    
    const paymentDetailsMap = {};
    paymentDetails.forEach(p => { paymentDetailsMap[p.paymentDetails_id] = p; });

    // Map transactions with comprehensive details
    const transactionsWithDetails = userTransaction.map(transaction => {
      const transactionObj = transaction.toObject();
      return {
        ...transactionObj,
        created_by_details: transactionUserMap[transaction.created_by] ? {
          user_id: transactionUserMap[transaction.created_by].user_id,
          name: transactionUserMap[transaction.created_by].name,
          email: transactionUserMap[transaction.created_by].email,
          mobile: transactionUserMap[transaction.created_by].mobile
        } : null,
        bank_account_details: transaction.bank_id && bankAccountMap[transaction.bank_id] ? {
          bankAccount_id: bankAccountMap[transaction.bank_id].bankAccount_id,
          bank_name: bankAccountMap[transaction.bank_id].bank_name,
          account_number: bankAccountMap[transaction.bank_id].account_number,
          account_holder_name: bankAccountMap[transaction.bank_id].account_holder_name,
          ifsc_code: bankAccountMap[transaction.bank_id].ifsc_code
        } : null,
        payment_details: transaction.PaymentDetails_id && paymentDetailsMap[transaction.PaymentDetails_id] ? {
          paymentDetails_id: paymentDetailsMap[transaction.PaymentDetails_id].paymentDetails_id,
          payment_type: paymentDetailsMap[transaction.PaymentDetails_id].payment_type,
          upi_id: paymentDetailsMap[transaction.PaymentDetails_id].upi_id,
          qr_code: paymentDetailsMap[transaction.PaymentDetails_id].qr_code
        } : null
      };
    });
    
    // Calculate transaction summary
    const transactionSummary = {
      total_transactions: transactionsWithDetails.length,
      total_amount: userTransaction.reduce((sum, txn) => sum + (txn.amount || 0), 0),
      total_gst: userTransaction.reduce((sum, txn) => sum + (txn.TotalGST || 0), 0),
      by_status: {
        pending: userTransaction.filter(txn => txn.status === 'pending').length,
        completed: userTransaction.filter(txn => txn.status === 'completed').length,
        failed: userTransaction.filter(txn => txn.status === 'failed').length
      },
      by_type: userTransaction.reduce((acc, txn) => {
        acc[txn.transactionType] = (acc[txn.transactionType] || 0) + 1;
        return acc;
      }, {}),
      total_deposits: userTransaction
        .filter(txn => ['deposit', 'RechargeByAdmin', 'Recharge'].includes(txn.transactionType))
        .reduce((sum, txn) => sum + (txn.amount || 0), 0),
      total_withdrawals: userTransaction
        .filter(txn => txn.transactionType === 'withdraw')
        .reduce((sum, txn) => sum + (txn.amount || 0), 0),
      total_call_payments: userTransaction
        .filter(txn => txn.transactionType === 'Call')
        .reduce((sum, txn) => sum + (txn.amount || 0), 0),
      total_package_purchases: userTransaction
        .filter(txn => txn.transactionType === 'Package_Buy')
        .reduce((sum, txn) => sum + (txn.amount || 0), 0)
    };

    // Wallet balance
    const wallet = await Wallet.findOne({ user_id: Number(user_id) });
    const wallet_balance = wallet ? wallet.amount : 0;

    // Package subscriptions: all for this user, with package details
    const subscriptions = await PackageSubscription.find({ subscribe_by: Number(user_id) });
    
    // For each subscription, get package details
    const subscriptionPackageIds = subscriptions.map(sub => sub.package_id);
    const subscriptionPackages = await Package.find({ package_id: { $in: subscriptionPackageIds } });
    
    // Attach package details to each subscription
    const subscriptionsWithDetails = subscriptions.map(sub => ({
      ...sub.toObject(),
      package_details: subscriptionPackages.find(pkg => pkg.package_id === sub.package_id) || null
    }));

    // Get role details
    const Role = require('../models/role.model');
    const role = await Role.findOne({ role_id: user.role_id }, { role_id: 1, role_name: 1, description: 1, _id: 0 });

    return res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        role_details: role ? {
          role_id: role.role_id,
          role_name: role.role_name,
          description: role.description
        } : null
      },
      appointments: appointmentsWithDetails,
      transactions: transactionsWithDetails,
      transaction_summary: transactionSummary,
      wallet_balance,
      wallet_details: wallet ? {
        user_id: wallet.user_id,
        amount: wallet.amount,
        status: wallet.status,
        created_At: wallet.created_At,
        updated_At: wallet.updated_At
      } : null,
      package_subscriptions: subscriptionsWithDetails,
      counts: {
        total_appointments: appointmentsWithDetails.length,
        total_transactions: transactionsWithDetails.length,
        total_subscriptions: subscriptionsWithDetails.length
      },
      status: 200
    });
  } catch (error) {
    console.error('Get user full details error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get all users full details with pagination and search
const getAllUserFullDetails = async (req, res) => {


  try {
    // Get query parameters for pagination and search
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role_id = 1;
    
    // Debug logging
    console.log('getAllUserFullDetails - Query params:', {
      page, limit, search, role_id, status: req.query.status
    });
    
    // Handle status parsing with proper validation
    let status = null;
    if (req.query.status !== undefined && req.query.status !== null && req.query.status !== '') {
      if (req.query.status === 'true' || req.query.status === true) {
        status = 1;
      } else if (req.query.status === 'false' || req.query.status === false) {
        status = 0;
      } else {
        const parsedStatus = parseInt(req.query.status);
        if (!isNaN(parsedStatus)) {
          status = parsedStatus;
        }
      }
    }
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Build search query
    let searchQuery = {};
    
    // Add search functionality
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add role filter
    if (role_id) {
      searchQuery.role_id = role_id;
    }
    
    // Add status filter
    if (status !== null) {
      searchQuery.status = status;
    }
    
    // Debug logging - show final search query
    console.log('getAllUserFullDetails - Final search query:', JSON.stringify(searchQuery, null, 2));
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments(searchQuery);
    
    // Get users with pagination and search
    const users = await User.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 }); // Sort by newest first
    
         // Get all appointments, transactions, wallets, and subscriptions
     const allAppointments = await require('../models/schedule_call.model').find();
    const allTransactions = await Transaction.find();
    const allWallets = await Wallet.find();
    const allSubscriptions = await PackageSubscription.find();
    
    // Get all package details for subscriptions
    const allPackageIds = allSubscriptions.map(sub => sub.package_id);
    const allPackages = await Package.find({ package_id: { $in: allPackageIds } });
    
         // Get all unique skill IDs, package IDs, and call type IDs from appointments
     const allSkillIds = [...new Set(allAppointments.map(apt => apt.skills_id))];
     const allAppointmentPackageIds = [...new Set(allAppointments.map(apt => apt.package_id))];
     const allCallTypeIds = [...new Set(allAppointments.map(apt => apt.call_type_id))];
     
     // Get all unique user IDs for appointments
     const allAppointmentUserIds = [...new Set([
       ...allAppointments.map(apt => apt.advisor_id),
       ...allAppointments.map(apt => apt.created_by)
     ])];
     
     // Fetch all related data in parallel
     const [allSkills, allAppointmentPackages, allAppointmentUsers, allCallTypes] = await Promise.all([
      require('../models/skill.model').find(
        { skill_id: { $in: allSkillIds } },
        { skill_id: 1, skill_name: 1, _id: 0 }
      ),
      Package.find(
        { package_id: { $in: allAppointmentPackageIds } },
        { package_id: 1, package_name: 1, price: 1, _id: 0 }
      ),
             User.find(
         { user_id: { $in: allAppointmentUserIds } }, 
         { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }
       ),
       require('../models/call_type.model').find(
         { call_type_id: { $in: allCallTypeIds } },
         { call_type_id: 1, mode_name: 1, price_per_minute: 1, adviser_commission: 1, admin_commission: 1, _id: 0 }
       )
     ]);
    
    // Create maps for efficient lookup
    const skillMap = {};
    allSkills.forEach(s => { skillMap[s.skill_id] = s; });
    
    const appointmentPackageMap = {};
    allAppointmentPackages.forEach(p => { appointmentPackageMap[p.package_id] = p; });
    
         const appointmentUserMap = {};
     allAppointmentUsers.forEach(u => { appointmentUserMap[u.user_id] = u; });
     
     const callTypeMap = {};
     allCallTypes.forEach(ct => { callTypeMap[ct.call_type_id] = ct; });
     
     // Map users with their full details
     const usersWithFullDetails = users.map(user => {
      const userId = user.user_id;
      
      // Get user's appointments with enhanced details
      const userAppointments = allAppointments.filter(apt => 
        apt.advisor_id === userId || apt.created_by === userId
      );
      
      // Map appointments with all details including duration
      const appointmentsWithDetails = userAppointments.map(appointment => {
        const appointmentObj = appointment.toObject();
        return {
          ...appointmentObj,
          advisor_details: appointmentUserMap[appointment.advisor_id] ? {
            user_id: appointmentUserMap[appointment.advisor_id].user_id,
            name: appointmentUserMap[appointment.advisor_id].name,
            email: appointmentUserMap[appointment.advisor_id].email,
            mobile: appointmentUserMap[appointment.advisor_id].mobile
          } : null,
          created_by_details: appointmentUserMap[appointment.created_by] ? {
            user_id: appointmentUserMap[appointment.created_by].user_id,
            name: appointmentUserMap[appointment.created_by].name,
            email: appointmentUserMap[appointment.created_by].email,
            mobile: appointmentUserMap[appointment.created_by].mobile
          } : null,
          skill_details: skillMap[appointment.skills_id] ? {
            skill_id: skillMap[appointment.skills_id].skill_id,
            skill_name: skillMap[appointment.skills_id].skill_name
          } : null,
                     package_details: appointmentPackageMap[appointment.package_id] ? {
             package_id: appointmentPackageMap[appointment.package_id].package_id,
             package_name: appointmentPackageMap[appointment.package_id].package_name,
             price: appointmentPackageMap[appointment.package_id].price
           } : null,
           call_type_details: callTypeMap[appointment.call_type_id] ? {
             call_type_id: callTypeMap[appointment.call_type_id].call_type_id,
             mode_name: callTypeMap[appointment.call_type_id].mode_name,
             price_per_minute: callTypeMap[appointment.call_type_id].price_per_minute,
             adviser_commission: callTypeMap[appointment.call_type_id].adviser_commission,
             admin_commission: callTypeMap[appointment.call_type_id].admin_commission
           } : null,
           duration_info: {
            Call_duration: appointment.Call_duration || null,
            perminRate: appointment.perminRate || null,
            Amount: appointment.Amount || null,
            duration_minutes: appointment.Call_duration || 0,
            total_amount: appointment.Amount || 0,
            rate_per_minute: appointment.perminRate || 0
          }
        };
      });
      
      // Get user's transactions
      const userTransactions = allTransactions.filter(txn => txn.user_id === userId);
      
      // Get user's wallet balance
      const userWallet = allWallets.find(w => w.user_id === userId);
      const walletBalance = userWallet ? userWallet.amount : 0;
      
      // Get user's subscriptions with package details
      const userSubscriptions = allSubscriptions.filter(sub => sub.subscribe_by === userId);
      const subscriptionsWithDetails = userSubscriptions.map(sub => ({
        ...sub.toObject(),
        package_details: allPackages.find(pkg => pkg.package_id === sub.package_id) || null
      }));
      
      return {
        user: user,
        appointments: appointmentsWithDetails,
        userTransaction: userTransactions,
        wallet_balance: walletBalance,
        package_subscriptions: subscriptionsWithDetails
      };
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return res.status(200).json({
      users: usersWithFullDetails,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_users: totalUsers,
        limit: limit,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage,
        next_page: hasNextPage ? page + 1 : null,
        prev_page: hasPrevPage ? page - 1 : null
      },
      filters: {
        search: search,
        role_id: role_id,
        status: status
      },
      status: 200
    });
    
  } catch (error) {
    console.error('Get all users full details error:', error);
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Get users by role with filtering capabilities
const getAdvisorList = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      role_id = 2, // Default to advisors (role_id = 2)
      category_id, 
      subcategory_id, 
      status, 
      rating_min, 
      rating_max,
      experience_min,
      experience_max,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;

    // Build query
    const query = { role_id: parseInt(role_id) };
    
    // Debug logging
    console.log('getAdvisorList - Query params:', {
      page, limit, search, role_id, category_id, subcategory_id, status
    });

    // Add search functionality
    if (search) {
      // For text fields that can be searched directly
      const textSearchFields = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { expertise_offer: { $regex: search, $options: 'i' } },
        { description_Bio: { $regex: search, $options: 'i' } },
        { Current_Designation_Name: { $regex: search, $options: 'i' } },
        { Current_Company_Name: { $regex: search, $options: 'i' } }
      ];

      // If search is a number, also search by company_id and designation_id
      if (!isNaN(search)) {
        textSearchFields.push(
          { current_company_name: parseInt(search) },
          { Current_Designation: parseInt(search) }
        );
      }

      query.$or = textSearchFields;
    }

    // Add category filter
    if (category_id) {
      const categoryIds = Array.isArray(category_id) ? category_id : [category_id];
      query.Category = { $in: categoryIds.map(id => parseInt(id)) };
    }

    // Add subcategory filter
    if (subcategory_id) {
      const subcategoryIds = Array.isArray(subcategory_id) ? subcategory_id : [subcategory_id];
      query.Subcategory = { $in: subcategoryIds.map(id => parseInt(id)) };
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

    // Add rating filter
    if (rating_min !== undefined || rating_max !== undefined) {
      query.rating = {};
      if (rating_min !== undefined) {
        query.rating.$gte = parseFloat(rating_min);
      }
      if (rating_max !== undefined) {
        query.rating.$lte = parseFloat(rating_max);
      }
    }

    // Add experience filter
    if (experience_min !== undefined || experience_max !== undefined) {
      query.experience_year = {};
      if (experience_min !== undefined) {
        query.experience_year.$gte = parseInt(experience_min);
      }
      if (experience_max !== undefined) {
        query.experience_year.$lte = parseInt(experience_max);
      }
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'desc' ? -1 : 1;

    // Get advisors with pagination and filters
    const advisors = await User.find(query)
      .populate({ 
        path: 'Category', 
        model: 'Category', 
        localField: 'Category', 
        foreignField: 'category_id',
        select: 'category_id category_name description'
      })
      .populate({ 
        path: 'Subcategory', 
        model: 'Subcategory', 
        localField: 'Subcategory', 
        foreignField: 'subcategory_id',
        select: 'subcategory_id subcategory_name description'
      })
      .populate({ 
        path: 'skill', 
        model: 'Skill', 
        localField: 'skill', 
        foreignField: 'skill_id',
        select: 'skill_id skill_name description'
      })
      .populate({ 
        path: 'language', 
        model: 'Language', 
        localField: 'language', 
        foreignField: 'language_id',
        select: 'language_id name'
      })
      .populate({ 
        path: 'package_id', 
        model: 'Package', 
        localField: 'package_id', 
        foreignField: 'package_id',
        select: 'package_id packege_name Chat_price Chat_minute Chat_Schedule Audio_price Audio_minute Audio_Schedule Video_price Video_minute Video_Schedule status'
      })
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalAdvisors = await User.countDocuments(query);

    // Get unique category IDs for filter options
    const allAdvisors = await User.find({ role_id: 2 }, { Category: 1 });
    const allCategoryIds = [...new Set(allAdvisors.flatMap(advisor => advisor.Category))];
    
    // Get category details for filter options
    const Category = require('../models/category.model');
    const availableCategories = await Category.find(
      { category_id: { $in: allCategoryIds } },
      { category_id: 1, category_name: 1, description: 1, _id: 0 }
    );

    return res.status(200).json({
      success: true,
      message: `Users with role_id ${role_id} retrieved successfully`,
      data: {
        users: advisors.map(advisor => ({
          // Primary ID
          user_id: advisor.user_id,
          
          // Basic Information
          name: advisor.name,
          email: advisor.email,
          mobile: advisor.mobile,
          gender: advisor.gender,
          DOB: advisor.DOB,
          address: advisor.address,
          pincode: advisor.pincode,
          
          // ID References
          role_id: advisor.role_id,
          created_by: advisor.created_by,
          updated_by: advisor.updated_by,
          
          // Location IDs
          state: advisor.state,
          city: advisor.city,
          
          // Professional IDs
          Current_Designation: advisor.Current_Designation,
          Current_Designation_Name: advisor.Current_Designation_Name,
          Current_Company_Name: advisor.Current_Company_Name,
          current_company_name: advisor.current_company_name,
          package_id: advisor.package_id,
          
          // Category and Subcategory IDs
          Category: advisor.Category,
          Subcategory: advisor.Subcategory,
          
          // Skill and Language IDs
          skill: advisor.skill,
          language: advisor.language,
          
          // Professional Information
          rating: advisor.rating,
          experience_year: advisor.experience_year,
          description_Bio: advisor.description_Bio,
          expertise_offer: advisor.expertise_offer,
          IntroductionVideo: advisor.IntroductionVideo,
          
          // Rates
          chat_Rate: advisor.chat_Rate,
          audio_Rate: advisor.audio_Rate,
          VideoCall_rate: advisor.VideoCall_rate,
          
          // Documents and Social Links
          supporting_Document: advisor.supporting_Document,
          social_linkdin_link: advisor.social_linkdin_link,
          social_instagorm_link: advisor.social_instagorm_link,
          social_twitter_link: advisor.social_twitter_link,
          social_facebook_link: advisor.social_facebook_link,
          
          // Schedule and Availability
          choose_slot: advisor.choose_slot,
          choose_day: advisor.choose_day,
          instant_call: advisor.instant_call,
          applyslots_remainingDays: advisor.applyslots_remainingDays,
          vacation_status: advisor.vacation_status,
          vacation: advisor.vacation,
          
          // Status and Permissions
          status: advisor.status,
          login_permission_status: advisor.login_permission_status,
          user_online: advisor.user_online,
          suspended_reason: advisor.suspended_reason,
          
          // Terms and Firebase
          AgreeTermsCondition: advisor.AgreeTermsCondition,
          firebase_token: advisor.firebase_token,
          
          // Timestamps
          created_at: advisor.created_at,
          updated_on: advisor.updated_on
        })),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalAdvisors / limit),
          total_items: totalAdvisors,
          items_per_page: parseInt(limit)
        },
        filters: {
          available_categories: availableCategories
        }
      },
      status: 200
    });
  } catch (error) {
    console.error('Get advisor list error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      status: 500
    });
  }
};

// Admin: Get full advisor details by ID
const getAdviserById = async (req, res) => {
  try {
    const { advisor_id } = req.params;
    
    // Import models at the top to avoid initialization issues
    const Package = require('../models/package.model');
    const PackageSubscription = require('../models/package_subscription.model');
    
    // Advisor details with populated fields
    const advisor = await User.findOne({ user_id: Number(advisor_id), role_id: 2 })
      .populate({ path: 'Category', model: 'Category', localField: 'Category', foreignField: 'category_id', select: 'category_id category_name description' })
      .populate({ path: 'Subcategory', model: 'Subcategory', localField: 'Subcategory', foreignField: 'subcategory_id', select: 'subcategory_id subcategory_name description category_id' })
      .populate({ path: 'language', model: 'Language', localField: 'language', foreignField: 'language_id', select: 'language_id name code' })
      .populate({ path: 'skill', model: 'Skill', localField: 'skill', foreignField: 'skill_id', select: 'skill_id skill_name use_count' })
      .populate({ path: 'state', model: 'State', localField: 'state', foreignField: 'state_id', select: 'state_id state_name' })
      .populate({ path: 'city', model: 'City', localField: 'city', foreignField: 'city_id', select: 'city_id city_name' })
      .populate({ path: 'Current_Designation', model: 'Designation', localField: 'Current_Designation', foreignField: 'designation_id', select: 'designation_id designation_name' })
      .populate({ path: 'current_company_name', model: 'Company', localField: 'current_company_name', foreignField: 'company_id', select: 'company_id company_name' });
    
    if (!advisor) {
      return res.status(404).json({ message: 'Advisor not found', status: 404 });
    }

    // Manually populate advisor's package details
    const advisorPackage = advisor.package_id ? await Package.findOne({ package_id: advisor.package_id }) : null;
    const advisorWithPackage = {
      ...advisor.toObject(),
      package_details: advisorPackage ? {
        package_id: advisorPackage.package_id,
        package_name: advisorPackage.packege_name,
        description: advisorPackage.description,
        price: advisorPackage.price,
        duration: advisorPackage.duration,
        minute: advisorPackage.minute,
        Schedule: advisorPackage.Schedule
      } : null
    };

    // Get subscription details
    const subscriptions = await PackageSubscription.find({ subscribe_by: Number(advisor_id) })
      .sort({ created_at: -1 }); // Latest subscription first
    
    // Manually populate package details to avoid ObjectId/Number cast issues
    const subscriptionsWithPackages = await Promise.all(
      subscriptions.map(async (subscription) => {
        const packageDetails = await Package.findOne({ package_id: subscription.package_id });
        return {
          ...subscription.toObject(),
          package_details: packageDetails ? {
            package_id: packageDetails.package_id,
            package_name: packageDetails.packege_name,
            description: packageDetails.description,
            price: packageDetails.price,
            duration: packageDetails.duration,
            minute: packageDetails.minute,
            Schedule: packageDetails.Schedule
          } : null
        };
      })
    );
    
    // console.log(subscriptionsWithPackages);
    // Reviews
    const reviews = await require('../models/reviews.model').find({ user_id: Number(advisor_id) });
    
         // Appointments with enhanced details
     const appointments = await require('../models/schedule_call.model').find({ advisor_id: Number(advisor_id) });
     
     // Get call type details for appointments
     const callTypeIds = [...new Set(appointments.map(apt => apt.call_type_id))];
     const appointmentCallTypes = callTypeIds.length > 0 ? await CallType.find({ call_type_id: { $in: callTypeIds } }) : [];
     const callTypeMap = {};
     appointmentCallTypes.forEach(ct => { callTypeMap[ct.call_type_id] = ct; });
     
     // Map appointments with duration info and call type details
     const appointmentsWithDetails = appointments.map(appointment => {
             const appointmentObj = appointment.toObject();
       return {
         ...appointmentObj,
         call_type_details: callTypeMap[appointment.call_type_id] ? {
           call_type_id: callTypeMap[appointment.call_type_id].call_type_id,
           mode_name: callTypeMap[appointment.call_type_id].mode_name,
           price_per_minute: callTypeMap[appointment.call_type_id].price_per_minute,
           adviser_commission: callTypeMap[appointment.call_type_id].adviser_commission,
           admin_commission: callTypeMap[appointment.call_type_id].admin_commission
         } : null,
         duration_info: {
          Call_duration: appointment.Call_duration || null,
          perminRate: appointment.perminRate || null,
          Amount: appointment.Amount || null,
          duration_minutes: appointment.Call_duration || 0,
          total_amount: appointment.Amount || 0,
          rate_per_minute: appointment.perminRate || 0
        }
      };
    });
    
    // Transactions with comprehensive details
    const transactions = await Transaction.find({ user_id: Number(advisor_id) }).sort({ created_at: -1 });
    
    // Get bank account IDs, payment details IDs, and created_by IDs from transactions
    const transactionBankIds = [...new Set(transactions.map(txn => txn.bank_id).filter(id => id))];
    const transactionPaymentDetailsIds = [...new Set(transactions.map(txn => txn.PaymentDetails_id).filter(id => id))];
    const transactionUserIds = [...new Set(transactions.map(txn => txn.created_by))];
    
    // Fetch all related data in parallel
    const [transactionUsers, transactionBankAccounts, transactionPaymentDetails] = await Promise.all([
      User.find(
        { user_id: { $in: transactionUserIds } }, 
        { user_id: 1, name: 1, email: 1, mobile: 1, _id: 0 }
      ),
      transactionBankIds.length > 0 ? require('../models/Advisor_bankAccountDetails.model').find(
        { bankAccount_id: { $in: transactionBankIds } }
      ) : Promise.resolve([]),
      transactionPaymentDetailsIds.length > 0 ? require('../models/payment_details.model').find(
        { paymentDetails_id: { $in: transactionPaymentDetailsIds } }
      ) : Promise.resolve([])
    ]);
    
    // Create maps for efficient lookup
    const transactionUserMap = {};
    transactionUsers.forEach(u => { transactionUserMap[u.user_id] = u; });
    
    const transactionBankAccountMap = {};
    transactionBankAccounts.forEach(b => { transactionBankAccountMap[b.bankAccount_id] = b; });
    
    const transactionPaymentDetailsMap = {};
    transactionPaymentDetails.forEach(p => { transactionPaymentDetailsMap[p.paymentDetails_id] = p; });

    // Map transactions with comprehensive details
    const transactionsWithDetails = transactions.map(transaction => {
      const transactionObj = transaction.toObject();
      return {
        ...transactionObj,
        created_by_details: transactionUserMap[transaction.created_by] ? {
          user_id: transactionUserMap[transaction.created_by].user_id,
          name: transactionUserMap[transaction.created_by].name,
          email: transactionUserMap[transaction.created_by].email,
          mobile: transactionUserMap[transaction.created_by].mobile
        } : null,
        bank_account_details: transaction.bank_id && transactionBankAccountMap[transaction.bank_id] ? {
          bankAccount_id: transactionBankAccountMap[transaction.bank_id].bankAccount_id,
          bank_name: transactionBankAccountMap[transaction.bank_id].bank_name,
          account_number: transactionBankAccountMap[transaction.bank_id].account_number,
          account_holder_name: transactionBankAccountMap[transaction.bank_id].account_holder_name,
          ifsc_code: transactionBankAccountMap[transaction.bank_id].ifsc_code
        } : null,
        payment_details: transaction.PaymentDetails_id && transactionPaymentDetailsMap[transaction.PaymentDetails_id] ? {
          paymentDetails_id: transactionPaymentDetailsMap[transaction.PaymentDetails_id].paymentDetails_id,
          payment_type: transactionPaymentDetailsMap[transaction.PaymentDetails_id].payment_type,
          upi_id: transactionPaymentDetailsMap[transaction.PaymentDetails_id].upi_id,
          qr_code: transactionPaymentDetailsMap[transaction.PaymentDetails_id].qr_code
        } : null
      };
    });
    
    // Calculate transaction summary for advisor
    const transactionSummary = {
      total_transactions: transactionsWithDetails.length,
      total_amount: transactions.reduce((sum, txn) => sum + (txn.amount || 0), 0),
      total_gst: transactions.reduce((sum, txn) => sum + (txn.TotalGST || 0), 0),
      by_status: {
        pending: transactions.filter(txn => txn.status === 'pending').length,
        completed: transactions.filter(txn => txn.status === 'completed').length,
        failed: transactions.filter(txn => txn.status === 'failed').length
      },
      by_type: transactions.reduce((acc, txn) => {
        acc[txn.transactionType] = (acc[txn.transactionType] || 0) + 1;
        return acc;
      }, {}),
      earnings: {
        total_call_earnings: transactions
          .filter(txn => txn.transactionType === 'Call')
          .reduce((sum, txn) => sum + (txn.amount || 0), 0),
        total_package_earnings: transactions
          .filter(txn => txn.transactionType === 'Package_Buy')
          .reduce((sum, txn) => sum + (txn.amount || 0), 0),
        total_deposits: transactions
          .filter(txn => ['deposit', 'RechargeByAdmin', 'Recharge'].includes(txn.transactionType))
          .reduce((sum, txn) => sum + (txn.amount || 0), 0),
        total_withdrawals: transactions
          .filter(txn => txn.transactionType === 'withdraw')
          .reduce((sum, txn) => sum + (txn.amount || 0), 0)
      },
      call_transactions: transactions.filter(txn => txn.transactionType === 'Call').length,
      withdrawal_transactions: transactions.filter(txn => txn.transactionType === 'withdraw').length,
      deposit_transactions: transactions.filter(txn => ['deposit', 'RechargeByAdmin', 'Recharge'].includes(txn.transactionType)).length
    };
    
    // Subscriber list with created_by user details
    const subscribersRaw = await require('../models/schedule_call.model').find({ advisor_id: Number(advisor_id) });
   console.log("subscribersRaw _>>>", subscribersRaw);
    // Get unique created_by user IDs from subscribers
    const subscriberUserIds = [...new Set(subscribersRaw.map(sub => sub.created_by))];
   
    // Fetch user details for created_by users
    const subscriberUsers = await User.find(
      { user_id: { $in: subscriberUserIds } },
      { user_id: 1, name: 1, email: 1, mobile: 1, role_id: 1, _id: 0 }
    );
    
    // Create a map for quick lookup
    const subscriberUserMap = {};
    subscriberUsers.forEach(u => { subscriberUserMap[u.user_id] = u; });
    
    // Enhance subscribers with created_by user details
    const subscribers = subscribersRaw.map(subscriber => {
      const subscriberObj = subscriber.toObject();
      return {
        ...subscriberObj,
        created_by_user: subscriberUserMap[subscriber.created_by] || null
      };
    });
   
    // Wallet information
    const Wallet = require('../models/wallet.model');
    const wallet = await Wallet.findOne({ user_id: Number(advisor_id) });
    
    // Call types (all)
    const allCallTypes = await CallType.find();
    
    // Package and Pricing details
    const Package_and_pricing = {
      call_rates: {
        chat_Rate: advisor.chat_Rate || 0,
        audio_Rate: advisor.audio_Rate || 0,
        VideoCall_rate: advisor.VideoCall_rate || 0
      },
      current_package: advisorPackage ? {
        package_id: advisorPackage.package_id,
        package_name: advisorPackage.packege_name,
        description: advisorPackage.description,
        price: advisorPackage.price,
        duration: advisorPackage.duration,
        minute: advisorPackage.minute,
        Schedule: advisorPackage.Schedule
      } : null,
      active_subscriptions: subscriptionsWithPackages.filter(sub => sub.status === 'Actived'),
      total_subscriptions: subscriptionsWithPackages.length,
      subscription_revenue: subscriptionsWithPackages.reduce((sum, sub) => {
        const pkg = sub.package_details;
        return sum + (pkg ? (pkg.price || 0) : 0);
      }, 0),
      call_types_available: allCallTypes.map(ct => ({
        call_type_id: ct.call_type_id,
        mode_name: ct.mode_name,
        price_per_minute: ct.price_per_minute,
        adviser_commission: ct.adviser_commission,
        admin_commission: ct.admin_commission
      })),
      pricing_summary: {
        min_rate: Math.min(
          advisor.chat_Rate || Infinity,
          advisor.audio_Rate || Infinity,
          advisor.VideoCall_rate || Infinity
        ) === Infinity ? 0 : Math.min(
          advisor.chat_Rate || Infinity,
          advisor.audio_Rate || Infinity,
          advisor.VideoCall_rate || Infinity
        ),
        max_rate: Math.max(
          advisor.chat_Rate || 0,
          advisor.audio_Rate || 0,
          advisor.VideoCall_rate || 0
        ),
        average_rate: ((advisor.chat_Rate || 0) + (advisor.audio_Rate || 0) + (advisor.VideoCall_rate || 0)) / 3
      }
    };
    
    return res.status(200).json({
      advisor: advisorWithPackage, // Advisor with populated package details
      reviews,
      appointments: appointmentsWithDetails,
      transactions: transactionsWithDetails, // Enhanced transactions with bank, payment, and user details
      transaction_summary: transactionSummary, // Transaction summary with earnings breakdown
      Package_and_pricing, // Comprehensive package and pricing information
      subscribers,
      subscriptions: subscriptionsWithPackages, // Enhanced subscription details with populated package info
      wallet: wallet ? {
        user_id: wallet.user_id,
        amount: wallet.amount,
        status: wallet.status,
        created_At: wallet.created_At,
        updated_At: wallet.updated_At
      } : null, // Wallet information
      callTypes: allCallTypes,
      status: 200
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Admin Dashboard API
// Route Parameters: month (1-12), year (YYYY)
// Example: GET /admin-dashboard/:year/:month or GET /admin-dashboard/:year
const getAdminDashboard = async (req, res) => {
  try {
    // Extract month and year filters from route parameters
    const { month, year } = req.params;
    
    // Validate parameters
    if (month && (isNaN(month) || month < 1 || month > 12)) {
      return res.status(400).json({
        message: 'Month must be a number between 1 and 12',
        status: 400
      });
    }
    
    if (year && (isNaN(year) || year < 1900 || year > 2100)) {
      return res.status(400).json({
        message: 'Year must be a valid year between 1900 and 2100',
        status: 400
      });
    }
    
    // Create date filter based on month and year parameters
    let dateFilter = {};
    if (month && year) {
      // Filter by specific month and year
      const startDate = new Date(year, month - 1, 1); // month is 0-indexed in Date constructor
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month
      dateFilter = {
        created_at: {
          $gte: startDate,
          $lte: endDate
        }
      };
    } else if (year) {
      // Filter by entire year
      const startDate = new Date(year, 0, 1); // January 1st
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st
      dateFilter = {
        created_at: {
          $gte: startDate,
          $lte: endDate
        }
      };
    }
    // If no month/year provided, no date filter is applied (returns all data)

    // Counts with date filters
    const totalUsers = await User.countDocuments({ role_id: { $ne: 1 } }); // All users except admin
    const totalAdvisers = await User.countDocuments({ role_id: 2 });
    const withdrawRequests = await require('../models/withdraw_request.model').countDocuments(dateFilter);
    const pendingRequests = await require('../models/withdraw_request.model').countDocuments({ ...dateFilter, status: 0 });
    const completedSessions = await require('../models/schedule_call.model').countDocuments({ ...dateFilter, callStatus: 'Completed' });
    const appointments = await require('../models/schedule_call.model').countDocuments(dateFilter);
    const totalEarnings = await require('../models/transaction.model').aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const packageCount = await require('../models/package.model').countDocuments();

    // Category Trends
    const categories = await require('../models/category.model').find();
    const categoryTrends = await Promise.all(categories.map(async (category) => {
      const categoryId = category.category_id;
      
      // Get advisers in this category
      const advisersInCategory = await User.find({ 
        Category: categoryId, 
        role_id: 2 
      });
      
      const adviserIds = advisersInCategory.map(adv => adv.user_id);
      
      // Sessions for this category
      const sessions = await require('../models/schedule_call.model').find({
        advisor_id: { $in: adviserIds },
        ...dateFilter
      });
      
      // Revenue for this category
      const revenue = await require('../models/transaction.model').aggregate([
        { $match: { user_id: { $in: adviserIds }, ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      // Average rating for this category
      const ratings = await require('../models/reviews.model').find({
        user_id: { $in: adviserIds },
        ...dateFilter
      });
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, review) => sum + (review.rating || 0), 0) / ratings.length 
        : 0;
      
      // Packages sold for this category
      const packagesSold = await require('../models/package_subscription.model').countDocuments({
        subscribe_by: { $in: adviserIds },
        ...dateFilter
      });
      
      // Last 30 days growth (simplified - you can enhance this)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSessions = await require('../models/schedule_call.model').countDocuments({
        advisor_id: { $in: adviserIds },
        created_at: { $gte: thirtyDaysAgo },
        ...dateFilter
      });
      
      return {
        Category: category.category_name,
        session: sessions.length,
        Revenue: revenue.length > 0 ? revenue[0].total : 0,
        Avg_Rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        Packages_sold: packagesSold,
        Last30daysGrowth: recentSessions
      };
    }));

    // Top Advisers (by sessions)
    const topAdvisers = await require('../models/schedule_call.model').aggregate([
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),
      { $group: { _id: '$advisor_id', sessionCount: { $sum: 1 } } },
      { $sort: { sessionCount: -1 } },
      { $limit: 10 }
    ]);

    const topAdvisersWithDetails = await Promise.all(topAdvisers.map(async (advisor) => {
      const user = await User.findOne({ user_id: advisor._id });
      if (!user) return null;
      
      // Get user's languages
      const languages = await require('../models/language.model').find({
        language_id: { $in: user.language || [] }
      });
      
      return {
        user_id: user.user_id,
        Profile_img: user.IntroductionVideo || null, // Using IntroductionVideo as profile image
        name: user.name,
        ContactNo: user.mobile,
        Total_session: advisor.sessionCount,
        Language: languages.map(lang => lang.name)
      };
    }));

    // Filter out null values
    const validTopAdvisers = topAdvisersWithDetails.filter(advisor => advisor !== null);

    return res.status(200).json({
      Total_user: totalUsers,
      Total_Adviser: totalAdvisers,
      Withdraw_Request: withdrawRequests,
      Pending_Request: pendingRequests,
      Total_Completed_session: completedSessions,
      Appoinment: appointments,
      Total_Earning: totalEarnings.length > 0 ? totalEarnings[0].total : 0,
      Package: packageCount,
      Category_Trends: categoryTrends,
      Top_Adviser: validTopAdvisers,
      status: 200
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Delete user by admin
const deleteUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const adminId = req.user.user_id;

    // Validate user_id
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if admin is trying to delete themselves
    if (parseInt(user_id) === adminId) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot delete their own account'
      });
    }

    // Find the user to be deleted
    const userToDelete = await User.findOne({ user_id: parseInt(user_id) });
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is an admin (prevent deleting other admins)
    if (userToDelete.role_id === 1) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    // Delete related data (optional - you can choose to keep or delete related data)
    const userId = parseInt(user_id);

         // Note: ScheduleCall model has been removed, so no appointments to delete

    // Delete user's transactions
    await Transaction.deleteMany({ user_id: userId });

    // Delete user's wallet
    await Wallet.deleteMany({ user_id: userId });

    // Delete user's package subscriptions
    await PackageSubscription.deleteMany({ subscribe_by: userId });

    // Delete user's reviews
    await require('../models/reviews.model').deleteMany({ user_id: userId });

    // Delete user's withdraw requests
    await require('../models/withdraw_request.model').deleteMany({ user_id: userId });

    // Delete user's bank account details
    await require('../models/Advisor_bankAccountDetails.model').deleteMany({ user_id: userId });

    // Finally delete the user
    const deletedUser = await User.findOneAndDelete({ user_id: userId });

    if (!deletedUser) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User and all related data deleted successfully',
      deleted_user: {
        user_id: deletedUser.user_id,
        name: deletedUser.name,
        email: deletedUser.email,
        role_id: deletedUser.role_id
      },
      status: 200
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update user status and login permission status
const updateUserStatus = async (req, res) => {
  try {
    const { user_id, status, login_permission_status } = req.body;
    const adminId = req.user.user_id;

    // Validate user_id
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Validate that at least one status field is provided
    if (status === undefined && login_permission_status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'At least one status field (status or login_permission_status) is required'
      });
    }

    // Validate status values if provided
    if (status !== undefined && ![0, 1].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be 0 (inactive) or 1 (active)'
      });
    }

    if (login_permission_status !== undefined && ![true, false].includes(login_permission_status)) {
      return res.status(400).json({
        success: false,
        message: 'login_permission_status must be true or false'
      });
    }

    // Check if admin is trying to update themselves
    if (parseInt(user_id) === adminId) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot update their own status'
      });
    }

    // Find the user to be updated
    const userToUpdate = await User.findOne({ user_id: parseInt(user_id) });
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is an admin (prevent updating other admins)
    if (userToUpdate.role_id === 1) {
      return res.status(403).json({
        success: false,
        message: 'Cannot update admin users'
      });
    }

    // Prepare update data
    const updateData = {
      updated_by: adminId,
      updated_on: new Date()
    };

    if (status !== undefined) {
      updateData.status = status;
    }

    if (login_permission_status !== undefined) {
      updateData.login_permission_status = login_permission_status;
    }

    // Update the user
    const updatedUser = await User.findOneAndUpdate(
      { user_id: parseInt(user_id) },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update user status'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      updated_user: {
        user_id: updatedUser.user_id,
        name: updatedUser.name,
        email: updatedUser.email,
        status: updatedUser.status,
        login_permission_status: updatedUser.login_permission_status,
        role_id: updatedUser.role_id
      },
      status: 200
    });

  } catch (error) {
    console.error('Update user status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update user online status
const updateUserOnlineStatus = async (req, res) => {
  try {
    const { user_online } = req.body;
    const userId = req.user.user_id;

    // Validate required field
    if (user_online === undefined) {
      return res.status(400).json({
        success: false,
        message: 'user_online field is required'
      });
    }

    // Validate boolean value
    if (typeof user_online !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'user_online must be a boolean value (true or false)'
      });
    }

    // Update user online status
    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      { 
        user_online: user_online,
        updated_by: userId,
        updated_on: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: `User online status updated to ${user_online ? 'online' : 'offline'}`,
      data: {
        user_id: updatedUser.user_id,
        name: updatedUser.name,
        user_online: updatedUser.user_online,
        updated_on: updatedUser.updated_on
      },
      status: 200
    });

  } catch (error) {
    console.error('Update user online status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all employees (team list) - flexible role filtering
const getAllEmployees = async (req, res) => {
  try {
    // Get employees with pagination and search, with populated fields
    const employees = await User.find({ role_id : { $nin: [1, 2, 3] } })
      .populate({ path: 'language', model: 'Language', localField: 'language', foreignField: 'language_id', select: 'language_id name' })
      .populate({ path: 'skill', model: 'Skill', localField: 'skill', foreignField: 'skill_id', select: 'skill_id skill_name' })
      .populate({ path: 'state', model: 'State', localField: 'state', foreignField: 'state_id', select: 'state_id state_name' })
      .populate({ path: 'city', model: 'City', localField: 'city', foreignField: 'city_id', select: 'city_id city_name' })
      .populate({ path: 'Current_Designation', model: 'Designation', localField: 'Current_Designation', foreignField: 'designation_id', select: 'designation_id designation_name' })
      .populate({ path: 'current_company_name', model: 'Company', localField: 'current_company_name', foreignField: 'company_id', select: 'company_id company_name' })
      .populate({ path: 'Category', model: 'Category', localField: 'Category', foreignField: 'category_id', select: 'category_id category_name' })
      .populate({ path: 'Subcategory', model: 'Subcategory', localField: 'Subcategory', foreignField: 'subcategory_id', select: 'subcategory_id subcategory_name' })
      .populate({ path: 'package_id', model: 'Package', localField: 'package_id', foreignField: 'package_id', select: 'package_id package_name' })
      .populate({ path: 'role_id', model: 'Role', localField: 'role_id', foreignField: 'role_id', select: 'role_id name' })
      .sort({ created_at: -1 }); // Sort by newest first
    
   
    
    return res.status(200).json({
      success: true,
      message: 'Team members retrieved successfully',
      data: employees,
     
      status: 200
    });
    
  } catch (error) {
    console.error('Get all employees error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      status: 500
    });
  }
};

// Update user (Admin function - can update any user)
const updateUser = async (req, res) => {
  try {
    const { user_id, ...updateData } = req.body;
    const adminId = req.user.user_id;

    // Validate user_id
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required in request body'
      });
    }

    // // Check if admin is trying to update themselves
    // if (parseInt(user_id) === adminId) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Admin cannot update their own account through this endpoint'
    //   });
    // }

    // Find the user to be updated
    const userToUpdate = await User.findOne({ user_id: parseInt(user_id) });
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.user_id;
    delete updateData.created_by;
    delete updateData.created_at;
    delete updateData.updated_by;
    delete updateData.updated_on;

    // If role_id is being updated, validate it
    if (updateData.role_id !== undefined) {
      const Role = require('../models/role.model');
      const roleExists = await Role.findOne({ role_id: updateData.role_id });
      if (!roleExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role_id provided'
        });
      }
    }

    // If email is being updated, check for duplicates
    if (updateData.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email, 
        user_id: { $ne: parseInt(user_id) } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists for another user'
        });
      }
    }

    // If mobile is being updated, check for duplicates
    if (updateData.mobile) {
      const existingUser = await User.findOne({ 
        mobile: updateData.mobile, 
        user_id: { $ne: parseInt(user_id) } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number already exists for another user'
        });
      }
    }

    // Prepare update data with admin info
    const finalUpdateData = {
      ...updateData,
      updated_by: adminId,
      updated_on: new Date()
    };

    // Update the user
    const updatedUser = await User.findOneAndUpdate(
      { user_id: parseInt(user_id) },
      finalUpdateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }

    // Get role details for the updated user
    const Role = require('../models/role.model');
    const role = await Role.findOne({ role_id: updatedUser.role_id });

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        ...updatedUser.toObject(),
        role_details: role ? {
          role_id: role.role_id,
          role_name: role.name,
          description: role.description
        } : null
      },
      status: 200
    });

  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      status: 500
    });
  }
};

module.exports = { registerUser, getProfile, updateProfile, logout, getUsersByRoleId, getUserFullDetails, getAllUserFullDetails, getAdvisorList, getAdviserById, getAdminDashboard, deleteUser, updateUserStatus, updateUserOnlineStatus, getAllEmployees, updateUser }; 