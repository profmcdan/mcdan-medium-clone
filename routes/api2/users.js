const express = require("express");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

const router = express.Router();

// Load user model
const User = require("../../models/User");

// Load Input Validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

// @route   POST api/auth/register
// @desc    Registers new user
// @access  Public
router.post("/register", (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);
  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.findOne({
    email: req.body.email
  }).then(user => {
    if (user) {
      errors.email = "Email already exists";
      return res.status(400).json(errors);
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: "200", // Size
        r: "pg", // Rating
        d: "mm" // Default
      });

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        username: req.body.email,
        avatar: avatar,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

// @route   POST api/auth/login
// @desc    Logs in user
// @access  Public
router.post("/login", (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const { email, password } = req.body;

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        errors.email = "User not found";
        return res.status(404).json({ errors });
      }

      // Check Password
      bcrypt.compare(password, user.password).then(isMatch => {
        // User Matched
        if (isMatch) {
          const payload = {
            id: user.id,
            name: user.name,
            avatar: user.avatar
          };
          //  Sign the token
          jwt.sign(
            payload,
            keys.secretOrKey,
            { expiresIn: 3600 },
            (err, token) => {
              res.json({
                success: true,
                token: "Bearer " + token
              });
            }
          );
        } else {
          errors.password = "Password incorrect";
          return res.status(400).json({ errors });
        }
      });
    })
    .catch(err => res.status(405).json({ err }));
});

// @route   GET api/auth/user
// @desc    Get Current User
// @access  Private
router.get(
  "/user",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar
    });
  }
);

// @route   GET api/auth/current
// @desc    Return Current User
// @access  Private
router.get(
  "/current",
  passport.authenticate("jwt", {
    session: false
  }),
  (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar
    });
  }
);

module.exports = router;
