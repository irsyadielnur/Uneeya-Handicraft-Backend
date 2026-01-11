module.exports = (sequelize, DataTypes) => {
  const EmailOtp = sequelize.define(
    'EmailOtp',
    {
      otp_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      otp_code: {
        type: DataTypes.STRING(6),
        allowNull: false,
      },
      expired_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'email_otps',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return EmailOtp;
};
