const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Exercise = require('../models/exercise');
const { ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const { authenticate } = require('../middleware/authenticate')

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json())



router.get('/users', function (req, res) {
    User.find({}).lean().exec()
        .then((users) => {
            users = users.map((user) => {
                return {
                    _id: user._id,
                    username: user.username
                }
            })
            res.send({ users })
        }).catch((e) => {
            res.status(404).send(e)
        })
})
router.get('/users/:id', function (req, res) {
    let _id = req.params.id;
    if (!ObjectId.isValid(_id)) {
        return res.status(400).send('Invalid id')
    }
    User.findOne({ _id }).lean().exec()
        .then((user) => {
            if (!user) {
                throw new Error('Not found')
            }
            return res.send({
                username: user.username,
                _id: user._id
            })
        }).catch((e) => {
            res.status(404).send(e)
        })
})
router.post('/users', function (req, res) {
    let { username, password } = req.body;
    let newUser = new User({ username, password })
    newUser.generateAuthToken()
        .then((token) => {
            res.header('x-auth', token).send(newUser.toJson())
        }).catch((e) => {
            res.status(400).send(e)
        })
})
router.post('/users/login', function (req, res) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).send('Invalid credentials')
    }
    let { username, password } = req.body
    User.findByCredentials(username, password)
        .then((user) => {
            return user.generateAuthToken()
                .then((token) => {
                    return res.header('x-auth', token).send(user.toJson())
                })
        }).catch((e) => {
            res.status(400).send(e)
        })
})
router.delete('/users/logout', authenticate, function (req, res) {
    req.user.removeToken(req.token)
        .then((user) => {
            return res.status(200).send()
        }).catch((e) => {
            return res.status(400).send()
        })
})
module.exports = router