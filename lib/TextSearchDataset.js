const rdf = require('rdf-ext')
const TextIndex = require('./TextIndex')

class TextSearchDataset {
  constructor ({ dataset, factory = rdf, properties, indexes }) {
    if (!properties && !indexes) {
      throw new Error('properties or index argument is required')
    }

    this.dataset = dataset || factory.dataset()
    this.indexes = {}

    if (properties) {
      this.indexes[''] = new TextIndex({ properties })
    }

    if (indexes) {
      Object.entries(indexes).forEach(([indexId, properties]) => {
        this.indexes[indexId] = new TextIndex({ properties })
      })
    }

    if (dataset) {
      for (const quad of dataset) {
        this.add(quad)
      }
    }
  }

  search (query, indexId = '') {
    return this.indexes[indexId].search(query)
  }

  get size () {
    return this.dataset.size
  }

  add (quad) {
    Object.values(this.indexes).forEach(index => index.add(quad))

    this.dataset.add(quad)

    return this
  }

  delete (quad) {
    Object.values(this.indexes).forEach(index => index.delete(quad))

    this.dataset.delete(quad)

    return this
  }

  has (quad) {
    return this.dataset.has(quad)
  }

  match (subject, predicate, object, graph) {
    return this.dataset.match(subject, predicate, object, graph)
  }

  [Symbol.iterator] () {
    return this.dataset[Symbol.iterator]()
  }
}

module.exports = TextSearchDataset
