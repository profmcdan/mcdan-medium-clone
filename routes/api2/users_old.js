const mongoose = require("mongoose");
const router = require("express").Router();
const passport = require("passport");
const User = require("../../models/User");
const auth = require("../auth");

// @route POST /api/auth/register
// Desc REGISTER USER
// Public
router.post("/register", (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email
  });

  // user.username = req.body.username;
  // user.email = req.body.email;
  user.setPassword(req.body.password);

  user
    .save()
    .then(() => {
      return res.json({ user: user.toAuthJSON() });
    })
    .catch(err => res.status(404).json(err));
});

// route POST /api/auth/login
// Desc Login USER
// Public
router.post("/login", (req, res, next) => {
  if (!req.body.email) {
    return res.status(422).json({ errors: { email: "can't be blank" } });
  }

  if (!req.body.password) {
    return res.status(422).json({ errors: { password: "can't be blank" } });
  }

  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (user) {
      user.token = user.generateJWT();
      return res.json({ user: user.toAuthJSON() });
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
});

// route GET /api/auth/user
// Desc Get Current User
// Private
router.get("/user", auth.required, (req, res, next) => {
  User.findById(req.payload.id)
    .then(user => {
      if (!user) {
        return res.sendStatus(401);
      }

      return res.json({ user: user.toAuthJSON() });
    })
    .catch(next);
});

// route PUT /api/auth/user
// Desc Update User Info
// Private
router.put("/user", auth.required, (req, res, next) => {
  User.findById(req.payload.id)
    .then(user => {
      if (!user) {
        return res.sendStatus(401);
      }

      // only update fields that were actually passed.
      if (typeof req.body.user.username !== "undefined") {
        user.username = req.body.user.username;
      }

      if (typeof req.body.user.email !== "undefined") {
        user.email = req.body.user.email;
      }

      if (typeof req.body.user.bio !== "undefined") {
        user.bio = req.body.user.bio;
      }

      if (typeof req.body.user.image !== "undefined") {
        user.image = req.body.user.image;
      }

      if (typeof req.body.user.password !== "undefined") {
        user.password = req.body.user.password;
      }

      return user.save().then(() => {
        return res.json({ user: user.toAuthJSON() });
      });
    })
    .catch(next);
});

module.exports = router;
