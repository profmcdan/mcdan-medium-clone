const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateLoginInput(data) {
  let errors = {};

  data.title = !isEmpty(data.title) ? data.title : "";
  data.body = !isEmpty(data.body) ? data.body : "";
  data.description = !isEmpty(data.description) ? data.description : "";
  data.tagList = !isEmpty(data.tagList) ? data.tagList : "";

  if (
    !Validator.isLength(data.title, {
      min: 2,
      max: 50
    })
  ) {
    errors.title = "Title must be between 2 and 30 characters";
  }

  if (Validator.isEmpty(data.title)) {
    errors.title = "Title field is required";
  }

  if (Validator.isEmpty(data.body)) {
    errors.body = "Body field is required";
  }

  if (Validator.isEmpty(data.description)) {
    errors.description = "Description must be provided";
  }

  if (Validator.isEmpty(data.tagList)) {
    errors.tagList = "Tag List must be provided";
  }

  return {
    errors: errors,
    isValid: isEmpty(errors)
  };
};
