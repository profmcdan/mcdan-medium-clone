const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const uniqueValidator = require("mongoose-unique-validator");
const slugify = require("slugify");

const User = require("./User");

// Create Schema
const ArticleSchema = new Schema(
  {
    slug: {
      type: String,
      lowercase: true,
      unique: true
    },
    title: {
      type: String
    },
    body: {
      type: String
    },
    description: {
      type: String
    },
    favoritesCount: {
      type: String
    },
    tagList: [
      {
        type: String
      }
    ],
    author: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    favorited: {
      type: String
    },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "comments" }]
  },

  { timestamps: true }
);

ArticleSchema.plugin(uniqueValidator, { message: "is already taken" });

ArticleSchema.methods.slugify = function() {
  this.slug =
    slugify(this.title) +
    "-" +
    ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
};

ArticleSchema.methods.toJSONFor = function() {
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    tagList: this.tagList,
    favoritesCount: this.favoritesCount,
    author: this.author.toProfileJSONFor()
    // favored: user ? user.isFavorite(this._id) : false
  };
};

ArticleSchema.methods.updateFavoriteCount = function() {
  var article = this;

  return User.count({ favorites: { $in: [article._id] } }).then(function(
    count
  ) {
    article.favoritesCount = count;

    return article.save();
  });
};

// Let this get called at save time
ArticleSchema.pre("validate", function(next) {
  if (!this.slug) {
    this.slugify();
  }
  next();
});

module.exports = Article = mongoose.model("Article", ArticleSchema);
