module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'Favorite',
    {
      favorite_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'favorites',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );
};
