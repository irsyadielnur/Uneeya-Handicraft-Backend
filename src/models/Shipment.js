module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'Shipment',
    {
      shipment_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      courier: DataTypes.STRING,
      service: DataTypes.STRING,
      etd: DataTypes.STRING,
      shipping_cost: DataTypes.INTEGER,
      tracking_number: DataTypes.STRING,
      status: DataTypes.STRING,
    },
    {
      tableName: 'shipments',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
};
