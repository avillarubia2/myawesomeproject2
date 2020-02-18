const express = require("express");
const router = express.Router();
const authorizer = require("../middleware/authorizer");
const objectIdValidator = require("../middleware/objectIdValidator");
const { Tag, validate } = require("../models/tag");

router.put(
  "/",
  [authorizer.auth, objectIdValidator.validateBody],
  async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { _id, name } = req.body;

    const updates = { name };
    const updateOption = { new: true };
    const tag = await Tag.findByIdAndUpdate(_id, updates, updateOption);

    if (!tag)
      return res.status(404).send("Tag of with the given id is not exists.");

    return res.send(tag.name);
  }
);

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const tag = await Tag.findById(id);

  if (!tag) return res.status(404).send("Tag with the given id is not exists.");

  return res.send(tag);
});

router.get("/", async (req, res) => {
  const tags = await Tag.find();

  if (!tags.length) return res.status(404).send("No tags exists.");

  return res.send(tags);
});

module.exports = router;
