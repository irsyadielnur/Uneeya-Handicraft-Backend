module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'ProductTfidf',
    {
      product_tfidf_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      term: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tf: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      idf: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      tfidf: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      tableName: 'product_tfidf',
      timestamps: false,
    }
  );
};
