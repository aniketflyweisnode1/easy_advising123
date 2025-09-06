const User = require('../models/User.model.js');
const PackageSubscription = require('../models/package_subscription.model.js');
const ScheduleCall = require('../models/schedule_call.model.js');
const Transaction = require('../models/transaction.model.js');
const Package = require('../models/package.model.js');
const Wallet = require('../models/wallet.model.js');

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
      current_company_name,
      expertise_offer,
      Category,
      Subcategory,
      chat_Rate,
      voiceCall_Rate,
      package_id,
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
console.log( choose_slot,choose_day)
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
      current_company_name,
      expertise_offer,
      Category,
      Subcategory,
      chat_Rate,
      voiceCall_Rate,
      package_id,
      supporting_Document,
      social_linkdin_link,
      social_instagorm_link,
      social_twitter_link,
      social_facebook_link,
      choose_slot,
      choose_day,
      instant_call,
      applyslots_remainingDays
    });
    await newUser.save();

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
    const appointments = await ScheduleCall.find({ 
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
    
    // Get all unique skill IDs and package IDs from appointments
    const skillIds = [...new Set(appointments.map(apt => apt.skills_id))];
    const appointmentPackageIds = [...new Set(appointments.map(apt => apt.package_id))];
    
    // Fetch all related data in parallel
    const [appointmentUsers, skills, appointmentPackages] = await Promise.all([
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
      )
    ]);
    
    const appointmentUserMap = {};
    appointmentUsers.forEach(u => { appointmentUserMap[u.user_id] = u; });
    
    const skillMap = {};
    skills.forEach(s => { skillMap[s.skill_id] = s; });
    
    const appointmentPackageMap = {};
    appointmentPackages.forEach(p => { appointmentPackageMap[p.package_id] = p; });

    // Map appointments with user details, skills, packages, and duration
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
    const userTransaction = await Transaction.find({ user_id: Number(user_id) });

    // Get user details for transactions (created_by)
    const transactionUserIds = [...new Set(userTransaction.map(txn => txn.created_by))];
    const transactionUsers = await User.find(
      { user_id: { $in: transactionUserIds } }, 
      { user_id: 1, name: 1, _id: 0 }
    );
    const transactionUserMap = {};
    transactionUsers.forEach(u => { transactionUserMap[u.user_id] = u; });

    // Map transactions with user details
    const transactionsWithDetails = userTransaction.map(transaction => {
      const transactionObj = transaction.toObject();
      return {
        ...transactionObj,
        created_by_details: transactionUserMap[transaction.created_by] ? {
          user_id: transactionUserMap[transaction.created_by].user_id,
          name: transactionUserMap[transaction.created_by].name
        } : null
      };
    });

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
      userTransaction: transactionsWithDetails,
      wallet_balance,
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
/**
page (optional): Page number (default: 1)
limit (optional): Items per page (default: 10)
search (optional): Search term for name/email/mobile
role_id (optional): Filter by user role
status (optional): Filter by user status
The API now provides powerful pagination and search capabilities for efficient data management!
 */


  try {
    // Get query parameters for pagination and search
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role_id = req.query.role_id ? parseInt(req.query.role_id) : null;
    const status = req.query.status ? parseInt(req.query.status) : null;
    
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
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments(searchQuery);
    
    // Get users with pagination and search
    const users = await User.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 }); // Sort by newest first
    
    // Get all appointments, transactions, wallets, and subscriptions
    const allAppointments = await ScheduleCall.find();
    const allTransactions = await Transaction.find();
    const allWallets = await Wallet.find();
    const allSubscriptions = await PackageSubscription.find();
    
    // Get all package details for subscriptions
    const allPackageIds = allSubscriptions.map(sub => sub.package_id);
    const allPackages = await Package.find({ package_id: { $in: allPackageIds } });
    
    // Get all unique skill IDs and package IDs from appointments
    const allSkillIds = [...new Set(allAppointments.map(apt => apt.skills_id))];
    const allAppointmentPackageIds = [...new Set(allAppointments.map(apt => apt.package_id))];
    
    // Get all unique user IDs for appointments
    const allAppointmentUserIds = [...new Set([
      ...allAppointments.map(apt => apt.advisor_id),
      ...allAppointments.map(apt => apt.created_by)
    ])];
    
    // Fetch all related data in parallel
    const [allSkills, allAppointmentPackages, allAppointmentUsers] = await Promise.all([
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
      )
    ]);
    
    // Create maps for efficient lookup
    const skillMap = {};
    allSkills.forEach(s => { skillMap[s.skill_id] = s; });
    
    const appointmentPackageMap = {};
    allAppointmentPackages.forEach(p => { appointmentPackageMap[p.package_id] = p; });
    
    const appointmentUserMap = {};
    allAppointmentUsers.forEach(u => { appointmentUserMap[u.user_id] = u; });
    
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

