const mongoose = require("mongoose");
const router = require("express").Router();
const passport = require("passport");
// const User = mongoose.model("User");
const auth = require("../auth");
const User = require("../../models/User");

// @desc Register New User
// @route POST /api/auth/users
// Public
router.post("/", (req, res, next) => {
  const newUser = new User();
  newUser.username = req.body.username;
  newUser.email = req.body.email;
  newUser.setPassword(req.body.password);

  newUser
    .save()
    .then(() => {
      return res.json({ user: newUser.toAuthJSON() });
    })
    .catch(next);
});

// @desc Login New User
// @route POST /api/auth/users/login
// Public
router.post("/login", (req, res, next) => {
  if (!req.body.email) {
    return res.status(422).json({ errors: { email: "cant be blank" } });
  }

  if (!req.body.password) {
    return res.status(422).json({ errors: { password: "cant be blank" } });
  }

  User.findOne({ email: req.body.email }).then(user => {
    if (!user) {
      return res.status(404).json({ notfound: "User not found" });
    }
    if (user.validPassword(req.body.password)) {
      user.token = user.generateJWT();
      return res.json({ user: user.toAuthJSON() });
    } else {
      return res.status(401).json({ password: "Invalid Password" });
    }
  });
});

// @desc Logout  User
// @route POST /api/auth/users/logout
// Public
router.get("/logout", (req, res) => {
  // [TODO] -- Handle with passport
  req.logout();
  res.redirect("/");
});

// Auth with google
router.get("/google", passport.authenticate("google", { scope: ["profile"] }));

// Callback route for google to redirect to
router.get("/google/redirect", passport.authenticate("google"), (req, res) => {
  // [TODO] -- Process the returned code
  res.json({ user: req.user });
  // res.redirect("/profile");
});

// @desc  Get logged in user
// @route GET /api/auth/users
// Private
router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    return res.json({ user: req.user.toProfileJSONFor() });
  }
);

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    User.findById(req.payload.id)
      .then(user => {
        if (!user) {
          return res.sendStatus(401);
        }
        return res.json({ user: user.toAuthJSON() });
      })
      .catch(next);
  }
);

// @desc  Update user info
// @route PUT /api/auth/users
// Private
router.put(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    User.findById(req.payload.id)
      .then(user => {
        if (!user) {
          return res.sendStatus(401);
        }

        // only update fields that were actually passed...
        if (typeof req.body.username !== "undefined") {
          user.username = req.body.username;
        }
        if (typeof req.body.email !== "undefined") {
          user.email = req.body.email;
        }
        if (typeof req.body.bio !== "undefined") {
          user.bio = req.body.bio;
        }
        if (typeof req.body.image !== "undefined") {
          user.image = req.body.image;
        }
        if (typeof req.body.password !== "undefined") {
          user.setPassword(req.body.password);
        }

        return user.save().then(() => {
          return res.json({ user: user.toProfileJSONFor() });
        });
      })
      .catch(next);
  }
);

module.exports = router;
