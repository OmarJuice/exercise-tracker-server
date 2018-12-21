const express = require('express');
const app = express();
const mongoose = require('mongoose');
const { mongouri } = require('./config/config')
const authRoutes = require('./routes/auth');
const trackerRoutes = require('./routes/tracker');
const bodyParser = require('body-parser');
const cors = require('cors')

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
    exposedHeaders: 'x-auth'
}
app.use(cors(corsOptions));

mongoose.connect(mongouri, { useNewUrlParser: true });
app.use(express.static('public'));
app.use(authRoutes)
app.use(trackerRoutes)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())





app.get('/', function (req, res) {
    res.send('hello')
})
app.listen(3001, function () {
    console.log('Server init')
})
module.exports = { app }