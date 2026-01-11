const { SalesReport, Order, OrderItem, Product, ProductColor, ProductImage, Payment, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Generate Preview (Hitung Omzet sebelum disimpan)
exports.getReportPreview = async (req, res) => {
  const { start_date, end_date } = req.query;

  try {
    // A. Ambil Order Selesai beserta Item-nya
    const orders = await Order.findAll({
      where: {
        status: 'completed',
        created_at: {
          [Op.between]: [`${start_date} 00:00:00`, `${end_date} 23:59:59`],
        },
      },
      include: [
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['name'] }], // Ambil nama produk
        },
      ],
    });

    const totalSales = orders.reduce((sum, order) => sum + parseInt(order.grand_total), 0);
    const totalTransactions = orders.length;

    // B. Hitung Penjualan Per Produk (Grouping)
    const productStats = {};
    orders.forEach((order) => {
      order.OrderItems.forEach((item) => {
        const pId = item.product_id;
        if (!productStats[pId]) {
          productStats[pId] = {
            product_id: pId,
            name: item.Product?.name || 'Produk Dihapus',
            qty: 0,
            total: 0,
          };
        }
        productStats[pId].qty += item.qty;
        productStats[pId].total += parseInt(item.price) * item.qty;
      });
    });
    // Ubah ke Array & Sortir berdasarkan Qty terbanyak (Best Seller)
    const productsSummary = Object.values(productStats).sort((a, b) => b.qty - a.qty);

    // C. Hitung Total Customer Terdaftar (Sampai tanggal akhir laporan)
    const totalCustomers = await User.count({
      where: {
        role_id: 1, // Customer Role
        created_at: { [Op.lte]: `${end_date} 23:59:59` },
      },
    });

    res.json({
      start_date,
      end_date,
      total_sales: totalSales,
      total_transactions: totalTransactions,
      total_customers: totalCustomers, // <-- Data Baru
      products_summary: productsSummary, // <-- Data Baru
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Buat Laporan Baru (Sales Admin)
exports.createReport = async (req, res) => {
  // Tambahkan total_customers & products_summary ke body request
  const { start_date, end_date, total_sales, total_transactions, total_customers, products_summary, notes } = req.body;
  const created_by = req.user.user_id;
  const proofFile = req.file ? `/uploads/reports/${req.file.filename}` : null;

  try {
    const date = new Date();
    const repNum = `REP/${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`;

    // Parse JSON string jika dikirim sebagai string dari FormData
    let parsedProducts = products_summary;
    if (typeof products_summary === 'string') {
      try {
        parsedProducts = JSON.parse(products_summary);
      } catch (e) {}
    }

    const report = await SalesReport.create({
      report_number: repNum,
      start_date,
      end_date,
      total_sales,
      total_transactions,
      total_customers, // <-- Simpan
      products_summary: parsedProducts, // <-- Simpan JSON
      proof_image: proofFile,
      notes,
      created_by,
      status: 'pending',
    });

    res.status(201).json({ message: 'Laporan berhasil dibuat', report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Ambil Semua Laporan
exports.getAllReports = async (req, res) => {
  try {
    const reports = await SalesReport.findAll({
      include: [{ model: User, attributes: ['username'] }],
      order: [['created_at', 'DESC']],
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Ambil 1 laporan
exports.getReportById = async (req, res) => {
  try {
    const { report_id } = req.params;
    const report = await SalesReport.findOne({
      where: { report_id },
      include: [{ model: User, attributes: ['username'] }],
    });

    if (!report) return res.status(404).json({ message: 'Laporan tidak ditemukan' });

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// update laporan by ID
exports.updateReport = async (req, res) => {
  const { report_id } = req.params;
  const { notes } = req.body;
  const newProofFile = req.file ? `/uploads/reports/${req.file.filename}` : null;

  try {
    const report = await SalesReport.findByPk(report_id);
    if (!report) return res.status(404).json({ message: 'Laporan tidak ditemukan' });

    // Update Notes
    if (notes !== undefined) report.notes = notes;

    // Update Bukti (Hapus lama jika ada upload baru)
    if (newProofFile) {
      if (report.proof_image) {
        const oldPath = path.join(__dirname, '../../public', report.proof_image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      report.proof_image = newProofFile;
    }

    await report.save();
    res.json({ message: 'Laporan berhasil diperbarui', report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Hapus Laporan
exports.deleteReport = async (req, res) => {
  const { report_id } = req.params;

  try {
    const report = await SalesReport.findByPk(report_id);
    if (!report) return res.status(404).json({ message: 'Laporan tidak ditemukan' });

    // Opsional: Cegah hapus jika sudah Approved
    if (report.status === 'approved') {
      return res.status(403).json({ message: 'Laporan yang sudah divalidasi tidak dapat dihapus.' });
    }

    // Hapus File Bukti
    if (report.proof_image) {
      const filePath = path.join(__dirname, '../../public', report.proof_image);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await report.destroy();
    res.json({ message: 'Laporan berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// 4. Validasi Laporan (Owner Only)
exports.validateReport = async (req, res) => {
  const { report_id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'

  try {
    const report = await SalesReport.findByPk(report_id);
    if (!report) return res.status(404).json({ message: 'Laporan tidak ditemukan' });

    report.status = status;
    await report.save();

    res.json({ message: `Laporan berhasil diubah statusnya menjadi ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const completedOrders = await Order.findAll({
      where: { status: 'completed' },
      include: [{ model: OrderItem, include: [Product] }],
    });

    let totalRevenue = 0;
    let totalProfit = 0;

    completedOrders.forEach((order) => {
      totalRevenue += parseInt(order.grand_total);
      order.OrderItems.forEach((item) => {
        const capital = item.Product?.capital || 0;
        const profitPerItem = parseInt(item.price) - capital;
        totalProfit += profitPerItem * item.qty;
      });
    });

    const totalTransactions = completedOrders.length;
    const totalCustomers = await User.count({ where: { role_id: 1 } });
    const totalProducts = await Product.count({ where: { is_active: true } });

    const recentOrders = await Order.findAll({
      where: { status: { [Op.notIn]: ['completed', 'cancelled'] } },
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: User, attributes: ['username'] }],
    });

    const outOfStockProducts = await ProductColor.findAll({
      where: {
        stock: { [Op.lte]: 0 }, // Stok <= 0
      },
      limit: 5,
      include: [
        {
          model: Product,
          attributes: ['product_id', 'name'],
          include: [{ model: ProductImage, limit: 1, attributes: ['image_url'] }],
        },
      ],
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const chartDataRaw = await Order.findAll({
      where: {
        status: 'completed',
        created_at: { [Op.gte]: sevenDaysAgo },
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('SUM', sequelize.col('grand_total')), 'daily_revenue'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
    });

    res.json({
      totalRevenue,
      totalProfit,
      totalTransactions,
      totalCustomers,
      totalProducts,
      recentOrders,
      outOfStockProducts,
      chartData: chartDataRaw,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
