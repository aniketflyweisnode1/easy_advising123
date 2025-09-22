const User = require('../models/User.model');
const ScheduleCall = require('../models/schedule_call.model');
const PackageSubscription = require('../models/package_subscription.model');
const Category = require('../models/category.model');

// Helper to get earnings by call type
async function getCallEarnings(advisorId, callType = null) {
  const match = { advisor_id: advisorId };
  if (callType) {
    match.call_type = callType;
  }
  const calls = await ScheduleCall.find(match);
  let chat_earning = 0, audio_earning = 0, video_earning = 0, total_earning = 0;
  for (const call of calls) {
    if (call.call_type === 'CHAT') chat_earning += call.Amount || 0;
    if (call.call_type === 'AUDIO') audio_earning += call.Amount || 0;
    if (call.call_type === 'VIDEO') video_earning += call.Amount || 0;
    total_earning += call.Amount || 0;
  }
  return { chat_earning, audio_earning, video_earning, total_earning };
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
      const callEarnings = await getCallEarnings(adviser.user_id);
      const package_earning = await getPackageEarning(adviser.user_id);
      results.push({
        adviser_id: adviser.user_id,
        Advisername: adviser.name,
        category: category ? category.category_name : null,
        total_earning: callEarnings.total_earning,
        chat_earning: callEarnings.chat_earning,
        audio_earning: callEarnings.audio_earning,
        video_earning: callEarnings.video_earning,
        package_earning
      });
    }
    return res.status(200).json({ earnings: results, status: 200 });
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
        for (const call of calls) {
          if (call.call_type === 'CHAT') chat_earning += call.Amount || 0;
          if (call.call_type === 'AUDIO') audio_earning += call.Amount || 0;
          if (call.call_type === 'VIDEO') video_earning += call.Amount || 0;
          total_earning += call.Amount || 0;
        }
        callEarnings = { chat_earning, audio_earning, video_earning, total_earning };
      } else {
        callEarnings = await getCallEarnings(adviser.user_id, call_type);
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
        for (const call of calls) {
          if (call.call_type === 'CHAT') chat_earning += call.Amount || 0;
          if (call.call_type === 'AUDIO') audio_earning += call.Amount || 0;
          if (call.call_type === 'VIDEO') video_earning += call.Amount || 0;
          total_earning += call.Amount || 0;
        }
        callEarnings = { chat_earning, audio_earning, video_earning, total_earning };
      } else {
        callEarnings = await getCallEarnings(adviser.user_id);
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

module.exports = { getAdviserEarning, filterByCallTypeEarning, filterByCategoryEarning }; 