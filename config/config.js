const dotenv = require('dotenv').config();


const env = process.env.NODE_ENV || 'development';
let mongouri;
if(env === 'test'){
    mongouri = process.env.MONGO_URI_TEST
}else{
    mongouri = process.env.MONGO_URI
}

module.exports = {mongouri}