const mongoose = require("mongoose");
const router = require("express").Router();
const passport = require("passport");
const User = mongoose.model("User");
const auth = require("../auth");
// const User = require("../../models/User");

// @desc Search User
// @route POST /api/profiles/:username
// Public
router.get("/:username", function(req, res) {
  User.findOne({ username: req.params.username })
    .then(function(user) {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ profile: user.toProfileJSONFor() });
    })
    .catch(err => {
      return res.status(404).json({ error: "User not found" });
    });
});

module.exports = router;
