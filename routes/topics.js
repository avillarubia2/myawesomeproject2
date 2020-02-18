const express = require("express")
const mongoose = require("mongoose")
const Joi = require("joi")
const authorizer = require("../middleware/authorizer")
const objectIdValitor = require("../middleware/objectIdValidator")
const router = express.Router()
const { Topic, validateTopic, validateTags, validateTitle, validateDescription } = require("../models/topic")

const pageLimit = 100

router.get("/", paginate(Topic), async (req, res) => {
  res.send(res.paginatedResults)
})

router.get("/own", [authorizer.auth, paginateByOwnTopics(Topic)], async (req, res) => {
  res.send(res.paginatedResults)
})

router.get("/tag/:tag", paginateByTag(Topic), async (req, res) => {
  res.send(res.paginatedResults)
})

router.get("/interests", paginateByInterest(Topic), async (req, res) => {
  res.send(res.paginatedResults)
})

router.get("/:id", (req, res) => {
  Topic.findById(req.params.id)
    .then(topics => res.json(topics))
    .catch(err => res.status(400).json("Error: " + err))
})

router.get("/search-exact/:title", (req, res) => {
  Topic.findOne({ title: req.params.title })
    .then(topics => res.json(topics))
    .catch(err => res.status(400).json("Error: " + err))
})

router.get("/search/:titlekeys", (req, res) => {
  Topic.find({ $text: { $search: req.params.titlekeys } })
    .then(topics => res.json(topics))
    .catch(err => res.status(400).json("Error: " + err))
})

router.get("/search/:titlekeys/tags/:tags", (req, res) => {
  const queryTags = req.params.tags.split("-")

  Topic.find({
    $and: [
      { $text: { $search: req.params.titlekeys } },
      { tags: { $all: queryTags } }
    ]
  })
    .then(topics => res.json(topics))
    .catch(err => res.status(400).json("Error: " + err))
})

router.put(
  "/tags/:id",
  [authorizer.auth, objectIdValitor.validateParams],
  async (req, res) => {
    const { error } = validateTags(req.body)
    if (error) return sendResponse(res, error.details[0].message, 400)

    const { id } = req.params
    const { tags } = req.body
    const topic = await update(id, { tags })

    if (!topic)
      return sendResponse(
        res,
        `Topic with the given id ${id} did not exists.`,
        404
      )

    return sendResponse(
      res,
      `Topic with the given id ${id} has been successfully saved.`
    )
  }
)

router.put(
  "/title/:id",
  [authorizer.auth, objectIdValitor.validateParams],
  async (req, res) => {
    const { error } = validateTitle(req.body)
    if (error) return sendResponse(res, error.details[0].message, 400)

    const { id: _id } = req.params
    const { title } = req.body

    const topic = await update(_id, { title })

    if (!topic)
      return sendResponse(
        res,
        `Topic with the given id ${_id} did not exists.`,
        404
      )

    return sendResponse(
      res,
      `Topic with the given id ${_id} has been successfully saved.`
    )
  }
)

router.put(
  "/description/:id",
  [authorizer.auth, objectIdValitor.validateParams],
  async (req, res) => {
    const { error } = validateDescription(req.body)
    if (error) return sendResponse(res, error.details[0].message, 400)

    const { id: _id } = req.params
    const { description } = req.body

    const topic = await update(_id, { description })

    if (!topic)
      return sendResponse(
        res,
        `Topic with the given id ${_id} did not exists.`,
        404
      )

    return sendResponse(
      res,
      `Topic with the given id ${_id} has been successfully saved.`
    )
  }
)

router.post("/create", authorizer.auth, async (req, res) => {
  const req_userid = req.body.user_id

  if (!req_userid || !mongoose.Types.ObjectId.isValid(req_userid)) {
    return res.status(400).send("Invalid userid")
  }

  const error = validateTopic(req.body)
  // if (error) return sendResponse(res, error.details[0].message, 400)

  const { user_id, type, title, description, tags, uploads, publication_type } = req.body
  const newTopic = new Topic({ type, title, description, user_id, tags, uploads, publication_type })

  await newTopic
    .save()
    .then(() => res.json(newTopic))
    .catch(err => res.status(400).json("Error: " + err))
})

router.post("/vote/:id", [authorizer.auth, objectIdValitor.validateParams], async (req, res) => {
  const { id: _id } = req.params
  const { recommending_user_id: upvoter, vote } = req.body

  const query = { _id }
  const update =
    vote ?
      { $addToSet: { recommending_user_ids: upvoter } } :
      { $pullAll: { recommending_user_ids: [upvoter] } }
  const options = { new: true }
  const message = vote ? "upvoting" : "downvoting"

  try {
    await Topic.update(query, update, options)
    return res.send(`Successfully ${message} a topic.`)
  } catch (error) {
    return res.status(500).send("FATAL ERROR: Failed to update a topic, somewhere in the backend has a problem.")
  }
})

function paginate(model) {
  return async ({ query }, res, next) => {
    await doPagination({}, query, res, model, next)
  }
}

function paginateByOwnTopics(model) {
  return async (req, res, next) => {
    const { query, params } = req
    const colQuery = { user_id: req.user._id }

    if (!params)
      return res.status(400).send("Param must not empty")

    await doPagination(colQuery, query, res, model, next)
  }
}

function paginateByTag(model) {
  return async ({ query, params }, res, next) => {
    const colQuery = { tags: params.tag }

    if (!params)
      return res.status(400).send("Param must not empty")

    await doPagination(colQuery, query, res, model, next)
  }
}

function paginateByInterest(model) {
  return async ({ query, body }, res, next) => {
    const colQuery = { tags: { '$in': body.tags } }

    await doPagination(colQuery, query, res, model, next)
  }
}

async function doPagination(colQuery, query, res, model, next) {
  const { error } = validateParams(query)
  if (error) return res.status(400).send(error.details[0].message)

  const page = parseInt(query.page)
  const limit = parseInt(query.limit)

  if (page > pageLimit) return res.send([])

  const startIndex = (page - 1) * limit

  const results = await setPagination(model, page, limit, startIndex)

  await findInCol(colQuery, model, limit, startIndex, next, results, res)
}


async function setPagination(model, page, limit, startIndex) {
  const colSize = await getCollectionSize(model);

  const results = {};
  const endIndex = page * limit

  if (endIndex < colSize)
    results.next = {
      page: page + 1,
      limit
    };
  if (startIndex > 0)
    results.previous = {
      page: page - 1,
      limit
    };

  return results;
}

async function getCollectionSize(model) {
  return await model.countDocuments().exec();
}

async function findInCol(colQuery, model, limit, startIndex, next, results, res) {
  try {
    results.results = await model.find(colQuery)
      .limit(limit)
      .skip(startIndex)
      .sort({ "updatedAt": -1 })
      .exec()

    res.paginatedResults = results
    next()
  } catch (error) {
    return res.status(500)
      .send("FATAL ERROR: Failed to fetch topics, somewhere in the backend has a problem.")
  }
}

function validateParams(query) {
  const schema = {
    page: Joi.string().regex(/^\d+$/),
    limit: Joi.string().regex(/^\d+$/)
  }

  return Joi.validate(query, schema)
}

async function update(id, update) {
  const options = { new: true }
  return await Topic.findByIdAndUpdate(id, update, options)
}

function sendResponse(res, error, code = 200) {
  return res.status(code).send(error)
}

module.exports = router