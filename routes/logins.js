const { Account } = require('../models/account')
const { User, validateRequest, validateLogin } = require('../models/user')
const _ = require('lodash')
const express = require('express')
const router = express.Router()

const messages = [
  'Invalid email or password.',
  'FATAL ERR: No user of the given id exists, account and user data for given id is not sync or deleted.'
]

router.post('/', async (req, res) => {
  const { error } = validateRequest(req.body)
  if (error) return res.status(400).send(error.details[0].message)

  const { email, password: requestPassword } = req.body
  const account = await Account.findOne({ email })
  if (!account) return res.status(404).send('Account not exists.')

  const { _id, password: hashedPassword } = account
  const user = await User.findOne({ _id })

  if (!account) return res.status(404).send(messages[0])
  if (!user) return res.status(500).send(messages[1])

  const validPassword = await validateLogin(requestPassword, hashedPassword)
  if (!validPassword) return res.status(404).send(messages[0])

  const accountPicks = _.pick(account, ['_id', 'email'])
  const userPicks = _.pick(user, ['first_name', 'last_name', 'photo'])
  const picks = _.merge(accountPicks, userPicks)

  const token = user.generateToken(picks)
  res.send(token)
})

module.exports = router
