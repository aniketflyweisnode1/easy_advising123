const User = require('../models/User.model');
const ScheduleCall = require('../models/schedule_call.model');
const PackageSubscription = require('../models/package_subscription.model');
const AdvisorPackage = require('../models/Advisor_Package.model');
const Category = require('../models/category.model');
const CallTypeModel = require('../models/call_type.model');

// Helper to get earnings by call type
async function getCallEarnings(advisorId, callTypes) {
  // Get all call types for this advisor
  const advisorCallTypes = await CallTypeModel.find({ adviser_id: advisorId });
  // console.log("advisorCallTypes", advisorCallTypes);
  
  // Extract mode_names from advisor's call types
  const advisorModeNames = advisorCallTypes.map(ct => ct.call_type_id);
  // console.log("advisorModeNames", advisorModeNames);
  
  // Build match query for schedule calls
  const match = { advisor_id: advisorId };
  
  // If specific call types provided, filter by them
  if (callTypes && Array.isArray(callTypes)) {
    match.call_type_id = { $in: advisorModeNames };
  } else if (advisorModeNames.length > 0) {
    // Filter by advisor's available mode_names
    match.call_type_id = { $in: advisorModeNames };
  }
  
  // console.log("match query", match);
  
  const calls = await ScheduleCall.find(match);
  // console.log("Found calls", calls.length);
  
  let chat_earning = 0, audio_earning = 0, video_earning = 0, total_earning = 0;
  let chat_count = 0, audio_count = 0, video_count = 0, total_count = 0;
  
  // Create a map of call_type_id to mode_name for matching
  const callTypeMap = {};
  advisorCallTypes.forEach(ct => {
    callTypeMap[ct.call_type_id] = ct.mode_name;
  });
  
  for (const call of calls) {
    const amount = call.Amount || 0;
    
    // Get mode_name from call_type_id if available
    const modeName = callTypeMap[call.call_type_id];
    
    if (modeName === 'Chat') {
      chat_earning += amount;
      chat_count++;
    } else if (modeName === 'Audio') {
      audio_earning += amount;
      audio_count++;
    } else if (modeName === 'Video') {
      video_earning += amount;
      video_count++;
    }
    
    total_earning += amount;
    total_count++;
  }
    console.log("chat_earning",chat_earning);
    console.log("audio_earning",audio_earning);
    console.log("video_earning",video_earning);
    console.log("total_earning",total_earning);
    console.log("chat_count",chat_count);
    console.log("audio_count",audio_count);
    console.log("video_count",video_count);
  return { 
    chat_earning, 
    audio_earning, 
    video_earning, 
    total_earning,
    chat_count,
    audio_count,
    video_count,
    total_count,
    available_call_types: advisorModeNames
  };
}

// Helper to get package earnings
async function getPackageEarning(advisorId) {
  const packages = await PackageSubscription.find({ subscribe_by: advisorId });
  // If package earning is a field, sum it; else, just count
  // Here, just count as earning for demo
  return packages.length;
}

// Get all advisers' earnings
const getAdviserEarning = async (req, res) => {
  try {
    const advisers = await User.find({ role_id: 2 });
    const results = [];
    for (const adviser of advisers) {
      const category = adviser.Category && adviser.Category.length > 0 ? await Category.findOne({ category_id: adviser.Category[0] }) : null;
      const callEarnings = await getCallEarnings(adviser.user_id, ['Chat', 'Audio', 'Video']);
      console.log("callEarnings",callEarnings);
      const package_earning = await getPackageEarning(adviser.user_id);
      results.push({
        adviser_id: adviser.user_id,
        Advisername: adviser.name,
        category: category ? category.category_name : null,
        total_earning: callEarnings.total_earning,
        chat_earning: callEarnings.chat_earning,
        audio_earning: callEarnings.audio_earning,
        video_earning: callEarnings.video_earning,
        chat_count: callEarnings.chat_count,
        audio_count: callEarnings.audio_count,
        video_count: callEarnings.video_count,
        total_count: callEarnings.total_count,
        // available_call_types: callEarnings.available_call_types,
        package_earning
      });
    }
    return res.status(200).json({ 
      success: true,
      earnings: results, 
      status: 200 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || error, status: 500 });
  }
};

