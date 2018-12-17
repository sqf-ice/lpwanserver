let appLogger = require('./lib/appLogger.js')
let restServer
let modelAPI
let applications

exports.initialize = function (app, server) {
  restServer = server
  modelAPI = server.modelAPI
  applications = modelAPI.applications

  app.get('/api/applications', [restServer.isLoggedIn],
    function (req, res) {
      applications.retrieveApplications(req).then(function (cos) {
        restServer.respondJson(res, null, cos)
      })
        .catch(function (err) {
          appLogger.log('Error getting applications: ' + err)
          restServer.respond(res, err)
        })
    })

  app.get('/api/applications/:id', [restServer.isLoggedIn],
    function (req, res, next) {
      applications.retrieveApplication(parseInt(req.params.id))
        .then(function (app) {
          res.status(200)
          res.send(app)
        })
        .catch(function (err) {
          appLogger.log('Error getting application ' + req.params.id + ': ' + err)
          res.status()
        })
    })

  app.post('/api/applications', [restServer.isLoggedIn,
    restServer.isAdmin],
  function (req, res) {
    let rec = req.body
    applications.createApplication(rec)
      .then(function (rec) {
        res.status(200)
        res.send(rec)
      })
      .catch(function (err) {
        res.status(400)
        res.send({Error: err.message})
      })
  })

  /**
     * @apiDescription Updates the application record with the specified id.
     *
     * @api {put} /api/applications/:id Update Application
     * @apiGroup Applications
     * @apiPermission System Admin, or Company Admin for this Company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Application's id
     * @apiParam (Request Body) {String} [name] The Application's name
     * @apiParam (Request Body) {String} [description] The Application's
     *      description
     * @apiParam (Request Body) {Number} [companyId] The Id of the Company that
     *      the Application blongs to.  For a Company Admin user, this can
     *      only be the Id of their own Company.
     * @apiParam (Request Body) {String} [baseURL] The URL that the Reporting
     *      Protocol sends the data to.  This may have additional paths added,
     *      depending on the Reporting Protocol.
     * @apiParam (Request Body) {Number} [reportingProtocolId] The Id of the
     *      Reporting Protocol the Application will use to pass Device data
     *      back to the Application Vendor.
     * @apiExample {json} Example body:
     *      {
     *          "name": "GPS Pet Tracker",
     *          "description": "Pet finder with occasional reporting"
     *          "companyId": 1,
     *          "baseUrl": "https://IoTStuff.com/incomingData/GPSPetTracker"
     *          "reportingProtocolId": 1
     *      }
     * @apiVersion 0.1.0
     */
  app.put('/api/applications/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    let data = {}
    data.id = parseInt(req.params.id)
    // We'll start by getting the application, as a read is much less
    // expensive than a write, and then we'll be able to tell if anything
    // really changed before we even try to write.
    applications.retrieveApplication(data.id).then(function (app) {
      // Verify that the user can make the change.
      if ((modelAPI.companies.COMPANY_ADMIN !== req.company.type) &&
                 (req.user.companyId !== app.companyId)) {
        restServer.respond(res, 403)
        return
      }

      let changed = 0
      if ((req.body.name) &&
                 (req.body.name !== app.name)) {
        data.name = req.body.name
        ++changed
      }

      if ((req.body.description) &&
                 (req.body.description !== app.description)) {
        data.description = req.body.description
        ++changed
      }

      // Can only change the companyId if an admin user.
      if ((req.body.companyId) &&
                 (req.body.companyId !== app.companyId) &&
                 (modelAPI.companies.COMPANY_ADMIN !== req.company.type)) {
        restServer.respond(res, 400, "Cannot change application's company")
        return
      }

      if ((req.body.companyId) &&
                 (req.body.companyId !== app.companyId)) {
        data.companyId = req.body.companyId
        ++changed
      }
      if ((req.body.reportingProtocolId) &&
                 (req.body.reportingProtocolId !== app.reportingProtocolId)) {
        data.reportingProtocolId = req.body.reportingProtocolId
        ++changed
      }
      if ((req.body.baseUrl) &&
                 (req.body.baseUrl !== app.baseUrl)) {
        data.baseUrl = req.body.baseUrl
        ++changed
      }
      if (changed === 0) {
        // No changes.  But returning 304 apparently causes Apache to strip
        // CORS info, causing the browser to throw a fit.  So just say,
        // "Yeah, we did that.  Really.  Trust us."
        restServer.respond(res, 204)
      }
      else {
        // Do the update.
        applications.updateApplication(data).then(function (rec) {
          restServer.respond(res, 204)
        })
          .catch(function (err) {
            restServer.respond(res, err)
          })
      }
    })
      .catch(function (err) {
        appLogger.log('Error getting application ' + req.body.name + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * @apiDescription Deletes the application record with the specified id.
     *
     * @api {delete} /api/applications/:id Delete Application
     * @apiGroup Applications
     * @apiPermission System Admin, or Company Admin for this company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Application's id
     * @apiVersion 0.1.0
     */
  app.delete('/api/applications/:id', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    let id = parseInt(req.params.id)
    // If the caller is a global admin, we can just delete.
    if (req.company.type === modelAPI.companies.COMPANY_ADMIN) {
      applications.deleteApplication(id).then(function () {
        restServer.respond(res, 204)
      })
        .catch(function (err) {
          appLogger.log('Error deleting application ' + id + ': ' + err)
          restServer.respond(res, err)
        })
    }
    // Company admin
    else {
      applications.retrieveApplication(req.params.id).then(function (app) {
        // Verify that the user can delete.
        if (req.user.companyId !== app.companyId) {
          restServer.respond(res, 403)
          return
        }
        applications.deleteApplication(id).then(function () {
          restServer.respond(res, 204)
        })
          .catch(function (err) {
            appLogger.log('Error deleting application ' + id + ': ' + err)
            restServer.respond(res, err)
          })
      })
        .catch(function (err) {
          appLogger.log('Error finding application ' + id + ' to delete: ' + err)
          restServer.respond(res, err)
        })
    }
  })

  /**
     * @apiDescription Starts serving the data from the Networks to the
     *      Application server (baseUrl) using the Reporting Protocol for
     *      the Application.
     * @api {post} /api/applications/:id/start Start Application
     * @apiGroup Applications
     * @apiPermission System Admin, or Company Admin for this company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Application's id
     * @apiVersion 0.1.0
     */
  // Yeah, yeah, this isn't a pure REST call.  So sue me.  Gets the job done.
  app.post('/api/applications/:id/start', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    let id = parseInt(req.params.id)
    // If the caller is a global admin, we can just start.
    if (req.company.type === modelAPI.companies.COMPANY_ADMIN) {
      applications.startApplication(id).then(function (logs) {
        restServer.respond(res, 200, logs.remoteAccessLogs)
      })
        .catch(function (err) {
          appLogger.log('Error starting application ' + id + ': ' + err)
          restServer.respond(res, err)
        })
    }
    // Company admin
    else {
      applications.retrieveApplication(req.params.id).then(function (app) {
        // Verify that the user can start.
        if (req.user.companyId !== app.companyId) {
          restServer.respond(res, 403)
          return
        }
        applications.startApplication(id).then(function (logs) {
          restServer.respond(res, 200, logs.remoteAccessLogs)
        })
          .catch(function (err) {
            appLogger.log('Error starting application ' + id + ': ' + err)
            restServer.respond(res, err)
          })
      })
        .catch(function (err) {
          appLogger.log('Error finding application ' + id + ' to start: ' + err)
          restServer.respond(res, err)
        })
    }
  })

  /**
     * @apiDescription Stops serving the data from the Networks to the
     *      Application server (baseUrl).
     * @api {post} /api/applications/:id/stop Stop Application
     * @apiGroup Applications
     * @apiPermission System Admin, or Company Admin for this company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Application's id
     * @apiVersion 0.1.0
     */
  // Yeah, yeah, this isn't a pure REST call.  So sue me.  Gets the job done.
  app.post('/api/applications/:id/stop', [restServer.isLoggedIn,
    restServer.fetchCompany,
    restServer.isAdmin],
  function (req, res, next) {
    let id = parseInt(req.params.id)
    // If the caller is a global admin, we can just stop.
    if (req.company.type === modelAPI.companies.COMPANY_ADMIN) {
      applications.stopApplication(id).then(function (logs) {
        restServer.respond(res, 200, logs.remoteAccessLogs)
      })
        .catch(function (err) {
          appLogger.log('Error stopping application ' + id + ': ' + err)
          restServer.respond(res, err)
        })
    }
    // Company admin
    else {
      applications.retrieveApplication(req.params.id).then(function (app) {
        // Verify that the user can stop this app.
        if (req.user.companyId !== app.companyId) {
          restServer.respond(res, 403)
          return
        }

        applications.stopApplication(id).then(function (logs) {
          restServer.respond(res, 200, logs.remoteAccessLogs)
        })
          .catch(function (err) {
            appLogger.log('Error stopping application ' + id + ': ' + err)
            restServer.respond(res, err)
          })
      })
        .catch(function (err) {
          appLogger.log('Error finding application ' + id + ' to start: ' + err)
          restServer.respond(res, err)
        })
    }
  })

  /**
     * Tests serving the data as if it came from a network.
     * Yeah, yeah, this isn't a pure REST call.  So sue me.  Gets the job done.
     */
  app.post('/api/applications/:id/test', function (req, res, next) {
    let id = parseInt(req.params.id)
    applications.testApplication(id, req.body).then(function (logs) {
      restServer.respond(res, 200)
    })
      .catch(function (err) {
        appLogger.log('Error testing application ' + id + ': ' + err)
        restServer.respond(res, err)
      })
  })

  /**
     * Accepts the data from the remote networks to pass to the reporting
     * protocol on behalf of the application.
     * - Any caller can pass data to this method.  We don't require them to be
     *   logged in.  We will reject messages for unknown applicationIds and/or
     *   networkIds with a generic 404.
     */
  app.post('/api/ingest/:applicationId/:networkId', function (req, res, next) {
    let applicationId = parseInt(req.params.applicationId)
    let networkId = parseInt(req.params.networkId)
    let data = req.body

    // make sure the network is enabled
    modelAPI.networks.retrieveNetwork(networkId)
      .then(network => {
        if (network.securityData.enabled) {
          appLogger.log('Received data from network ' + networkId +
            ' for application ' + applicationId +
            ': ' + JSON.stringify(data))

          applications.passDataToApplication(applicationId, networkId,
            data).then(function () {
            restServer.respond(res, 200)
          })
            .catch(function (err) {
              appLogger.log('Error passing data from network ' + networkId +
                ' to application ' + applicationId + ': ' + err)
              restServer.respond(res, err)
            })
        }
        else {
          restServer.respond(res, 200)
        }
      })
  })

  // Now that the API is initialized, start the known apps.
  applications.startApplications()
    .then(() => appLogger.log('Applications Started.'))
    .catch((err) => appLogger.log('Applications Startup Failed: ' + err))
}
