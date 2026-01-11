module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'ProductImage',
    {
      product_image_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'product_images',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );
};
