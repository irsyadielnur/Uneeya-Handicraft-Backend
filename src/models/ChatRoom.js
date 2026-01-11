module.exports = (sequelize, DataTypes) => {
  const ChatRoom = sequelize.define(
    'ChatRoom',
    {
      chatroom_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
      },
      last_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      unread_count_user: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      unread_count_admin: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'chat_rooms',
      timestamps: true,
    }
  );

  return ChatRoom;
};
