const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateLoginInput(data) {
  let errors = {};

  return {
    errors: errors,
    isValid: isEmpty(errors)
  };
};
