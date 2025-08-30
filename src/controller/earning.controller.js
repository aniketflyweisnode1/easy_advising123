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
    const { call_type } = req.params;
    const advisers = await User.find({ role_id: 2 });
    const results = [];
    for (const adviser of advisers) {
      const category = adviser.Category && adviser.Category.length > 0 ? await Category.findOne({ category_id: adviser.Category[0] }) : null;
      const callEarnings = await getCallEarnings(adviser.user_id, call_type);
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

module.exports = { getAdviserEarning, filterByCallTypeEarning }; 