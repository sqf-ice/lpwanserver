// Database implementation.
var db = require('../../../lib/dbmongo')

// Error reporting
var httpError = require('http-errors')
var appLogger = require('../../../lib/appLogger.js')


const table = 'reportingProtocols'

//* *****************************************************************************
// ReportingProtocols database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the reportingProtocol record.
//
// name            - the name of the reporting protocol to display for selection
// protocolHandler - the filename for the code that supports the general
//                   reporting protocol api for this specific protocol.
//
// Returns the promise that will execute the create.
exports.createReportingProtocol = function (name, protocolHandler) {
  return new Promise(function (resolve, reject) {
    // Create the user record.
    var rp = {}
    rp.name = name
    rp.protocolHandler = protocolHandler

    // OK, save it!
    db.insertRecord('reportingProtocols', rp, function (err, record) {
      if (err) {
        reject(err)
      }
      else {
        resolve(record)
      }
    })
  })
}

// Retrieve a reportingProtocol record by id.
//
// id - the record id of the reportingProtocol.
//
// Returns a promise that executes the retrieval.
exports.retrieveReportingProtocol = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('reportingProtocols', 'id', id, function (err, rec) {
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

// Update the reportingProtocol record.
//
// reportingProtocol - the updated record.  Note that the id must be unchanged
//                     from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateReportingProtocol = function (rp) {
  return new Promise(function (resolve, reject) {
    db.updateRecord('reportingProtocols', 'id', rp, function (err, row) {
      if (err) {
        reject(err)
      }
      else {
        resolve(row)
      }
    })
  })
}

// Delete the reportingProtocol record.
//
// id - the id of the reportingProtocol record to delete.
//
// Returns a promise that performs the delete.
exports.deleteReportingProtocol = function (id) {
  return new Promise(function (resolve, reject) {
    db.deleteRecord('reportingProtocols', 'id', id, function (err, rec) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rec)
      }
    })
  })
}

exports.retrieveReportingProtocols = function (options) {
  return new Promise(function (resolve, reject) {
    appLogger.log(options)
    db.fetchRecords(table, options, function (err, result) {
      if (err) reject(err)
      else resolve({ totalCount: result.length, records: result })
    })
  })
}

exports.retrieveAllReportingProtocols = function () {
  return this.retrieveReportingProtocols({})
}
