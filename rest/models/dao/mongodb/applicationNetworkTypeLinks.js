// Database implementation.
var db = require('../../../lib/dbmongo')

// Logging
var appLogger = require('../../../lib/appLogger.js')

// Application access
var app = require('./applications.js')

// Error reporting
var httpError = require('http-errors')

const table = 'applicationNetworkTypeLinks'

//* *****************************************************************************
// ApplicationNetworkTypeLinks database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the applicationNetworkTypeLinks record.
//
// applicationId     - The id for the application this link is being created for
// networkTypeId     - The id for the network the application is linked to
// networkSettings   - The settings required by the network protocol in json
//                     format
// validateCompanyId - If supplied, the application MUST belong to this company.
//
// Returns the promise that will execute the create.
exports.createApplicationNetworkTypeLink = function (applicationId, networkTypeId, networkSettings, validateCompanyId) {
  return new Promise(function (resolve, reject) {
    exports.validateCompanyForApplication(validateCompanyId, applicationId).then(function () {
      // Create the user record.
      var anl = {}
      anl.applicationId = applicationId
      anl.networkTypeId = networkTypeId
      anl.networkSettings = JSON.stringify(networkSettings)

      // OK, save it!
      db.insertRecord('applicationNetworkTypeLinks', anl, function (err, record) {
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

// Retrieve a applicationNetworkTypeLinks record by id.
//
// id - the record id of the applicationNetworkTypeLinks record.
//
// Returns a promise that executes the retrieval.
exports.retrieveApplicationNetworkTypeLink = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('applicationNetworkTypeLinks', 'id', id, function (err, rec) {
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

// Update the applicationNetworkTypeLinks record.
//
// applicationNetworkTypeLinks - the updated record. Note that the id must be
//                           unchanged from retrieval to guarantee the same
//                           record is updated.
// validateCompanyId       - If supplied, the application MUST belong to this
//                           company.
//
// Returns a promise that executes the update.
exports.updateApplicationNetworkTypeLink = function (applicationNetworkTypeLink, validateCompanyId) {
  return new Promise(async function (resolve, reject) {
    exports.validateCompanyForApplicationNetworkTypeLink(validateCompanyId, applicationNetworkTypeLink.id).then(function () {
      if (applicationNetworkTypeLink.networkSettings) {
        applicationNetworkTypeLink.networkSettings = JSON.stringify(applicationNetworkTypeLink.networkSettings)
      }
      db.updateRecord('applicationNetworkTypeLinks', 'id', applicationNetworkTypeLink, function (err, row) {
        if (err) {
          reject(err)
        }
        else {
          resolve(row)
        }
      })
    })
      .catch(function (err) {
        appLogger.log('Error validating company ' + validateCompanyId + ' for ' + 'applicationNetworkLink ' + applicationNetworkTypeLink.id + '.')
        reject(err)
      })
  })
}

// Delete the applicationNetworkTypeLinks record.
//
// id                - the id of the applicationNetworkTypeLinks record to delete.
// validateCompanyId - If supplied, the application MUST belong to this company.
//
// Returns a promise that performs the delete.
exports.deleteApplicationNetworkTypeLink = function (id, validateCompanyId) {
  return new Promise(function (resolve, reject) {
    exports.validateCompanyForApplicationNetworkTypeLink(validateCompanyId, id).then(function () {
      db.deleteRecord('applicationNetworkTypeLinks', 'id', id, function (err, rec) {
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

exports.retrieveApplicationNetworkTypeLinks = function (options) {
  return new Promise(function (resolve, reject) {
    appLogger.log(options)
    db.fetchRecords(table, options, function (err, result) {
      if (err) reject(err)
      else resolve({ totalCount: result.length, records: result })
    })
  })
}

/***************************************************************************
 * Validation methods
 ***************************************************************************/
exports.validateCompanyForApplication = function (companyId, applicationId) {
  return new Promise(function (resolve, reject) {
    // undefined companyId is always valid - means the caller is a used for
    // an admin company, so they can set up any links.
    if (!companyId) {
      resolve()
    }
    else {
      app.retrieveApplication(applicationId).then(function (a) {
        if (a.companyId != companyId) {
          reject(new httpError.Unauthorized())
        }
        else {
          resolve()
        }
      })
        .catch(function (err) {
          reject(err)
        })
    }
  })
}

exports.validateCompanyForApplicationNetworkTypeLink = function (companyId, antlId) {
  return new Promise(async function (resolve, reject) {
    // undefined companyId is always valid - means the caller is a used for
    // an admin company, so they can set up any links.  Yes, this is
    // redundant with the application validator, but it saves the database
    // hit.
    if (!companyId) {
      resolve()
    }
    else {
      try {
        // Get the record we're validating.
        var antl = await exports.retrieveApplicationNetworkTypeLink(antlId)
        // Validate he record's applicationm against the company.
        await exports.validateCompanyForApplication(companyId, antl.applicationId)
        resolve()
      }
      catch (err) {
        reject(err)
      };
    }
  })
}
