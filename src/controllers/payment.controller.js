const snap = require('../config/midtrans');
const { Order, OrderItem, Payment, User, Shipment, ProductColor, sequelize } = require('../models');

exports.createSnapTransaction = async (req, res) => {
  const user_id = req.user.user_id;
  const { order_id } = req.params;

  try {
    const order = await Order.findOne({
      where: { order_id, user_id },
      include: [{ model: OrderItem }, { model: Shipment }],
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'pending' && order.status !== 'waiting_payment') {
    }

    const user = await User.findByPk(user_id);

    const items = order.OrderItems.map((item) => ({
      id: `PROD-${item.product_id}`,
      name: `${item.product_name.substring(0, 40)}`,
      price: Number(item.price),
      quantity: item.qty,
    }));

    if (order.Shipment) {
      items.push({
        id: 'SHIPMENT',
        name: `Ongkir (${order.Shipment.courier} - ${order.Shipment.service})`,
        price: Number(order.shipping_cost),
        quantity: 1,
      });
    }

    const grossAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const midtransOrderId = `ORDER-${order.order_id}-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: user.username,
        email: user.email,
        phone: user.phone || '08123456789',
      },
      item_details: items,
      callbacks: {
        finish: `${process.env.DOMAIN || 'http://localhost:5173'}/history`,
      },
    };

    const snapResponse = await snap.createTransaction(parameter);

    // Simpan data payment ke database
    await Payment.create({
      order_id: order.order_id,
      payment_method: 'midtrans',
      transaction_id: midtransOrderId,
      gross_amount: grossAmount,
      status: 'pending',
    });

    res.json({
      snap_token: snapResponse.token,
      redirect_url: snapResponse.redirect_url,
    });
  } catch (error) {
    console.error('Midtrans Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.verifyPaymentStatus = async (req, res) => {
  const { order_id } = req.params;

  try {
    const paymentData = await Payment.findOne({
      where: { order_id },
      order: [['created_at', 'DESC']],
    });
    if (!paymentData || !paymentData.transaction_id) {
      return res.status(404).json({ message: 'Data pembayaran tidak ditemukan' });
    }

    // Cek Status ke Midtrans
    console.log('Checking status for:', paymentData.transaction_id);
    const midtransStatus = await snap.transaction.status(paymentData.transaction_id);

    const transactionStatus = midtransStatus.transaction_status;
    const fraudStatus = midtransStatus.fraud_status;

    let paymentStatus = 'pending';
    let orderStatus = 'waiting_payment';
    let shipmentStatus = 'pending';

    // Status Midtrans
    if (transactionStatus == 'capture') {
      if (fraudStatus == 'challenge') {
        paymentStatus = 'pending';
      } else if (fraudStatus == 'accept') {
        paymentStatus = 'paid';
        orderStatus = 'processing';
        shipmentStatus = 'processing';
      }
    } else if (transactionStatus == 'settlement') {
      paymentStatus = 'paid';
      orderStatus = 'processing';
      shipmentStatus = 'processing';
    } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
      paymentStatus = 'failed';
      orderStatus = 'cancelled';
      shipmentStatus = 'cancelled';
    }

    // Update Database
    await sequelize.transaction(async (t) => {
      await Payment.update({ status: paymentStatus }, { where: { order_id }, transaction: t });
      await Order.update({ status: orderStatus }, { where: { order_id }, transaction: t });
      await Shipment.update({ status: shipmentStatus }, { where: { order_id }, transaction: t });

      if (paymentStatus === 'paid') {
        const orderInfo = await Order.findOne({
          where: { order_id },
          include: [{ model: OrderItem }],
          transaction: t,
        });

        if (orderInfo && orderInfo.OrderItems) {
          for (const item of orderInfo.OrderItems) {
            await ProductColor.decrement('stock', {
              by: item.qty,
              where: {
                product_id: item.product_id,
                color_name: item.color_name,
              },
              transaction: t,
            });
          }
        }
      }
    });

    res.json({ message: 'Status updated', status: paymentStatus });
  } catch (error) {
    console.error('Verify Error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getStatusPayment = async (req, res) => {
  const { order_id } = req.params;

  try {
    await snap.transaction
      .status(order_id)
      .then((response) => {
        res.status(200).json(response);
      })
      .catch((error) => {
        res.status(404).json({ error: 'Order Tidak Ditemukan' });
      });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.handleMidtransNotification = async (req, res) => {
  const statusResponse = req.body;
  const orderId = statusResponse.order_id;
  const transactionStatus = statusResponse.transaction_status;
  const fraudStatus = statusResponse.fraud_status;
  let newStatus;
  if (transactionStatus == 'capture' || transactionStatus == 'settlement') {
    newStatus = 'paid';
  } else if (transactionStatus == 'cancel' || transactionStatus == 'expire') {
    newStatus = 'cancelled';
  } else if (transactionStatus == 'pending') {
    newStatus = 'pending';
  }

  if (newStatus) {
    await Order.update({ status: newStatus }, { where: { order_id: orderId } });
  }
  res.status(200).send('OK');
};
