const { Order, OrderItem, Shipment, Address, Payment, Product, ProductImage, User, ShopSetting, sequelize } = require('../models');
const cartService = require('../services/cart.service');
const rajaOngkirService = require('../services/rajaOngkir.service');

// Create Order / Checkout (customer)
exports.createOrder = async (req, res) => {
  const user_id = req.user.user_id;
  const { address_id, courier, service } = req.body;

  const t = await sequelize.transaction();

  try {
    // 1. Ambil alamat
    const address = await Address.findOne({
      where: { address_id, user_id },
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // 2. Ambil cart
    const cartItems = await cartService.getUserCart(user_id);

    // 3. Hitung total harga & berat
    const { totalPrice, totalWeight } = cartService.calculateCartTotal(cartItems);

    const shop = await ShopSetting.findByPk(1);
    const originCity = shop?.city_id || process.env.ORIGIN_CITY_ID;

    // 4. Hit ongkir server-side
    const shippingResults = await rajaOngkirService.checkDomesticCost({
      origin: originCity,
      destination: address.city_id,
      weight: totalWeight,
      courier: courier.trim().toLowerCase(),
    });

    // 5. Cari service yang dipilih
    const selectedService = shippingResults.find((s) => s.service === service);

    if (!selectedService) {
      return res.status(400).json({
        message: 'Invalid shipping service selected',
      });
    }

    const shippingCost = selectedService.cost;
    const etd = selectedService.etd;

    const grandTotal = totalPrice + shippingCost;

    // 6. Buat order
    const order = await Order.create(
      {
        user_id,
        address_snapshot: JSON.stringify(address),
        total_price: totalPrice,
        shipping_cost: shippingCost,
        grand_total: grandTotal,
      },
      { transaction: t }
    );

    // 7. Snapshot order items
    const orderItems = cartItems.map((item) => ({
      order_id: order.order_id,
      product_id: item.product_id,
      product_name: item.Product.name,
      color_name: item.color_name,
      price: item.price,
      qty: item.qty,
      subtotal: item.price * item.qty,
    }));

    await OrderItem.bulkCreate(orderItems, {
      transaction: t,
    });

    // 8. Buat shipment
    await Shipment.create(
      {
        order_id: order.order_id,
        courier: courier.toUpperCase(),
        service,
        etd,
        shipping_cost: shippingCost,
        status: 'waiting_payment',
      },
      { transaction: t }
    );

    // 9. Kosongkan cart
    await cartService.clearCart(user_id, t);

    await t.commit();

    res.status(201).json({
      message: 'Order created successfully',
      order_id: order.order_id,
      total_price: totalPrice,
      shipping_cost: shippingCost,
      grand_total: grandTotal,
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
};

// Get Order History (Customer)
exports.getMyOrders = async (req, res) => {
  const user_id = req.user.user_id;
  const { status, page = 1, limit = 10 } = req.query;

  const whereClause = { user_id };
  // Handle filter status
  if (status && status !== 'all') whereClause.status = status;

  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset: Number(offset),
      // Tambahkan 'address_snapshot' agar alamat muncul
      attributes: ['order_id', 'status', 'total_price', 'shipping_cost', 'grand_total', 'created_at', 'address_snapshot'],
      include: [
        {
          model: Shipment,
          attributes: ['courier', 'service', 'tracking_number', 'status'],
        },
        {
          model: OrderItem,
          attributes: ['product_id', 'product_name', 'qty', 'price', 'color_name'],
          include: [
            {
              model: Product,
              attributes: ['product_id', 'category'],
              include: [
                {
                  model: ProductImage,
                  attributes: ['image_url'],
                  limit: 1,
                },
              ],
            },
          ],
        },
      ],
      distinct: true,
    });

    res.json({
      total_data: count,
      total_page: Math.ceil(count / limit),
      current_page: Number(page),
      orders: rows,
    });
  } catch (error) {
    console.error('Error GetMyOrders:', error); // Cek terminal jika masih error
    res.status(500).json({ error: error.message });
  }
};

// Get Order Detail (Customer)
exports.getMyOrderDetail = async (req, res) => {
  const user_id = req.user.user_id;
  const { order_id } = req.params;

  try {
    const order = await Order.findOne({
      where: { order_id, user_id },
      include: [
        {
          model: OrderItem,
          attributes: ['product_id', 'product_name', 'color_name', 'price', 'qty', 'subtotal'],
        },
        {
          model: Shipment,
          attributes: ['courier', 'service', 'etd', 'shipping_cost', 'tracking_number', 'status'],
        },
        {
          model: Payment,
          attributes: ['payment_method', 'status', 'gross_amount'],
        },
      ],
    });

    // const hasRated = order.OrderItems.map((item) => ({
    //   ...item.toJSON(),
    //   can_review: order.status === 'completed',
    // }));

    if (!order) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Order Timeline
exports.getOrderTimeline = async (req, res) => {
  const user_id = req.user.user_id;
  const { order_id } = req.params;

  try {
    const order = await Order.findOne({
      where: { order_id, user_id },
      include: [Shipment, Payment],
    });

    if (!order) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    const timeline = [
      { status: 'pending', label: 'Menunggu Pembayaran', active: true },
      { status: 'paid', label: 'Pembayaran Diterima', active: order.status !== 'pending' },
      { status: 'processing', label: 'Diproses', active: ['processing', 'shipped', 'completed'].includes(order.status) },
      { status: 'shipped', label: 'Dikirim', active: ['shipped', 'completed'].includes(order.status) },
      { status: 'completed', label: 'Selesai', active: order.status === 'completed' },
    ];

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Pesanan Diterima (customer)
exports.completeOrder = async (req, res) => {
  const user_id = req.user.user_id;
  const { order_id } = req.params;

  try {
    // 1. Cari Order milik user ini
    const order = await Order.findOne({
      where: { order_id, user_id },
      include: [Shipment],
    });

    if (!order) {
      return res.status(404).json({ message: 'Order tidak ditemukan atau bukan milik Anda' });
    }

    if (order.status !== 'shipped') {
      return res.status(400).json({ message: 'Pesanan belum dikirim, tidak bisa diselesaikan.' });
    }

    await sequelize.transaction(async (t) => {
      await order.update({ status: 'completed' }, { transaction: t });

      if (order.Shipment) {
        await order.Shipment.update({ status: 'delivered' }, { transaction: t });
      }
    });

    res.json({ message: 'Pesanan berhasil diselesaikan. Terima kasih!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Orders (Admin)
exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = status && status !== 'all' ? { status } : {};

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['username', 'email'],
        },
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['name', 'price', 'weight'] }],
        },
        {
          model: Payment,
          attributes: ['payment_method', 'status'],
        },
        {
          model: Shipment,
          attributes: ['courier', 'service', 'etd', 'tracking_number', 'status'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Update Status & Input Resi (Admin)
exports.updateOrderStatus = async (req, res) => {
  const { order_id } = req.params;
  const { status, tracking_number } = req.body;

  // Gunakan transaction agar data konsisten (Order & Shipment terupdate bersamaan)
  const t = await sequelize.transaction();

  try {
    // 1. Cari Order BESERTA Shipment-nya
    const order = await Order.findByPk(order_id, {
      include: [{ model: Shipment }], // Penting: Include Shipment agar bisa diakses
      transaction: t,
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    // 2. Update Status Order Utama
    if (status) {
      order.status = status;
    }
    await order.save({ transaction: t });

    // 3. Update Data Shipment (Resi & Status Pengiriman)
    if (order.Shipment) {
      // Jika status "shipped" (Dikirim)
      if (status === 'shipped') {
        // Update status shipment jadi shipped
        order.Shipment.status = 'shipped';

        // Masukkan resi jika ada inputnya
        if (tracking_number) {
          order.Shipment.tracking_number = tracking_number;
        }
      }
      // Jika status "completed" (Selesai), shipment dianggap delivered
      else if (status === 'completed') {
        order.Shipment.status = 'delivered';
      }
      // Jika status "cancelled"
      else if (status === 'cancelled') {
        order.Shipment.status = 'cancelled';
      }

      // Simpan perubahan Shipment
      await order.Shipment.save({ transaction: t });
    }

    await t.commit(); // Simpan perubahan ke database

    res.json({ message: 'Status pesanan dan data pengiriman berhasil diperbarui', order });
  } catch (error) {
    await t.rollback(); // Batalkan jika ada error
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
