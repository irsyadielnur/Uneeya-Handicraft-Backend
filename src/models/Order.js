module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'Order',
    {
      order_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      address_snapshot: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      total_price: DataTypes.INTEGER,
      shipping_cost: DataTypes.INTEGER,
      grand_total: DataTypes.INTEGER,
      status: {
        type: DataTypes.ENUM('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled'),
        defaultValue: 'pending',
      },
    },
    {
      tableName: 'orders',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
};
