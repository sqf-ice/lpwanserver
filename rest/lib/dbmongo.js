const {MongoClient, ObjectID} = require('mongodb')
const assert = require('assert')
const appLogger = require('./appLogger')
const crypto = require('./crypto')

// Connection URL
const url = 'mongodb://localhost:27017'

// Database Name
const dbName = 'lpwanserver'

// Create a new MongoClient
const client = new MongoClient(url)
var db = null

const adminUser = {
  username: 'admin',
  email: 'admin@cablelabs.com',
  emailVerified: true,
  companyId: 1,
  role: 2,
  password: 'password'
}

const company = {
  name: 'adminCompany',
  type: 1
}

function addAdmin () {
  return new Promise(function (resolve, reject) {
    crypto.hashPassword(adminUser.password, function (err, hash) {
      if (!err) {
        // Need a string to store in DB. Convert back to buffer on fetch.
        adminUser.passwordHash = hash.toString('hex')
        db.collection('users').findOneAndReplace({username: 'admin'}, adminUser, {
          upsert: true,
          returnOriginal: false
        }, function (err, result) {
          if (err) reject(err)
          else resolve(result.value)
        })
      }
      else {
        throw (err)
      }
    })
  })
}

function addCompany () {
  return new Promise(function (resolve, reject) {
    db.collection('companies').findOneAndReplace({name: company.name}, company, {
      upsert: true,
      returnOriginal: false
    }, function (err, result) {
      if (err) reject(err)
      else resolve(result.value)
    })
  })
}

function addRole () {
  return new Promise(function (resolve, reject) {
    db.collection('userRoles').findOneAndReplace({name: 'admin'}, {name: 'admin'}, {
      upsert: true,
      returnOriginal: false
    }, function (err, result) {
      if (err) reject(err)
      else resolve(result.value)
    })
  })
}

exports.open = function () {
  return new Promise(function (resolve, reject) {
    client.connect(function (err) {
      if (err) {
        appLogger.log(err, 'error')
        reject(err)
      }
      else {
        appLogger.log('Connected successfully to mongodb', 'warn')
        db = client.db(dbName)
        let promiseList = [addCompany(), addRole()]
        Promise.all(promiseList)
          .then(results => {
            adminUser.companyId = results[0]._id
            adminUser.role = results[1]._id
            addAdmin()
              .then(result => {
                appLogger.log('Added Admin', 'warn')
                resolve()
              })
              .catch(err => {
                appLogger.log(err, 'error')
                reject(err)
              })
          })
          .catch(err => {
            appLogger.log(err, 'error')
            reject(err)
          })
      }
    })
  })
}

exports.close = function () {
  if (db) {
    db.close()
  }
  appLogger.log('close db: ' + dbName)
}

exports.updateRecord = function (table, tkey, record, callback) {
  if (record._id) delete record._id
  let collection = db.collection(table)
  collection.findOneAndReplace({[tkey]: record[tkey]}, record, {returnOriginal: false}, function (err, r) {
    if (err) callback(err)
    else callback(null, r.value)
  })
}

exports.insertRecord = function (table, record, callback) {
  if (record._id) delete record._id
  let collection = db.collection(table)
  collection.insertOne(record)
    .then(result => {
      collection.findOne({_id: result.insertedId})
        .then(newRecord => {
          callback(null, newRecord)
        })
    })
    .catch(err => {
      callback(err)
    })
}

// Insert if not existing, else update. In either case return the resulting row.
exports.upsertRecord = function (table, tkey, record, callback) {
  if (record._id) delete record._id
  let collection = db.collection(table)
  collection.findOneAndReplace({[tkey]: record[tkey]}, record, {returnOriginal: false, upsert: true}, function (err, r) {
    if (err) callback(err)
    else callback(null, r.value)
  })
}

exports.deleteRecord = function (table, key, value, callback) {
  let collection = db.collection(table)
  collection.deleteOne({[key]: value})
    .then(result => {
      callback(null, value)
    })
    .catch(err => {
      callback(err)
    })
}

exports.fetchRecord = function (table, tkey, value, callback) {
  if (tkey === 'id') {
    tkey = '_id'
  }
  value = scrubValue(value)
  appLogger.log('Fetching ' + table + '{' + tkey + ': ' + value + '}', 'error')
  let collection = db.collection(table)
  collection.findOne({[tkey]: value})
    .then(result => {
      appLogger.log(result, 'error')
      callback(null, result)
    })
    .catch(err => {
      callback(err)
    })
}

exports.fetchRecords = function (table, options, callback) {
  for (const key of Object.keys(options)) {
    let newKey = scrubKey(key)
    options[newKey] = scrubValue(options[key])
    if (newKey !== key) delete options[key]
  }
  appLogger.log(options, 'warn')
  let collection = db.collection(table)
  collection.find(options).toArray(callback)
}

exports.selectOne = function (sql, username, callback) {
  this.fetchRecord('users', 'username', username, callback)
}

exports.select = function (sql, table, options, callback) {
  let collection = db.collection(table)
  collection.find(options).toArray(callback)
}

exports.sqlValue = function (value) {
  return value
}

function scrubKey(key) {
  if (key === 'search') {
    key = 'name'
  }
  return key
}

function scrubValue (value) {
  let checkObjectId = new RegExp("^[0-9a-fA-F]{24}$")

  if (checkObjectId.test(value)) {
    value = new ObjectID(value)
  }
  return value
}
