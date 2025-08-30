const PageManagement = require('../models/page_management.model');
const User = require('../models/User.model');
// Create page (with auth)
const createPage = async (req, res) => {
  try {
    const { title, ToBoth, postedby, content } = req.body;
    const created_by = req.user.user_id;
    const page = new PageManagement({
      title,
      ToBoth,
      postedby,
      content,
      created_by
    });
    await page.save();
    res.status(201).json({ success: true, message: 'Page created successfully', data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const createPageByRole = async (req, res) => {
  try {
    const { title, ToRole_id, postedby, content } = req.body;
    const created_by = req.user.user_id;
    const page = new PageManagement({
      title,
      ToRole_id,
      postedby,
      content,
      created_by
    });
    await page.save();
    res.status(201).json({ success: true, message: 'Page created successfully', data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Update page (with auth, id in body)
const updatePage = async (req, res) => {
  try {
    const { id, title, ToBoth, postedby, content, status } = req.body;
    const updated_by = req.user.user_id;
    const updated_at = new Date();
    const page = await PageManagement.findOneAndUpdate(
      { pageMg_id: id },
      { title, ToBoth, postedby, content, status, updated_by, updated_at },
      { new: true }
    );
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, message: 'Page updated successfully', data: page });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get page by ID
const getPageById = async (req, res) => {
  try {
    const { id } = req.params;
    const page = await PageManagement.findOne({ pageMg_id: id });
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

    // Get user details for postedby and created_by
   
    const [postedByUser, createdByUser] = await Promise.all([
      User.findOne({ user_id: page.postedby }, { user_id: 1, name: 1, email: 1, _id: 0 }),
      User.findOne({ user_id: page.created_by }, { user_id: 1, name: 1, _id: 0 })
    ]);

    // Get role details for ToRole_id
    let roleDetails = null;
    if (page.ToRole_id) {
      const Role = require('../models/role.model');
      roleDetails = await Role.findOne(
        { role_id: page.ToRole_id },
        { role_id: 1, role_name: 1, description: 1, _id: 0 }
      );
    }

    const pageWithDetails = {
      ...page.toObject(),
      postedby_user: postedByUser ? {
        user_id: postedByUser.user_id,
        name: postedByUser.name,
        email: postedByUser.email
      } : null,
      created_by_user: createdByUser ? {
        user_id: createdByUser.user_id,
        name: createdByUser.name
      } : null,
      role_details: roleDetails ? {
        role_id: roleDetails.role_id,
        role_name: roleDetails.role_name,
        description: roleDetails.description
      } : null
    };

    res.json({ 
      success: true, 
      data: pageWithDetails 
    });
  } catch (error) {
    console.error('Get page by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Get all pages
const getAllPages = async (req, res) => {
  try {
    const pages = await PageManagement.find().sort({ created_at: -1 });
    
    // Get all unique user IDs from pages
    const userIds = [...new Set([
      ...pages.map(p => p.postedby),
      ...pages.map(p => p.created_by)
    ])];
    
    // Get all unique role IDs
    const roleIds = [...new Set(pages.map(p => p.ToRole_id).filter(id => id))];
    
    // Fetch user details for all user IDs

    const users = await User.find(
      { user_id: { $in: userIds } }, 
      { user_id: 1, name: 1, email: 1, _id: 0 }
    );
    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u; });
    
    // Fetch role details for all role IDs
    let roleMap = {};
    if (roleIds.length > 0) {
      const Role = require('../models/role.model');
      const roles = await Role.find(
        { role_id: { $in: roleIds } },
        { role_id: 1, role_name: 1, description: 1, _id: 0 }
      );
      roles.forEach(r => { roleMap[r.role_id] = r; });
    }
    
    // Map pages to include user and role details
    const pagesWithDetails = pages.map(page => {
      const pageObj = page.toObject();
      return {
        ...pageObj,
        postedby_user: userMap[page.postedby] ? {
          user_id: userMap[page.postedby].user_id,
          name: userMap[page.postedby].name,
          email: userMap[page.postedby].email
        } : null,
        created_by_user: userMap[page.created_by] ? {
          user_id: userMap[page.created_by].user_id,
          name: userMap[page.created_by].name
        } : null,
        role_details: page.ToRole_id && roleMap[page.ToRole_id] ? {
          role_id: roleMap[page.ToRole_id].role_id,
          role_name: roleMap[page.ToRole_id].role_name,
          description: roleMap[page.ToRole_id].description
        } : null
      };
    });

    res.json({ 
      success: true, 
      data: pagesWithDetails,
      count: pagesWithDetails.length
    });
  } catch (error) {
    console.error('Get all pages error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

module.exports = {
  createPage,
  updatePage,
  getPageById,
  getAllPages,
  createPageByRole
}; 