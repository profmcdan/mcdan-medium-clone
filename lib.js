module.exports.absolute = function(number) {
  return number >= 0 ? number : -number;
};

module.exports.greet = function(name) {
  return "Welcome " + name;
};

module.exports.getCurrencies = function() {
  return ["USD", "AUD", "EUR", "NGN"];
};

module.exports.getProduct = function(productId) {
  return {
    id: productId,
    price: 100,
    quantity: 500
  };
};

module.exports.registerUser = function(username) {
  if (!username) throw new Error("Username is required");

  return { id: new Date().getTime(), username: username };
};

// Exercise
module.exports.fizzBuzz = function(input) {
  if (typeof input !== "number") {
    throw new Error("Imput must be a number");
  }

  if (input % 3 === 0 && input % 5 === 0) {
    return "FizzBuzz";
  }

  if (input % 3 === 0) {
    return "Fizz";
  }

  if (input % 5 === 0) {
    return "Buzz";
  }

  return input;
};
