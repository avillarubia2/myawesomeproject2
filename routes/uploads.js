const express = require('express')
const multer = require('multer')
const mongoose = require('mongoose')
const config = require("config")
const _ = require('lodash')
const path = require('path')
const fs = require('fs')
const { verify } = require("../middleware/authorizer");

const router = express.Router()
let mimeTypes = config.get("MIME_TYPES")
mimeTypes = mimeTypes.split(';') || mimeTypes

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        const _id = mongoose.Types.ObjectId();
        cb(null, _id + '_' + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    const isAccepted = mimeTypes.includes(file.mimetype)
    cb(null, isAccepted)
}

const mb = 50
const limits = {
    fileSize: mb * 1024 * 1024 // 1MB
}

const upload = multer({ storage, limits })

router.post("/", upload.single('items'), (req, res, next) => {
    const { token } = JSON.parse(req.body.items)
    if (!token) return res.status(401).send("Access denied. No token provided.");

    try {
        const decoded = verify(token);
        req.user = decoded;
        next();
    } catch (ex) {
        const pathFilenameExt = path.join(__dirname, '../public/uploads', req.file.filename)
        fs.unlink(pathFilenameExt, err => { if (err) console.log(err) })
        return res.status(400).send("Invalid token.");
    }

    const { file } = req
    if (!file) return res.send("File uploaded not supported.")

    res.send(file.filename)
})

module.exports = router
