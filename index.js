const authentication = require("./authentication");
const listForms = require("./triggers/listForms");
const listResponses = require("./triggers/listResponses");
const submitResponse = require("./actions/submitResponse");

// It runs runs before each request is sent out, allowing you to make tweaks to the request in a centralized spot
const includeAccessToken = (request, z, bundle) => {
  if (bundle.authData.access_token) {
    request.params["access_token"] = bundle.authData.access_token;
  }
  return request;
};

const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require("./package.json").version,
  platformVersion: require("zapier-platform-core").version,

  authentication: authentication,

  beforeRequest: [includeAccessToken],

  afterResponse: [],

  resources: {},

  // If you want your trigger to show up, you better include it here!
  triggers: {
    [listForms.key]: listForms,
    [listResponses.key]: listResponses
  },

  // If you want your searches to show up, you better include it here!
  searches: {},

  // If you want your creates to show up, you better include it here!
  creates: {}
};

// Finally, export the app.
module.exports = App;
