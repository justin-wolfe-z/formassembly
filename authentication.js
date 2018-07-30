const getAccessToken = (z, bundle) => {
  const promise = z.request(
    `https://${bundle.inputData.instance_url}/oauth/access_token`,
    {
      method: "POST",
      body: {
        code: bundle.inputData.code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: bundle.inputData.redirect_uri,
        type: "web_server"
      },
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      }
    }
  );

  // Needs to return at minimum, `access_token`, and if your app also does refresh, then `refresh_token` too
  return promise.then(response => {
    if (response.status !== 200) {
      throw new Error("Unable to fetch access token: " + response.content);
    }

    const result = JSON.parse(response.content);
    return {
      access_token: result.access_token,
      refresh_token: result.refresh_token
    };
  });
};

const testAuth = (z, bundle) => {
  // Normally you want to make a request to an endpoint that is either specifically designed to test auth, or one that
  // every user will have access to, such as an account or profile endpoint like /me.
  z.console.log(bundle);
  const promise = z.request({
    method: "GET",
    url: `https://${bundle.authData.instance_url}/api_v1/forms/index.json`
  });

  // This method can return any truthy value to indicate the credentials are valid.
  // Raise an error to show
  return promise.then(response => {
    if (response.status !== 200) {
      throw new Error("Testing your account connection failed");
    }
    return z.JSON.parse(response.content);
  });
};

module.exports = {
  type: "oauth2",
  fields: [
    {
      key: "instance_url",
      label: "Instance URL",
      required: true,
      type: "string"
    }
  ],
  oauth2Config: {
    // Step 1 of the OAuth flow; specify where to send the user to authenticate with your API.
    // Zapier generates the state and redirect_uri, you are responsible for providing the rest.
    // Note: can also be a function that returns a string
    authorizeUrl: {
      url: `https://{{bundle.inputData.instance_url}}/oauth/authorize`,
      params: {
        client_id: "{{process.env.CLIENT_ID}}",
        client_secret: "{{process.env.CLIENT_SECRET}}",
        redirect_uri: "{{bundle.inputData.redirect_uri}}",
        response_type: "code",
        type: "web"
      }
    },
    // Step 2 of the OAuth flow; Exchange a code for an access token.
    // This could also use the request shorthand.
    getAccessToken: getAccessToken
  },
  // The test method allows Zapier to verify that the access token is valid. We'll execute this
  // method after the OAuth flow is complete to ensure everything is setup properly.
  test: testAuth
  // assuming "username" is a key returned from the test
};
