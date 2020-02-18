const express = require("express")
const router = express.Router()
const jwtDecode = require("jwt-decode")
const _ = require("lodash")
const path = require('path')
const fs = require('fs')
const authorizer = require("../middleware/authorizer")
const { User } = require("../models/user")
const { Account } = require("../models/account")
const { validate: validateProfile } = require("../validators/profile")
const { convertBase64ToFile } = require('../utils/fileConverter')

const messages = [
  "FATAL ERR: No user of the given id exists, account and user data for given id is not sync or deleted.",
  "No user of the given id exists."
]

const userPicks = [
  "tags",
  "first_name",
  "last_name",
  "type",
  "birthdate",
  "gender",
  "address",
  "photo"
]

//TODO: no jwt
router.get("/", authorizer.auth, async (req, res) => {
  const _id = extractId(req)

  const user = await User.findById(_id)
  const account = await Account.findById(_id)

  if (!user) return res.status(404).send(messages[1])
  if (!account) return res.status(500).send(messages[0])

  const _userPicks = _.pick(user, userPicks)
  const accountPicks = _.pick(account, ["email"])
  const picks = _.merge(_userPicks, accountPicks)

  return res.send(picks)
})

router.put("/", authorizer.auth, async (req, res) => {
  const { error } = validateProfile(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  const _id = extractId(req)

  const user = await User.findById(_id)
  const account = await Account.findById(_id)

  if (!user) return res.status(404).send(messages[1])
  if (!account) return res.status(500).send(messages[0])

  removeOldPhoto(user)

  let { photo: requestedPhoto } = req.body
  delete req.body.photo
  const fileFormat = convertBase64ToFile(requestedPhoto)
  req.body.photo = fileFormat

  const options = { new: true }
  const updates = req.body

  const updatedUser = await User.findByIdAndUpdate(_id, updates, options)

  const accountPicks = _.pick(account, ["email"])
  const _userPicks = _.pick(updatedUser, userPicks)
  const picks = _.merge(accountPicks, _userPicks)

  const token = user.generateToken(picks)
  return res.send(token)
})

function removeOldPhoto(user) {
  let { photo: savedPhoto } = user
  const _path = path.join(__dirname, '../') + 'public\\uploads\\'
  try {
    fs.unlinkSync(_path + savedPhoto)
  } catch (error) {
	
  }
}

function extractId(req) {
  const token = req.header("x-auth-token")
  const { _id } = jwtDecode(token)
  return _id
}

module.exports = router