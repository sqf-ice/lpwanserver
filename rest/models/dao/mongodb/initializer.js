const db = require('../../../lib/dbmongo')
const appLogger = require('../../../lib/appLogger')

exports.init = function () {
  return new Promise( function( resolve, reject ) {
    db.open()
      .then(() => {
        appLogger.log('Mongo DB Connected', 'warn')
        resolve()
      })
      .catch(err => {
        reject(err)
      })
  })
}
