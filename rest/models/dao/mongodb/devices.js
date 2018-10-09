// Database implementation.
var db = require('../../../lib/dbmongo')

// Error reporting
var httpError = require('http-errors')
var appLogger = require('../../../lib/appLogger.js')

const table = 'devices'

//* *****************************************************************************
// Devices database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the device record.
//
// name                - the name of the device
// description         - a description of the device
// deviceModel         - model information for the device
// applicationId       - the id of the Application this device belongs to
//
// Returns the promise that will execute the create.
exports.createDevice = function (name, description, applicationId, deviceModel) {
  return new Promise(function (resolve, reject) {
    // Create the user record.
    var device = {}
    device.name = name
    device.description = description
    device.applicationId = applicationId
    device.deviceModel = deviceModel

    // OK, save it!
    db.insertRecord('devices', device, function (err, record) {
      if (err) {
        reject(err)
      }
      else {
        resolve(record)
      }
    })
  })
}

// Retrieve a device record by id.  This method retrieves not just the
// device fields, but also returns an array of the networkTypeIds the
// device has deviceNetworkTypeLinks to.
//
// id - the record id of the device.
//
// Returns a promise that executes the retrieval.
exports.retrieveDevice = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('devices', 'id', id, function (err, rec) {
      if (err) {
        reject(err)
      }
      else if (!rec) {
        reject(new httpError.NotFound())
      }
      else {
        // Get the networks for this device.
        var networksQuery = 'select networkTypeId from deviceNetworkTypeLinks where deviceId = ' + db.sqlValue(id)
        db.select(networksQuery, function (err, rows) {
          // Ignore bad returns and null sets here.
          if (!err && rows && (rows.length > 0)) {
            // Add the networks array to the returned record.
            rec.networks = []
            for (var i = 0; i < rows.length; ++i) {
              rec.networks.push(rows[ i ].networkTypeId)
            }
          }
          resolve(rec)
        })
      }
    })
  })
}

// Update the device record.
//
// device - the updated record.  Note that the id must be unchanged from
//               retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateDevice = function (device) {
  return new Promise(function (resolve, reject) {
    db.updateRecord('devices', 'id', device, function (err, row) {
      if (err) {
        reject(err)
      }
      else {
        resolve(row)
      }
    })
  })
}

// Delete the device record.
//
// deviceId - the id of the device record to delete.
//
// Returns a promise that performs the delete.
exports.deleteDevice = function (deviceId) {
  return new Promise(function (resolve, reject) {
    db.deleteRecord('devices', 'id', deviceId, function (err, rec) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rec)
      }
    })
  })
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Gets all devices from the database.
//
// Returns a promise that does the retrieval.
exports.retrieveAllDevices = function () {
  return new Promise(function (resolve, reject) {
    var sql = 'SELECT * from devices;'
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

// Retrieve the device by name.
//
// Returns a promise that does the retrieval.
exports.retrieveDevicebyName = function (name) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('devices', 'name', name, function (err, rec) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rec)
      }
    })
  })
}

exports.retrieveDevices = function (options) {
  return new Promise(function (resolve, reject) {
    appLogger.log(options)
    db.fetchRecords(table, options, function (err, result) {
      if (err) reject(err)
      else resolve({ totalCount: result.length, records: result })
    })
  })
}

exports.retrieveAllDevices = function () {
  return this.retrieveDevices({})
}
