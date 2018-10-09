// Database implementation.
var db = require('../../../lib/dbmongo')

// Error reporting
var httpError = require('http-errors')
var appLogger = require('../../../lib/appLogger.js')

const table = 'networks'

//* *****************************************************************************
// Networks database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the network record.
//
// name                      - the name of the network to display for selection
// networkProviderId         - the id of the networkProvider that manages this
//                             network.
// networkTypeId             - the id of the networkType this network supports
// networkProtocolId         - the id of the networkProtocol this network uses
// baseUrl                   - the root of the URL to be used by the
//                             networkProtocol to access the network api.
// securityData              - Data used by the networkProtocol to access the
//                             remote system.  Could be a JWT token or other
//                             login credentials.
//
// Returns the promise that will execute the create.
exports.createNetwork = function (name, networkProviderId, networkTypeId, networkProtocolId, baseUrl, securityData) {
  return new Promise(function (resolve, reject) {
    // Create the user record.
    var nwk = {}
    nwk.name = name
    nwk.networkProviderId = networkProviderId
    nwk.networkTypeId = networkTypeId
    nwk.networkProtocolId = networkProtocolId
    nwk.baseUrl = baseUrl
    nwk.securityData = securityData

    // OK, save it!
    db.insertRecord('networks', nwk, function (err, record) {
      if (err) {
        reject(err)
      }
      else {
        resolve(record)
      }
    })
  })
}

// Retrieve a network record by id.
//
// id - the record id of the network.
//
// Returns a promise that executes the retrieval.
exports.retrieveNetwork = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('networks', 'id', id, function (err, rec) {
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

// Update the network record.
//
// network- the updated record.  Note that the id must be unchanged
//          from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateNetwork = function (np) {
  return new Promise(function (resolve, reject) {
    db.updateRecord('networks', 'id', np, function (err, row) {
      if (err) {
        reject(err)
      }
      else {
        resolve(row)
      }
    })
  })
}

// Delete the network record.
//
// networkId - the id of the network record to delete.
//
// Returns a promise that performs the delete.
exports.deleteNetwork = function (networkId) {
  return new Promise(function (resolve, reject) {
    db.deleteRecord('networks', 'id', networkId, function (err, rec) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rec)
      }
    })
  })
}

exports.retrieveNetworks = function (options) {
  return new Promise(function (resolve, reject) {
    appLogger.log(options)
    db.fetchRecords(table, options, function (err, result) {
      if (err) reject(err)
      else resolve({ totalCount: result.length, records: result })
    })
  })
}

exports.retrieveAllNetworks = function () {
  return this.retrieveNetworks({})
}
