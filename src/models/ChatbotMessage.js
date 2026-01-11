module.exports = (sequelize, DataTypes) => {
  const ChatbotMessage = sequelize.define(
    'ChatbotMessage',
    {
      chatbot_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Sesuaikan dengan nama tabel user kamu
          key: 'user_id',
        },
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sender: {
        type: DataTypes.ENUM('user', 'bot'),
        allowNull: false,
        comment: 'Penanda siapa yang mengirim pesan',
      },
      recommendations: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
    },
    {
      tableName: 'chatbot_messages',
      timestamps: true,
    }
  );

  return ChatbotMessage;
};
