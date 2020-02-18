const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const config = require("config");

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 255,
      trim: true
    },
    last_name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 255,
      trim: true
    },
    type: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50
    },
    address: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 255,
      trim: true
    },
    gender: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 6
    },
    birthdate: {
      type: Date,
      required: true
    },
    photo: {
      type: String,
      maxlength: 200000
    },
    tags: [{ type: String, minlength: 2, maxlength: 50, trim: true }]
  },
  {
    timestamps: true
  }
);

userSchema.methods.generateToken = function (picks) {
  return jwt.sign(picks, config.get("JWT_SECRET"), {
    expiresIn: config.get("JWT_LIFESPAN")
  });
};

const User = mongoose.model("User", userSchema);

function validateRequest(req) {
  const schema = {
    email: Joi.string()
      .email()
      .min(5)
      .max(50)
      .required()
      .trim(),
    password: Joi.string()
      .min(5)
      .max(50)
      .required()
  };

  return Joi.validate(req, schema);
}

async function validateLogin(plain, encypted) {
  return await bcrypt.compare(plain, encypted);
}

exports.User = User;
exports.validateRequest = validateRequest;
exports.validateLogin = validateLogin;
