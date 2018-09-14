const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema(
  {
    body: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    article: { type: mongoose.Schema.Types.ObjectId, ref: "articles" }
  },
  { timestamps: true }
);

CommentSchema.methods.toJSONFor = function(user) {
  return {
    id: this._id,
    body: this.body,
    author: this.author.toProfileJSONFor(user)
  };
};
module.exports = Comment = mongoose.model("comments", CommentSchema);
