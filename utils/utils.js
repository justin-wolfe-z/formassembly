//take FA file list field and return an object with each attachment as a property
const listFiles = field => {
  var output = {};
  var fileArr = [];
  //if there is a file list (i.e. at least one file upload field was used)
  if (field.value.textContent) {
    //if there are multiple files, split into an array
    if (field.value.textContent.indexOf(",") != -1) {
      fileArr = field.value.textContent.split(",");
      //if there's just one file, put it in an array
    } else {
      fileArr = [field.value.textContent];
    }
    //loop through files
    for (var i = 0; i < fileArr.length; i++) {
      //make counter readable for normies
      var humanCount = i + 1;
      //add the file to the output array
      output["file_" + humanCount + " "] = fileExtractor(fileArr[i]);
    }
  } else {
  }
  return output;
};

const processResponseArray = responseContent => {
  //API returns a different structure depending on whether there's no records, one record, or multiple records, so handle that
  //(by handle that, i mean if there's one or more responses, return it/them in an array and if not, throw an exception
  //if there are no responses, throw an exception
  var output;
  if (responseContent.textContent === "") {
    throw new HaltedException("We could not find a response.");
  }
  //if there's one response, wrap it in an array
  if (Array.isArray(responseContent.responses.response) === false) {
    output = [responseContent.responses.response];
    //if there are multiple responses and they're in an array, pass them on over as they are
  } else if (Array.isArray(responseContent.responses.response) === true) {
    output = responseContent.responses.response;
  }
  return output.filter(response => response.status === "complete");
};

const traverseFieldsets = (fieldsets, accumulator) => {
  if (Array.isArray(fieldsets) === false) {
    fieldsets = [fieldsets];
  }
  fieldsets.forEach(item => {
    if (Array.isArray(item.field) === true) {
      for (var field of item.field) {
        accumulator.push(field);
      }
    }
    if (Array.isArray(item.field) === false) {
      if (item.field) {
        accumulator.push(item.field);
      }
    }
    if (item.fieldset) {
      traverseFieldsets(item.fieldset, accumulator);
    }
  });
  return accumulator;
};

//in the response object
//loose form fields and system/metadata fields are under the `field` key
//`field` will be an object if there is one field BUT an array if there are multiple fields
//fields in groups/sections are under the `fieldset` key
//`fieldset` will be an object if there is one group/section BUT an array if there are multiple
//fields in a fieldset are under the `fieldset.field` key in the fieldset object
//if fieldsets are nested, nested fieldsets will be under the `fieldset` key
const processFieldsets = response => {
  if (response.fieldset) {
    var fieldsetFields = [];
    if (Array.isArray(response.fieldset)) {
      traverseFieldsets(response.fieldset, fieldsetFields);
    } else {
      traverseFieldsets([response.fieldset], fieldsetFields);
    }
    return fieldsetFields;
  } else {
    return [];
  }
};

const processLooseFields = fields => {
  if (fields) {
    if (Array.isArray(fields)) {
      return fields;
    } else {
      return [fields];
    }
  } else {
    return [];
  }
};

//for getting the file URLs out of the strings for the files in the listFiles function
const fileExtractor = str => {
  var urlArr = str.split("):");
  return urlArr[1].trim();
};

//filter metadata fields into their own key
const isMetadata = label => {
  var metadata_fields = [
    "modified_date",
    "created:",
    "completion_time",
    "referrer",
    "ip_address",
    "date_submitted",
    "response_text",
    "resume_email",
    "file_list",
    "form_name",
    "response_html",
    "response"
  ];
  //check if this is a metadata field and if so, return true
  for (var k = 0; k < metadata_fields.length; k++) {
    if (label.indexOf(metadata_fields[k]) != -1) {
      return true;
    }
  }
  //else if it's not a metadata field, return false
  return false;
};

const labelBlankFieldWithID = field => {
  if (field.label.plain.trim() !== "") {
    return field.label.textContent;
  } else {
    return field.id;
  }
};

const processField = field => {
  //label the field with its id if it doesn't have a label
  var label = labelBlankFieldWithID(field);
  var value = field.value.textContent;
  var fieldID = field.id;
  var metaFlag = isMetadata(label);
  //don't add empty metadata fields to the response object to avoid cruft
  if (value === "" && metaFlag === false) {
    //do add in metadata fields that DO have values
  } else if (
    value !== "" &&
    metaFlag === true &&
    label !== "unprotected_file_list"
  ) {
    //pull out the response ID separately for deduping purposes/general clarity
    if (label === "response_id") {
      return {
        normalField: false,
        key: "id",
        value: value
      };
    } else {
      return {
        normalField: false,
        parent: "metadata",
        key: label,
        value: value
      };
    }
    //add in response fields (not metadata) even if they DON'T have values
  } else if (metaFlag === false && label !== "unprotected_file_list") {
    //check whether this is a repeated field, since they use array syntax (i.e. tfa[01], tfa[03]);
    if (fieldID.indexOf("[") !== -1) {
      var extractor = /\[(\d*)\]/g;
      var extractedArr = extractor.exec(fieldID);
      var repeatIndex = extractedArr[1];
      //check if this was a blank field to avoid double labeling the repeat index)
      if (label.indexOf("[") != -1) {
        return {
          normalField: true,
          key: label,
          value: value
        };
      } else {
        return {
          normalField: true,
          key: `${label} [${repeatIndex}]`,
          value: value
        };
      }
      //else if this is not a repeated field
    } else {
      //check whether it has a label - if it does,
      if (label) {
        return {
          normalField: true,
          key: `${label} (${fieldID})`,
          value: value
        };
      } else {
        return {
          normalField: true,
          key: label,
          value: value
        };
      }
    }
  }
  //handle file list
  if (label === "unprotected_file_list") {
    return {
      normalField: false,
      key: "files",
      value: listFiles(field)
    };
  }
};

module.exports = {
  processResponseArray,
  traverseFieldsets,
  processFieldsets,
  processField,
  processLooseFields,
  labelBlankFieldWithID
};
