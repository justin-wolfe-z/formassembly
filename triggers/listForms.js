const Entities = require("html-entities").AllHtmlEntities;
const entities = new Entities();

const getForms = (z, bundle) => {
  return z
    .request({
      url: `https://${bundle.authData.instance_url}/api_v1/forms/index.json`
    })
    .then(response => {
      if (response.status !== 200) {
        throw new Error("Error getting the list of forms");
      }
      var parsed = z.JSON.parse(response.content);
      var formArray = parsed.Forms;
      var output = formArray.map(form => {
        const decodedName = entities.decode(form.Form.name);
        const id = form.Form.id;
        return { id: id, name: decodedName };
      });
      return output;
    });
};

module.exports = {
  key: "listForms", // uniquely identifies the trigger
  noun: "Form", // user-friendly word that is used to refer to the resource
  // `display` controls the presentation in the Zapier Editor
  display: {
    label: "Get Forms",
    description: "List forms in user's account.",
    hidden: true
  },
  // `operation` implements the API call used to fetch the data
  operation: {
    perform: getForms
  }
};
