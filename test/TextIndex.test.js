/* global describe, expect, it */

const namespace = require('@rdfjs/namespace')
const rdf = require('rdf-ext')
const { termToNTriples } = require('@rdfjs/to-ntriples')
const TextIndex = require('../lib/TextIndex')

const ns = {
  ex: namespace('http://example.org/')
}

describe('TextIndex', () => {
  it('should be a constructor', () => {
    expect(typeof TextIndex).toBe('function')
  })

  it('should init the given properties', () => {
    const index = new TextIndex({
      properties: [{ term: ns.ex.label }, { term: ns.ex.description }]
    })

    expect(index.properties.size).toBe(2)
    expect(index.properties.get(ns.ex.label.value)).toEqual({ id: '1', weight: 1.0 })
  })

  it('should use the given weights', () => {
    const index = new TextIndex({
      properties: [{ term: ns.ex.label, weight: 0.5 }, { term: ns.ex.description, weight: 1.0 }]
    })

    expect(index.properties.size).toBe(2)
    expect(index.properties.get(ns.ex.label.value)).toEqual({ id: '1', weight: 0.5 })
    expect(index.properties.get(ns.ex.description.value)).toEqual({ id: '2', weight: 1.0 })
  })

  describe('.add', () => {
    it('should be a method', () => {
      const index = new TextIndex({ properties: [] })

      expect(typeof index.add).toBe('function')
    })

    it('should do nothing if the property is not included in the index', () => {
      const index = new TextIndex({ properties: [] })
      index.init() // force init so touched is false after this call

      index.add(rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test')))

      expect(index.docs.size).toBe(0)
      expect(index.touched).toBe(false)
    })

    it('should add the value to the docs', () => {
      const id = termToNTriples(ns.ex.subject0)
      const index = new TextIndex({ properties: [{ term: ns.ex.label }] })
      index.init() // force init so touched is false after this call

      index.add(rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test')))

      expect(index.docs.size).toBe(1)
      expect(index.docs.get(id)).toEqual({ id, 1: ['test'] })
      expect(index.touched).toBe(true)
    })

    it('should support multiple values', () => {
      const id = termToNTriples(ns.ex.subject0)
      const index = new TextIndex({ properties: [{ term: ns.ex.label }] })

      index.add(rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test')))
      index.add(rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('text')))

      expect(index.docs.size).toBe(1)
      expect(index.docs.get(id)).toEqual({ id, 1: ['test', 'text'] })
    })
  })

  describe('.delete', () => {
    it('should be a method', () => {
      const index = new TextIndex({ properties: [] })

      expect(typeof index.delete).toBe('function')
    })

    it('should do nothing if the property is not included in the index', () => {
      const index = new TextIndex({ properties: [] })
      const quad = rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test'))
      index.add(quad)
      index.init() // force init so touched is false after this call

      index.delete(quad)

      expect(index.docs.size).toBe(0)
      expect(index.touched).toBe(false)
    })

    it('should do nothing if there is no doc that contains the given quad', () => {
      const index = new TextIndex({ properties: [{ term: ns.ex.label }] })
      const quad = rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test'))
      index.init() // force init so touched is false after this call

      index.delete(quad)

      expect(index.docs.size).toBe(0)
      expect(index.touched).toBe(false)
    })

    it('should do nothing if there is no value for the given quad', () => {
      const index = new TextIndex({ properties: [{ term: ns.ex.label }] })
      const quad0 = rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test'))
      const quad1 = rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('text'))
      index.add(quad0)
      index.init() // force init so touched is false after this call

      index.delete(quad1)

      expect(index.docs.size).toBe(1)
      expect(index.touched).toBe(false)
    })

    it('should remove the given values from the doc', () => {
      const index = new TextIndex({ properties: [{ term: ns.ex.label }] })
      const id = termToNTriples(ns.ex.subject0)
      const quad0 = rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test'))
      const quad1 = rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('text'))
      index.add(quad0)
      index.add(quad1)
      index.init() // force init so touched is false after this call

      index.delete(quad0)

      expect(index.docs.size).toBe(1)
      expect(index.docs.get(id)).toEqual({ id, 1: ['text'] })
      expect(index.touched).toBe(true)
    })

    it('should remove the given property if no values are left', () => {
      const index = new TextIndex({
        properties: [{ term: ns.ex.label }, { term: ns.ex.description }]
      })
      const id = termToNTriples(ns.ex.subject0)
      const quad0 = rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test'))
      const quad1 = rdf.quad(ns.ex.subject0, ns.ex.description, rdf.literal('text'))
      index.add(quad0)
      index.add(quad1)
      index.init() // force init so touched is false after this call

      index.delete(quad0)

      expect(index.docs.size).toBe(1)
      expect(index.docs.get(id)).toEqual({ id, 2: ['text'] })
      expect(index.touched).toBe(true)
    })

    it('should remove the given doc if no properties are left', () => {
      const index = new TextIndex({ properties: [{ term: ns.ex.label }] })
      const quad0 = rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test'))
      index.add(quad0)
      index.init() // force init so touched is false after this call

      index.delete(quad0)

      expect(index.docs.size).toBe(0)
      expect(index.touched).toBe(true)
    })
  })

  describe('.search', () => {
    it('should be a method', () => {
      const index = new TextIndex({ properties: [] })

      expect(typeof index.search).toBe('function')
    })

    it('should return an array', () => {
      const index = new TextIndex({ properties: [{ term: ns.ex.label }] })

      const results = index.search('')

      expect(Array.isArray(results)).toBe(true)
    })

    it('should return an array with an scores array attached', () => {
      const index = new TextIndex({ properties: [{ term: ns.ex.label }] })

      const results = index.search('')

      expect(Array.isArray(results.scores)).toBe(true)
    })

    it('should return an array of terms', () => {
      const index = new TextIndex({ properties: [{ term: ns.ex.label }] })
      index.add(rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test')))
      index.add(rdf.quad(ns.ex.subject1, ns.ex.label, rdf.literal('text')))

      const results = index.search('test')

      expect(results[0].termType).toBe('NamedNode')
    })

    it('should return the best matches first', () => {
      const index = new TextIndex({ properties: [{ term: ns.ex.label }] })
      index.add(rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test')))
      index.add(rdf.quad(ns.ex.subject1, ns.ex.label, rdf.literal('text')))

      const results = index.search('test')

      expect(results[0].equals(ns.ex.subject0)).toBe(true)
    })

    it('should use the weight from the given properties to score results', () => {
      const index = new TextIndex({
        properties: [{ term: ns.ex.label, weight: 0.5 }, { term: ns.ex.description, weight: 1.0 }]
      })
      index.add(rdf.quad(ns.ex.subject0, ns.ex.label, rdf.literal('test')))
      index.add(rdf.quad(ns.ex.subject0, ns.ex.description, rdf.literal('text')))
      index.add(rdf.quad(ns.ex.subject1, ns.ex.label, rdf.literal('text')))
      index.add(rdf.quad(ns.ex.subject1, ns.ex.description, rdf.literal('test')))

      const results = index.search('test')

      expect(results[0].equals(ns.ex.subject1)).toBe(true)
    })
  })
})
