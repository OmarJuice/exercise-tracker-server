const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    description:{
        type: String,
        require: true,
        minlength: 1,
        maxlength: 50
    },
    duration:{
        type: Number,
        require: true,
    },
    date:{
        type: Number
    },
    _creator:{
        type: mongoose.Schema.Types,
        require: true
    }
})

const Exerise = mongoose.model('Exercise', exerciseSchema)

module.exports = Exerise