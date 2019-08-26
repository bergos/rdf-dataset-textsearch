/* global describe, expect, it */

const textSearchDataset = require('..')
const TextSearchDataset = require('../lib/TextSearchDataset')

describe('rdf-dataset-textsearch', () => {
  it('should be a function', () => {
    expect(typeof textSearchDataset).toBe('function')
  })

  it('should return a TextSearchDataset', () => {
    const dataset = textSearchDataset({ properties: [] })

    expect(dataset instanceof TextSearchDataset).toBe(true)
  })
})
