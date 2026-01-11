const { Permission, Role, RolePermission, sequelize } = require('../models');

const PERMISSIONS_LIST = [
  // --- Fitur Customer (Belanja) ---
  { permission_name: 'manage_cart', description: 'Mengelola keranjang belanja' },
  { permission_name: 'manage_favorites', description: 'Mengelola produk favorit' },
  { permission_name: 'create_order', description: 'Melakukan checkout pesanan' },
  { permission_name: 'view_own_orders', description: 'Melihat riwayat pesanan sendiri' },
  { permission_name: 'manage_review', description: 'Memberikan penilaian produk' },

  // --- Fitur All Admin ---
  { permission_name: 'dashboard-stats', description: 'Tampilan Dashboard, Grafik, Pesanan Terbaru' },

  // --- Fitur Marketing Admin ---
  { permission_name: 'manage_products', description: 'CRUD Produk (Create, Update, Delete)' },
  { permission_name: 'manage_customers', description: 'Mengatur akun pelanggan' },
  { permission_name: 'chat_customers', description: 'Berdiskusi dengan Pelanggan' },

  // --- Fitur Sales Admin ---
  { permission_name: 'manage_orders', description: 'Mengelola seluruh pesanan masuk (Update Status, dll)' },
  { permission_name: 'approve_report', description: 'Membuat atau memvalidasi laporan penjualan' },

  // --- Fitur Umum/Admin ---
  { permission_name: 'manage_profile', description: 'Mengubah profil sendiri' },

  // --- Fitur Khusus Owner
  { permission_name: 'manage_shop', description: 'Mengelola pengguna (Khusus Owner jika perlu)' },
];

const ROLES_CONFIG = {
  customer: ['manage_cart', 'manage_favorites', 'create_order', 'view_own_orders', 'manage_review', 'manage_profile'],
  marketing_admin: ['manage_products', 'manage_customers', 'chat_customers', 'dashboard-stats', 'manage_profile'],
  sales_admin: ['manage_orders', 'approve_report', 'dashboard-stats', 'manage_profile'],
  owner: ['manage_products', 'manage_orders', 'manage_customers', 'chat_customers', 'manage_shop', 'approve_report', 'dashboard-stats', 'manage_profile'],
};

const seedPermissions = async () => {
  const t = await sequelize.transaction();
  try {
    console.log('Seeding Permissions & Roles...');
    // 1. Create Permissions
    const dbPermissions = [];
    for (const perm of PERMISSIONS_LIST) {
      const [p] = await Permission.findOrCreate({
        where: { permission_name: perm.permission_name },
        defaults: {
          permission_name: perm.permission_name,
          description: perm.description,
        },
        transaction: t,
      });
      dbPermissions.push(p);
    }

    for (const [roleName, perms] of Object.entries(ROLES_CONFIG)) {
      const [role] = await Role.findOrCreate({
        where: { role_name: roleName },
        defaults: { role_name: roleName },
        transaction: t,
      });

      const currentRolePerms = dbPermissions.filter((p) => perms.includes(p.permission_name));

      if (currentRolePerms.length > 0) {
        await RolePermission.destroy({ where: { role_id: role.role_id }, transaction: t });

        await RolePermission.bulkCreate(
          currentRolePerms.map((p) => ({
            role_id: role.role_id,
            permission_id: p.permission_id,
          })),
          { transaction: t }
        );
      }
    }

    await t.commit();
    console.log('✅ RBAC Permissions & Roles Seeded Successfully!');
  } catch (error) {
    await t.rollback();
    console.error('❌ Failed to seed permissions:', error);
  }
};

module.exports = seedPermissions;
