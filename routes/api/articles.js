const express = require("express");
const router = express.Router();
const passport = require("passport");
const slugify = require("slugify");

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
      if (articles.length < 1) {
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

// @route   POST api/article/
// @desc    Create Article
// @access  Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateArticleInput(req.body);
    // Check Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
    //  Post a new article
    const { title, body, description, tagList } = req.body;
    const slugCreated =
      slugify(title) + "-" + ((Math.random() * Math.pow(36, 6)) | 0).toString();
    const newArticle = new Article({
      slug: slugCreated,
      title: title,
      body: body,
      description: description,
      tagList: tagList,
      author: req.user.id
    });

    newArticle
      .save()
      .then(article => {
        res.json(article);
      })
      .catch(err => {
        console.log(err);
      });
  }
);

module.exports = router;
