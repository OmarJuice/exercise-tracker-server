const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs')
const db = require('mongodb');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true,
        validate: {
            validator: (value) => {
                let regex = /\W+/g
                return !regex.test(value)
            },
            message: '{VALUE} is not a valid username'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }],
    exercises: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise'
    }]
})
userSchema.methods.toJson = function () {
    const user = this;
    const userObject = user.toObject();
    return _.pick(userObject, ['username', '_id', 'exercises'])
}
userSchema.methods.generateAuthToken = function () {
    let user = this;
    const access = 'auth';
    const token = jwt.sign({ _id: user._id.toHexString(), access }, process.env.JWT_SECRET).toString();

    user.tokens.push({ access, token })

    return user.save().then(() => {
        return Promise.resolve(token)
    }).catch((err) => {
        if (err.code === 11000) {
            return Promise.reject("Username already taken");
        }
        return Promise.reject(e)
    })
}
userSchema.pre('save', function (next) {
    const user = this;
    if (user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next()
            })
        })
    } else {
        next()
    }
})
userSchema.statics.findByCredentials = function (username, password) {
    const USER = this;
    return USER.findOne({ username }).exec()
        .then((user) => {
            if (!user) {
                return Promise.reject('Not Found')
            }
            return bcrypt.compare(password, user.password)
                .then((result) => {
                    if (!result) {
                        return Promise.reject('Invalid credentials')
                    }
                    return user
                })
        }).then((user) => {
            return Promise.resolve(user)
        }).catch((e) => {
            return Promise.reject(e)
        })
}
userSchema.statics.findByToken = function (token) {
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (e) {
        return Promise.reject(e)
    }
    return User.findOne({
        _id: decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    }).then((user) => {
        return Promise.resolve(user)
    }).catch((e) => {
        return Promise.reject(e)
    })
}
userSchema.methods.removeToken = function (token) {
    const USER = this;
    let newTokens = []
    return User.findOneAndUpdate({ username: USER.username }, { tokens: newTokens }, { new: true }).exec()
        .then((user) => {
            return Promise.resolve(user)
        })
        .catch((e) => {
            return Promise.reject(e)
        })

}


const User = mongoose.model('User', userSchema)
module.exports = User