const mongoose = require('mongoose');
const Exercise = require('../models/exercise');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const user1ID = new ObjectId()
const user2ID = new ObjectId()
const user3ID = new ObjectId()
const access = 'auth'


const exercises = [{
    _id: new ObjectId(),
    description: 'Walking',
    duration: 10,
    date: new Date('2018-04-01').getTime(),
    _creator: user1ID
},
{
    _id: new ObjectId(),
    description: 'Running',
    duration: 20,
    date: Date.now(),
    _creator: user2ID
},
{
    _id: new ObjectId(),
    description: 'Lifting',
    duration: 30,
    date: new Date('2018-11-01').getTime(),
    _creator: user1ID
}]


const users = [{
    _id: user1ID,
    username: 'userOne',
    password: 'userOnePass',
    tokens: [{
        access: 'auth',
        token: jwt.sign({ _id: user1ID.toHexString(), access }, process.env.JWT_SECRET).toString()
    }],
    exercises: [exercises[0]._id, exercises[2]._id]
},
{
    _id: user2ID,
    username: 'userTwo',
    password: 'userTwoPass',
    tokens: [{
        access: 'auth',
        token: jwt.sign({ _id: user2ID.toHexString(), access }, process.env.JWT_SECRET).toString()
    }],
    exercises: [exercises[1]._id]
},
{
    _id: user3ID,
    username: 'userThree',
    password: 'userThreePass',
    tokens: [{
        access: 'auth',
        token: jwt.sign({ _id: user3ID.toHexString(), access }, process.env.JWT_SECRET).toString()
    }],
    exercises: []
}]

const populateExercises = (done) => {
    Exercise.deleteMany({}).exec()
        .then(() => {
            return Exercise.insertMany(exercises)
        })
        .then(() => done())
        .catch((e) => {
        })
}
const populateUsers = (done) => {
    User.deleteMany({}).exec()
        .then(() => {
            const User1 = new User(users[0]).save()
            const User2 = new User(users[1]).save()
            const User3 = new User(users[2]).save()

            return Promise.all([User1, User2, User3])
        })
        .then(() => done())
        .catch((e) => {
        })
}

module.exports = { populateExercises, populateUsers, exercises, users }