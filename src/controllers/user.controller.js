const { User, Order, sequelize } = require('../models');

// Get All Customers (Khusus Admin)
exports.getAllCustomers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role_id: 1 },
      attributes: ['user_id', 'username', 'email', 'phone', 'profile_pic', 'created_at'],
      include: [
        {
          model: Order,
          attributes: ['order_id', 'status', 'grand_total', 'created_at'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const customerData = users.map((user) => {
      const completedOrders = user.Orders.filter((o) => o.status === 'completed');
      const totalSpent = completedOrders.reduce((sum, o) => sum + parseInt(o.grand_total), 0);

      return {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        profile_pic: user.profile_pic,
        joined_at: user.created_at,
        total_orders: user.Orders.length,
        total_spent: totalSpent,
        recent_order: user.Orders[0] || null,
        orders: user.Orders,
      };
    });

    res.json(customerData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
