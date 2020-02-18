const express = require("express");
const router = express.Router();
const objectIdValidator = require("../middleware/objectIdValidator");
const authorizer = require("../middleware/authorizer");
const { Comment, validateComment } = require("../models/comment");

const messages = ["FATAL ERROR: Failed to update a comment, somewhere in the backend has a problem."];

router.get("/:id", objectIdValidator.validateParams, async (req, res) => {
  const { id: topic_id } = req.params;

  const comments = await Comment.find({ topic_id });

  if (!comments.length)
    return res
      .status(404)
      .send(`No comments of the given topic id '${topic_id}' exists.`);

  res.send(comments);
});

router.post("/respond/:id", [authorizer.auth, objectIdValidator.validateParams], async ({ params, body }, res) => {
  let isValid = objectIdValidator.validateId(body.parent_id);
  if (!isValid) res.status(400).send("Invalid parent_id.");
  isValid = objectIdValidator.validateId(body.topic_id);
  if (!isValid) res.status(400).send("Invalid topic id.");
  isValid = objectIdValidator.validateId(body.user_id);
  if (!isValid) res.status(400).send("Invalid user id.");
  isValid = objectIdValidator.validateId(params.id);
  if (!isValid) res.status(400).send("Invalid id.");

  const { error } = validateComment(body);
  if (error) return res.status(400).send(error.details[0].message);

  const comment = new Comment(body);
  try {
    await comment.save();
  } catch (error) {
    res.status(500).send("Fail to save a comment object.")
  }

  const update = { $addToSet: { comment_ids: comment._id } }
  const options = { new: true };
  const updateTopic = await Comment.findByIdAndUpdate(params.id, update, options)
  updateTopic._id = comment._id;

  res.send(updateTopic);
})

router.post("/", [authorizer.auth], async (req, res) => {
  const { body } = req;
  let isValid = objectIdValidator.validateId(body.topic_id);
  if (!isValid) res.status(400).send("Invalid topic id.");
  isValid = objectIdValidator.validateId(body.user_id);
  if (!isValid) res.status(400).send("Invalid user id.");

  const { error } = validateComment(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const comment = new Comment(body);
  try {
    await comment.save();
  } catch (error) {
    res.status(500).send("Fail to save a comment object.")
  }

  res.send(comment);
});

router.post("/vote/commend/:id", [authorizer.auth, objectIdValidator.validateParams], async (req, res) => {
  const { id: _id } = req.params;
  const { recommending_user_id: upvoter, vote } = req.body;

  const query = { _id };
  const update =
    vote ?
      { $addToSet: { recommending_user_ids: upvoter } } :
      { $pullAll: { recommending_user_ids: [upvoter] } };
  const options = { new: true };
  const message = vote ? "upvoting" : "downvoting"

  try {
    await Comment.update(query, update, options);
    return res.send(`Successfully ${message} a comment.`);
  } catch (error) {
    return res.status(500).send(messages[0]);
  }
});

router.post("/vote/comment/:id", [authorizer.auth, objectIdValidator.validateParams], async (req, res) => {
  const { id: _id } = req.params;
  const { comment_id: commenter } = req.body;

  const query = { _id };
  const update = { $addToSet: { comment_ids: commenter } }
  const options = { new: true };

  try {
    await Comment.update(query, update, options);
    return res.send(`Successfully respond to a comment.`);
  } catch (error) {
    return res.status(500).send(messages[0]);
  }
})

module.exports = router;