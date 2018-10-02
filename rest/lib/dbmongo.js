const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const appLogger = require('./appLogger')

// Connection URL
const url = 'mongodb://localhost:27017'

// Database Name
const dbName = 'lpwanserver'

// Create a new MongoClient
const client = new MongoClient(url)
var db = null

exports.open = function () {
  return new Promise( function( resolve, reject ) {
    client.connect(function (err) {
      if (err) {
        appLogger.log(err, 'error')
        reject(err)
      }
      else {
        appLogger.log('Connected successfully to mongodb', 'warn')
        db = client.db(dbName)
        resolve()
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
  let collection = db.collection(table)
  collection.findOneAndUpdate({[tkey]: record[tkey]}, record, function (err, r) {
    if (err) callback(err)
    else callback(null, r.value)
  })
}

exports.insertRecord = function (table, record, callback) {
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
  let collection = db.collection(table)
  collection.findOneAndUpdate({[tkey]: record[tkey]}, record, {upsert: true})
    .then(result => {
      callback(null, r.value)
    })
    .catch(err => {
      callback(err)
    })
}

exports.deleteRecord = function (table, key, value, callback) {
  let collection = collection
  collection.deleteOne({[key]: value})
    .then(result => {
      callback(null, value)
    })
    .catch(err => {
      callback(err)
    })
}

exports.fetchRecord = function (table, tkey, value, callback) {
  let collection = db.collection(table)
  collection.findOne({[tkey]: value})
    .then(result => {
      callback(null, result)
    })
    .catch(err => {
      callback(err)
    })
}

exports.fetchRecords = function (table, options, callback) {
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
