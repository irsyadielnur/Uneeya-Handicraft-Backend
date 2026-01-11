module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'ProductColor',
    {
      product_color_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      color_name: DataTypes.STRING,
      stock: DataTypes.INTEGER,
    },
    {
      tableName: 'product_colors',
      timestamps: false,
    }
  );
};
