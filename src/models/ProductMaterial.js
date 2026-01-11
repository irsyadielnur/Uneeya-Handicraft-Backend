module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'ProductMaterial',
    {
      product_material_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      material_name: DataTypes.STRING,
    },
    {
      tableName: 'product_materials',
      timestamps: false,
    }
  );
};
