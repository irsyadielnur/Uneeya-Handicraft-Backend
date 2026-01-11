const { Role } = require('../models');

const ROLE_MAP = {
  customer: 1,
  marketing_admin: 2,
  sales_admin: 3,
  owner: 4,
};

module.exports = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.role_id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userRoleId = req.user.role_id;

      // Owner selalu boleh
      if (userRoleId === ROLE_MAP.owner) {
        return next();
      }

      // Konversi role_name → role_id jika perlu
      const allowedRoleIds = allowedRoles.map((role) => {
        return typeof role === 'string' ? ROLE_MAP[role] : role;
      });

      if (!allowedRoleIds.includes(userRoleId)) {
        return res.status(403).json({
          message: 'Forbidden: insufficient access rights',
        });
      }

      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
