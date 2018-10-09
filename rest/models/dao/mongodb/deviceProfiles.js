// Database implementation.
var db = require('../../../lib/dbmongo')

// Logging
var appLogger = require('../../../lib/appLogger.js')

// Device access
var dev = require('./devices.js')

// Error reporting
var httpError = require('http-errors')
var appLogger = require('../../../lib/appLogger.js')


const table = 'deviceProfiles'

//* *****************************************************************************
// DeviceProfiles database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the deviceProfiles record.
//
// deviceId          - The id for the device this link is being created for
// networkTypeId     - The id for the network the device is linked to
// name              - The display name for the profile.
// description       - The description for the profile
// networkSettings   - The settings required by the network protocol in json
//                     format
// Returns the promise that will execute the create.
exports.createDeviceProfile = function (networkTypeId, companyId, name, description, networkSettings) {
  return new Promise(function (resolve, reject) {
    // Create the link record.
    var profile = {}
    profile.networkTypeId = networkTypeId
    profile.companyId = companyId
    profile.name = name
    profile.description = description
    profile.networkSettings = JSON.stringify(networkSettings)

    // OK, save it!
    db.insertRecord('deviceProfiles', profile, function (err, record) {
      if (err) {
        reject(err)
      }
      else {
        resolve(record)
      }
    })
  })
}

// Retrieve a deviceProfiles record by id.
//
// id - the record id of the deviceProfiles record.
//
// Returns a promise that executes the retrieval.
exports.retrieveDeviceProfile = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('deviceProfiles', 'id', id, function (err, rec) {
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

// Update the deviceProfiles record.
//
// profile - the updated record. Note that the id must be unchanged from
//           retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateDeviceProfile = function (profile) {
  return new Promise(function (resolve, reject) {
    if (profile.networkSettings) {
      profile.networkSettings = JSON.stringify(profile.networkSettings)
    }
    db.updateRecord('deviceProfiles', 'id', profile, function (err, row) {
      if (err) {
        reject(err)
      }
      else {
        resolve(row)
      }
    })
  })
}

// Delete the deviceProfiles record.
//
// id - the id of the deviceProfiles record to delete.
//
// Returns a promise that performs the delete.
exports.deleteDeviceProfile = function (id) {
  return new Promise(function (resolve, reject) {
    db.deleteRecord('deviceProfiles', 'id', id, function (err, rec) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rec)
      }
    })
  })
}

exports.retrieveDeviceProfiles = function (options) {
  return new Promise(function (resolve, reject) {
    appLogger.log(options)
    db.fetchRecords(table, options, function (err, result) {
      if (err) reject(err)
      else resolve({ totalCount: result.length, records: result })
    })
  })
}

exports.retrieveAllDeviceProfiles = function () {
  return this.retrieveDeviceProfiles({})
}
