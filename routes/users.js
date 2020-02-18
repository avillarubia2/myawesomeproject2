const express = require("express");
const router = express.Router();
const objectIdValidator = require("../middleware/objectIdValidator");
const { User } = require("../models/user");

router.get("/:id", objectIdValidator.validateParams, async (req, res) => {
  const { id: _id } = req.params;
  const user = await User.findById({ _id });
  if (!user)
    return res.status(404).send(`User with the given id '${_id}' not exists.`);

  return res.send(user);
});

module.exports = router;
