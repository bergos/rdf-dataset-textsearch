/* global describe, expect, it */

const namespace = require('@rdfjs/namespace')
const rdf = require('rdf-ext')
const TextSearchDataset = require('../lib/TextSearchDataset')

const ns = {
  ex: namespace('http://example.org/')
}

function callTestBuilder (methodName) {
  const dataset = rdf.dataset()
  const method = dataset[methodName]

  dataset.called = false

  dataset[methodName] = function () {
    dataset.called = arguments

    return method.apply(dataset, arguments)
  }

  return dataset
}

describe('TextSearchDataset', () => {
  it('should be a constructor', () => {
    expect(typeof TextSearchDataset).toBe('function')
  })

  it('should throw an error if no properties and no indexes are given', () => {
    expect(() => {
      return new TextSearchDataset({})
    }).toThrow()
  })

  it('should use the given dataset', () => {
    const dataset = rdf.dataset()
    const searchDataset = new TextSearchDataset({ dataset, properties: [] })

    expect(searchDataset.dataset).toBe(dataset)
  })

  it('should add existing quads from the given dataset to the index', () => {
    const dataset = rdf.dataset()
    dataset.add(rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test')))
    dataset.add(rdf.quad(ns.ex.subject1, ns.ex.label, rdf.literal('text')))
    const searchDataset = new TextSearchDataset({ dataset, properties: [{ term: ns.ex.label }] })

    const results = searchDataset.indexes[''].search('test')

    expect(results.length).toBe(2)
  })

  it('should use the given factory to create the dataset', () => {
    let called = false
    const dataset = rdf.dataset()
    const factory = {
      dataset: () => {
        called = true

        return dataset
      }
    }
    const searchDataset = new TextSearchDataset({ factory, properties: [] })

    expect(called).toBe(true)
    expect(searchDataset.dataset).toBe(dataset)
  })

  it('should build a default index', () => {
    const dataset = new TextSearchDataset({ properties: [] })

    expect(typeof dataset.indexes['']).toBe('object')
  })

  it('should build indexes based on the given indexes argument', () => {
    const dataset = new TextSearchDataset({
      indexes: {
        '': [{ term: ns.ex.label }],
        description: [{ term: ns.ex.description }]
      }
    })

    expect(typeof dataset.indexes['']).toBe('object')
    expect(typeof dataset.indexes.description).toBe('object')
  })

  describe('.search', () => {
    it('should be a method', () => {
      const dataset = new TextSearchDataset({ properties: [] })

      expect(typeof dataset.search).toBe('function')
    })

    it('should return an array of terms', () => {
      const dataset = new TextSearchDataset({ properties: [{ term: ns.ex.label }] })
      dataset.add(rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test')))
      dataset.add(rdf.quad(ns.ex.subject1, ns.ex.label, rdf.literal('text')))

      const result = dataset.search('test')

      expect(Array.isArray(result)).toBe(true)
      expect(result[0].termType).toBe('NamedNode')
      expect(Boolean(result[0].value)).toBe(true)
    })

    it('should return an array with a scores property of type array', () => {
      const dataset = new TextSearchDataset({ properties: [{ term: ns.ex.label }] })
      dataset.add(rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test')))
      dataset.add(rdf.quad(ns.ex.subject1, ns.ex.label, rdf.literal('text')))

      const result = dataset.search('test')

      expect(Array.isArray(result.scores)).toBe(true)
      expect(result.scores.length).toBe(result.length)
      expect(typeof result.scores[0]).toBe('number')
    })

    it('should return an array sorted by best matches first', () => {
      const dataset = new TextSearchDataset({ properties: [{ term: ns.ex.label }] })
      dataset.add(rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test')))
      dataset.add(rdf.quad(ns.ex.subject1, ns.ex.label, rdf.literal('text')))

      const result = dataset.search('test')

      expect(ns.ex.subject0.equals(result[0])).toBe(true)
    })

    it('should support multiple indexes', () => {
      const dataset = new TextSearchDataset({
        indexes: {
          '': [{ term: ns.ex.label }],
          description: [{ term: ns.ex.description }]
        }
      })
      dataset.add(rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test')))
      dataset.add(rdf.quad(ns.ex.subject0, ns.ex.description, rdf.literal('text')))
      dataset.add(rdf.quad(ns.ex.subject1, ns.ex.label, rdf.literal('text')))
      dataset.add(rdf.quad(ns.ex.subject1, ns.ex.description, rdf.literal('test')))

      const defaultResult = dataset.search('test')
      const descriptionResult = dataset.search('test', 'description')

      expect(ns.ex.subject0.equals(defaultResult[0])).toBe(true)
      expect(ns.ex.subject1.equals(descriptionResult[0])).toBe(true)
    })
  })

  describe('.size', () => {
    it('should be a number property', () => {
      const dataset = new TextSearchDataset({ properties: [] })

      expect(typeof dataset.size).toBe('number')
    })

    it('should forward the result of the wrapped dataset', () => {
      const dataset = rdf.dataset()
      dataset.add(rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test')))
      dataset.add(rdf.quad(ns.ex.subject1, ns.ex.label, rdf.literal('text')))
      const searchDataset = new TextSearchDataset({ dataset, properties: [] })

      expect(searchDataset.size).toBe(dataset.size)
    })
  })

  describe('.add', () => {
    it('should be a method', () => {
      const dataset = new TextSearchDataset({ properties: [] })

      expect(typeof dataset.add).toBe('function')
    })

    it('should call the method of the wrapped dataset', () => {
      const dataset = callTestBuilder('add')
      const searchDataset = new TextSearchDataset({ dataset, properties: [] })
      const quad = rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test'))

      searchDataset.add(quad)

      expect(quad.equals(dataset.called[0])).toBe(true)
    })
  })

  describe('.delete', () => {
    it('should be a method', () => {
      const dataset = new TextSearchDataset({ properties: [] })

      expect(typeof dataset.delete).toBe('function')
    })

    it('should call the method of the wrapped dataset', () => {
      const dataset = callTestBuilder('delete')
      const searchDataset = new TextSearchDataset({ dataset, properties: [] })
      const quad = rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test'))

      searchDataset.delete(quad)

      expect(quad.equals(dataset.called[0])).toBe(true)
    })
  })

  describe('.has', () => {
    it('should be a method', () => {
      const dataset = new TextSearchDataset({ properties: [] })

      expect(typeof dataset.has).toBe('function')
    })

    it('should call the method of the wrapped dataset', () => {
      const dataset = callTestBuilder('has')
      const searchDataset = new TextSearchDataset({ dataset, properties: [] })
      const quad = rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test'))

      searchDataset.has(quad)

      expect(quad.equals(dataset.called[0])).toBe(true)
    })
  })

  describe('.match', () => {
    it('should be a method', () => {
      const dataset = new TextSearchDataset({ properties: [] })

      expect(typeof dataset.match).toBe('function')
    })

    it('should call the method of the wrapped dataset', () => {
      const dataset = callTestBuilder('match')
      const searchDataset = new TextSearchDataset({ dataset, properties: [] })
      const quad = rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test'))

      searchDataset.match(quad.subject, quad.predicate, quad.object, quad.graph)

      expect(quad.subject.equals(dataset.called[0])).toBe(true)
      expect(quad.predicate.equals(dataset.called[1])).toBe(true)
      expect(quad.object.equals(dataset.called[2])).toBe(true)
      expect(quad.graph.equals(dataset.called[3])).toBe(true)
    })
  })

  describe('Symbol.iterator', () => {
    it('should be a method', () => {
      const dataset = new TextSearchDataset({ properties: [] })

      expect(typeof dataset[Symbol.iterator]).toBe('function')
    })

    it('should call the method of the wrapped dataset', () => {
      const dataset = callTestBuilder(Symbol.iterator)
      const searchDataset = new TextSearchDataset({ dataset, properties: [] })
      const quad = rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test'))
      dataset.add(quad)

      const array = [...searchDataset]

      expect(dataset.called.length).toBe(0)
      expect(quad.equals(array[0])).toBe(true)
    })
  })
})
