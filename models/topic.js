const mongoose = require('mongoose')
const Joi = require('joi')

const topicSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true },
    type: { type: String, required: true },
    title: {
      type: String,
      minlength: 5,
      maxlength: 500,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      maxlength: 500,
      trim: true
    },
    tags: [
      {
        type: String,
        minlength: 2,
        maxlength: 50,
        trim: true
      }
    ],
    uploads: [
      {
        type: String,
        minlength: 4,
        maxlength: 50,
        trim: true
      }
    ],
    recommending_user_ids: Array,
    research_data: {},
    publication_type: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
)

const Topic = mongoose.model('Topic', topicSchema)

function validateTopic(req) {
  const schema = {
    _id: Joi.string()
      .trim()
      .required(),
    type: Joi.string()
      .trim()
      .required(),
    title: Joi.string()
      .trim()
      .min(5)
      .max(500)
      .required(),
    description: Joi.string()
      .max(500)
      .trim()
      .required(),
    tags: Joi.array(),
    uploads: Joi.array().items(
      Joi.string()
        .trim()
        .min(4)
        .max(50)
    ),
    recommending_user_ids: Joi.array(),
    research_data: Joi.empty(),
    publication_type: Joi.string()
      .valid(
        'Article',
        'Book',
        'Chapter',
        'Code',
        'Conference Paper',
        'Cover Page',
        'Data',
        'Experiment Findings',
        'Method',
        'Negative Results',
        'Patent',
        'Poster',
        'Preprint',
        'Presentation',
        'Raw Data',
        'Research Proposal',
        'Technical Report',
        'Thesis',
        'Research')
      .required(),
  }

  return Joi.validate(req, schema)
}

function validateTags(req) {
  const schema = {
    tags: Joi.array().items(
      Joi.string()
        .min(2)
        .max(50)
        .trim()
    )
  }

  return Joi.validate(req, schema)
}

function validateTitle(req) {
  const schema = {
    title: Joi.string()
      .min(5)
      .max(500)
      .required()
      .trim()
  }

  return Joi.validate(req, schema)
}

function validateDescription(req) {
  const schema = {
    description: Joi.string()
      .min(5)
      .max(500)
      .required()
      .trim()
  }

  return Joi.validate(req, schema)
}

exports.Topic = Topic
exports.validateTopic = validateTopic
exports.validateTags = validateTags
exports.validateTitle = validateTitle
exports.validateDescription = validateDescription
