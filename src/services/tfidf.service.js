const { ProductTextFeature, ProductTfidf } = require('../models');

exports.generateTfidf = async (transaction) => {
  const docs = await ProductTextFeature.findAll({ transaction });
  const N = docs.length;

  if (N === 0) {
    await ProductTfidf.destroy({ where: {}, transaction });
    return;
  }

  const documentTerms = {}; // terms per document
  const documentFrequencies = {}; // DF

  docs.forEach((doc) => {
    const text = doc.clean_text || '';
    const terms = text.split(' ').filter(Boolean);
    const uniqueTerms = new Set(terms);

    documentTerms[doc.product_id] = terms;

    uniqueTerms.forEach((term) => {
      documentFrequencies[term] = (documentFrequencies[term] || 0) + 1;
    });
  });

  await ProductTfidf.destroy({ where: {}, transaction });
  const tfidfData = [];

  for (const doc of docs) {
    const terms = documentTerms[doc.product_id];
    const totalTerms = terms.length;

    if (totalTerms === 0) continue;
    const termCount = {};
    terms.forEach((term) => {
      termCount[term] = (termCount[term] || 0) + 1;
    });

    for (const term of Object.keys(termCount)) {
      const tf = termCount[term] / totalTerms;
      const idf = Math.log((N + 1) / (documentFrequencies[term] + 1)) + 1;
      const tfidf = tf * idf;

      tfidfData.push({
        product_id: doc.product_id,
        term,
        tf,
        idf,
        tfidf,
      });
    }
  }

  if (tfidfData.length > 0) {
    await ProductTfidf.bulkCreate(tfidfData, { transaction });
  }

  console.log(`TF-IDF generation completed. Total records: ${tfidfData.length}`);
};
