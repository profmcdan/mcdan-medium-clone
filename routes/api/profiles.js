const mongoose = require("mongoose");
const router = require("express").Router();
const passport = require("passport");
// const User = mongoose.model("User");
const auth = require("../auth");
const User = require("../../models/User");

router.get("/all", (req, res) => {
  User.find().then(users => {
    if (!users) {
      return res.status(404).json({ errors: "Users not found" });
    }
    return res.json(users);
  });
});
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

// @desc Follow an Author
// @route POST /api/profiles/:username/follow
// Public
router.post(
  "/:username/follow",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    var profileId = req.user._id;

    User.findById(req.user.id)
      .then(user => {
        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }

        return user.follow(profileId).then(() => {
          return res.json({ profile: req.profile.toProfileJSONFor(user) });
        });
      })
      .catch(next);
  }
);

// @desc UnFollow an Author
// @route DELETE /api/profiles/:username/follow
// Public
router.delete(
  "/:username/follow",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    var profileId = req.profile._id;

    User.findById(req.user.id)
      .then(user => {
        if (!user) {
          return res.sendStatus(401);
        }

        return user.unfollow(profileId).then(() => {
          return res.json({ profile: req.profile.toProfileJSONFor(user) });
        });
      })
      .catch(next);
  }
);

module.exports = router;