// Filter earnings by call type
const filterByCallTypeEarning = async (req, res) => {
  try {
    const { call_type, date_from, date_to } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category_id,
      sort_by = 'total_earning',
      sort_order = 'desc'
    } = req.query;

    // Validate call_type
    if (!['CHAT', 'AUDIO', 'VIDEO'].includes(call_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid call_type. Must be CHAT, AUDIO, or VIDEO',
        status: 400
      });
    }

    const skip = (page - 1) * limit;

    // Build user query
    let userQuery = { role_id: 2 };
    if (category_id) {
      userQuery.Category = { $in: [parseInt(category_id)] };
    }

    const advisers = await User.find(userQuery);

    // Build date filter for schedule calls
    let dateFilter = {};
    if (date_from || date_to) {
      dateFilter.date = {};
      if (date_from) {
        dateFilter.date.$gte = new Date(date_from);
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setDate(endDate.getDate() + 1);
        dateFilter.date.$lt = endDate;
      }
    }

    const results = [];
    for (const adviser of advisers) {
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        if (!adviser.name.toLowerCase().includes(searchLower) && 
            !adviser.email?.toLowerCase().includes(searchLower)) {
          continue;
        }
      }

      const category = adviser.Category && adviser.Category.length > 0 ? await Category.findOne({ category_id: adviser.Category[0] }) : null;
      
      // Get call earnings with date filter
      let callEarnings;
      if (date_from || date_to) {
        // Custom earnings calculation with date filter
        const match = { 
          advisor_id: adviser.user_id,
          call_type: call_type,
          ...dateFilter
        };
        
        const calls = await ScheduleCall.find(match);
        let chat_earning = 0, audio_earning = 0, video_earning = 0, total_earning = 0;
        let chat_count = 0, audio_count = 0, video_count = 0, total_count = 0;
        
        for (const call of calls) {
          const amount = call.Amount || 0;
          
          if (call.call_type === 'Chat') {
            chat_earning += amount;
            chat_count++;
          } else if (call.call_type === 'Audio') {
            audio_earning += amount;
            audio_count++;
          } else if (call.call_type === 'VIDEO') {
            video_earning += amount;
            video_count++;
          }
          
          total_earning += amount;
          total_count++;
        }
        callEarnings = { 
          chat_earning, 
          audio_earning, 
          video_earning, 
          total_earning,
          chat_count,
          audio_count,
          video_count,
          total_count
        };
      } else {
        callEarnings = await getCallEarnings(adviser.user_id, call_type ? [call_type] : null);
      }

      const package_earning = await getPackageEarning(adviser.user_id);
      
      results.push({
        adviser_id: adviser.user_id,
        Advisername: adviser.name,
        email: adviser.email,
        mobile: adviser.mobile,
        category: category ? category.category_name : null,
        category_id: category ? category.category_id : null,
        total_earning: callEarnings.total_earning,
        chat_earning: callEarnings.chat_earning,
        audio_earning: callEarnings.audio_earning,
        video_earning: callEarnings.video_earning,
        chat_count: callEarnings.chat_count,
        audio_count: callEarnings.audio_count,
        video_count: callEarnings.video_count,
        total_count: callEarnings.total_count,
        available_call_types: callEarnings.available_call_types,
        package_earning,
        rating: adviser.rating,
        experience_year: adviser.experience_year,
        status: adviser.status,
        created_at: adviser.created_at
      });
    }

    // Sort results
    results.sort((a, b) => {
      const aVal = a[sort_by] || 0;
      const bVal = b[sort_by] || 0;
      return sort_order === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Apply pagination
    const totalItems = results.length;
    const paginatedResults = results.slice(skip, skip + parseInt(limit));

    // Get available call types for filter options
    const availableCallTypes = ['CHAT', 'AUDIO', 'VIDEO'];

    // Get available categories for filter options
    const allCategories = await Category.find({}, { category_id: 1, category_name: 1, description: 1, _id: 0 });

    return res.status(200).json({
      success: true,
      message: `Earnings filtered by call type: ${call_type}`,
      data: {
        call_type: call_type,
        earnings: paginatedResults,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalItems / limit),
          total_items: totalItems,
          items_per_page: parseInt(limit)
        },
        filters: {
          available_call_types: availableCallTypes,
          available_categories: allCategories
        }
      },
      status: 200
    });
  } catch (error) {
    console.error('Filter by call type earning error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      status: 500
    });
  }
};