// Get all advisors (role_id = 2) with pagination, search, and sorting
const getAdvisorList = async (req, res) => {
  try {
    // Extract query parameters
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      subcategory = '',
      skill = '',
      language = '',
      state = '',
      city = '',
      login_permission_status = '',
      status = '',
      rating_min = '',
      rating_max = '',
      experience_min = '',
      experience_max = '',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build base filter for advisors
    let searchFilter = { role_id: 2 };

    // Add search functionality
    if (search) {
      searchFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { description_Bio: { $regex: search, $options: 'i' } },
        { expertise_offer: { $regex: search, $options: 'i' } },
        { login_permission_status: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (category) {
      searchFilter.Category = parseInt(category);
    }

    // Add subcategory filter
    if (subcategory) {
      searchFilter.Subcategory = parseInt(subcategory);
    }

    // Add skill filter
    if (skill) {
      searchFilter.skill = parseInt(skill);
    }

    // Add language filter
    if (language) {
      searchFilter.language = parseInt(language);
    }

    // Add state filter
    if (state) {
      searchFilter.state = parseInt(state);
    }

    // Add city filter
    if (city) {
      searchFilter.city = parseInt(city);
    }

    // Add login permission status filter
    if (login_permission_status) {
      searchFilter.login_permission_status = parseInt(login_permission_status);
    }

    // Add status filter
    if (status) {
      searchFilter.status = parseInt(status);
    }

    // Add rating filters
    if (rating_min || rating_max) {
      searchFilter.rating = {};
      if (rating_min) searchFilter.rating.$gte = parseFloat(rating_min);
      if (rating_max) searchFilter.rating.$lte = parseFloat(rating_max);
    }

    // Add experience filters
    if (experience_min || experience_max) {
      searchFilter.experience_year = {};
      if (experience_min) searchFilter.experience_year.$gte = parseInt(experience_min);
      if (experience_max) searchFilter.experience_year.$lte = parseInt(experience_max);
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get total count for pagination
    const totalCount = await User.countDocuments(searchFilter);

    // Get advisors with pagination and sorting
    const advisors = await User.find(searchFilter)
      .populate({ path: 'Category', model: 'Category', localField: 'Category', foreignField: 'category_id' })
      .populate({ path: 'Subcategory', model: 'Subcategory', localField: 'Subcategory', foreignField: 'subcategory_id' })
      .populate({ path: 'skill', model: 'Skill', localField: 'skill', foreignField: 'skill_id' })
      .populate({ path: 'language', model: 'Language', localField: 'language', foreignField: 'language_id' })
      .populate({ path: 'state', model: 'State', localField: 'state', foreignField: 'state_id' })
      .populate({ path: 'city', model: 'City', localField: 'city', foreignField: 'city_id' })
      .populate({ path: 'Current_Designation', model: 'Designation', localField: 'Current_Designation', foreignField: 'designation_id' })
      .populate({ path: 'current_company_name', model: 'Company', localField: 'current_company_name', foreignField: 'company_id' })
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Response with pagination metadata
    return res.status(200).json({
      advisors,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        search,
        category,
        subcategory,
        skill,
        language,
        state,
        city,
        login_permission_status,
        status,
        rating_min,
        rating_max,
        experience_min,
        experience_max,
        sortBy,
        sortOrder
      },
      status: 200
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Admin: Get full advisor details by ID
const getAdviserById = async (req, res) => {
  try {
    const { advisor_id } = req.params;
    
    // Advisor details with populated fields
    const advisor = await User.findOne({ user_id: Number(advisor_id), role_id: 2 })
      .populate({ path: 'Category', model: 'Category', localField: 'Category', foreignField: 'category_id', select: 'category_id category_name description' })
      .populate({ path: 'Subcategory', model: 'Subcategory', localField: 'Subcategory', foreignField: 'subcategory_id', select: 'subcategory_id subcategory_name description category_id' })
      .populate({ path: 'language', model: 'Language', localField: 'language', foreignField: 'language_id', select: 'language_id name code' })
      .populate({ path: 'skill', model: 'Skill', localField: 'skill', foreignField: 'skill_id', select: 'skill_id skill_name use_count' })
      .populate({ path: 'state', model: 'State', localField: 'state', foreignField: 'state_id', select: 'state_id state_name' })
      .populate({ path: 'city', model: 'City', localField: 'city', foreignField: 'city_id', select: 'city_id city_name' })
      .populate({ path: 'Current_Designation', model: 'Designation', localField: 'Current_Designation', foreignField: 'designation_id', select: 'designation_id designation_name' })
      .populate({ path: 'current_company_name', model: 'Company', localField: 'current_company_name', foreignField: 'company_id', select: 'company_id company_name' })
      .populate({ path: 'package_id', model: 'Package', localField: 'package_id', foreignField: 'package_id', select: 'package_id package_name description price duration' });
    
    if (!advisor) {
      return res.status(404).json({ message: 'Advisor not found', status: 404 });
    }
    
    // Reviews
    const reviews = await require('../models/reviews.model').find({ user_id: Number(advisor_id) });
    
    // Appointments with enhanced details
    const appointments = await require('../models/schedule_call.model').find({ advisor_id: Number(advisor_id) });
    
    // Map appointments with duration info
    const appointmentsWithDetails = appointments.map(appointment => {
      const appointmentObj = appointment.toObject();
      return {
        ...appointmentObj,
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
    
    // Transactions
    const transactions = await require('../models/transaction.model').find({ user_id: Number(advisor_id) });
    
    // Subscriber list
    const subscribers = await require('../models/package_subscription.model').find({ subscribe_by: Number(advisor_id) });
    
    // Packages (from advisor.package_id and from subscriptions)
    const packageIds = [advisor.package_id].filter(Boolean);
    const subPackageIds = subscribers.map(sub => sub.package_id).filter(Boolean);
    const allPackageIds = Array.from(new Set([...packageIds, ...subPackageIds]));
    const packages = allPackageIds.length > 0 ? await require('../models/package.model').find({ package_id: { $in: allPackageIds } }) : [];
    
    // Call types (all)
    const callTypes = await require('../models/call_type.model').find();
    
    return res.status(200).json({
      advisor,
      reviews,
      appointments: appointmentsWithDetails,
      transactions,
      subscribers,
      packages,
      callTypes,
      status: 200
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Admin Dashboard API
const getAdminDashboard = async (req, res) => {
  try {
    // Counts
    const totalUsers = await User.countDocuments({ role_id: { $ne: 1 } }); // All users except admin
    const totalAdvisers = await User.countDocuments({ role_id: 2 });
    const withdrawRequests = await require('../models/withdraw_request.model').countDocuments();
    const pendingRequests = await require('../models/withdraw_request.model').countDocuments({ status: 0 });
    const completedSessions = await require('../models/schedule_call.model').countDocuments({ callStatus: 'Completed' });
    const appointments = await require('../models/schedule_call.model').countDocuments();
    const totalEarnings = await require('../models/transaction.model').aggregate([
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
        advisor_id: { $in: adviserIds }
      });
      
      // Revenue for this category
      const revenue = await require('../models/transaction.model').aggregate([
        { $match: { user_id: { $in: adviserIds } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      // Average rating for this category
      const ratings = await require('../models/reviews.model').find({
        user_id: { $in: adviserIds }
      });
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, review) => sum + (review.rating || 0), 0) / ratings.length 
        : 0;
      
      // Packages sold for this category
      const packagesSold = await require('../models/package_subscription.model').countDocuments({
        subscribe_by: { $in: adviserIds }
      });
      
      // Last 30 days growth (simplified - you can enhance this)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSessions = await require('../models/schedule_call.model').countDocuments({
        advisor_id: { $in: adviserIds },
        created_at: { $gte: thirtyDaysAgo }
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

    // Delete user's appointments/schedule calls
    await ScheduleCall.deleteMany({
      $or: [
        { advisor_id: userId },
        { created_by: userId }
      ]
    });

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

module.exports = { registerUser, getProfile, updateProfile, logout, getUsersByRoleId, getUserFullDetails, getAllUserFullDetails, getAdvisorList, getAdviserById, getAdminDashboard, deleteUser, updateUserStatus }; 