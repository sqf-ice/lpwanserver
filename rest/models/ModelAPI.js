// Define the parts of the Model API

// General libraries in use in this module.
var appLogger = require('../lib/appLogger.js')

// Data models - what can be done with each data type.
var Initializer = require('./initializer.js')
var UserModel = require('./IUser.js')
var CompanyModel = require('./ICompany.js')
var PasswordPolicyModel = require('./IPasswordPolicy.js')
var SessionManagerModel = require('./sessionManager.js')
var NetworkProtocolModel = require('./INetworkProtocol.js')
var NetworkModel = require('./INetwork.js')
var CompanyNetworkTypeLinkModel = require('./ICompanyNetworkTypeLink.js')
// var NetworkProvisioningFieldModel = require( './models/INetworkProvisioningField.js' );
var ReportingProtocolModel = require('./IReportingProtocol.js')
var ApplicationModel = require('./IApplication.js')
var ApplicationNetworkTypeLinkModel = require('./IApplicationNetworkTypeLink.js')
var DeviceProfileModel = require('./IDeviceProfile.js')
var DeviceModel = require('./IDevice.js')
var DeviceNetworkTypeLinkModel = require('./IDeviceNetworkTypeLink.js')
var NetworkTypeModel = require('./INetworkType.js')
var NetworkProviderModel = require('./INetworkProvider.js')
var ProtocolDataModel = require('./IProtocolData.js')

// Network Protocol use.
var NetworkTypeAPI = require('../networkProtocols/networkTypeApi.js')
var NetworkProtocolAPI = require('../networkProtocols/networkProtocols.js')

// Reporting Protocol use.
var ReportingProtocols = require('../reportingProtocols/reportingProtocols.js')

var modelAPI

function ModelAPI (app) {
  modelAPI = this
  try {
    // Companies.
    modelAPI.companies = new CompanyModel(this)

    // Password policies.  Manages password rules for companies.
    modelAPI.passwordPolicies = new PasswordPolicyModel(modelAPI.companies)

    // Users.  And start the user email verification background task that
    // expires old email verification records.
    modelAPI.users = new UserModel()
    modelAPI.users.emailVerifyInit()

    // The session model, which uses users (for login).
    modelAPI.sessions = new SessionManagerModel(modelAPI.users)

    // The networkProtocol model.
    modelAPI.networkProtocols = new NetworkProtocolModel()

    // The network model.  Needs the protocols to access the correct api.
    modelAPI.networks = new NetworkModel(this)

    // The network provider model.
    modelAPI.networkProviders = new NetworkProviderModel()

    // The network type model.
    modelAPI.networkTypes = new NetworkTypeModel()

    // The NetworkProvisioningFields model.
    // modelAPI.networkProvisioningFields = new NetworkProvisioningFieldModel();

    // The reportingProtocol model.
    modelAPI.reportingProtocols = new ReportingProtocolModel()

    // The applicationNetworkTypeLink model.
    modelAPI.applicationNetworkTypeLinks = new ApplicationNetworkTypeLinkModel(this)

    // The application model.  Needs the express app because when it starts, it
    // may need to add new endpoints to receive data from remote networks.
    modelAPI.applications = new ApplicationModel(app, this)

    // The networkType API, giving access to the various remote networks of a
    // given type.
    modelAPI.networkTypeAPI = new NetworkTypeAPI(this)

    // The networkProtocol API, giving access to a specific remote network.
    modelAPI.networkProtocolAPI = new NetworkProtocolAPI(modelAPI.networkProtocols)

    // The companyNetworkTypeLink model.
    modelAPI.companyNetworkTypeLinks = new CompanyNetworkTypeLinkModel(this)

    modelAPI.reportingProtocolAPIs = new ReportingProtocols(modelAPI.reportingProtocols)

    // The deviceProfile model.
    modelAPI.deviceProfiles = new DeviceProfileModel(this)

    // The device model.  It uses applications for some validation.
    modelAPI.devices = new DeviceModel(this)

    // The applicationNetworkTypeLink model.
    modelAPI.deviceNetworkTypeLinks = new DeviceNetworkTypeLinkModel(this)

    // The helper interface for network protocols to use.
    modelAPI.protocolData = new ProtocolDataModel(this)
  }
  catch (err) {
    appLogger.log(err.stack, 'error')
    appLogger.log('Could not connect to the database', 'error')
  }
}

module.exports = ModelAPI
