const { Role } = require('../models');

const rolesData = [
  { role_id: 1, role_name: 'customer' },
  { role_id: 2, role_name: 'marketing_admin' },
  { role_id: 3, role_name: 'sales_admin' },
  { role_id: 4, role_name: 'owner' },
];

module.exports = async () => {
  for (const role of rolesData) {
    const exists = await Role.findByPk(role.role_id);

    if (!exists) {
      await Role.create(role);
      console.log(`Role seeded: ${role.role_name}`);
    }
  }
};
