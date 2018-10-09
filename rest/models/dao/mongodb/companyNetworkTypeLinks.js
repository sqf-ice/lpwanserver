// Database implementation.
var db = require('../../../lib/dbmongo')

// Error reporting
var httpError = require('http-errors')
var appLogger = require('../../../lib/appLogger.js')


const table = 'companyNetworkTypeLinks'

//* *****************************************************************************
// CompanyNetworkTypeLinks database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the companyNetworkTypeLinks record.
//
// companyId       - The id for the company this link is being created for
// networkTypeId       - The id for the network the company is linked to
// networkSettings - The settings required by the network protocol in json
//                   format
//
// Returns the promise that will execute the create.
exports.createCompanyNetworkTypeLink = function (companyId, networkTypeId, networkSettings) {
  return new Promise(function (resolve, reject) {
    // Create the user record.
    var cnl = {}
    cnl.companyId = companyId
    cnl.networkTypeId = networkTypeId
    if (networkSettings) {
      cnl.networkSettings = JSON.stringify(networkSettings)
    }
    // OK, save it!
    db.insertRecord('companyNetworkTypeLinks', cnl, function (err, record) {
      if (err) {
        reject(err)
      }
      else {
        resolve(record)
      }
    })
  })
}

// Retrieve a companyNetworkTypeLinks record by id.
//
// id - the record id of the companyNetworkTypeLinks record.
//
// Returns a promise that executes the retrieval.
exports.retrieveCompanyNetworkTypeLink = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('companyNetworkTypeLinks', 'id', id, function (err, rec) {
      if (err) {
        reject(err)
      }
      else if (!rec) {
        reject(new httpError.NotFound())
      }
      else {
        // Stored in the database as a string, make it an object.
        rec.networkSettings = JSON.parse(rec.networkSettings)
        resolve(rec)
      }
    })
  })
}

// Update the companyNetworkTypeLinks record.
//
// companyNetworkTypeLinks - the updated record.  Note that the id must be unchanged
//                       from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateCompanyNetworkTypeLink = function (companyNetworkTypeLink) {
  return new Promise(function (resolve, reject) {
    if (companyNetworkTypeLink.networkSettings) {
      companyNetworkTypeLink.networkSettings = JSON.stringify(companyNetworkTypeLink.networkSettings)
    }
    db.updateRecord('companyNetworkTypeLinks', 'id', companyNetworkTypeLink, function (err, row) {
      if (err) {
        reject(err)
      }
      else {
        resolve(row)
      }
    })
  })
}

// Delete the companyNetworkTypeLinks record.
//
// id - the id of the companyNetworkTypeLinks record to delete.
//
// Returns a promise that performs the delete.
exports.deleteCompanyNetworkTypeLink = function (id) {
  return new Promise(function (resolve, reject) {
    db.deleteRecord('companyNetworkTypeLinks', 'id', id, function (err, rec) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rec)
      }
    })
  })
}

exports.retrieveCompanyNetworkTypeLinks = function (options) {
  return new Promise(function (resolve, reject) {
    appLogger.log(options)
    db.fetchRecords(table, options, function (err, result) {
      if (err) reject(err)
      else resolve({ totalCount: result.length, records: result })
    })
  })
}

exports.retrieveAllCompanyNetworkTypeLinks = function () {
  return this.retrieveCompanyNetworkTypeLinks({})
}
