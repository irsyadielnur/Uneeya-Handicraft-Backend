const { Product, ProductMaterial, ProductColor, ChatbotMessage, ProductImage } = require('../models');
const { recommendFromChat } = require('../services/chatRecommendation.service');
const { askGeminiChat } = require('../services/gemini.service');
const { uneeyaInfo } = require('../scripts/uneeyaInfo');

function isProductRelated(message) {
  const keywords = [
    'produk',
    'barang',
    'beli',
    'harga',
    'stock',
    'rekomendasi',
    'ada',
    'cari',
    'saran',
    'contoh',
    'tas',
    'rajut',
    'dompet',
    'gantungan',
    'kunci',
    'boneka',
    'kardigan',
    'cardigan',
    'topi',
    'peci',
    'amigurumi',
    'yang',
    'buat',
    'untuk',
    'bisa',
    'bentuk',
    'apa',
    'berapa',
  ];
  const lowerMsg = message.toLowerCase();
  return keywords.some((word) => lowerMsg.includes(word));
}

exports.chatbot = async (req, res) => {
  // console.log('=== DEBUG CHATBOT ===');
  // console.log('1. Header Auth:', req.headers.authorization);
  // console.log('2. Req User:', req.user);
  const { message } = req.body;
  const userId = req.user ? req.user.user_id || req.user.id : null;

  // console.log('3. Detected UserID:', userId);

  try {
    // Ambil Semua Product
    const allProductsData = await Product.findAll({
      include: [
        { model: ProductMaterial, attributes: ['material_name'] },
        { model: ProductColor, attributes: ['color_name', 'stock'] },
        { model: ProductImage, attributes: ['image_url'] },
      ],
    });

    const catalogContext = allProductsData
      .map((p) => {
        const materials = p.ProductMaterials?.map((m) => m.material_name).join(', ') || '';
        const colors = p.ProductColors?.map((c) => `Varian: ${c.color_name} (Stok: ${c.stock})`).join(', ') || '';
        return `- ${p.name} (Rp${p.price}) | Kategori: ${p.category} | Deskripsi: ${p.description} | Bahan: ${materials} | Warna: ${colors}`;
      })
      .join('\n');

    let recommendations = [];
    let productContextForAI = 'Tidak ada produk spesifik yang ditemukan dari database saat ini.';

    if (isProductRelated(message)) {
      recommendations = await recommendFromChat(message);
      if (recommendations.length > 0) {
        productContextForAI = recommendations
          .map((item, index) => {
            const p = item.product;
            const materials = p.ProductMaterials?.map((m) => m.material_name).join(', ') || 'Tidak disebutkan';
            const colors = p.ProductColors?.map((c) => `Varian: ${c.color_name} (Stok: ${c.stock})`).join(', ') || 'Tidak disebutkan';

            return `
            Rekomendasi #${index + 1}:
              - Nama: ${p.name}
              - Harga: Rp${p.price}
              - Deskripsi: ${p.description}
              - Kategori: ${p.category}
              - Bahan: ${materials}
              - Pilihan Variasi & Stok: ${colors}`;
          })
          .join('\n');
      }
    }

    // Memori Chatbot
    let historyForGemini = [];
    if (userId) {
      const pastMessages = await ChatbotMessage.findAll({
        where: { user_id: userId },
        order: [['createdAt', 'ASC']],
        limit: 10,
      });
      historyForGemini = pastMessages.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.message }],
      }));
    }

    const systemPrompt = `
    PERAN:
    Kamu adalah "Cimot", asisten AI toko Uneeya Handicraft yang ceria, ramah, dan membantu.
    Gunakan gaya bahasa yang ramah, kasual, dan sopan.

    INFORMASI TOKO:
    ${uneeyaInfo}
    
    KATALOG PRODUK TOKO: 
    ${catalogContext}

    DATA REKOMENDASI TERKAIT REQUEST USER SAAT INI:
    (Fokuskan jawabanmu pada produk-produk ini saja, karena ini yang paling mirip dengan request mereka):
    ${productContextForAI}

    PESAN PENGGUNA:
    "${message}"

    ATURAN GAYA BAHASA (PENTING):
    1. Gaya bahasa: Santai, akrab, tapi sopan (gunakan "Kak" untuk user, "Cimot/aku" untuk diri sendiri).
    2. JANGAN MENGULANG SALAM: Jika ini adalah percakapan lanjutan (user membalas pesanmu), JANGAN mengawali pesan dengan "Halo Kak", "Hai", atau basa-basi pembuka yang repetitif. Langsung jawab intinya atau berikan respon yang relevan.
    3. Kecuali user menyapa duluan (misal: "Halo", "Pagi"), baru kamu boleh balas menyapa.
    4. Hindari kalimat pembuka template seperti "Tentu saja ada dong", "Cimot siap bantu". Variasikan responmu agar terdengar seperti manusia.

    INSTRUKSI:
    1. Jawablah pertanyaan pengguna dengan natural, ringkas, singkat, dan ramah.
    2. JIKA ada daftar produk di "DATA REKOMENDASI TERKAIT REQUEST USER SAAT INI":
      - jelaskan produk yang ada pada "DATA REKOMENDASI TERKAIT REQUEST USER SAAT INI".
      - Jelaskan kenapa produk itu cocok (berdasarkan deskripsinya, variasi, bahan).
      - sebutkan stok yang tersedia.
    3. Jika "DATA PRODUK REKOMENDASI" kosong atau kurang pas, kamu BOLEH mencari alternatif dari "KATALOG LENGKAP TOKO".
    4. Jika stok variasi atau warna 0, katakan stok habis.
    5. Jawab singkat padat, jangan terlalu panjang lebar.
    6. Jangan mengarang produk yang tidak ada di database.
    7. Jika pengguna bertanya hal umum (bukan produk), jawab sesuai "INFORMASI TOKO".
    `;

    const reply = await askGeminiChat(message, historyForGemini, systemPrompt);

    const structuredRecommendations = recommendations.map((item) => {
      const prod = item.product;
      return {
        id: prod.product_id,
        name: prod.name,
        description: prod.description || '',
        category: prod.category,
        unique_character: prod.unique_character,
        price: prod.price,
        materials: prod.ProductMaterials?.map((m) => m.material_name) || [],
        colors: prod.ProductColors?.map((c) => ({ name: c.color_name, stock: c.stock })) || [],
        rating_avg: prod.rating_avg,
        image: prod.ProductImages?.[0]?.image_url || null,
        similarity: item.similarity.toFixed(5),
      };
    });

    if (userId) {
      await ChatbotMessage.create({
        user_id: userId,
        message: message,
        sender: 'user',
        recommendations: null,
      });

      await ChatbotMessage.create({
        user_id: userId,
        message: reply,
        sender: 'bot',
        recommendations: structuredRecommendations,
      });
    }

    res.json({
      reply: reply,
      recommendations: structuredRecommendations,
      is_stored: !!userId,
    });
  } catch (error) {
    console.error('Chatbot Error:', error);
    res.status(500).json({ error: 'Maaf, terjadi kesalahan pada server.' });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const histories = await ChatbotMessage.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'ASC']],
    });

    const formattedHistory = histories.map((h) => ({
      id: h.chatbot_id,
      message: h.message,
      sender: h.sender,
      recommendations: h.recommendations,
      createdAt: h.createdAt,
    }));

    res.json(formattedHistory);
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({ error: 'Gagal memuat riwayat chat' });
  }
};

exports.deleteChatHistory = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    await ChatbotMessage.destroy({
      where: { user_id: userId },
    });

    return res.status(200).json({ message: 'Riwayat percakapan berhasil dihapus.' });
  } catch (error) {
    console.error('Delete History Error:', error);
    return res.status(500).json({ error: 'Gagal menghapus riwayat chat.' });
  }
};
