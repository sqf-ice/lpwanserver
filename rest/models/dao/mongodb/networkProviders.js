// Database implementation.
var db = require('../../../lib/dbmongo')

// Error reporting
var httpError = require('http-errors')
var appLogger = require('../../../lib/appLogger.js')


const table = 'networkProviders'

//* *****************************************************************************
// NetworkProviders database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the networkProviders record.
//
// name  - the name of the networkProvider
//
// Returns the promise that will execute the create.
exports.createNetworkProvider = function (name) {
  return new Promise(function (resolve, reject) {
    // Create the record.
    var networkProvider = {}
    networkProvider.name = name

    // OK, save it!
    db.insertRecord('networkProviders', networkProvider, function (err, record) {
      if (err) {
        reject(err)
      }
      else {
        resolve(record)
      }
    })
  })
}

// Retrieve a networkProvider record by id.
//
// id - the record id of the networkProvider.
//
// Returns a promise that executes the retrieval.
exports.retrieveNetworkProvider = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('networkProviders', 'id', id, function (err, rec) {
      if (err) {
        reject(err)
      }
      else if (!rec) {
        reject(new httpError.NotFound())
      }
      else {
        resolve(rec)
      }
    })
  })
}

// Update the networkProvider record.
//
// networkProvider - the updated record.  Note that the id must be unchanged
//                   from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateNetworkProvider = function (networkProvider) {
  return new Promise(function (resolve, reject) {
    db.updateRecord('networkProviders', 'id', networkProvider, function (err, row) {
      if (err) {
        reject(err)
      }
      else {
        resolve(row)
      }
    })
  })
}

// Delete the networkProvider record.
//
// networkProviderId - the id of the networkProvider record to delete.
//
// Returns a promise that performs the delete.
exports.deleteNetworkProvider = function (networkProviderId) {
  return new Promise(function (resolve, reject) {
    db.deleteRecord('networkProviders', 'id', networkProviderId, function (err, rec) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rec)
      }
    })
  })
}

exports.retrieveNetworkProviders = function (options) {
  return new Promise(function (resolve, reject) {
    appLogger.log(options)
    db.fetchRecords(table, options, function (err, result) {
      if (err) reject(err)
      else resolve({ totalCount: result.length, records: result })
    })
  })
}

exports.retrieveAllNetworkProviders = function () {
  return this.retrieveNetworkProviders({})
}