// Filter earnings by category
const filterByCategoryEarning = async (req, res) => {
  try {
    const { category_id, date_from, date_to } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      search, 
      call_type,
      sort_by = 'total_earning',
      sort_order = 'desc'
    } = req.query;

    // Validate category_id
    if (!category_id || isNaN(parseInt(category_id))) {
      return res.status(400).json({
        success: false,
        message: 'Valid category_id is required',
        status: 400
      });
    }

    const skip = (page - 1) * limit;

    // Find advisers with the specified category
    const advisers = await User.find({ 
      role_id: 2, 
      Category: { $in: [parseInt(category_id)] } 
    });

    // Get category details
    const category = await Category.findOne({ category_id: parseInt(category_id) });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
        status: 404
      });
    }

    // Build date filter for schedule calls
    let dateFilter = {};
    if (date_from || date_to) {
      dateFilter.date = {};
      if (date_from) {
        dateFilter.date.$gte = new Date(date_from);
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setDate(endDate.getDate() + 1);
        dateFilter.date.$lt = endDate;
      }
    }

    const results = [];
    for (const adviser of advisers) {
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        if (!adviser.name.toLowerCase().includes(searchLower) && 
            !adviser.email?.toLowerCase().includes(searchLower)) {
          continue;
        }
      }

      // Get call earnings with date and call type filters
      let callEarnings;
      if (call_type || date_from || date_to) {
        // Custom earnings calculation with filters
        const match = { 
          advisor_id: adviser.user_id,
          ...dateFilter
        };
        if (call_type) {
          match.call_type = call_type;
        }
        
        const calls = await ScheduleCall.find(match);
        let chat_earning = 0, audio_earning = 0, video_earning = 0, total_earning = 0;
        let chat_count = 0, audio_count = 0, video_count = 0, total_count = 0;
        
        for (const call of calls) {
          const amount = call.Amount || 0;
          
          if (call.call_type === 'Chat') {
            chat_earning += amount;
            chat_count++;
          } else if (call.call_type === 'Audio') {
            audio_earning += amount;
            audio_count++;
          } else if (call.call_type === 'Video') {
            video_earning += amount;
            video_count++;
          }
          
          total_earning += amount;
          total_count++;
        }
        callEarnings = { 
          chat_earning, 
          audio_earning, 
          video_earning, 
          total_earning,
          chat_count,
          audio_count,
          video_count,
          total_count
        };
      } else {
          callEarnings = await getCallEarnings(adviser.user_id, ['Chat', 'Audio', 'Video']);
      }

      const package_earning = await getPackageEarning(adviser.user_id);
      
      results.push({
        adviser_id: adviser.user_id,
        Advisername: adviser.name,
        email: adviser.email,
        mobile: adviser.mobile,
        category: category.category_name,
        category_id: category.category_id,
        total_earning: callEarnings.total_earning,
        chat_earning: callEarnings.chat_earning,
        audio_earning: callEarnings.audio_earning,
        video_earning: callEarnings.video_earning,
        chat_count: callEarnings.chat_count,
        audio_count: callEarnings.audio_count,
        video_count: callEarnings.video_count,
        total_count: callEarnings.total_count,
        available_call_types: callEarnings.available_call_types,
        package_earning,
        rating: adviser.rating,
        experience_year: adviser.experience_year,
        status: adviser.status,
        created_at: adviser.created_at
      });
    }

    // Sort results
    results.sort((a, b) => {
      const aVal = a[sort_by] || 0;
      const bVal = b[sort_by] || 0;
      return sort_order === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Apply pagination
    const totalItems = results.length;
    const paginatedResults = results.slice(skip, skip + parseInt(limit));

    // Get available call types for filter options
    const availableCallTypes = ['CHAT', 'AUDIO', 'VIDEO'];

    return res.status(200).json({
      success: true,
      message: `Earnings filtered by category: ${category.category_name}`,
      data: {
        category: {
          category_id: category.category_id,
          category_name: category.category_name,
          description: category.description
        },
        earnings: paginatedResults,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalItems / limit),
          total_items: totalItems,
          items_per_page: parseInt(limit)
        },
        filters: {
          available_call_types: availableCallTypes
        }
      },
      status: 200
    });
  } catch (error) {
    console.error('Filter by category earning error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      status: 500
    });
  }
};

