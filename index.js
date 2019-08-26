const TextSearchDataset = require('./lib/TextSearchDataset')

function textSearchDataset ({ dataset, factory, properties, indexes }) {
  return new TextSearchDataset({ dataset, factory, properties, indexes })
}

module.exports = textSearchDataset
