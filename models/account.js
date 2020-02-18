const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const accountSchema = new mongoose.Schema(
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
      maxlength: 1024 //example lang is 1k kapin ang length, para masulod ang total length sa hashed password
    },
    verified: Boolean,
    verifiedDate: Date,
    verifiedToken: String,
    roles: [{ type: String }]
  },
  {
    timestamps: true
  }
);

accountSchema.methods.passwordEncryption = async function(account) {
  const salt = await bcrypt.genSalt(10);
  account.password = await bcrypt.hash(account.password, salt);
};

const Account = mongoose.model("Account", accountSchema);

exports.Account = Account;
