const router = require("express").Router();

router.use("/users", require("./users"));
// router.use("/profiles", require("./profiles"));

router.use(function(err, req, res, next) {
  if (err.name === "ValidationError" || err.name === "UnauthorizedError") {
    return res.status(401).json({
      errors: "Unauthorized"
    });
  }
  return next(err);
});

module.exports = router;
