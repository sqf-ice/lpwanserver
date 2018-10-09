// Database implementation.
var db = require('../../../lib/dbmongo')
var appLogger = require('../../../lib/appLogger')

var pwVal = require('./passwordPolicies.js')

// Error reporting
var httpError = require('http-errors')


const table = 'companies'

exports.COMPANY_VENDOR = 2
exports.COMPANY_ADMIN = 1
//* *****************************************************************************
// Companies database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the company record.
//
// name  - the name of the company
// type  - the company type. COMPANY_ADMIN can manage companies, etc.,
//         COMPANY_VENDOR is the typical vendor who just manages their own apps
//         and devices.
//
// Returns the promise that will execute the create.
exports.createCompany = function (name, type) {
  return new Promise(function (resolve, reject) {
    // Create the user record.
    var company = {}
    company.name = name
    company.type = type

    // OK, save it!
    db.insertRecord('companies', company, function (err, record) {
      if (err) {
        reject(err)
      }
      else {
        resolve(record)
      }
    })
  })
}

// Retrieve a company record by id.  This method retrieves not just the company
// fields, but also returns an array of the networkTypeIds the company has
// companyNetworkTypeLinks to.
//
// id - the record id of the company.
//
// Returns a promise that executes the retrieval.
exports.retrieveCompany = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('companies', 'id', id, function (err, rec) {
      if (err) {
        reject(err)
      }
      else if (!rec) {
        reject(new httpError.NotFound())
      }
      else {
        // Get the networks for this company.
        db.fetchRecords('companyNetworkTypeLinks', {companyId: rec._id}, function (err, results) {
          if (err) {
            appLogger.log(err, 'error')
            reject(err)
          }
          else {
            rec.networks = []
            for (var i = 0; i < results.length; ++i) {
              rec.networks.push(results[i].networkTypeId)
            }
          }
          appLogger.log(rec, 'warn')
          resolve(rec)
        })
      }
    })
  })
}

// Update the company record.
//
// company - the updated record.  Note that the id must be unchanged from
//           retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updateCompany = function (company) {
  return new Promise(function (resolve, reject) {
    db.updateRecord('companies', 'id', company, function (err, row) {
      if (err) {
        reject(err)
      }
      else {
        resolve(row)
      }
    })
  })
}

// Delete the company record.
//
// companyId - the id of the company record to delete.
//
// Returns a promise that performs the delete.
exports.deleteCompany = function (companyId) {
  return new Promise(function (resolve, reject) {
    db.deleteRecord('companies', 'id', companyId, function (err, rec) {
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

// Retrieve the company by name.
//
// Returns a promise that does the retrieval.
exports.retrieveCompanybyName = function (name) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('companies', 'name', name, function (err, rec) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rec)
      }
    })
  })
}
exports.retrieveCompanies = function (options) {
  return new Promise(function (resolve, reject) {
    appLogger.log(options)
    db.fetchRecords(table, options, function (err, result) {
      if (err) reject(err)
      else resolve({ totalCount: result.length, records: result })
    })
  })
}

exports.retrieveAllCompanies = function () {
  return this.retrieveAllCompanies({})
}

//* *****************************************************************************
// Other functions.
//* *****************************************************************************

// Tests the password for validity based on the passwordPolicies for the
// company.
//
// companyId - The company to test the password for
// password  - The password to be tested.
//
// Returns a promise that will perform the tests.
exports.passwordValidator = function (companyId, password) {
  return new Promise(function (resolve, reject) {
    // Get the rules from the passwordPolicies table
    pwVal.retrievePasswordPolicies(companyId).then(function (rows) {
      // Verify that the password passes each rule.
      for (var i = 0; i < rows.length; ++i) {
        var regexp
        try {
          regexp = new RegExp(rows[ i ].ruleRegExp)
        }
        catch (e) {
          // Invalid expression.  Skip it.
          continue
        }

        if (!regexp.test(password)) {
          // Invalid password
          reject(rows[ i ].ruleText)
          return
        }
      }
      resolve()
    })
  })
}

// Gets the types of companies from the database table
exports.getTypes = function () {
  return new Promise(function (resolve, reject) {
    db.fetchRecords('companyTypes', {}, function (err, rows) {
      if (err) {
        appLogger.log(err, 'error')
        reject(err)
      }
      else {
        resolve(rows)
      }
    })
  })
}
