const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const uniqueValidator = require("mongoose-unique-validator");
var slugify = require("slugify");

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
    tagList: {
      type: String
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "users"
    }
  },
  { timestamps: true }
);

ArticleSchema.plugin(uniqueValidator, { message: "is already taken" });

ArticleSchema.methods.createSlug = () => {
  this.slug =
    slugify(this.title) +
    "-" +
    ((Math.random() * Math.pow(36, 6)) | 0).toString();
};

ArticleSchema.methods.toJSONFor = user => {
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    tagList: this.tagList,
    favoritesCount: this.favoritesCount,
    author: user
  };
  // author: this.author.toProfileJSONFor(user)
};

// Let this get called at save time
// ArticleSchema.pre("validate", next => {
//   if (!this.slug) {
//     this.createSlug();
//   }
//   next();
// });

module.exports = Article = mongoose.model("articles", ArticleSchema);
