module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    'SalesReport',
    {
      report_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      report_number: { type: DataTypes.STRING, allowNull: false },
      start_date: DataTypes.DATEONLY,
      end_date: DataTypes.DATEONLY,
      total_sales: DataTypes.INTEGER,
      total_transactions: DataTypes.INTEGER,

      // --- FIELD BARU ---
      total_customers: DataTypes.INTEGER, // Jumlah customer terdaftar saat laporan dibuat
      products_summary: DataTypes.JSON, // Array: [{name, qty, total}, ...]
      // ------------------

      proof_image: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
      },
      notes: DataTypes.TEXT,
      created_by: DataTypes.INTEGER,
    },
    {
      tableName: 'sales_reports',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
};
