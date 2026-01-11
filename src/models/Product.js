module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      product_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      category: DataTypes.STRING,
      unique_character: DataTypes.STRING,
      size_length: DataTypes.FLOAT,
      size_width: DataTypes.FLOAT,
      size_height: DataTypes.FLOAT,
      price: DataTypes.INTEGER,
      capital: DataTypes.INTEGER,
      profit: DataTypes.INTEGER,
      weight: DataTypes.INTEGER,
      is_custom: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      assigned_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      rating_avg: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0,
      },
      rating_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'products',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Product;
};
