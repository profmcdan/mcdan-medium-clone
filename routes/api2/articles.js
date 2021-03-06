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

// @route   DELETE api/article/:slug
// @desc    Delete Article
// @access  Private
router.delete(
  "/:slug",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    Article.findOne({ slug: req.params.slug })
      .then(article => {
        if (!article) {
          return res.status(404).json({ errors: "article not found" });
        }

        if (article.author.toString() !== req.user.id.toString()) {
          errors.denied = "You are not authorized to delete this article";
          return res.status(401).json(errors);
        }
        Article.findOneAndRemove({ slug: req.params.slug }).then(article => {
          return res.json({
            success: true,
            deleted: article
          });
        });
      })
      .catch(err => {
        return res.status(404).json({ errors: "article not found" });
      });
  }
);

// @route   POST api/article/upvote/:slug
// @desc    Upvote an article
// @access  Private
router.post(
  "/upvote/:slug",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    User.findById(req.user.id)
      .then(user => {
        if (!user) {
          errors.nouser = "User not found";
          return res.status(404).json(errors);
        }
        Article.findOne({ slug: req.params.slug })
          .then(article => {
            if (!article) {
              errors.noarticle = "Article not found";
              return res.status(404).json(errors);
            }
            // Update the user.
            user.favorite(article.id);
            user
              .save()
              .then(usr => {
                return res.json(usr);
              })
              .catch(err => {
                console.log(err);
              });
          })
          .catch(err => {
            errors.noarticle = "Article not found";
            return res.status(404).json(errors);
          });
      })
      .catch(err => {
        errors.nouser = "User not found";
        return res.status(404).json(errors);
      });
  }
);

// @route   POST api/article/favorite/:slug
// @desc    Upvote an article
// @access  Private
router.post(
  "/:slug/favorite",
  passport.authenticate("jwt", { session: false }),
  function(req, res) {
    User.findById(req.user.id)
      .then(function(user) {
        if (!user) {
          return res.sendStatus(401);
        }

        Article.findOne({ slug: req.params.slug })
          .then(article => {
            if (!article) {
              return res.status(404).json({ notfound: "article not found" });
            }

            return user
              .favorite(article.id)
              .then(function() {
                return article
                  .updateFavoriteCount()
                  .then(function(article) {
                    return res.json({ article: article.toJSONFor(user) });
                  })
                  .catch(err => {
                    return res.status(401).json({ error: err });
                  });
              })
              .catch(err => {
                return res.status(401).json({ error: err });
              });
          })
          .catch(err => {
            return res.status(404).json({ notfound: "article not found" });
          });
      })
      .catch(err => {
        return res.status(401).json({ error: err });
      });
  }
);

module.exports = router;
