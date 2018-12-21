const User = require('../models/user');

const authenticate = (req,res,next) =>{
    const token = req.headers['x-auth']
    User.findByToken(token)
        .then((user) => {
            if(!user){
                return next()
            }
            req.user = user
            req.token = token
            return next()
        }).catch((e) => {
            return next()
        })
}

module.exports = {authenticate}