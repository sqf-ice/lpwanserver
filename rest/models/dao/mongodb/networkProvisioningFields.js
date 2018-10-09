// Database implementation.
var db = require('../../../lib/dbmongo')

// Error reporting
var httpError = require('http-errors')
var appLogger = require('../../../lib/appLogger.js')


const table = 'networkProvisioningFields'

//* *****************************************************************************
// NetworkProvisioningFields database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the networkProvisioningFields record.
//
// networkProtocolId   - The id of the networkProtocol this
//                       networkProvisioningField is defining data for
// fieldOrder          - The sort order for fields to be presented.
// fieldName           - The name of the field in the JSON structure
// fieldLabel          - The name of the field (for the end user)
// fieldType           - The data type of the field.
// fieldSize           - The size of the field, if applicable
// requiredField       - Is the field required?
// provisioningTableId - The table in the database this data is for (e.g.,
//                       companies, applications, devices)
//
// Returns the promise that will execute the create.
exports.createNetworkProvisioningField = function (networkProtocolId, fieldOrder, fieldName, fieldLabel, fieldType, fieldSize, requiredField, provisioningTableId) {
  return new Promise(function (resolve, reject) {
    // Create the user record.
    var npf = {}
    npf.networkProtocolId = networkProtocolId
    npf.fieldOrder = fieldOrder
    npf.fieldName = fieldName
    npf.fieldLabel = fieldLabel
    npf.fieldType = fieldType
    npf.fieldSize = fieldSize
    npf.requiredField = requiredField
    npf.provisioningTableId = provisioningTableId

    // OK, save it!
    db.insertRecord('networkProvisioningFields', npf, function (err, record) {
      if (err) {
        reject(err)
      }
      else {
        resolve(record)
      }
    })
  })
}

// Retrieve a networkProvisioningField record by id.
//
// id - the record id of the network.
//
// Returns a promise that executes the retrieval.
exports.retrieveNetworkProvisioningField = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('networkProvisioningFields', 'id', id, function (err, rec) {
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

// Update the networkProvisioningField record.
//
// network- the updated record.  Note that the id must be unchanged
//          from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateNetworkProvisioningField = function (npf) {
  return new Promise(function (resolve, reject) {
    db.updateRecord('networkProvisioningFields', 'id', npf, function (err, row) {
      if (err) {
        reject(err)
      }
      else {
        resolve(row)
      }
    })
  })
}

// Delete the networkProvisioningField record.
//
// id - the id of the networkProvisioningField record to delete.
//
// Returns a promise that performs the delete.
exports.deleteNetworkProvisioningField = function (id) {
  return new Promise(function (resolve, reject) {
    db.deleteRecord('networkProvisioningFields', 'id', id, function (err, rec) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rec)
      }
    })
  })
}

exports.retrieveNetworkProvisioningFields = function (options) {
  return new Promise(function (resolve, reject) {
    appLogger.log(options)
    db.fetchRecords(table, options, function (err, result) {
      if (err) reject(err)
      else resolve({ totalCount: result.length, records: result })
    })
  })
}

exports.retrieveAllNetworkProvisioningFields = function () {
  return this.retrieveNetworkProvisioningFields({})
}

// Gets the types of companies from the database table
exports.getProvisioningTables = function () {
  return new Promise(function (resolve, reject) {
    var sql = 'select * from provisioningTables'
    db.select(sql, table, options, function (err, rows) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rows)
      }
    })
  })
}
