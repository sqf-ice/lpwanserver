// Database implementation.
var db = require('../../../lib/dbmongo')

// Error reporting
var httpError = require('http-errors')
var appLogger = require('../../../lib/appLogger.js')


const table = 'applications'

//* *****************************************************************************
// Applications database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the application record.
//
// name                - the name of the application
// description         - the description of the application
// companyId           - the id of the Company this application belongs to
// reportingProtocolId - The protocol used to report data to the application
// baseUrl             - The base URL to use for reporting the data to the
//                       application using the reporting protocol
//
// Returns the promise that will execute the create.
exports.createApplication = function (name, description, companyId, reportingProtocolId, baseUrl) {
  return new Promise(function (resolve, reject) {
    // Create the user record.
    var application = {}
    application.name = name
    application.description = description
    application.companyId = companyId
    application.reportingProtocolId = reportingProtocolId
    application.baseUrl = baseUrl

    // OK, save it!
    db.insertRecord('applications', application, function (err, record) {
      if (err) {
        reject(err)
      }
      else {
        resolve(record)
      }
    })
  })
}

// Retrieve a application record by id.  This method retrieves not just the
// application fields, but also returns an array of the networkTypeIds the
// application has applicationNetworkTypeLinks to.
//
// id - the record id of the application.
//
// Returns a promise that executes the retrieval.
exports.retrieveApplication = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('applications', 'id', id, function (err, rec) {
      if (err) {
        reject(err)
      }
      else if (!rec) {
        reject(new httpError.NotFound())
      }
      else {
        // Get the networks for this application.
        var networksQuery = 'select networkTypeId from applicationNetworkTypeLinks where applicationId = ' + db.sqlValue(id)
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

// Update the application record.
//
// application - the updated record.  Note that the id must be unchanged from
//               retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateApplication = function (application) {
  return new Promise(function (resolve, reject) {
    db.updateRecord('applications', 'id', application, function (err, row) {
      if (err) {
        reject(err)
      }
      else {
        resolve(row)
      }
    })
  })
}

// Delete the application record.
//
// applicationId - the id of the application record to delete.
//
// Returns a promise that performs the delete.
exports.deleteApplication = function (applicationId) {
  return new Promise(function (resolve, reject) {
    db.deleteRecord('applications', 'id', applicationId, function (err, rec) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rec)
      }
    })
  })
}

exports.retrieveApplicationbyName = function (name) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('applications', 'name', name, function (err, rec) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rec)
      }
    })
  })
}
exports.retrieveApplications = function (options) {
  return new Promise(function (resolve, reject) {
    appLogger.log(options)
    db.fetchRecords(table, options, function (err, result) {
      if (err) reject(err)
      else resolve({ totalCount: result.length, records: result })
    })
  })
}

exports.retrieveAllApplications = function () {
  return this.retrieveApplications({})
}
