const bcrypt = require('bcryptjs');
const { User } = require('../models');

const adminUsers = [
  {
    username: 'owner',
    email: 'owner@uneeya.com',
    password: 'owner123',
    role_id: 4,
  },
  {
    username: 'marketing_admin',
    email: 'marketing@uneeya.com',
    password: 'marketing123',
    role_id: 2,
  },
  {
    username: 'sales_admin',
    email: 'sales@uneeya.com',
    password: 'sales123',
    role_id: 3,
  },
];

module.exports = async () => {
  for (const admin of adminUsers) {
    const exists = await User.findOne({ where: { email: admin.email } });
    if (exists) continue;
    const hashedPassword = await bcrypt.hash(admin.password, 10);
    await User.create({
      username: admin.username,
      email: admin.email,
      password: hashedPassword,
      role_id: admin.role_id,
      is_verified: true,
    });

    console.log(`Seeded: ${admin.email}`);
  }
};
