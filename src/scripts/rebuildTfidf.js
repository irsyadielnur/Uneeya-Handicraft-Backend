const { generateTfidf } = require('../services/tfidf.service');

(async () => {
  await generateTfidf();
  console.log('TF-IDF regenerated');
  process.exit();
})();
