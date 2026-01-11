const { sequelize, Order, OrderItem, Product, Shipment, Product } = require('../models');
const { checkDomesticCost } = require('./rajaOngkir.service');

exports.createOrder = async ({ user_id, address_snapshot, items, origin, destination, courier }) => {
  return sequelize.transaction(async (t) => {
    let totalPrice = 0;
    let totalWeight = 0;

    // Hitung total harga & berat
    for (const item of items) {
      const product = await Product.findByPk(item.product_id);

      if (!product) throw new Error('Produk tidak ditemukan');

      totalPrice += product.price * item.qty;
      totalWeight += product.weight * item.qty;
    }

    // Hitung ongkir RajaOngkir
    const shipping = await checkDomesticCost({
      origin,
      destination,
      weight: totalWeight,
      courier,
    });

    // Create Order
    const order = await Order.create(
      {
        user_id,
        address_snapshot,
        total_price: totalPrice,
        shipping_cost: shipping.shipping_cost,
        grand_total: totalPrice + shipping.shipping_cost,
        status: 'pending',
      },
      { transaction: t }
    );

    // Create Order Items
    for (const item of items) {
      const product = await Product.findByPk(item.product_id);

      await OrderItem.create(
        {
          order_id: order.order_id,
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          qty: item.qty,
          subtotal: product.price * item.qty,
        },
        { transaction: t }
      );
    }

    // Create Shipment
    await Shipment.create(
      {
        order_id: order.order_id,
        courier: shipping.courier,
        service: shipping.service,
        etd: shipping.etd,
        shipping_cost: shipping.shipping_cost,
        status: 'waiting_payment',
      },
      { transaction: t }
    );

    return order;
  });
};
