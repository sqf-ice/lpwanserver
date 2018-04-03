// Configuration access.
var nconf = require('nconf');
var NetworkProtocolDataAccess = require( "../networkProtocols/networkProtocolDataAccess" );
var appLogger = require( "../lib/appLogger.js" );

//******************************************************************************
// The Network interface.
//******************************************************************************
var modelAPI;

function Network( server ) {
    this.impl = new require( './dao/' +
                             nconf.get( "impl_directory" ) +
                             '/networks.js' );
    modelAPI = server;
}

Network.prototype.retrieveNetworks = function( options ) {
    let me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            let ret = await me.impl.retrieveNetworks( options );
            let dataAPI = new NetworkProtocolDataAccess( modelAPI, "INetwork Retrieve bulk" );
            // Don't do a forEach or map here.  We need this done NOW, so it
            // is converted for other code.
            for ( let i = 0; i < ret.records.length; ++i ) {
                let rec = ret.records[ i ];
                if ( rec.securityData ) {
                    let k = await dataAPI.getProtocolDataForKey(
                                                    rec.id,
                                                    rec.networkProtocolId,
                                                    genKey( rec.id ) );
                    rec.securityData = await dataAPI.access( rec, rec.securityData, k );
                }
            };

            resolve( ret );
        }
        catch( err ) {
            reject( err );
        }
    });
}

Network.prototype.retrieveNetwork = function( id ) {
    let me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            let ret = await me.impl.retrieveNetwork( id );
            if ( ret.securityData ) {
                let dataAPI = new NetworkProtocolDataAccess( modelAPI, "INetwork Retrieve" );
                let k = await dataAPI.getProtocolDataForKey( id,
                                                    ret.networkProtocolId,
                                                    genKey( id ) );
                ret.securityData = await dataAPI.access( ret, ret.securityData, k );
            }

            resolve( ret );
        }
        catch( err ) {
            reject( err );
        }
    });
}

Network.prototype.createNetwork = function( name, networkProviderId, networkTypeId, networkProtocolId, baseUrl, securityData ) {
    let me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            let dataAPI = new NetworkProtocolDataAccess( modelAPI, "INetwork Create" );
            let k = dataAPI.genKey();
            if ( securityData ) {
                securityData = dataAPI.hide( null, securityData, k );
            }
            let ret = await me.impl.createNetwork( name,
                                                   networkProviderId,
                                                   networkTypeId,
                                                   networkProtocolId,
                                                   baseUrl,
                                                   securityData );
            await dataAPI.putProtocolDataForKey( ret.id,
                                                 networkProtocolId,
                                                 genKey( ret.id ),
                                                 k );

            resolve( ret );
        }
        catch( err ) {
            reject( err );
        }
    });
}

Network.prototype.updateNetwork = function( record ) {
    let me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            let dataAPI = new NetworkProtocolDataAccess( modelAPI, "INetwork Update" );
            let old = await me.impl.retrieveNetwork( record.id );
            let k = await dataAPI.getProtocolDataForKey(
                                                    record.id,
                                                    old.networkProtocolId,
                                                    genKey( record.id ) );

            if ( record.networkProtocolId ) {
                await dataAPI.deleteProtocolDataForKey( record.id,
                                                        old.networkProtocolId,
                                                        genKey( record.id ) );
                await dataAPI.putProtocolDataForKey( record.id,
                                                     record.networkProtocolId,
                                                     genKey( record.id ),
                                                     k );
            }

            if ( record.securityData ) {
                record.securityData = dataAPI.hide( null,
                                                    record.securityData,
                                                    k );
            }
            let ret = await me.impl.updateNetwork( record );
            resolve( ret );
        }
        catch( err ) {
            reject( err );
        }
    });
}

Network.prototype.deleteNetwork = function( id ) {
    let me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            let dataAPI = new NetworkProtocolDataAccess( modelAPI, "INetwork Delete" );
            let old = await me.impl.retrieveNetwork( id );
            await dataAPI.deleteProtocolDataForKey( id,
                                                    old.networkProtocolId,
                                                    genKey( id ) );
            let ret = await me.impl.deleteNetwork( id );
            resolve( ret );
        }
        catch( err ) {
            reject( err );
        }
    });
}



