const {
  processResponseArray,
  processFieldsets,
  processField
} = require("../utils/utils");
const Entities = require("html-entities").AllHtmlEntities;
const entities = new Entities();

const getResponses = (z, bundle) => {
  return z
    .request({
      url: `https://${bundle.authData.instance_url}/api_v1/responses/export/${
        bundle.inputData.form
      }.json`,
      params: {
        filter: "complete"
      }
    })
    .then(response => {
      if (response.status !== 200) {
        throw new Error("Error getting the responses for your form");
      }
      var parsed = z.JSON.parse(response.content);
      var responses = processResponseArray(parsed);
      var processedResponses = responses.map(response => {
        let processedResponse = {
          metadata: {
            status: response.status,
            title: entities.decode(response.title.textContent)
          },
          fields: {}
        };
        const fieldsFromFieldsets = processFieldsets(response);
        const fields = response.field.concat(fieldsFromFieldsets);
        for (var field of fields) {
          if (field !== undefined) {
            var processedField = processField(field);
            if (processedField !== undefined) {
              if (!processedField.normalField && processedField.parent) {
                processedResponse[processedField.parent][processedField.key] =
                  processedField.value;
              }
              if (!processedField.normalField && !processedField.parent) {
                processedResponse[processedField.key] = processedField.value;
              }
              if (processedField.normalField) {
                processedResponse.fields[processedField.key] =
                  processedField.value;
              }
            }
          }
        }
        return processedResponse;
      });
      return processedResponses;
    });
};

module.exports = {
  key: "listResponses", // uniquely identifies the trigger
  noun: "Response", // user-friendly word that is used to refer to the resource
  // `display` controls the presentation in the Zapier Editor
  display: {
    label: "New Form Response",
    description:
      "Triggers when a new response is submitted to a form you designate."
  },
  // `operation` implements the API call used to fetch the data
  operation: {
    inputFields: [
      {
        key: "form",
        required: true,
        label: "Form",
        dynamic: "listForms.id.name"
      }
    ],
    perform: getResponses
  }
};
