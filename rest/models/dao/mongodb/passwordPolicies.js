// Database implementation.
var db = require('../../../lib/dbmongo')

// Error reporting
var httpError = require('http-errors')
var appLogger = require('../../../lib/appLogger.js')

const table = 'passwordPolicies'

//* *****************************************************************************
// PasswordPolicies database table.
//* *****************************************************************************

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the passwordPolicy record.
//
// ruleText   - the description of the rule for users.
// ruleRegExp - the regular expression that enforces the rule.  The password
//              must match this expression to be valid.
// companyId  - The id of the company that this rule if for (null for all).
//
// Returns the promise that will execute the create.
exports.createPasswordPolicy = function (ruleText, ruleRegExp, companyId) {
  return new Promise(function (resolve, reject) {
    // Create the user record.
    var passwordPolicy = {}
    passwordPolicy.ruleText = ruleText
    passwordPolicy.ruleRegExp = ruleRegExp
    if (companyId) {
      passwordPolicy.companyId = companyId
    }

    // OK, save it!
    db.insertRecord('passwordPolicies', passwordPolicy, function (err, record) {
      if (err) {
        reject(err)
      }
      else {
        resolve(record)
      }
    })
  })
}

// Retrieve a passwordPolicy record by id.
//
// id - the record id of the passwordPolicy.
//
// Returns a promise that executes the retrieval.
exports.retrievePasswordPolicy = function (id) {
  return new Promise(function (resolve, reject) {
    db.fetchRecord('passwordPolicies', 'id', id, function (err, rec) {
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

// Update the passwordPolicy record.
//
// passwordPolicy - the updated record.  Note that the id must be unchanged from
//                  retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
exports.updatePasswordPolicy = function (passwordPolicy) {
  return new Promise(function (resolve, reject) {
    db.updateRecord('passwordPolicies', 'id', passwordPolicy, function (err, row) {
      if (err) {
        reject(err)
      }
      else {
        resolve(row)
      }
    })
  })
}

// Delete the passwordPolicy record.
//
// id - the id of the passwordPolicy record to delete.
//
// Returns a promise that performs the delete.
exports.deletePasswordPolicy = function (id) {
  return new Promise(function (resolve, reject) {
    db.deleteRecord('passwordPolicies', 'id', id, function (err, rec) {
      if (err) {
        reject(err)
      }
      else {
        resolve(rec)
      }
    })
  })
}

exports.retrievePasswordPolicies = function (options) {
  return new Promise(function (resolve, reject) {
    appLogger.log(options)
    db.fetchRecords(table, options, function (err, result) {
      if (err) reject(err)
      else resolve({ totalCount: result.length, records: result })
    })
  })
}

exports.retrieveAllPasswordPolicies = function () {
  return this.retrievePasswordPolicies({})
}

//* *****************************************************************************
// Other functions.
//* *****************************************************************************

exports.passwordValidator = function (companyId, password) {
  return new Promise(function (resolve, reject) {
    // Get the rules from the passwordPolicies table

    // Verify that the password passes each rule.

  })
}
