const mongoose = require("mongoose");
const router = require("express").Router();
const passport = require("passport");
const slugify = require("slugify");
const User = mongoose.model("User");
const auth = require("../auth");
const Article = require("../../models/Article");

const validateArticleInputs = require("../../validation/articles");

// @desc Create Article
// @route POST /api/articles/
// Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateArticleInputs(req.body);
    // Check Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const { title, body, description, tagList } = req.body;
    User.findById(req.user.id).then(user => {
      if (!user) {
        return res.status(401).json({ error: "Access Denied" });
      }
      const newArticle = new Article({
        title,
        body,
        description,
        tagList
      });

      newArticle.author = user;
      return newArticle
        .save()
        .then(() => {
          return res.json({ article: newArticle.toJSONFor() });
        })
        .catch(err => {
          return res.status(500).json({ error: "Unable to save" });
        });
    });
  }
);

router.get("/all", (req, res) => {
  Article.find().then(articles => {
    if (!articles) {
      return res.status(404).json({ notfound: "Articles not found" });
    }
    return res.json({ articles });
  });
});

// Middleware
router.param("article", function(req, res, next, slug) {
  Article.findOne({ slug: slug })
    .populate("author")
    .then(function(article) {
      if (!article) {
        return res.sendStatus(404);
      }

      req.article = article;

      return next();
    })
    .catch(next);
});

// @desc Read Article
// @route GET /api/articles/:slug
// Public
router.get("/:article", (req, res, next) => {
  Promise.all([
    req.user ? User.findById(req.user.id) : null,
    req.article.populate("author").execPopulate()
  ])
    .then(function(results) {
      var user = results[0];

      return res.json({ article: req.article.toJSONFor(user) });
    })
    .catch(next);
});

// @desc Update Article
// @route PUT /api/articles/:slug
// Private
router.put(
  "/:article",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    User.findById(req.user.id).then(function(user) {
      if (req.article.author._id.toString() === req.user.id.toString()) {
        if (typeof req.body.title !== "undefined") {
          req.article.title = req.body.title;
        }

        if (typeof req.body.description !== "undefined") {
          req.article.description = req.body.description;
        }

        if (typeof req.body.body !== "undefined") {
          req.article.body = req.body.body;
        }

        const slug =
          slugify(req.article.title) +
          "-" +
          ((Math.random() * Math.pow(36, 6)) | 0).toString(16);
        req.article.slug = slug;

        req.article
          .save()
          .then(function(article) {
            return res.json({ article: article.toJSONFor(user) });
          })
          .catch(next);
      } else {
        return res.sendStatus(403);
      }
    });
  }
);

// @desc Delete Article
// @route DELETE /api/articles/:slug
// Private
router.delete(
  "/:article",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    User.findById(req.user.id).then(function() {
      if (req.article.author._id.toString() === req.user.id.toString()) {
        return req.article.remove().then(function() {
          return res.status(204).json({ success: true });
        });
      } else {
        return res.status(403).json({ notFound: "Article does not exists" });
      }
    });
  }
);

// @desc Favorite an article
// @route POST /api/articles/:slug/favorite
// Private
router.post(
  "/:article/favorite",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    var articleId = req.article._id;

    User.findById(req.user.id)
      .then(function(user) {
        if (!user) {
          return res.status(401).json({ notFound: "User not found" });
        }

        return user.favorite(articleId).then(() => {
          return req.article.updateFavoriteCount().then(article => {
            return res.json({ article: article.toJSONFor(user) });
          });
        });
      })
      .catch(err => {
        res.status(500).json({ error: err });
      });
  }
);

// @desc UnFavorite an article
// @route DELETE /api/articles/:slug/favorite
// Private
router.delete(
  "/:article/favorite",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    var articleId = req.article._id;

    User.findById(req.user.id)
      .then(user => {
        if (!user) {
          return res.status(401).json({ notFound: "User not found" });
        }

        return user.unfavorite(articleId).then(() => {
          return req.article.updateFavoriteCount().then(article => {
            return res.json({ article: article.toJSONFor(user) });
          });
        });
      })
      .catch(err => {
        res.status(500).json({ error: err });
      });
  }
);

module.exports = router;
