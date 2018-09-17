const router = require("express").Router();
const mongoose = require("mongoose");
// var Article = mongoose.model('Article');
const Article = require("../../models/Article");

// @desc Get all tags
// @route DELETE /api/tags/
// Public
router.get("/", (req, res, next) => {
  Article.find()
    .distinct("tagList")
    .then(tags => {
      return res.json({ tags: tags });
    })
    .catch(next);
});

module.exports = router;
