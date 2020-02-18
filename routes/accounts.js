const express = require("express");
const router = express.Router();
const authorizer = require("../middleware/authorizer");
const { Account } = require("../models/account");

router.post("/confirm/:token", (req, res) => {
  const token = req.params.token;
  if (!token)
    return res.status(401).send("Verification failed. No token provided.");

  try {
    const decodedUser = authorizer.verify(token);
    res.user = decodedUser;

    Account.update(
      { email: decodedUser.email },
      { verified: true, verifiedDate: Date.now(), verifiedToken: token },
      err => {
        if (err) {
          res
            .status(500)
            .send(
              "Server error. Failed to update db for verification indicators. Message: " +
                err.message
            );
        } else {
          res.status(200).send("Account successfully verified.");
        }
      }
    );
  } catch (ex) {
    res.status(400).send("Verification failed. Invalid token.");
  }
});

module.exports = router;