// Get Earnings by Advisor ID with detailed call information
const getEarningsByAdvisorId = async (req, res) => {
  try {
    const { advisor_id } = req.params;
    const { date_from, date_to } = req.query;
    
    // Validate advisor_id
    if (!advisor_id) {
      return res.status(400).json({
        success: false,
        message: 'advisor_id is required',
        status: 400
      });
    }
    
    // Find advisor
    const adviser = await User.findOne({ user_id: Number(advisor_id), role_id: 2 });
    
    if (!adviser) {
      return res.status(404).json({
        success: false,
        message: 'Advisor not found',
        status: 404
      });
    }
    
    // Get advisor's call types
    const advisorCallTypes = await CallTypeModel.find({ adviser_id: Number(advisor_id) });
    const callTypeIds = advisorCallTypes.map(ct => ct.call_type_id);
    
    // Create map for quick lookup
    const callTypeMap = {};
    advisorCallTypes.forEach(ct => {
      callTypeMap[ct.call_type_id] = ct;
    });
    
    // Build date filter
    let dateFilter = {};
    if (date_from || date_to) {
      dateFilter.date = {};
      if (date_from) {
        dateFilter.date.$gte = new Date(date_from);
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setDate(endDate.getDate() + 1);
        dateFilter.date.$lt = endDate;
      }
    }
    
    // Get all schedule calls for this advisor with date filter
    const scheduleCalls = await ScheduleCall.find({ 
      advisor_id: Number(advisor_id),
      call_type_id: { $in: callTypeIds },
      callStatus: 'Completed',
      ...dateFilter
    })
      .populate({ 
        path: 'created_by', 
        model: 'User', 
        localField: 'created_by', 
        foreignField: 'user_id', 
        select: 'user_id name email mobile' 
      })
      .sort({ created_at: -1 });
    
    // Build detailed call earnings array
    const detailedEarnings = [];
    let totalAdvisorEarning = 0;
    let totalAdminEarning = 0;
    let totalEarning = 0;
    
    for (const call of scheduleCalls) {
      const callType = callTypeMap[call.call_type_id];
      
      if (!callType) continue;
      
      const amount = call.Amount || 0;
      const advisorCommission = (amount * (callType.adviser_commission || 0)) / 100;
      const adminCommission = (amount * (callType.admin_commission || 0)) / 100;
      
      detailedEarnings.push({
        schedule_id: call.schedule_id,
        user_name: call.created_by ? call.created_by.name : 'Unknown',
        user_email: call.created_by ? call.created_by.email : null,
        user_mobile: call.created_by ? call.created_by.mobile : null,
        datetime: call.date || call.created_at,
        call_type_id: callType.mode_name,
        price: call.perminRate || 0,
        duration: call.Call_duration || 0,
        total_earning: amount,
        Advisor_earning: advisorCommission,
        Admin_Earning: adminCommission,
        callStatus: call.callStatus,
        schedule_type: call.schedule_type
      });
      
      totalAdvisorEarning += advisorCommission;
      totalAdminEarning += adminCommission;
      totalEarning += amount;
    }
    
    // Get category details
    const category = adviser.Category && adviser.Category.length > 0 
      ? await Category.findOne({ category_id: adviser.Category[0] }) 
      : null;
    
    // Get aggregated earnings
    const callEarnings = await getCallEarnings(adviser.user_id, ['Chat', 'Audio', 'Video']);
    const package_earning = await getPackageEarning(adviser.user_id);
    
    // Get package-wise earnings with user details
    let packageQuery = { subscribe_by: Number(advisor_id) };
    
    // Apply date filter to package subscriptions if provided
    if (date_from || date_to) {
      packageQuery.created_at = {};
      if (date_from) {
        packageQuery.created_at.$gte = new Date(date_from);
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setDate(endDate.getDate() + 1);
        packageQuery.created_at.$lt = endDate;
      }
    }
    
    const packageSubscriptions = await PackageSubscription.find(packageQuery)
      .sort({ created_at: -1 });
    
    // Build detailed package earnings array
    const packageWiseEarnings = [];
    let totalPackageEarning = 0;
    
    for (const subscription of packageSubscriptions) {
      // Get subscriber (user who subscribed to this advisor's package)
      const subscriber = await User.findOne({ user_id: subscription.created_by });
      
      // Get advisor package details
      const advisorPackage = await AdvisorPackage.findOne({ 
        Advisor_Package_id: subscription.package_id 
      });
      
      // Calculate package earning (sum of all prices)
      let packageEarningAmount = 0;
      if (advisorPackage) {
        packageEarningAmount = (advisorPackage.Chat_price || 0) + 
                               (advisorPackage.Audio_price || 0) + 
                               (advisorPackage.Video_price || 0);
      }
      
      packageWiseEarnings.push({
        subscription_id: subscription.PkSubscription_id,
        package_id: subscription.package_id,
        package_name: advisorPackage ? advisorPackage.packege_name : null,
        
        // Package Details
        package_details: advisorPackage ? {
          Chat_minute: advisorPackage.Chat_minute,
          Chat_Schedule: advisorPackage.Chat_Schedule,
          Chat_price: advisorPackage.Chat_price,
          Audio_minute: advisorPackage.Audio_minute,
          Audio_Schedule: advisorPackage.Audio_Schedule,
          Audio_price: advisorPackage.Audio_price,
          Video_minute: advisorPackage.Video_minute,
          Video_Schedule: advisorPackage.Video_Schedule,
          Video_price: advisorPackage.Video_price,
          total_price: packageEarningAmount
        } : null,
        
        // Subscriber (User who bought the package) Details
        subscriber_details: subscriber ? {
          user_id: subscriber.user_id,
          name: subscriber.name,
          email: subscriber.email,
          mobile: subscriber.mobile,
          profile_image: subscriber.profile_image
        } : null,
        
        // Subscription Status
        subscription_status: subscription.Subscription_status,
        expire_status: subscription.Expire_status,
        expire_date: subscription.Expire_Date,
        remaining_minute: subscription.Remaining_minute,
        remaining_schedule: subscription.Remaining_Schedule,
        
        // Earning
        package_earning: packageEarningAmount,
        
        // Timestamps
        created_at: subscription.created_at,
        updated_at: subscription.updated_at
      });
      
      totalPackageEarning += packageEarningAmount;
    }
    
    return res.status(200).json({
      success: true,
      message: 'Advisor earnings retrieved successfully',
      data: {
        advisor_info: {
          adviser_id: adviser.user_id,
          Advisername: adviser.name,
          email: adviser.email,
          mobile: adviser.mobile,
          profile_image: adviser.profile_image,
          category: category ? category.category_name : null,
          category_id: category ? category.category_id : null,
          rating: adviser.rating,
          experience_year: adviser.experience_year,
          status: adviser.status,
          
          // Total earnings by call type
          total_Chat_earning: callEarnings.chat_earning,
          total_Audio_earning: callEarnings.audio_earning,
          total_Video_earning: callEarnings.video_earning,
          total_earning: callEarnings.total_earning
        },
        
        // Detailed call-by-call earnings
        detailed_earnings: detailedEarnings,
        
        // Package-wise earnings with user details
        package_wise_earnings: packageWiseEarnings,
        
        // Summary
        summary: {
          // Call earnings summary
          total_calls: detailedEarnings.length,
          total_call_earning: totalEarning,
          total_advisor_earning: totalAdvisorEarning,
          total_admin_earning: totalAdminEarning,
          
          // Breakdown by call type
          chat_earning: callEarnings.chat_earning,
          audio_earning: callEarnings.audio_earning,
          video_earning: callEarnings.video_earning,
          
          chat_count: callEarnings.chat_count,
          audio_count: callEarnings.audio_count,
          video_count: callEarnings.video_count,
          
          // Package earnings summary
          total_package_subscriptions: packageWiseEarnings.length,
          total_package_earning: totalPackageEarning,
          active_subscriptions: packageWiseEarnings.filter(p => p.subscription_status === 'Actived').length,
          expired_subscriptions: packageWiseEarnings.filter(p => p.subscription_status === 'Expired').length,
          
          // Grand total
          grand_total_earning: totalEarning + totalPackageEarning
        },
        
        // Applied filters
        filters: {
          date_from: date_from || null,
          date_to: date_to || null
        }
      },
      status: 200
    });
  } catch (error) {
    console.error('Get earnings by advisor ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      status: 500
    });
  }
};

module.exports = { 
  getAdviserEarning, 
  filterByCallTypeEarning, 
  filterByCategoryEarning,
  getEarningsByAdvisorId
}; 