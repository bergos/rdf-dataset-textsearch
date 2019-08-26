# rdf-dataset-textsearch

This package provides text search for [RDFJS DatasetCore](https://rdf.js.org/dataset-spec/#datasetcore-interface) compatible datasets.

## Usage

The package exports a function to create a new dataset or wrap an existing one:

```javascript
const textSearchDataset = require('rdf-dataset-textsearch')

const dataset = textSearchDataset(options)
```

The function supports the following options:

- `dataset`: The dataset that should be wrapped.
  If this option is not provided the `factory` will be used.
- `factory`: A RDFJS dataset factory that should be used to create the wrapped dataset.
  If the `dataset` option is given this option will be ignored.
  By default `rdf-ext` is used.
- `properties`: An iterable object that contains the definition for the search index.
  Each item must be an object with a `term` property.
  The value of the `term` property must be a RDFJS Named Node with the IRI of the predicates which should be indexed.
  Optionally a `weight` property can be used to weight the property for the search.
  By default the weight value is `1.0`.
  In case multiple indexes are used `''` (empty string) is used as `indexId`. 
- `indexes`: An object that contains key-value pairs for multiple indexes.
  The key is used as `indexId`.
  The value must have the same structure as described in the `properties` option.

The function returns a dataset that implements the [RDFJS DatasetCore](https://rdf.js.org/dataset-spec/#datasetcore-interface) interface.
All methods of the spec can be used as described in the spec.
Additionally there is a `.search` method to make a text search on the indexed properties:

```javascript
const textSearchDataset = require('rdf-dataset-textsearch')
const namespace = require('@rdfjs/namespace')

const ns = {
  rdfs: namespace('http://www.w3.org/2000/01/rdf-schema#')
} 

const dataset = textSearchDataset({
  properties: [{
    term: ns.rdfs.label,
    weight: 1.0
  }, {
    term: ns.rdfs.comment,
    weight: 0.5
  }]
})

// fill the dataset with quads

const results = dataset.search('this is my query string')

results.forEach((result, index) => {
  console.log(`subject: ${result.value} (${results.scores[index]})`)
})
```

The `.search` method expects a query string as the first argument.

The method returns the subject of the matches as an array of RDFJS Terms.
The best matches appear first.
With the `.scores` property in the result, it's possible to get the score of the results.
The value of `.scores` is an array with the same number of elements as the result itself.
The score for a specific result can be found with the same index as the result (see the example above).

Optionally a second string argument for the `indexId` can be given.
See the `indexes` options for more details how to create multiple indexes.
By default the `''` (empty string) index is used. 