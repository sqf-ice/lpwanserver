var appLogger = require( "./lib/appLogger.js" );
var restServer;
var modelAPI;

exports.initialize = function( app, server ) {
    restServer = server;
    modelAPI = server.modelAPI;

    /*********************************************************************
    * Devices API
    ********************************************************************/
    /**
     * Gets the devices available for access by the calling account.
     *
     * @api {get} /api/devices Get Devices
     * @apiGroup Devices
     * @apiDescription Returns an array of the Devices that match the options.
     * @apiPermission System Admin, or Company Admin (limits returned data to
     *       user's own Company's Devices)
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Query Parameters) {Number} [limit] The maximum number of
     *      records to return.  Use with offset to manage paging.  0 is the
     *      same as unspecified, returning all users that match other query
     *      parameters.
     * @apiParam (Query Parameters) {Number} [offset] The offset into the
     *      returned database query set.  Use with limit to manage paging.  0 is
     *      the same as unspecified, returning the list from the beginning.
     * @apiParam (Query Parameters) {String} [search] Search the Devices based
     *      on name matches to the passed string.  In the string, use "%" to
     *      match 0 or more characters and "_" to match exactly one.  For
     *      example, to match names starting with "D", use the string "D%".
     * @apiParam (Query Parameters) {Number} [companyId] Limit the Devices
     *      to those belonging to the Company.
     * @apiParam (Query Parameters) {Number} [applicationId] Limit the Devices
     *      to those belonging to the Application.
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.totalCount The total number of records that
     *      would have been returned if offset and limit were not specified.
     *      This allows for calculation of number of "pages" of data.
     * @apiSuccess {Object[]} object.records An array of Device records.
     * @apiSuccess {Number} object.records.id The Device's Id
     * @apiSuccess {String} object.records.name The Device's name
     * @apiSuccess {String} object.records.description The Device's description
     * @apiSuccess {String} object.records.deviceModel The Device's Model
     *      information
     * @apiSuccess {Number} object.records.applicationId The Id of the
     *      Application that this Device belongs to.
     * @apiVersion 0.1.0
     */
    app.get('/api/devices', [restServer.isLoggedIn, restServer.fetchCompany],
                            function(req, res, next) {
        var options = {};
        if ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) {
            // If they gave a applicationId, make sure it belongs to their
            // company.
            if ( req.query.companyId ) {
                if ( req.query.companyId != req.user.companyId ) {
                    restServer.respond( res, 403, "Cannot request devices for another company" );
                    return;
                }
            }
            else {
                // Force the search to be limited to the user's company
                options.companyId = req.user.companyId;
            }
        }

        if ( req.query.limit ) {
            var limitInt = parseInt( req.query.limit );
            if ( !isNaN( limitInt ) ) {
                options.limit = limitInt;
            }
        }
        if ( req.query.offset ) {
            var offsetInt = parseInt( req.query.offset );
            if ( !isNaN( offsetInt ) ) {
                options.offset = offsetInt;
            }
        }
        if ( req.query.search ) {
            options.search = req.query.search;
        }
        // This may be redundant, but we've already verified that if the
        // user is not part of the admin company, then this is their companyId.
        if ( req.query.companyId ) {
            options.companyId = req.query.companyId;
        }
        if ( req.query.applicationId ) {
            options.applicationId = req.query.applicationId;
        }
        modelAPI.devices.retrieveDevices( options ).then( function( cos ) {
            restServer.respondJson( res, null, cos );
        })
        .catch( function( err ) {
            appLogger.log( "Error getting devices: " + err );
            restServer.respond( res, err );
        });
    });

    /**
     * @apiDescription Gets the device record with the specified id.
     *
     * @api {get} /api/devices/:id Get Device
     * @apiGroup Devices
     * @apiPermission Any, but only System Admin can retrieve a device for a
     *      company other than their own.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Device's id
     * @apiSuccess {Object} object
     * @apiSuccess {Number} object.records.id The Device's Id
     * @apiSuccess {String} object.records.name The Device's name
     * @apiSuccess {String} object.records.description The Device's description
     * @apiSuccess {String} object.records.deviceModel The Device's Model
     *      information
     * @apiSuccess {Number} object.records.applicationId The Id of the
     *      Application that this Device belongs to.
     * @apiVersion 0.1.0
     */
    app.get('/api/devices/:id', [restServer.isLoggedIn,
                                 restServer.fetchCompany,
                                 modelAPI.devices.fetchDeviceApplication],
                                     function(req, res, next) {
        // Should have device and application in req due to
        // fetchDeviceApplication
        if ( ( req.company.type != modelAPI.companies.COMPANY_ADMIN ) &&
             ( req.application.companyId != req.user.companyId ) ) {
                restServer.respond( res, 403 );
        }
        else {
            restServer.respondJson( res, null, req.device );
        }
    });

    /**
     * @apiDescription Creates a new device record.
     *
     * @api {post} /api/companies Create Device
     * @apiGroup Devices
     * @apiPermission System Admin or a Company Admin from the same Company
     *      as the Device.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (Request Body) {String} name The Device's name
     * @apiParam (Request Body) {String} description The Device's description
     * @apiParam (Request Body) {String} deviceModel The Device's Model
     *      information
     * @apiParam (Request Body) {Number} applicationId The Id of the
     *      Application that this Device belongs to.
     * @apiExample {json} Example body:
     *      {
     *          "name": "GPS for Fido",
     *          "description": "GPS for Fido, he keeps running away",
     *          "deviceModel": "Bark 1",
     *          "applicationId": 1
     *      }
     * @apiSuccess {Number} id The new Device's id.
     * @apiVersion 0.1.0
     */
    app.post('/api/devices', [restServer.isLoggedIn,
                              restServer.fetchCompany,
                              restServer.isAdmin,
                              modelAPI.devices.fetchApplicationForNewDevice],
                             function(req, res, next) {
        var rec = req.body;
        // You can't specify an id.
        if ( rec.id ) {
             restServer.respond( res, 400, "Cannot specify the devices's id in create" );
            return;
        }

        // Verify that required fields exist.
        if ( !rec.name || !rec.description || !rec.applicationId || !rec.deviceModel ) {
             restServer.respond( res, 400, "Missing required data" );
        }

        // The user must be part of the admin group or the device's
        // application's company.
        if ( ( modelAPI.companies.COMPANY_ADMIN != req.company.type ) &&
             ( req.application.companyId != req.user.companyId ) ) {
            restServer.respond( res, 403, "Can't create a device for another company's application" );
        }
        else {
            // OK, add it.
            modelAPI.devices.createDevice( rec.name,
                                           rec.description,
                                           rec.applicationId,
                                           rec.deviceModel ).then( function ( rec ) {
                var send = {};
                send.id = rec.id;
                restServer.respondJson( res, 200, send ); //TODO: Shouldn't this id be in the header per POST convention?
            })
            .catch( function( err ) {
                appLogger.log( "Failed to create device " + JSON.stringify( rec ) + ": " + err );
                restServer.respondJson( res, err ); //TODO:  So some errors are JSON and some are text. Is there a rule?
            });
        }
    });

    /**
     * @apiDescription Updates the device record with the specified id.
     *
     * @api {put} /api/devices/:id Update Device
     * @apiGroup Devices
     * @apiPermission System Admin, or Company Admin for this Device's Company.
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Device's id
     * @apiParam (Request Body) {String} [name] The Device's name
     * @apiParam (Request Body) {String} [description] The Device's description
     * @apiParam (Request Body) {Number} [applicationId] The Id of the
     *      Application that the Device blongs to.  For a Company Admin user,
     *      this Appplication must belong to their own Company.
     * @apiParam (Request Body) {String} [deviceModel] The Device's Model
     *      information
     * @apiParam (Request Body) {Number} [applicationId] The Id of the
     *      Application that this Device belongs to.
     * @apiExample {json} Example body:
     *      {
     *          "name": "GPS for Fido",
     *          "description": "GPS for Fido, he keeps running away!",
     *          "deviceModel": "Bark 1",
     *          "applicationId": 1
     *      }
     * @apiVersion 0.1.0
     */
    app.put('/api/devices/:id', [restServer.isLoggedIn,
                                 restServer.fetchCompany,
                                 restServer.isAdmin,
                                 modelAPI.devices.fetchDeviceApplication],
                                     function(req, res, next) {
        var data = {};
        data.id = parseInt( req.params.id );
        // We'll start with the device retrieved by fetchDeviceApplication as
        // a basis for comparison.
        // Verify that the user can make the change.
        if ( ( modelAPI.companies.COMPANY_ADMIN != req.company.type ) &&
             ( req.user.companyId != req.application.companyId ) ) {
            respond( res, 403 );
            return;
        }

        var changed = 0;
        if ( ( req.body.name ) &&
             ( req.body.name != req.device.name ) ) {
            data.name = req.body.name;
            ++changed;
        }

        if ( ( req.body.description ) &&
             ( req.body.description != req.device.description ) ) {
            data.description = req.body.description;
            ++changed;
        }

        // NOTE: ALL OTHER FIELD CHECKS MUST OCCUR BEFORE THIS CODE.
        // Can only change the applicationId if an admin user, and the
        // new applicationId is part of the same company.
        if ( ( req.body.applicationId ) &&
             ( req.body.applicationId != req.device.applicationId ) ) {
            data.applicationId = req.body.applicationId;
            ++changed;

            // If this is not a user with an admin company, we have to make sure
            // that the company doesn't change with the application.
            if ( modelAPI.companies.COMPANY_ADMIN != req.company.type ) {
                // The new application must also be part of the same company.
                modelAPI.applications.retrieveApplication( req.body.applicationId )
                .then( function( newApp ) {
                    if ( newApp.companyId != req.application.id ) {
                        respond( res, 400, "Cannot change device's application to another company's application" );
                    }
                    else {
                        // Do the update.
                        modelAPI.devices.updateDevice( data ).then( function ( rec ) {
                             restServer.respond( res, 204 );
                        })
                        .catch( function( err ) {
                             restServer.respond( res, err );
                        });
                    }
                    return;
                })
                .catch( function( err ) {
                     restServer.respond( res, err );
                     return;
                });
            }
        }

        // Do we have a change?
        if ( 0 == changed ) {
            // No changes.  But returning 304 apparently causes Apache to strip
            // CORS info, causing the browser to throw a fit.  So just say,
            // "Yeah, we did that.  Really.  Trust us."
            restServer.respond( res, 204 );
            //TODO:  This is because 304 are for Conditional Gets and HEADERs and "A 304 response cannot contain a message-body; it is always terminated by the first empty line after the header fields."
            /*
            Per the RFC, HTTP Not Modified should not include entity headers "Section 10.3.5: the response SHOULD NOT include other entity-headers"

                However, the Cross-Origin-Resource-Sharing spec (http://www.w3.org/TR/cors/) defines a few headers that are not entity headers and should therefore be allowed in the 304 response:
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Credentials",
                "Access-Control-Allow-Methods",
                "Access-Control-Allow-Headers",
                "Access-Control-Max-Age"

                I understand that CORS is currently only a draft but it currently prevents any web application from properly adopting this new standard. Indeed, a client making a CORS request will not see the response if it is an Http Not Modified 304. The browser will block it due to the missing CORS headers.

                Comment 1 Mark Nottingham 2014-11-19 04:45:16 UTC
                CORS doesn't require those headers on a 304, and indeed browsers work without them present on it. This is because many 304s are generated from intermediary caches that can't be updated to know about CORS.

                Recommend INVALID.
                Comment 2
             */

        }
        else {
            // Do the update.
            modelAPI.devices.updateDevice( data ).then( function ( rec ) {
                 restServer.respond( res, 204 );
            })
            .catch( function( err ) {
                 restServer.respond( res, err );
            });
        }
    });

    /**
     * @apiDescription Deletes the device record with the specified id.
     *
     * @api {delete} /api/devices/:id Delete Devices
     * @apiGroup Devices
     * @apiPermission System Admin or Company Admin for the Device's Company
     * @apiHeader {String} Authorization The Create Session's returned token
     *      prepended with "Bearer "
     * @apiParam (URL Parameters) {Number} id The Device's id
     * @apiVersion 0.1.0
     */
    app.delete('/api/devices/:id', [restServer.isLoggedIn,
                                    restServer.fetchCompany,
                                    restServer.isAdmin,
                                    modelAPI.devices.fetchDeviceApplication],
                                        function(req, res, next) {
        var id = parseInt( req.params.id );
        // If the caller is a global admin, or the device is part of the company
        // admin's company, we can delete.
        if ( ( req.company.type === modelAPI.companies.COMPANY_ADMIN ) ||
             ( req.application.companyId === req.user.companyId ) ) {
            modelAPI.devices.deleteDevice( id ).then( function( ) {
                restServer.respond( res, 204 );
             })
             .catch( function( err ) {
                 appLogger.log( "Error deleting device " + id + ": " + err );
                 restServer.respond( res, err );
             });
        }
        // Device is owned by another company.
        else {
            appLogger.log( "Someone else's device" );
            restServer.respond( res, 403, "Cannot delete another company's device.");
        }
    });


}
