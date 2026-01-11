const { RolePermission, Permission } = require('../models');

module.exports = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.role_id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const roleId = req.user.role_id;

      // Owner selalu boleh
      if (roleId === 4) {
        return next();
      }

      const permission = await Permission.findOne({
        where: { permission_name: requiredPermission },
      });

      if (!permission) {
        return res.status(500).json({
          message: 'Permission not registered in system',
        });
      }

      const rolePermission = await RolePermission.findOne({
        where: {
          role_id: roleId,
          permission_id: permission.permission_id,
        },
      });

      if (!rolePermission) {
        return res.status(403).json({
          message: 'Forbidden: missing required permission',
        });
      }

      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
