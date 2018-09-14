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

// @desc  Get logged in user
// @route GET /api/auth/users
// Private
router.get(
  "/me",
  passport.authenticate("local", { session: false }),
  (req, res) => {
    res.json({ id: req.user.id, username: req.user.username });
  }
);

router.get("/", auth.required, (req, res, next) => {
  User.findById(req.payload.id)
    .then(user => {
      if (!user) {
        return res.sendStatus(401);
      }
      return res.json({ user: user.toAuthJSON() });
    })
    .catch(next);
});

// @desc  Update user info
// @route PUT /api/auth/users
// Private
router.put("/", auth.required, (req, res, next) => {
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
        return res.json({ user: user.toAuthJSON() });
      });
    })
    .catch(next);
});

module.exports = router;
