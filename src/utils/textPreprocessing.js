const natural = require('natural');
const { removeStopwords, ind } = require('stopword');

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const customStopwords = ['yaa'];

exports.preprocessText = (text) => {
  if (!text) return '';

  text = text.toLowerCase(); // 1. Lowercase
  text = text.replace(/[^a-zA-Z\s]/g, ' '); // 2. Remove non-letter
  let tokens = tokenizer.tokenize(text); // 3. Tokenize
  tokens = removeStopwords(tokens, [...ind, ...customStopwords]); // 4. Stopword removal
  tokens = tokens.map((token) => stemmer.stem(token)); // 5. Stemming

  return tokens.join(' ');
};
