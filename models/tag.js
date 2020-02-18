const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const tagSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      minlength: 2,
      maxlength: 50,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const Tag = mongoose.model("Tag", tagSchema);

function validateRequest({ ...body }) {
  delete body._id;

  const schema = {
    user_id: Joi.string().required(),
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .trim()
  };

  return Joi.validate(body, schema);
}

exports.Tag = Tag;
exports.validate = validateRequest;
