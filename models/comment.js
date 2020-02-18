const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const schema = new mongoose.Schema(
  {
    parent_id: {
      type: String
    },
    topic_id: {
      type: String,
      required: true
    },
    user_id: {
      type: String,
      required: true
    },
    content: {
      type: String,
      minlength: 2,
      maxlength: 500,
      trim: true,
      required: true
    },
    recommending_user_ids: [{ type: String }],
    comment_ids: [{ type: String }],
  },
  {
    timestamps: true
  }
);

function validateComment(req) {
  const joiSchema = {
    parent_id: Joi.string(),
    topic_id: Joi.string()
      .required(),
    user_id: Joi.string()
      .required(),
    content: Joi.string()
      .trim()
      .min(2)
      .max(500)
      .required(),
    recommending_user_ids: Joi.array().items(
      Joi.objectId()),
    comment_ids: Joi.array().items(
      Joi.objectId())
  };

  return Joi.validate(req, joiSchema);
}

const Comment = mongoose.model("Comment", schema);

exports.Comment = Comment;
exports.validateComment = validateComment;
