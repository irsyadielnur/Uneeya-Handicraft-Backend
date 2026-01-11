module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'ProductTextFeature',
    {
      product_text_feature_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      raw_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      clean_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'product_text_features',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
};
