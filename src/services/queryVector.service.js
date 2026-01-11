const { preprocessText } = require('../utils/textPreprocessing');
const { ProductTfidf } = require('../models');

exports.buildQueryVector = async (query) => {
  const cleanQuery = preprocessText(query);
  const terms = cleanQuery.split(' ').filter(Boolean);

  const termCount = {};
  terms.forEach((t) => {
    termCount[t] = (termCount[t] || 0) + 1;
  });

  const totalTerms = terms.length;
  if (totalTerms === 0) return {};

  // Ambil IDF dari database (GLOBAL)
  const idfRows = await ProductTfidf.findAll({
    where: { term: Object.keys(termCount) },
  });

  const idfMap = {};
  idfRows.forEach((row) => {
    idfMap[row.term] = row.idf;
  });

  const queryVector = {};
  for (const term in termCount) {
    if (!idfMap[term]) continue;

    const tf = termCount[term] / totalTerms;
    queryVector[term] = tf * idfMap[term];
  }

  return queryVector;
};
