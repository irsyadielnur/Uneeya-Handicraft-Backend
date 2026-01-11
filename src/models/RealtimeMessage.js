module.exports = (sequelize, DataTypes) => {
  const RealtimeMessage = sequelize.define(
    'RealtimeMessage',
    {
      chat_realtime_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'chat_rooms',
          key: 'chatroom_id',
        },
      },
      sender_role: {
        type: DataTypes.ENUM('user', 'admin'),
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        defaultValue: 'text',
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'realtime_messages',
      timestamps: true,
    }
  );

  return RealtimeMessage;
};
