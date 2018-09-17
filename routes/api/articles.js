const mongoose = require("mongoose");
const router = require("express").Router();
const passport = require("passport");
const slugify = require("slugify");
const User = mongoose.model("User");
const auth = require("../auth");
const Article = require("../../models/Article");
const Comment = require("../../models/Comment");

const validateArticleInputs = require("../../validation/articles");
const validateCommentInputs = require("../../validation/comments");

// @desc Get all Articles
// @route GET /api/articles/
// Private
router.get("/", (req, res, next) => {
  var query = {};
  var limit = 20;
  var offset = 0;

  if (typeof req.query.limit !== "undefined") {
    limit = req.query.limit;
  }

  if (typeof req.query.offset !== "undefined") {
    offset = req.query.offset;
  }

  if (typeof req.query.tag !== "undefined") {
    query.tagList = { $in: [req.query.tag] };
  }

  Promise.all([
    req.query.author ? User.findOne({ username: req.query.author }) : null,
    req.query.favorited ? User.findOne({ username: req.query.favorited }) : null
  ])
    .then(results => {
      var author = results[0];
      var favoriter = results[1];

      if (author) {
        query.author = author._id;
      }

      if (favoriter) {
        query._id = { $in: favoriter.favorites };
      } else if (req.query.favorited) {
        query._id = { $in: [] };
      }

      return Promise.all([
        Article.find(query)
          .limit(Number(limit))
          .skip(Number(offset))
          .sort({ createdAt: "desc" })
          .populate("author")
          .exec(),
        Article.count(query).exec(),
        req.user ? User.findById(req.payload.id) : null
      ]).then(function(results) {
        var articles = results[0];
        var articlesCount = results[1];
        var user = results[2];

        return res.json({
          articles: articles.map(article => {
            return article.toJSONFor(user);
          }),
          articlesCount: articlesCount
        });
      });
    })
    .catch(next);
});

// @desc Get feeds
// @route GET /api/articles/feed
// Private
router.get(
  "/feed",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    var limit = 20;
    var offset = 0;

    if (typeof req.query.limit !== "undefined") {
      limit = req.query.limit;
    }

    if (typeof req.query.offset !== "undefined") {
      offset = req.query.offset;
    }

    User.findById(req.user.id).then(user => {
      if (!user) {
        return res.sendStatus(401);
      }

      Promise.all([
        Article.find({ author: { $in: user.following } })
          .limit(Number(limit))
          .skip(Number(offset))
          .populate("author")
          .exec(),
        Article.count({ author: { $in: user.following } })
      ])
        .then(results => {
          var articles = results[0];
          var articlesCount = results[1];

          return res.json({
            articles: articles.map(article => {
              return article.toJSONFor(user);
            }),
            articlesCount: articlesCount
          });
        })
        .catch(next);
    });
  }
);

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

// @desc Comment on an article
// @route DELETE /api/articles/:slug/comment
// Private
router.post(
  "/:article/comments",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    const { errors, isValid } = validateCommentInputs(req.body);
    // Check Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
    User.findById(req.user.id)
      .then(user => {
        if (!user) {
          return res.status(401).json({ error: "You have to logged in" });
        }

        const comment = new Comment({ body: req.body.comment });
        comment.article = req.article;
        comment.author = user;

        return comment.save().then(() => {
          req.article.comments.push(comment);

          return req.article.save().then(article => {
            res.json({ comment: comment.toJSONFor(user) });
          });
        });
      })
      .catch(next);
  }
);

// @desc get all Comments on an article
// @route GET /api/articles/:slug/comments
// Public
router.get("/:article/comments", (req, res, next) => {
  Promise.resolve(req.user ? User.findById(req.user.id) : null)
    .then(function(user) {
      return req.article
        .populate({
          path: "comments",
          populate: {
            path: "author"
          },
          options: {
            sort: {
              createdAt: "desc"
            }
          }
        })
        .execPopulate()
        .then(function(article) {
          return res.json({
            comments: req.article.comments.map(function(comment) {
              return comment.toJSONFor(user);
            })
          });
        });
    })
    .catch(next);
});

// Before we can create the DELETE route, we'll need a router param
// middleware for resolving the /:comment in our URL:
router.param("comment", function(req, res, next, id) {
  Comment.findById(id)
    .then(function(comment) {
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      req.comment = comment;

      return next();
    })
    .catch(next);
});

// @desc delete a Comments on an article
// @route DELETE /api/articles/:slug/comments/:comment
// Public
router.delete(
  "/:article/comments/:comment",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    if (req.comment.author.toString() === req.user.id.toString()) {
      req.article.comments.remove(req.comment._id);
      req.article
        .save()
        .then(
          Comment.find({ _id: req.comment._id })
            .remove()
            .exec()
        )
        .then(() => {
          return res.status(204).json({ success: true });
        });
    } else {
      return res.status(403).json({ error: "Comment not found" });
    }
  }
);

module.exports = router;
