const mongoose = require("mongoose");
const router = require("express").Router();
const passport = require("passport");
const User = mongoose.model("User");
const auth = require("../auth");
const Article = mongoose.model("Article");

// @desc Create Article
// @route POST /api/articles/
// Public
router.post("/", (req, res) => {
  User.findById(req.payload.id).then(user => {
    if (!user) {
      return res.status(401).json({ error: "Access Denied" });
    }
    const newArticle = new Article({
      title: req.body.title,
      body: req.body.body,
      description: req.body.description
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
router.get("/:article", auth.optional, function(req, res, next) {
  Promise.all([
    req.payload ? User.findById(req.payload.id) : null,
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
// Public
router.put("/:article", auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user) {
    if (req.article.author._id.toString() === req.payload.id.toString()) {
      if (typeof req.body.article.title !== "undefined") {
        req.article.title = req.body.article.title;
      }

      if (typeof req.body.article.description !== "undefined") {
        req.article.description = req.body.article.description;
      }

      if (typeof req.body.article.body !== "undefined") {
        req.article.body = req.body.article.body;
      }

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
});

// @desc Delete Article
// @route DELETE /api/articles/:slug
// Public
router.delete("/:article", auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function() {
    if (req.article.author._id.toString() === req.payload.id.toString()) {
      return req.article.remove().then(function() {
        return res.sendStatus(204);
      });
    } else {
      return res.sendStatus(403);
    }
  });
});

module.exports = router;
