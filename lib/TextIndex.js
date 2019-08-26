const Fuse = require('fuse.js')
const { termToNTriples } = require('@rdfjs/to-ntriples')

class TextIndex {
  constructor ({ properties }) {
    this.properties = new Map()
    this.subjects = new Map()
    this.docs = new Map()
    this.index = null
    this.touched = true

    for (const property of properties) {
      const id = (this.properties.size + 1).toString()

      this.properties.set(property.term.value, { id, weight: property.weight || 1 })
    }
  }

  init () {
    if (!this.touched) {
      return
    }

    // calculate weight sum to normalize the weights
    const weightSum = [...this.properties.values()].reduce((weightSum, property) => property.weight + weightSum, 0)

    this.index = new Fuse([...this.docs.values()], {
      includeScore: true,
      id: 'id',
      keys: [...this.properties.values()].map(property => {
        return {
          name: property.id,
          weight: property.weight / weightSum
        }
      })
    })

    this.touched = false
  }

  add (quad) {
    const property = this.properties.get(quad.predicate.value)

    // not an indexed property?
    if (!property) {
      return
    }

    // search for the doc
    const docId = termToNTriples(quad.subject)
    let doc = this.docs.get(docId)

    // create a new one if there is no existing one with the matching doc id
    if (!doc) {
      doc = { id: docId }

      this.subjects.set(docId, quad.subject)
      this.docs.set(docId, doc)
    }

    // search for the values array
    let values = doc[property.id]

    // create a new array if there is no existing values array
    if (!values) {
      values = []

      doc[property.id] = values
    }

    values.push(quad.object.value)

    this.touched = true
  }

  delete (quad) {
    const property = this.properties.get(quad.predicate.value)

    // not an indexed property?
    if (!property) {
      return
    }

    // search for the doc
    const docId = termToNTriples(quad.subject)
    const doc = this.docs.get(docId)

    // no doc for the given subject, nothing to do
    if (!doc) {
      return
    }

    // search for the values array
    const values = doc[property.id]

    // no values for the given predicate, nothing to do
    if (!values) {
      return
    }

    // search for the value
    const valueIndex = values.indexOf(quad.object.value)

    // value not found, nothing to do
    if (valueIndex === -1) {
      return
    }

    values.splice(valueIndex, 1)

    // no value left, delete the property
    if (values.length === 0) {
      delete doc[property.id]
    }

    // remove the doc from the doc map if only the id is left
    if (Object.keys(doc).length === 1) {
      this.docs.delete(docId)
    }

    this.touched = true
  }

  search (query) {
    this.init()

    const results = this.index.search(query)
    const terms = results.map(result => this.subjects.get(result.item))
    terms.scores = results.map(result => result.score)

    return terms
  }
}

module.exports = TextIndex
