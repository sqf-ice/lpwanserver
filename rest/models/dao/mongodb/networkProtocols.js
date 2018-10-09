// Database implementation.
var db = require('../../../lib/dbmongo')
const appLogger = require('../../../lib/appLogger')

// Error reporting
var httpError = require('http-errors')


const table = 'networkProtocols'

//* *****************************************************************************
// NetworkProtocols database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the networkProtocol record.
//
// name            - the name of the network protocol to display for selection
// protocolType    - the protocol type, such as "LoRa", "NB-IoT", etc.
// protocolHandler - the filename for the code that supports the general network
//                   protocol api for this specific protocol.
//
// Returns the promise that will execute the create.
exports.createNetworkProtocol = function (name, networkTypeId, protocolHandler, version, masterProtocol) {
  return new Promise(function (resolve, reject) {
    // Create the user record.
    var np = {}
    np.name = name
    np.networkTypeId = networkTypeId
    np.protocolHandler = protocolHandler
    if (version) np.networkProtocolVersion = version
    if (masterProtocol) np.masterProtocol = masterProtocol

    // OK, save it!
    db.insertRecord('networkProtocols', np, function (err, record) {
      if (err) {
        reject(err)
      } else {
        resolve(record)
      }
    })
  })
}

exports.upsertNetworkProtocol = function (np) {
  let me = this
  return new Promise(function (resolve, reject) {
    appLogger.log(np, 'error')
    db.upsertRecord(table, 'protocolHandler', np, function(err, rec) {
      if (err) {
        reject(err)
      } else if (!rec) {
        reject(new httpError.NotFound())
      } else {
        resolve(rec)
      }
    })

  })
}

// Retrieve a networkProtocol record by id.
//
// id - the record id of the networkProtocol.
//
// Returns a promise that executes the retrieval.
exports.retrieveNetworkProtocol = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('networkProtocols', 'id', id, function (err, rec) {
      if (err) {
        reject(err)
      } else if (!rec) {
        reject(new httpError.NotFound())
      } else {
        resolve(rec)
      }
    })
  })
}

// Update the networkProtocol record.
//
// networkProtocol - the updated record.  Note that the id must be unchanged
//                   from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateNetworkProtocol = function (np) {
  return new Promise(function (resolve, reject) {
    db.updateRecord('networkProtocols', 'id', np, function (err, row) {
      if (err) {
        reject(err)
      } else {
        resolve(row)
      }
    })
  })
}

// Delete the networkProtocol record.
//
// networkProtocolId - the id of the networkProtocol record to delete.
//
// Returns a promise that performs the delete.
exports.deleteNetworkProtocol = function (networkProtocolId) {
  return new Promise(function (resolve, reject) {
    db.deleteRecord('networkProtocols', 'id', networkProtocolId, function (err, rec) {
      if (err) {
        reject(err)
      } else {
        resolve(rec)
      }
    })
  })
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Gets all networkProtocols from the database.
//
// Returns a promise that does the retrieval.
exports.retrieveAllNetworkProtocols = function () {
  return this.retrieveNetworkProtocols({})
}

/**
 * Retrieves a subset of the networkProtocols in the system given the options.
 *
 * Options include limits on the number of companies returned, the offset to
 * the first company returned (together giving a paging capability), and a
 * search string on networkProtocol name or type.
 *
 */
exports.retrieveNetworkProtocols = function (options) {
  return new Promise(function (resolve, reject) {
    appLogger.log(options)
    db.fetchRecords(table, options,  function(err, result) {
      resolve({ totalCount: result.length, records: result })
    })
  })
}
