const sequelize = require('../config/database');
const Sequelize = require('sequelize');

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.Role = require('./Role')(sequelize, Sequelize);
db.User = require('./User')(sequelize, Sequelize);
db.EmailOtp = require('./EmailOtp')(sequelize, Sequelize);
db.Permission = require('./Permission')(sequelize, Sequelize);
db.RolePermission = require('./RolePermission')(sequelize, Sequelize);
db.Product = require('./Product')(sequelize, Sequelize);
db.ProductMaterial = require('./ProductMaterial')(sequelize, Sequelize);
db.ProductColor = require('./ProductColor')(sequelize, Sequelize);
db.ProductImage = require('./ProductImage')(sequelize, Sequelize);
db.Cart = require('./Cart')(sequelize, Sequelize);
db.Favorite = require('./Favorite')(sequelize, Sequelize);
db.Address = require('./Address')(sequelize, Sequelize);
db.Order = require('./Order')(sequelize, Sequelize);
db.OrderItem = require('./OrderItem')(sequelize, Sequelize);
db.Shipment = require('./Shipment')(sequelize, Sequelize);
db.Payment = require('./Payment')(sequelize, Sequelize);
db.Review = require('./Review')(sequelize, Sequelize);
db.ProductTextFeature = require('./ProductTextFeatures')(sequelize, Sequelize);
db.ProductTfidf = require('./ProductTfidf')(sequelize, Sequelize);
db.SalesReport = require('./SalesReport')(sequelize, Sequelize);
db.ShopSetting = require('./ShopSetting')(sequelize, Sequelize);
db.ChatbotMessage = require('./ChatbotMessage')(sequelize, Sequelize);
db.ChatRoom = require('./ChatRoom')(sequelize, Sequelize);
db.RealtimeMessage = require('./RealtimeMessage')(sequelize, Sequelize);

// Relasi RBAC
db.Role.hasMany(db.User, { foreignKey: 'role_id' });
db.User.belongsTo(db.Role, { foreignKey: 'role_id' });

// Relasi OTP
db.User.hasMany(db.EmailOtp, {
  foreignKey: {
    nae: 'user_id',
    allowNull: false,
  },
  onDelete: 'CASCADE',
});
db.EmailOtp.belongsTo(db.User, { foreignKey: 'user_id' });

// Relasi Many-to-Many: Role - Permission
db.Role.belongsToMany(db.Permission, {
  through: db.RolePermission,
  foreignKey: 'role_id',
});

db.Permission.belongsToMany(db.Role, {
  through: db.RolePermission,
  foreignKey: 'permission_id',
});

// Relasi Product
db.Product.hasMany(db.ProductMaterial, { foreignKey: 'product_id' });
db.ProductMaterial.belongsTo(db.Product, { foreignKey: 'product_id' });

db.Product.hasMany(db.ProductColor, { foreignKey: 'product_id' });
db.ProductColor.belongsTo(db.Product, { foreignKey: 'product_id' });

db.Product.hasMany(db.ProductImage, { foreignKey: 'product_id' });
db.ProductImage.belongsTo(db.Product, { foreignKey: 'product_id' });

// Relasi Cart
db.User.hasMany(db.Cart, { foreignKey: 'user_id' });
db.Cart.belongsTo(db.User, { foreignKey: 'user_id' });

db.Product.hasMany(db.Cart, { foreignKey: 'product_id' });
db.Cart.belongsTo(db.Product, { foreignKey: 'product_id' });

// Relasi Favorite
db.User.belongsToMany(db.Product, {
  through: db.Favorite,
  foreignKey: 'user_id',
  as: 'favorites',
});

db.Product.belongsToMany(db.User, {
  through: db.Favorite,
  foreignKey: 'product_id',
});

db.Favorite.belongsTo(db.Product, { foreignKey: 'product_id' });
db.Favorite.belongsTo(db.User, { foreignKey: 'user_id' });

// Relasi Order, Checkout
db.User.hasMany(db.Address, { foreignKey: 'user_id' });
db.Address.belongsTo(db.User, { foreignKey: 'user_id' });

db.User.hasMany(db.Order, { foreignKey: 'user_id' });
db.Order.belongsTo(db.User, { foreignKey: 'user_id' });

db.Order.hasMany(db.OrderItem, { foreignKey: 'order_id' });
db.OrderItem.belongsTo(db.Order, { foreignKey: 'order_id' });

db.Order.hasOne(db.Shipment, { foreignKey: 'order_id' });
db.Shipment.belongsTo(db.Order, { foreignKey: 'order_id' });

db.Order.hasOne(db.Payment, { foreignKey: 'order_id' });
db.Payment.belongsTo(db.Order, { foreignKey: 'order_id' });

db.OrderItem.belongsTo(db.Product, { foreignKey: 'product_id' });
db.Product.hasMany(db.OrderItem, { foreignKey: 'product_id' });

// Relasi Review
db.User.hasMany(db.Review, { foreignKey: 'user_id' });
db.Review.belongsTo(db.User, { foreignKey: 'user_id' });

db.Product.hasMany(db.Review, { foreignKey: 'product_id' });
db.Review.belongsTo(db.Product, { foreignKey: 'product_id' });

db.Order.hasMany(db.Review, { foreignKey: 'order_id' });
db.Review.belongsTo(db.Order, { foreignKey: 'order_id' });

// Relasi For CBF
db.Product.hasOne(db.ProductTextFeature, { foreignKey: 'product_id' });
db.ProductTextFeature.belongsTo(db.Product, { foreignKey: 'product_id' });

db.Product.hasMany(db.ProductTfidf, { foreignKey: 'product_id' });
db.ProductTfidf.belongsTo(db.Product, { foreignKey: 'product_id' });

// Relasi For Sales Report
db.User.hasMany(db.SalesReport, { foreignKey: 'created_by' });
db.SalesReport.belongsTo(db.User, { foreignKey: 'created_by' });

// Relasi User - Chatbot
db.User.hasMany(db.ChatbotMessage, { foreignKey: 'user_id', as: 'chats' });
db.ChatbotMessage.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

// Relasi Chat-Realtime
db.User.hasOne(db.ChatRoom, { foreignKey: 'user_id', as: 'chatRoom' });
db.ChatRoom.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

db.ChatRoom.hasMany(db.RealtimeMessage, { foreignKey: 'room_id', as: 'messages' });
db.RealtimeMessage.belongsTo(db.ChatRoom, { foreignKey: 'room_id', as: 'room' });

module.exports = db;
