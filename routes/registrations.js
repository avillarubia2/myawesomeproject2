const { validateRegistration } = require("../models/register");
const { Account } = require("../models/account");
const { User } = require("../models/user");
const confirmationMailer = require("../mailer/confirmation-mailer");
const Fawn = require("fawn");
const _ = require("lodash");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

Fawn.init(mongoose);

router.post("/", async (req, res) => {
  const { error } = validateRegistration(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let account = await Account.findOne({ email: req.body.email });
  if (account) return res.status(400).send("Account already registered.");

  setDefaultValues(req);

  let picks = pickForAccount(req);
  account = new Account(picks);
  picks = picksForUser(req);
  const user = new User(picks);
  user._id = account._id;

  await account.passwordEncryption(account);

  try {
    picks = picksForToken(account, user);
    doTransactions(account, user);
    const token = user.generateToken(picks);
    //confirmationMailer(picks.email, token);

    res.send(token);
  } catch (ex) {
    res.status(500).send("Failed during saving.");
  }
});

function doTransactions(account, user) {
  new Fawn.Task()
    .save("accounts", account)
    .save("users", user)
    .run();
}

function pickForAccount(req) {
  return _.pick(req.body, ["email", "password", "verified", "roles"]);
}

function setDefaultValues(req) {
  req.body.verified = false;
  req.body.roles = ["user"];
}

function picksForUser({ body }) {
  return _.pick(body, [
    "first_name",
    "last_name",
    "type",
    "birthdate",
    "gender",
    "tags",
    "address"
  ]);
}

function picksForToken(account, user) {
  const accountPicks = _.pick(account, ["_id", "email"]);
  const userPicks = _.pick(user, ["first_name", "last_name"]);
  return _.merge(accountPicks, userPicks);
}

module.exports = router;
