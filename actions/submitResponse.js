const {
  processFieldsets,
  processLooseFields,
  labelBlankFieldWithID
} = require("../utils/utils");

const getFormFields = (z, bundle) => {
  return z
    .request({
      url: `https://${bundle.authData.instance_url}/api_v1/forms/view/${
        bundle.inputData.form
      }.json`
    })
    .then(response => {
      const parsedResponse = z.JSON.parse(response.content);
      const fieldsFromFieldsets = processFieldsets(parsedResponse.form);
      const fieldsOutOfFieldsets = processLooseFields(
        parsedResponse.form.field
      );
      const allFields = fieldsOutOfFieldsets.concat(fieldsFromFieldsets);
      return allFields.map(field => {
        return {
          type: "unicode",
          key: field.id,
          label: labelBlankFieldWithID(field)
        };
      });
    });
};

const submitResponse = (z, bundle) => {};

module.exports = {
  key: "submitResponse", // uniquely identifies the action
  noun: "Response", // user-friendly word that is used to refer to the resource
  // `display` controls the presentation in the Zapier Editor
  display: {
    label: "Submit Form Response",
    description: "Submits a new response to a form."
  },
  // `operation` implements the API call used to fetch the data
  operation: {
    inputFields: [
      {
        key: "form",
        required: true,
        label: "Form",
        dynamic: "listForms.id.name",
        altersDynamicFields: true
      },
      getFormFields
    ],
    perform: submitResponse
  }
};
