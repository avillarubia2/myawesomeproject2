const Joi = require("joi");
const mongoose = require("mongoose");

const registerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 50,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 1024
    },
    first_name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 50,
      trim: true
    },
    last_name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 50,
      trim: true
    },
    type: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50
    },
    birthdate: Date,
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
    verified: Boolean,
    tags: [{ type: String, minlength: 2, maxlength: 50, trim: true }],
    roles: [{ type: String }],
    photo: {
      type: String,
      maxlength: 200000
    },
  },
  {
    timestamps: true
  }
);

function validateRegistration(register) {
  return Joi.validate(register, registrationSchema());
}

function registrationSchema() {
  return {
    email: Joi.string()
      .min(5)
      .max(50)
      .required()
      .email()
      .trim(),
    password: Joi.string()
      .min(5)
      .max(50)
      .required(),
    first_name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .label("first name")
      .trim(),
    last_name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .label("last name")
      .trim(),
    type: Joi.string()
      .valid("student", "professor")
      .required(),
    birthdate: Joi.date().required(),
    gender: Joi.string()
      .valid("male", "female")
      .required(),
    tags: Joi.array().items(
      Joi.string()
        .min(2)
        .max(50)
        .trim()
    ),
    address: Joi.string()
      .min(2)
      .max(255)
      .required()
      .trim(),
    photo: Joi.string().max(200000)
  };
}

exports.validateRegistration = validateRegistration;
exports.registrationSchema = registrationSchema;