// Pull the organization, applications, device profiles, and devices record.
//
// networkTypeId - the network to be pulled from.
//
// Returns a promise that executes the pull.
Network.prototype.pullNetwork = function( networkId  ) {
    let me = this;
    return new Promise( async function( resolve, reject ) {
        try {
            appLogger.log(networkId);
            let network = await me.impl.retrieveNetwork(networkId);
            appLogger.log(JSON.stringify(network));
            await modelAPI.companies.pullCompanies( network );
            // var logs = await modelAPI.networkTypeAPI.pullCompany( networkTypeId );
            // let companies = JSON.parse(logs[Object.keys(logs)[0]].logs);
            // appLogger.log(companies);
            // let nsCoId = [];
            // let localCoId = [];
            // for (var index in companies.result) {
            //     let company = companies.result[index];
            //     //Mapping of Org Ids to Company Ids
            //     nsCoId.push(company.id);
            //
            //     //see if it exists first
            //     let existingCompany = await modelAPI.companies.retrieveCompanies({search: company.name});
            //     if (existingCompany.totalCount > 0 ) {
            //         existingCompany = existingCompany.records[0];
            //         appLogger.log(company.name + ' already exists');
            //         localCoId.push(existingCompany.id);
            //     }
            //     else {
            //         appLogger.log('creating ' + company.name);
            //         existingCompany = await modelAPI.companies.createCompany(company.name, modelAPI.companies.COMPANY_VENDOR);
            //         localCoId.push(existingCompany.id);
            //     }
            //     //see if it exists first
            //     let existingCompanyNTL = await modelAPI.companyNetworkTypeLinks.retrieveCompanyNetworkTypeLinks({companyId: existingCompany.id});
            //     if (existingCompanyNTL.totalCount > 0 ) {
            //         appLogger.log(company.name + ' link already exists');
            //     }
            //     else {
            //         appLogger.log('creating Network Link for ' + company.name);
            //         modelAPI.companyNetworkTypeLinks.createCompanyNetworkTypeLink(existingCompany.id, networkTypeId, {region: ''})
            //     }
            //
            // }
            // logs = await modelAPI.networkTypeAPI.pullApplication( networkTypeId );
            // let applications = JSON.parse(logs[Object.keys(logs)[0]].logs);
            // appLogger.log(applications);
            // let nsAppId = [];
            // let localAppId = [];
            // for (var index in applications.result) {
            //     let application = applications.result[index];
            //     nsAppId.push(application.id);
            //
            //     //see if it exists first
            //     let existingApplication = await modelAPI.applications.retrieveApplications({search: application.name});
            //     if (existingApplication.totalCount > 0 ) {
            //         existingApplication = existingApplication.records[0];
            //         localAppId.push(existingApplication.id);
            //         appLogger.log(application.name + ' already exists');
            //     }
            //     else {
            //         appLogger.log('creating ' + JSON.stringify(application));
            //         let coIndex = nsCoId.indexOf(application.organizationID);
            //         existingApplication = await modelAPI.applications.createApplication(application.name, application.description, localCoId[coIndex], 1, 'http://set.me.to.your.real.url:8888');
            //         localAppId.push(existingApplication.id);
            //     }
            //     //see if it exists first
            //     let existingApplicationNTL = await modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLinks({applicationId: existingApplication.id});
            //     if (existingApplicationNTL.totalCount > 0 ) {
            //         appLogger.log(application.name + ' link already exists');
            //     }
            //     else {
            //         appLogger.log('creating Network Link for ' + application.name);
            //         modelAPI.applicationNetworkTypeLinks.createApplicationNetworkTypeLink(existingApplication.id, networkTypeId, {}, existingApplication.companyId);
            //
            //     }
            // }
            //
            // logs = await modelAPI.networkTypeAPI.pullDeviceProfiles( networkTypeId );
            // let deviceProfiles = JSON.parse(logs[Object.keys(logs)[0]].logs);
            // appLogger.log(JSON.stringify(deviceProfiles));
            // let nsDpId = [];
            // let localDpId = [];
            // for (var index in deviceProfiles.result) {
            //     let deviceProfile = deviceProfiles.result[index];
            //     nsDpId.push(deviceProfile.deviceProfileID);
            //     let networkSettings = await modelAPI.networkTypeAPI.pullDeviceProfile(networkTypeId, deviceProfile.deviceProfileID);
            //     networkSettings = JSON.parse(networkSettings[Object.keys(logs)[0]].logs);
            //     networkSettings = networkSettings.deviceProfile;
            //
            //     //see if it exists first
            //     let existingDeviceProfile = await modelAPI.deviceProfiles.retrieveDeviceProfiles({search: deviceProfile.name});
            //     if (existingDeviceProfile.totalCount > 0 ) {
            //         existingDeviceProfile = existingDeviceProfile.records[0];
            //         localDpId.push(existingDeviceProfile.id);
            //         appLogger.log(deviceProfile.name + " " + existingDeviceProfile.id + ' already exists');
            //         appLogger.log(JSON.stringify(existingDeviceProfile));
            //         existingDeviceProfile.networkSettings = networkSettings;
            //         appLogger.log(JSON.stringify(existingDeviceProfile));
            //         await modelAPI.deviceProfiles.updateDeviceProfile(existingDeviceProfile);
            //     }
            //     else {
            //         appLogger.log('creating ' + deviceProfile.name);
            //         let coIndex = nsCoId.indexOf(deviceProfile.organizationID);
            //         appLogger.log(networkTypeId, localCoId[coIndex], deviceProfile.name, networkSettings);
            //         existingDeviceProfile = await modelAPI.deviceProfiles.createDeviceProfile(networkTypeId, localCoId[coIndex], deviceProfile.name, deviceProfile.description, networkSettings )
            //         localDpId.push(existingDeviceProfile.id);
            //     }
            // }
            //
            // for (var appIndex in nsAppId) {
            //     logs = await modelAPI.networkTypeAPI.pullDevices( networkTypeId, nsAppId[appIndex] );
            //     let devices = JSON.parse(logs[Object.keys(logs)[0]].logs);
            //     appLogger.log(JSON.stringify(devices));
            //     for (var index in devices.result) {
            //         let device = devices.result[index];
            //
            //         //see if it exists first
            //         let existingDevice = await modelAPI.devices.retrieveDevices({search: device.name});
            //         if (existingDevice.totalCount > 0 ) {
            //             existingDevice = existingDevice.records[0];
            //             appLogger.log(device.name + ' already exists');
            //             await existingDevice.updateDevice(existingDevice);
            //         }
            //         else {
            //             appLogger.log('creating ' + JSON.stringify(device));
            //             let appIndex = nsAppId.indexOf(device.applicationID);
            //             appLogger.log("localAppId[" + appIndex + "] = " + localAppId[appIndex]);
            //             existingDevice = await modelAPI.devices.createDevice(device.name, device.description, localAppId[appIndex]);
            //         }
            //
            //         let existingDeviceNTL = await modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks({deviceId: existingDevice.id});
            //         if (existingDeviceNTL.totalCount > 0 ) {
            //             appLogger.log(device.name + ' link already exists');
            //         }
            //         else {
            //             appLogger.log('creating Network Link for ' + device.name);
            //             let dpIndex = nsDpId.indexOf(device.deviceProfileID);
            //             // let coId = protocolDataAccess.prototype.getCompanyByApplicationId(existingDevice.applicationId);
            //
            //             let tempApp = await modelAPI.applications.retrieveApplication(localAppId[appIndex]);
            //             let coId = tempApp.companyId;
            //
            //             modelAPI.deviceNetworkTypeLinks.createDeviceNetworkTypeLink(existingDevice.id, networkTypeId, localDpId[dpIndex], device, coId);
            //         }
            //     }
            //
            // }

            resolve(  );
        }
        catch ( err ) {
            appLogger.log( "Error pulling from Network : " + networkId + " " + err );
            reject( err );
        }
    });
};


genKey = function( networkId ) {
    return "nk" + networkId;
}

module.exports = Network;
