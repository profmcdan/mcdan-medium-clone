const express = require("express");
const router = express.Router();
const passport = require("passport");

const validateProfileInput = require("../../validation/profile");

const User = require("../../models/User");
const Profile = require("../../models/Profile");

// @route   GET api/profile
// @desc    Get Current User's Profile
// @access  Private
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    let errors = {};
    Profile.findOne({ user: req.user.id })
      .populate("user", ["name", "email", "avartar"])
      .then(profile => {
        if (!profile) {
          errors.noprofile = "There is no profile for this user";
          return res.status(404).json(errors);
        }

        res.json(profile);
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route   GET api/profile/user/:username
// @desc    Get a User's Profile by username
// @access  Public
router.get("/user/:username", (req, res) => {
  const errors = {};
  Profile.findOne({ username: req.params.username })
    .populate("user", ["name", "email", "avartar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There is no profile for this user";
        return res.status(404).json(errors);
      }

      res.json(profile);
    })
    .catch((err = res.status(404).json(err)));
});

// @route   GET api/profile/all
// @desc    GETs all profiles
// @access  Public
router.get("/all", (req, res) => {
  const errors = {};
  Profile.find()
    .populate("user", ["name", "email", "avartar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There are profiles";
        return res.status(404).json(errors);
      }

      res.json(profile);
    })
    .catch(
      (err = res.status(404).json({
        profile: "There are no profiles"
      }))
    );
});

// @route   POST api/profile
// @desc    Create or Edit Profile
// @access  Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    const profileFields = {};
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.website) profileFields.website = req.body.website;

    Profile.findOne({ user: req.user.id })
      .then(profile => {
        if (profile) {
          Profile.findOneAndUpdate(
            { user: req.user.id },
            { $set: profileFields },
            { new: true }
          ).then(profile => {
            return res.json(profile);
          });
        } else {
          // Create new profile
          const newProfile = new Profile({
            bio: req.body.bio,
            website: req.body.website,
            user: req.user.id
          });

          newProfile.save().then(profile => {
            return res.json(profile);
          });

          // new Profile(profileFields).save().then(profile => res.json(profile));
        }
      })
      .catch(err => console.log(err));
  }
);

module.exports = router;
