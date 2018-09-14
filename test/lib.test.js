const lib = require("../lib");

describe("absolute", () => {
  it("should return a positive number is input is positive", () => {
    const result = lib.absolute(1);
    expect(result).toBe(1);
  });

  it("should return a negative number is input is negative", () => {
    const result = lib.absolute(-1);
    expect(result).toBe(1);
  });

  it("should return a zero is input is zero", () => {
    const result = lib.absolute(0);
    expect(result).toBe(0);
  });
});

describe("greet", () => {
  it("should return the greeting message", () => {
    const result = lib.greet("Mosh");
    expect(result).toMatch(/Mosh/);
    expect(result).toContain("Mosh");
  });
});

describe("getCurrencies", () => {
  it("should return supported currencies", () => {
    const result = lib.getCurrencies();

    // Too general
    expect(result).toBeDefined();
    expect(result).not.toBeNull();

    // Too Specific
    expect(result[0]).toBe("USD");
    expect(result[1]).toBe("AUD");
    expect(result.length).toBe(4);

    // Proper way but not ideal
    expect(result).toContain("USD");

    // Proper and ideal way
    expect(result).toEqual(expect.arrayContaining(["NGN", "USD"]));
  });
});

describe("getProduct", () => {
  it("should return the product with the given id", () => {
    const result = lib.getProduct(1);

    // Too bad too specific
    expect(result).toEqual({ id: 1, price: 100, quantity: 500 });

    // Good
    expect(result).toMatchObject({ id: 1, price: 100 });
    // Also good
    expect(result).toHaveProperty("id", 1);
  });
});

describe("registerUser", () => {
  it("should throw if username is falsy", () => {
    // Falsy value: Null, undefined, NaN, '', 0, false
    const args = [null, undefined, NaN, "", 0, false];
    args.forEach(a => {
      expect(() => {
        lib.registerUser(a);
      }).toThrow();
    });
  });

  it("should return a user object if valid username is passed", () => {
    const result = lib.registerUser("mosh");
    expect(result).toMatchObject({ username: "mosh" });
    expect(result.id).toBeGreaterThan(0);
  });
});

describe("fizzBuzz", () => {
  it("should throw if input is not a number", () => {
    expect(() => {
      lib.fizzBuzz("mosh");
    }).toThrow();
  });

  it("should throw if input is not a number", () => {
    // Falsy value: Null, undefined, NaN, '', 0, false
    const args = [null, undefined, "mosh", {}];
    args.forEach(a => {
      expect(() => {
        lib.fizzBuzz(a);
      }).toThrow();
    });
  });

  it("should return a FizzBuzz", () => {
    const result = lib.fizzBuzz(15);
    expect(result).toBe("FizzBuzz");
  });

  it("should return a fizz", () => {
    const result = lib.fizzBuzz(3);
    expect(result).toBe("Fizz");
  });

  it("should return a buzz", () => {
    const result = lib.fizzBuzz(5);
    expect(result).toBe("Buzz");
  });

  it("should return the input", () => {
    const result = lib.fizzBuzz(4);
    expect(result).toBe(4);
  });
});
