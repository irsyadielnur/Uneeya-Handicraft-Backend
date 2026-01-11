module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'ShopSetting',
    {
      setting_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      shop_name: { type: DataTypes.STRING, defaultValue: 'Uneeya Handicraft' },
      logo_url: DataTypes.STRING,

      // Kontak & Sosmed
      email_address: DataTypes.STRING,
      whatsapp_number: DataTypes.STRING,
      instagram_username: DataTypes.STRING,
      tiktok_username: DataTypes.STRING,

      // Alamat Toko (Origin Pengiriman)
      province_id: DataTypes.STRING,
      province_name: DataTypes.STRING,
      city_id: DataTypes.STRING,
      city_name: DataTypes.STRING,
      full_address: DataTypes.TEXT,
    },
    {
      tableName: 'shop_settings',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
};
