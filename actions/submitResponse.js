const {
  processFieldsets,
  processLooseFields,
  labelBlankFieldWithID
} = require("../utils/utils");

const getFormFields = (z, bundle) => {
  return z
    .request(
      `https://${bundle.authData.instance_url}/api_v1/forms/view/${
        bundle.inputData.form
      }.json`
    )
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

const postResponse = (z, bundle) => {
  return z
    .request(
      `https://${bundle.authData.instance_url}/api_v1/forms/view/${
        bundle.inputData.form
      }.json`,
      {
        method: "GET"
      }
    )
    .then(response => {
      const parsed = z.JSON.parse(response.content);
      const outputFields = Object.assign({}, bundle.inputData, {
        tfa_dbControl: parsed.form.dbControl,
        tfa_dbFormId: parsed.form.dbFormId
      });
      delete outputFields["form"];
      return z
        .request(
          `https://${bundle.authData.instance_url}/responses/processor`,
          {
            method: "POST",
            headers: {
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Encoding": "gzip, deflate, br",
              "Accept-Language": "en-US,en;q=0.8",
              "Cache-Control": "max-age=0",
              Connection: "keep-alive",
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: outputFields
          }
        )
        .then(response => {
          if (response.status === 200) {
            return { status: "success" };
          } else {
            throw new Error(
              "Error submitting form response—please contact support"
            );
          }
        });
    });
};

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
    perform: postResponse
  }
};
