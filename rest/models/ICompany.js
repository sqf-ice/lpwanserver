// Configuration access.
var nconf = require('nconf');

// General libraries in use in this module.
var appLogger = require( '../lib/appLogger.js' );
var NetworkProtocolDataAccess = require( '../networkProtocols/networkProtocolDataAccess.js' );


//******************************************************************************
// The Company interface.
//******************************************************************************
// Maps a type name to a numeric value.
var types = {};
// Maps a numeric value to the type name.
var reverseTypes = {};

// Gives access to other data
var modelAPI;

// Class constructor.
//
// Loads the implementation for the company interface based on the passed
// subdirectory name.  The implementation file companies.js is to be found in
// that subdirectory of the models/dao directory (Data Access Object).
//
// implPath - The subdirectory to get the dao implementation from.
//
function Company( server ) {
    this.impl = new require( './dao/' +
                             nconf.get( "impl_directory" ) +
                             '/companies.js' );
    this.COMPANY_ADMIN = this.impl.COMPANY_ADMIN;
    this.COMPANY_VENDOR = this.impl.COMPANY_VENDOR;
    this.types = types;
    this.reverseTypes = reverseTypes;

    // Load the types from the database.
    this.impl.getTypes().then( function( typeList )  {
        for ( var i = 0; i < typeList.length; ++i ) {
            types[ typeList[ i ].name ] = typeList[ i ].type;
            reverseTypes[ typeList[ i ].type ] = typeList[ i ].name;
        }
    })
    .catch( function( err ) {
        throw "Failed to load company types: " + err;
    });

    modelAPI = server;
}

// Retrieves a subset of the companies in the system given the options.
//
// Options include limits on the number of companies returned, the offset to
// the first company returned (together giving a paging capability), and a
// search string on company name.
Company.prototype.retrieveCompanies = function( options ) {
    return this.impl.retrieveCompanies( options );
}

// Retrieve a company record by id.
//
// id - the record id of the company.
//
// Returns a promise that executes the retrieval.
Company.prototype.retrieveCompany = function( id ) {
    return this.impl.retrieveCompany( id );
}

// Create the company record.
//
// name  - the name of the company
// type  - the company type. COMPANY_ADMIN can manage companies, etc.,
//         COMPANY_VENDOR is the typical vendor who just manages their own apps
//         and devices.
//
// Returns the promise that will execute the create.
Company.prototype.createCompany = function( name, type ) {
    return this.impl.createCompany( name, type );
}

// Update the company record.
//
// company - the updated record.  Note that the id must be unchanged from
//           retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
Company.prototype.updateCompany = function( record ) {
    return this.impl.updateCompany( record );
}

// Pull the company records.
//
// company - the updated record.  Note that the id must be unchanged from
//           retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
Company.prototype.pullCompanies = function( network ) {
    //Plan:
    //pull companies from the network
    //add companies to the local db
    //add companies login information to protocol data
    let me = this;
    return new Promise( async function(resolve, reject) {
        try {
            let remoteCompanies = await modelAPI.networkTypeAPI.pullCompanies( network.networkTypeId );
            // var network = await modelAPI.networks.retrieveNetwork( networkId );
            // var proto = await modelAPI.networkProtocolAPI.getProtocol( network );
            // var dataAPI =  new NetworkProtocolDataAccess( modelAPI, "Pull Companies" );
            // var remoteCompanies = await proto.api.pullCompanies( dataAPI, network);
            remoteCompanies = JSON.parse(remoteCompanies[Object.keys(remoteCompanies)[0]].logs);

            appLogger.log(JSON.stringify(remoteCompanies));
            if (!remoteCompanies || remoteCompanies.totalCount == 0) {
                resolve();
            }
            else {
                remoteCompanies = remoteCompanies.result;
                for (let index in remoteCompanies) {
                    appLogger.log(remoteCompanies[index]);
                    let newCompany = me.impl.createCompany(remoteCompanies[index].name, this.impl.COMPANY_VENDOR);
                    let newCompanyNetworkTypeLink = me.modelAPI.companyNetworkTypeLinks.remoteCreateCompanyNetworkTypeLink(newCompany.id, network.networkTypeId, {region: ''});
                    me.modelAPI.networkTypeAPI.addProtocolDataForCompany(network.networkTypeId, remoteCompanies[index], newCompany);
                }
                resolve();
            }
        }
        catch( err ) {
            reject( err );
        }
    })
}

// Delete the company record.
//deleteCo
// companyId - the id of the company record to delete.
//
// Returns a promise that performs the delete.
Company.prototype.deleteCompany = function( id ) {
    let me = this;
    return new Promise( async function( resolve, reject ) {
        // Delete my applications, users, and companyNetworkTypeLinks first.
        try {
            // Delete applications
            let apps = await modelAPI.applications.retrieveApplications( { companyId: id } );
            let recs = apps.records;
            for ( let i = 0; i < recs.length; ++i ) {
                await modelAPI.applications.deleteApplication( recs[ i ].id );
            }
        }
        catch ( err ) {
            appLogger.log( "Error deleting company's applications: " + err );
        }
        try {
            // Delete users
            let users = await modelAPI.users.retrieveUsers( { companyId: id } );
            let recs = users.records;
            for ( let i = 0; i < recs.length; ++i ) {
                await modelAPI.users.deleteUser( recs[ i ].id );
            }
        }
        catch ( err ) {
            appLogger.log( "Error deleting company's users: " + err );
        }
        try {
            // Delete deviceProfiles
            let dps = await modelAPI.deviceProfiles.retrieveDeviceProfiles( { companyId: id } );
            let recs = dps.records;
            for ( let i = 0; i < recs.length; ++i ) {
                await modelAPI.deviceProfiles.deleteDeviceProfile( recs[ i ].id );
            }
        }
        catch ( err ) {
            appLogger.log( "Error deleting company's deviceProfiles: " + err );
        }
        try {
            // Delete passwordPolicies
            let pps = await modelAPI.passwordPolicies.retrievePasswordPolicies( id );
            let recs = pps;
            for ( let i = 0; i < recs.length; ++i ) {
                // We can get null companyIds for cross-company rules - don't
                // delete those.
                if ( id === recs[ i ].companyId ) {
                    await modelAPI.passwordPolicies.deletePasswordPolicy( recs[ i ].id );
                }
            }
        }
        catch ( err ) {
            appLogger.log( "Error deleting company's PasswordPolicies: " + err );
        }
        try {
            // Delete companyNetworkTypeLinks
            let cntls = await modelAPI.companyNetworkTypeLinks.retrieveCompanyNetworkTypeLinks( { companyId: id } );
            recs = cntls.records;
            for ( let i = 0; i < recs.length; ++i ) {
                let logs = await modelAPI.companyNetworkTypeLinks.deleteCompanyNetworkTypeLink( recs[ i ].id );
            }
        }
        catch ( err ) {
            appLogger.log( "Error deleting company's networkTypeLinks: " + err );
        }

        try {
            await me.impl.deleteCompany( id );
            resolve();
        }
        catch( err ) {
            reject( err );
        }
    });
}

module.exports = Company;
