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
    User.findById(req.user.id).then(user => {
      if (!user) {
        return res.status(401).json({ errors: "user not found" });
      }
    });
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

// @route   GET api/article/:slug
// @desc    Get Article
// @access  Public
router.get("/:slug", (req, res) => {
  const errors = {};
  Article.findOne({ slug: req.params.slug }).then(article => {
    if (!article) {
      errors.noarticle = "Article not found";
      return res.status(404).json(errors);
    }

    return res.json(article);
  });
});

// @route   PUT api/article/:slug
// @desc    Update Article
// @access  Private
router.put(
  "/:slug",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    User.findById(req.user.id).then(user => {
      if (!user) {
        return res.status(401).json({ errors: "user not found" });
      }
    });
    const { errors, isValid } = validateArticleInput(req.body);
    // Check Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const articleFields = {
      title: req.body.title,
      description: req.body.description,
      body: req.body.body,
      tagList: req.body.tagList
    };

    Article.findOne({ slug: req.params.slug })
      .then(article => {
        if (!article) {
          errors.articlenotfound = "Article not found";
          return res.status(404).json(errors);
        }

        Article.findOneAndUpdate(
          { slug: req.params.slug },
          { $set: articleFields },
          { new: true }
        ).then(article => {
          if (!article) {
            errors.updateerror = "There is an error updating article";
            return res.status(405).json(errors);
          }
          return res.json(article);
        });
      })
      .catch(err => {
        errors.articlenotfound = "Article can't be updated";
        return res.status(500).json(errors);
      });
  }
);

module.exports = router;
