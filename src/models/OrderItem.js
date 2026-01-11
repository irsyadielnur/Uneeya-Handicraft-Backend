module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'OrderItem',
    {
      order_item_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      product_id: DataTypes.INTEGER,
      product_name: DataTypes.STRING,
      color_name: DataTypes.STRING,
      price: DataTypes.INTEGER,
      qty: DataTypes.INTEGER,
      subtotal: DataTypes.INTEGER,
    },
    {
      tableName: 'order_items',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );
};
