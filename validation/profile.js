const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateProfileInput(data) {
  const errors = {};

  data.bio = !isEmpty(data.bio) ? data.bio : "";
  data.website = !isEmpty(data.website) ? data.website : "";

  if (!isEmpty(data.website)) {
    if (!Validator.isURL(data.website)) {
      errors.website = "Not a valid URL";
    }
  }

  return {
    errors: errors,
    isValid: isEmpty(errors)
  };
};
