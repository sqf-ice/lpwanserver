// Database implementation.
var db = require('../../../lib/dbmongo')

// Device access
var dev = require('./devices.js')

// Application/company validation from applicationNetowrkLinks
var app = require('./applicationNetworkTypeLinks.js')

// Error reporting
var httpError = require('http-errors')
var appLogger = require('../../../lib/appLogger.js')


const table = 'deviceNetworkTypeLinks'

//* *****************************************************************************
// DeviceNetworkTypeLinks database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the deviceNetworkTypeLinks record.
//
// deviceId          - The id for the device this link is being created for
// networkTypeId         - The id for the network the device is linked to
// networkSettings   - The settings required by the network protocol in json
//                     format
// validateCompanyId - If supplied, the device MUST belong to this company.
//
// Returns the promise that will execute the create.
exports.createDeviceNetworkTypeLink = function (deviceId, networkTypeId, deviceProfileId, networkSettings, validateCompanyId) {
  return new Promise(function (resolve, reject) {
    validateCompanyForDevice(validateCompanyId, deviceId).then(function () {
      // Create the link record.
      var link = {}
      link.deviceId = deviceId
      link.networkTypeId = networkTypeId
      link.deviceProfileId = deviceProfileId
      link.networkSettings = JSON.stringify(networkSettings)

      // OK, save it!
      db.insertRecord('deviceNetworkTypeLinks', link, function (err, record) {
        if (err) {
          reject(err)
        }
        else {
          resolve(record)
        }
      })
    })
      .catch(function (err) {
        reject(err)
      })
  })
}

// Retrieve a deviceNetworkTypeLinks record by id.
//
// id - the record id of the deviceNetworkTypeLinks record.
//
// Returns a promise that executes the retrieval.
exports.retrieveDeviceNetworkTypeLink = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('deviceNetworkTypeLinks', 'id', id, function (err, rec) {
      if (err) {
        reject(err)
      }
      else if (!rec) {
        reject(new httpError.NotFound())
      }
      else {
        if (rec.networkSettings) {
          rec.networkSettings = JSON.parse(rec.networkSettings)
        }
        resolve(rec)
      }
    })
  })
}

// Update the deviceNetworkTypeLinks record.
//
// deviceNetworkTypeLinks      - the updated record. Note that the id must be
//                           unchanged from retrieval to guarantee the same
//                           record is updated.
// validateCompanyId       - If supplied, the device MUST belong to this
//                           company.
//
// Returns a promise that executes the update.
exports.updateDeviceNetworkTypeLink = function (dnl, validateCompanyId) {
  return new Promise(function (resolve, reject) {
    validateCompanyForDeviceNetworkTypeLink(validateCompanyId, dnl.id).then(function () {
      if (dnl.networkSettings) {
        dnl.networkSettings = JSON.stringify(dnl.networkSettings)
      }
      db.updateRecord('deviceNetworkTypeLinks', 'id', dnl, function (err, row) {
        if (err) {
          reject(err)
        }
        else {
          resolve(row)
        }
      })
    })
      .catch(function (err) {
        reject(err)
      })
  })
}

// Delete the deviceNetworkTypeLinks record.
//
// id                - the id of the deviceNetworkTypeLinks record to delete.
// validateCompanyId - If supplied, the device MUST belong to this company.
//
// Returns a promise that performs the delete.
exports.deleteDeviceNetworkTypeLink = function (id, validateCompanyId) {
  return new Promise(function (resolve, reject) {
    validateCompanyForDeviceNetworkTypeLink(validateCompanyId, id).then(function () {
      db.deleteRecord('deviceNetworkTypeLinks', 'id', id, function (err, rec) {
        if (err) {
          reject(err)
        }
        else {
          resolve(rec)
        }
      })
    })
      .catch(function (err) {
        reject(err)
      })
  })
}

exports.retrieveDeviceNetworkTypeLinks = function (options) {
  return new Promise(function (resolve, reject) {
    appLogger.log(options)
    db.fetchRecords(table, options, function (err, result) {
      if (err) reject(err)
      else resolve({ totalCount: result.length, records: result })
    })
  })
}

exports.retrieveAllDeviceNetworkTypeLinks = function () {
  return this.retrieveDeviceNetworkTypeLinks({})
}

/***************************************************************************
 * Validation methods
 ***************************************************************************/
function validateCompanyForDevice (companyId, deviceId) {
  return new Promise(function (resolve, reject) {
    // undefined companyId is always valid - means the caller is a used for
    // an admin company, so they can set up any links.
    if (!companyId) {
      resolve()
    }
    else {
      dev.retrieveDevice(deviceId)
        .then(function (d) {
          app.validateCompanyForApplication(companyId, d.applicationId)
            .then(resolve())
            .catch(function (err) {
              reject(err)
            })
        })
        .catch(function (err) {
          reject(err)
        })
    }
  })
}

function validateCompanyForDeviceNetworkTypeLink (companyId, dnlId) {
  return new Promise(function (resolve, reject) {
    // undefined companyId is always valid - means the caller is a used for
    // an admin company, so they can set up any links.
    if (!companyId) {
      resolve()
    }
    else {
      exports.retrieveDeviceNetworkTypeLink(dnlId).then(function (dnl) {
        validateCompanyForDevice(dnl.deviceId)
          .then(resolve())
          .catch(function (err) {
            reject(err)
          })
      })
        .catch(function (err) {
          reject(err)
        })
    }
  })
}
