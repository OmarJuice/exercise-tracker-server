const express = require('express');
const router = express.Router();
const Exercise = require('../models/exercise');
const User = require('../models/user')
const _ = require('lodash')
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');
const { authenticate } = require('../middleware/authenticate');


router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json())


router.get('/exercise', authenticate, function (req, res) {
    if (!req.user) {
        return res.status(401).send('You must be logged in to do that')
    }

    User.findById(req.user._id).populate('exercises').exec()
        .then((user) => {
            res.send(user.toJson())
        }).catch((e) => {
            res.status(404).send(e)
        })
})
router.get('/exercise/:id', authenticate, function (req, res) {
    if (!req.user) {
        return res.status(401).send('You must be logged in to do that')
    }
    Exercise.findById(req.params.id).exec()
        .then((exercise) => {
            if (!exercise) {
                throw new Error('Not Found')
            }
            return res.send(exercise)
        }).catch((e) => {
            return res.status(404).send(e)
        })
})

router.post('/exercise', authenticate, function (req, res) {
    if (!req.user) {
        return res.status(401).send('You must be logged in to do that')
    }
    let { description, duration, date } = req.body;
    if (!date) {
        date = new Date().getTime()
    }
    let _creator = req.user._id
    const newExercise = { description, duration, date, _creator }

    Exercise.create(newExercise)
        .then((created) => {

            req.user.exercises.push(created)
            req.user.save()
            res.send(created)
        }).catch((e) => {
            res.status(400).send(e)
        })


})

router.delete('/exercise/:id', authenticate, function (req, res) {
    if (!req.user) {
        return res.status(401).send('You must be logged in to do that')
    }
    let _id = req.params.id
    let _creator = req.user._id
    if (!ObjectId.isValid(_id)) {

        return res.status(400).send('Invalid Id')
    }
    Exercise.deleteOne({ _id, _creator }).lean().exec()
        .then((result) => {
            if (result.n === 0) {
                throw new Error('Not Found')
            }
            return User.findOneAndUpdate({ _id: _creator }, { $pull: { exercises: _id } }).exec()
        }).then((user) => {
            res.send()
        }).catch((e) => {
            res.status(404).send(e)
        })

})
router.patch('/exercise/:id', authenticate, function (req, res) {
    if (!req.user) {
        return res.status(401).send('You must be logged in to do that')
    }
    let _id = req.params.id;
    let _creator = req.user._id
    if (!ObjectId.isValid(_id)) {
        return res.status(400).send('Invalid id')
    }
    let { description, duration, date } = req.body;
    if (!date) {
        date = Date.now()
    }
    Exercise.findOneAndUpdate({ _id, _creator }, { description, duration, date }, { new: true }).lean().exec()
        .then((updated) => {
            if (!updated) {
                return res.status(404).send('Not found')
            }
            return res.send(updated)
        }).catch((e) => {
            return res.status(400).send(e)
        })

})

module.exports = router