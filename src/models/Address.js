module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'Address',
    {
      address_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      label: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Rumah',
        comment: 'Label alamat (contoh: Rumah, Kantor, Apartemen)',
      },
      receiver_name: DataTypes.STRING,
      phone: DataTypes.STRING,
      province_id: DataTypes.INTEGER,
      province_name: DataTypes.STRING,
      city_id: DataTypes.INTEGER,
      city_name: DataTypes.STRING,
      postal_code: DataTypes.STRING,
      address: DataTypes.TEXT,
      is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'addresses',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
};
