const express = require("express");
const router = express.Router();
const passport = require("passport");

const validateArticleInput = require("../../validation/articles");

const Article = require("../../models/Article");
const User = require("../../models/User");
const Profile = require("../../models/Profile");

// @route   GET api/article/all
// @desc    GETs all articles
// @access  Public
router.get("/all", (req, res) => {
  let errors = {};
  Article.find()
    .then(articles => {
      if (!articles) {
        errors.noarticle = "There are no articles found";
        return res.status(404).json(errors);
      }
      return res.json(articles);
    })
    .catch(err => {
      errors.noarticle = "There are no articles found";
      return res.status(404).json(errors);
    });
});

module.exports = router;
