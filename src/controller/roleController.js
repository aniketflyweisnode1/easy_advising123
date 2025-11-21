const Role = require('../models/role.model');
const User = require('../models/User.model');

// Create role (with auth)
const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
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
      permissions: permissions || [],
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
        permissions: newRole.permissions,
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
    const { status = true } = req.query;

    // Build query
    const query = {};
    if (status !== undefined) {
      // Handle different status formats: 'true'/'false', '1'/'0', 1/0
      let statusValue;
      if (status === 'true' || status === true) {
        statusValue = 1;
      } else if (status === 'false' || status === false) {
        statusValue = 0;
      } else {
        statusValue = parseInt(status);
        // If parseInt returns NaN, don't add to query
        if (isNaN(statusValue)) {
          statusValue = undefined;
        }
      }
      if (statusValue !== undefined) {
        query.status = statusValue;
      }
    }

    // Get roles without pagination
    const roles = await Role.find(query)
      .sort({ created_at: -1 });

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
        }))
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
      .sort({ created_at: -1 });

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
        }))
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

// Validate permissions format
const validatePermissions = (permissions) => {
  const errors = [];
  
  if (!Array.isArray(permissions)) {
    errors.push('Permissions must be an array');
    return { isValid: false, errors };
  }

  // Define valid permission structure
  const validModules = [
    'users', 'roles', 'categories', 'subcategories', 'skills', 
    'packages', 'schedule_calls', 'tickets', 'notifications', 
    'earnings', 'transactions', 'reviews', 'banners', 'blogs',
    'faqs', 'pages', 'settings', 'withdrawals'
  ];

  const validActions = ['create', 'read', 'update', 'delete', 'manage'];

  for (let i = 0; i < permissions.length; i++) {
    const permission = permissions[i];
    
    if (typeof permission !== 'object' || permission === null) {
      errors.push(`Permission at index ${i} must be an object`);
      continue;
    }

    if (!permission.module || typeof permission.module !== 'string') {
      errors.push(`Permission at index ${i} must have a valid module`);
      continue;
    }

    if (!validModules.includes(permission.module)) {
      errors.push(`Permission at index ${i} has invalid module: ${permission.module}`);
    }

    if (!permission.actions || !Array.isArray(permission.actions)) {
      errors.push(`Permission at index ${i} must have actions array`);
      continue;
    }

    for (let j = 0; j < permission.actions.length; j++) {
      const action = permission.actions[j];
      if (!validActions.includes(action)) {
        errors.push(`Permission at index ${i} has invalid action: ${action}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Update role permissions specifically
const updateRolePermissions = async (req, res) => {
  try {
    const { role_id } = req.params;
    const { permissions } = req.body;
    const updated_by = req.user.user_id;

    // Validate permissions
    const validationResult = validatePermissions(permissions);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid permissions format',
        errors: validationResult.errors
      });
    }

    // Find role by role_id
    const role = await Role.findOne({ role_id: parseInt(role_id) });
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Update only permissions
    const updatedRole = await Role.findOneAndUpdate(
      { role_id: parseInt(role_id) },
      { 
        permissions,
        updated_by,
        updated_on: new Date()
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Role permissions updated successfully',
      data: {
        role_id: updatedRole.role_id,
        name: updatedRole.name,
        permissions: updatedRole.permissions,
        updated_by: updatedRole.updated_by,
        updated_on: updatedRole.updated_on
      }
    });

  } catch (error) {
    console.error('Update role permissions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Add permission to role
const addPermissionToRole = async (req, res) => {
  try {
    const { role_id } = req.params;
    const { module, actions } = req.body;
    const updated_by = req.user.user_id;

    // Validate input
    if (!module || !actions || !Array.isArray(actions)) {
      return res.status(400).json({
        success: false,
        message: 'Module and actions are required'
      });
    }

    // Find role
    const role = await Role.findOne({ role_id: parseInt(role_id) });
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if permission already exists for this module
    const existingPermissionIndex = role.permissions.findIndex(p => p.module === module);
    
    if (existingPermissionIndex !== -1) {
      // Merge actions with existing permission
      const existingActions = role.permissions[existingPermissionIndex].actions;
      const newActions = [...new Set([...existingActions, ...actions])];
      role.permissions[existingPermissionIndex].actions = newActions;
    } else {
      // Add new permission
      role.permissions.push({ module, actions });
    }

    // Validate the updated permissions
    const validationResult = validatePermissions(role.permissions);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid permissions format after update',
        errors: validationResult.errors
      });
    }

    // Save updated role
    role.updated_by = updated_by;
    role.updated_on = new Date();
    await role.save();

    return res.status(200).json({
      success: true,
      message: 'Permission added to role successfully',
      data: {
        role_id: role.role_id,
        name: role.name,
        permissions: role.permissions,
        updated_by: role.updated_by,
        updated_on: role.updated_on
      }
    });

  } catch (error) {
    console.error('Add permission to role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Remove permission from role
const removePermissionFromRole = async (req, res) => {
  try {
    const { role_id } = req.params;
    const { module, actions } = req.body;
    const updated_by = req.user.user_id;

    // Validate input
    if (!module) {
      return res.status(400).json({
        success: false,
        message: 'Module is required'
      });
    }

    // Find role
    const role = await Role.findOne({ role_id: parseInt(role_id) });
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Find permission index
    const permissionIndex = role.permissions.findIndex(p => p.module === module);
    if (permissionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found for this module'
      });
    }

    if (actions && Array.isArray(actions)) {
      // Remove specific actions
      const currentActions = role.permissions[permissionIndex].actions;
      const updatedActions = currentActions.filter(action => !actions.includes(action));
      
      if (updatedActions.length === 0) {
        // Remove entire permission if no actions left
        role.permissions.splice(permissionIndex, 1);
      } else {
        // Update actions
        role.permissions[permissionIndex].actions = updatedActions;
      }
    } else {
      // Remove entire permission
      role.permissions.splice(permissionIndex, 1);
    }

    // Save updated role
    role.updated_by = updated_by;
    role.updated_on = new Date();
    await role.save();

    return res.status(200).json({
      success: true,
      message: 'Permission removed from role successfully',
      data: {
        role_id: role.role_id,
        name: role.name,
        permissions: role.permissions,
        updated_by: role.updated_by,
        updated_on: role.updated_on
      }
    });

  } catch (error) {
    console.error('Remove permission from role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all available permissions/modules
const getAvailablePermissions = async (req, res) => {
  try {
    const availablePermissions = {
      modules: [
        { name: 'users', display_name: 'User Management', description: 'Manage users and their accounts' },
        { name: 'roles', display_name: 'Role Management', description: 'Manage roles and permissions' },
        { name: 'categories', display_name: 'Category Management', description: 'Manage categories' },
        { name: 'subcategories', display_name: 'Subcategory Management', description: 'Manage subcategories' },
        { name: 'skills', display_name: 'Skill Management', description: 'Manage skills' },
        { name: 'packages', display_name: 'Package Management', description: 'Manage packages and subscriptions' },
        { name: 'schedule_calls', display_name: 'Schedule Call Management', description: 'Manage scheduled calls' },
        { name: 'tickets', display_name: 'Ticket Management', description: 'Manage support tickets' },
        { name: 'notifications', display_name: 'Notification Management', description: 'Manage notifications' },
        { name: 'earnings', display_name: 'Earning Management', description: 'Manage earnings and reports' },
        { name: 'transactions', display_name: 'Transaction Management', description: 'Manage transactions' },
        { name: 'reviews', display_name: 'Review Management', description: 'Manage reviews and ratings' },
        { name: 'banners', display_name: 'Banner Management', description: 'Manage banners and promotions' },
        { name: 'blogs', display_name: 'Blog Management', description: 'Manage blog posts' },
        { name: 'faqs', display_name: 'FAQ Management', description: 'Manage frequently asked questions' },
        { name: 'pages', display_name: 'Page Management', description: 'Manage static pages' },
        { name: 'settings', display_name: 'Settings Management', description: 'Manage system settings' },
        { name: 'withdrawals', display_name: 'Withdrawal Management', description: 'Manage withdrawal requests' }
      ],
      actions: [
        { name: 'create', display_name: 'Create', description: 'Create new records' },
        { name: 'read', display_name: 'Read', description: 'View and read records' },
        { name: 'update', display_name: 'Update', description: 'Modify existing records' },
        { name: 'delete', display_name: 'Delete', description: 'Remove records' },
        { name: 'manage', display_name: 'Manage', description: 'Full management access' }
      ]
    };

    return res.status(200).json({
      success: true,
      message: 'Available permissions retrieved successfully',
      data: availablePermissions
    });

  } catch (error) {
    console.error('Get available permissions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Check if user has specific permission
const checkUserPermission = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { module, action } = req.query;

    if (!module || !action) {
      return res.status(400).json({
        success: false,
        message: 'Module and action are required'
      });
    }

    // Get user with role
    const user = await User.findOne({ user_id: parseInt(user_id) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get role with permissions
    const role = await Role.findOne({ role_id: user.role_id });
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check permission
    const hasPermission = role.permissions.some(permission => 
      permission.module === module && 
      (permission.actions.includes(action) || permission.actions.includes('manage'))
    );

    return res.status(200).json({
      success: true,
      message: 'Permission check completed',
      data: {
        user_id: user.user_id,
        role_id: user.role_id,
        role_name: role.name,
        module,
        action,
        has_permission: hasPermission
      }
    });

  } catch (error) {
    console.error('Check user permission error:', error);
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
  getUsersByRoleId,
  updateRolePermissions,
  addPermissionToRole,
  removePermissionFromRole,
  getAvailablePermissions,
  checkUserPermission,
  validatePermissions
}; 