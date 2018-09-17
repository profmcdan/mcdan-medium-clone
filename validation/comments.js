const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateCommentInput(data) {
  let errors = {};

  data.comment = !isEmpty(data.comment) ? data.comment : "";

  if (
    !Validator.isLength(data.comment, {
      min: 2,
      max: 500
    })
  ) {
    errors.comment = "Comment must be between 2 and 500 characters";
  }

  if (Validator.isEmpty(data.comment)) {
    errors.comment = "Comment field is required";
  }

  return {
    errors: errors,
    isValid: isEmpty(errors)
  };
};
