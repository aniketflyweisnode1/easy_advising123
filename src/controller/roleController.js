const Role = require('../models/role.model');
const User = require('../models/User.model');

// Create role (with auth)
const createRole = async (req, res) => {
  try {
    const { name, description } = req.body;
    const created_by = req.user.user_id;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    // Check if role name already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }

    // Create new role
    const newRole = new Role({
      name,
      description: description || '',
      created_by,
      updated_by: created_by
    });

    await newRole.save();

    return res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: {
        role_id: newRole.role_id,
        name: newRole.name,
        description: newRole.description,
        status: newRole.status,
        created_by: newRole.created_by,
        created_at: newRole.created_at,
        updated_by: newRole.updated_by,
        updated_on: newRole.updated_on
      }
    });

  } catch (error) {
    console.error('Create role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update role (with auth)
const updateRole = async (req, res) => {
  try {
    const { role_id } = req.params;
    const { name, description, permissions, status } = req.body;
    const updated_by = req.user.user_id;

    // Find role by role_id
    const role = await Role.findOne({ role_id: parseInt(role_id) });
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if new name already exists (if name is being updated)
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Role with this name already exists'
        });
      }
    }

    // Update role
    const updateData = {
      updated_by,
      updated_on: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (status !== undefined) updateData.status = status;

    const updatedRole = await Role.findOneAndUpdate(
      { role_id: parseInt(role_id) },
      updateData,
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: {
        role_id: updatedRole.role_id,
        name: updatedRole.name,
        description: updatedRole.description,
        permissions: updatedRole.permissions,
        status: updatedRole.status,
        created_by: updatedRole.created_by,
        created_at: updatedRole.created_at,
        updated_by: updatedRole.updated_by,
        updated_on: updatedRole.updated_on
      }
    });

  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get role by ID
const getRoleById = async (req, res) => {
  try {
    const { role_id } = req.params;

    const role = await Role.findOne({ role_id: parseInt(role_id) });
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Role retrieved successfully',
      data: {
        role_id: role.role_id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        status: role.status,
        created_by: role.created_by,
        created_at: role.created_at,
        updated_by: role.updated_by,
        updated_on: role.updated_on
      }
    });

  } catch (error) {
    console.error('Get role by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status !== undefined) {
      query.status = parseInt(status);
    }

    // Get roles with pagination
    const roles = await Role.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalRoles = await Role.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Roles retrieved successfully',
      data: {
        roles: roles.map(role => ({
          role_id: role.role_id,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          status: role.status,
          created_by: role.created_by,
          created_at: role.created_at,
          updated_by: role.updated_by,
          updated_on: role.updated_on
        })),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalRoles / limit),
          total_items: totalRoles,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all roles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get users by role ID (with auth)
const getUsersByRoleId = async (req, res) => {
  try {
    const { role_id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Check if role exists
    const role = await Role.findOne({ role_id: parseInt(role_id) });
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Get users with this role
    const users = await User.find({ role_id: parseInt(role_id) })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalUsers = await User.countDocuments({ role_id: parseInt(role_id) });

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        role: {
          role_id: role.role_id,
          name: role.name,
          description: role.description
        },
        users: users.map(user => ({
          user_id: user.user_id,
          name: user.name,
          mobile: user.mobile,
          login_permission_status: user.login_permission_status,
          status: user.status,
          created_at: user.created_at
        })),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalUsers / limit),
          total_items: totalUsers,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users by role ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createRole,
  updateRole,
  getRoleById,
  getAllRoles,
  getUsersByRoleId
}; 