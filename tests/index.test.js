const expect = require('expect');
const request = require('supertest');
const { app } = require('../index')
const { populateExercises, populateUsers, exercises, users } = require('./seed')
const Exercise = require('../models/exercise');
const User = require('../models/user');
const { ObjectId } = require('mongodb');



beforeEach(populateExercises)
beforeEach(populateUsers)

describe('GET /', () => {
    it('should return 200', (done) => {
        request(app)
            .get('/')
            .expect(200)
            .end(done)
    })
})

describe('GET /exercise', () => {
    it('should display exercises only for the logged in user', (done) => {
        request(app)
            .get('/exercise')
            .expect(200)
            .set('x-auth', users[0].tokens[0].token)
            .expect((res) => {
                expect(res.body.exercises.length).toBe(2)
                for (let item of res.body.exercises) {
                    expect(item).toHaveProperty('_id')
                    expect(item).toHaveProperty('description')
                    expect(item).toHaveProperty('date')
                    expect(item).toHaveProperty('duration')
                    expect(item._creator).toBe(users[0]._id.toHexString())
                }
            })
            .end(done)
    })
    it('should return an empty array if the user has no exercises', (done) => {
        request(app)
            .get('/exercise')
            .expect(200)
            .set('x-auth', users[2].tokens[0].token)
            .expect((res) => {
                expect(res.body.exercises.length).toBe(0)
            })
            .end(done)
    })
})
describe('GET /exercise/:id', () => {
    it('Should get the exercise by its id', (done) => {
        request(app)
            .get(`/exercise/${exercises[0]._id}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).toBe(exercises[0]._id.toHexString())
                expect(typeof res.body.description).toBe('string')
                expect(typeof res.body.duration).toBe('number')
                expect(typeof res.body.date).toBe('number')
            })
            .end(done)
    })
    it('Should return 404 for an id that doesnt exist', (done) => {
        request(app)
            .get(`/exercise/${new ObjectId()}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done)
    })
    it('should return 401 if the user is not authenticated', (done) => {
        request(app)
            .get(`/exercise/${exercises[1]._id}`)
            .expect(401)
            .end(done)
    })
})
describe('POST /exercise', () => {
    it('should create a new exercise with the creator as the logged in user and add it to the users list of exercises', (done) => {
        let newEx = {
            description: 'Swimming',
            duration: 34,
            date: 1234567890,
        }
        request(app)
            .post('/exercise')
            .send(newEx)
            .set('x-auth', users[2].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body).toMatchObject(newEx)
                expect(res.body._creator).toBe(users[2]._id.toHexString())
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                User.findById(users[2]._id).exec()
                    .then((user) => {
                        expect(user.exercises.length).toBe(1)
                        expect(user.exercises[0]._id).toBeTruthy()
                        expect(ObjectId.isValid(user.exercises[0]._id)).toBe(true)
                        done()
                    }).catch((e) => {
                        done(e)
                    })
            })
    })
    it('should add a Date if none was specified', (done) => {
        let newEx = {
            description: 'Sit-ups',
            duration: 10,
        }
        request(app)
            .post('/exercise')
            .send(newEx)
            .set('x-auth', users[2].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body).toMatchObject(newEx)
                expect(typeof res.body.date).toBe('number')
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Exercise.findById(res.body._id).exec()
                    .then((found) => {
                        if (found) {
                            return done()
                        }
                        else {
                            throw new Error('Exercise not found in database')
                        }
                    }).catch((e) => {
                        return done(e)
                    })
            })
    })
    it('should not add the execise with an invalid body', (done) => {
        let newEx = {
            description: '',
            duration: 'happy',
        }
        request(app)
            .post('/exercise')
            .send(newEx)
            .set('x-auth', users[2].tokens[0].token)
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Exercise.find({}).exec()
                    .then((found) => {
                        expect(found.length).toBe(3)
                        done()
                    }).catch((e) => {
                        return done(e)
                    })
            })
    })
    it('should return 401 if the user is not logged in', (done) => {
        let newEx = {
            description: 'Swimming',
            duration: 34,
            date: 1234567890,
        }
        request(app)
            .post('/exercise')
            .send(newEx)
            .expect(401)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Exercise.find({}).exec()
                    .then((result) => {
                        expect(result.length).toBe(3)
                        done()
                    }).catch((e) => {
                        return done(e)
                    })
            })
    })

})
describe('DELETE /exercise/:id', () => {
    it('should delete an exercise by its id', (done) => {
        request(app)
            .delete(`/exercise/${exercises[0]._id}`)
            .expect(200)
            .set('x-auth', users[0].tokens[0].token)
            .expect((res) => {
                expect(res.body).toMatchObject({})
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                let promise1 = Exercise.find({}).exec()

                let promise2 = User.findById(users[0]._id).exec()
                Promise.all([promise1, promise2])
                    .then(([exs, user]) => {
                        expect(exs.length).toBe(2)
                        expect(user.exercises.length).toBe(1)
                        done()
                    }).catch((e) => {
                        done(e)
                    })
            })
    })
    it('should return 404 if no exercise is found', (done) => {
        request(app)
            .delete(`/exercise/${new ObjectId()}`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(404)
            .end(done)
    })
    it('should return 400 with invalid id', (done) => {
        request(app)
            .delete(`/exercise/123`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(400)
            .end(done)
    })
    it('should return 401 if the user is not authenticated', (done) => {
        request(app)
            .delete(`/exercise/${exercises[1]._id}`)
            .expect(401)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Exercise.find({}).exec()
                    .then((result) => {
                        expect(result.length).toBe(3)
                        done()
                    }).catch((e) => {
                        return done(e)
                    })
            })
    })
    it('should return 404 if the user is not the creator of the exercise', (done) => {
        request(app)
            .delete(`/exercise/${exercises[1]._id}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Exercise.find({}).exec()
                    .then((result) => {
                        expect(result.length).toBe(3)
                        done()
                    }).catch((e) => {
                        return done(e)
                    })
            })
    })
})
describe('PATCH /exercise/:id', () => {
    it('should update an exercise by its id', (done) => {
        let update = {
            description: 'Sprinting',
            duration: 15
        }
        request(app)
            .patch(`/exercise/${exercises[1]._id}`)
            .set('x-auth', users[1].tokens[0].token)
            .send(update)
            .expect(200)
            .expect((res) => {
                expect(res.body).toMatchObject(update)
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Exercise.findById(exercises[1]._id).exec()
                    .then((ex) => {
                        expect(ex).toMatchObject(update)
                        return done()
                    }).catch((e) => {
                        return done(e)
                    })

            })
    })
    it('should add a Date and update if none was specified', (done) => {
        let newEx = {
            description: 'Sit-ups',
            duration: 10,
        }
        request(app)
            .patch(`/exercise/${exercises[1]._id}`)
            .send(newEx)
            .set('x-auth', users[1].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body).toMatchObject(newEx)
                expect(typeof res.body.date).toBe('number')
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Exercise.findById(res.body._id).exec()
                    .then((found) => {
                        if (found) {
                            return done()
                        }
                        else {
                            throw new Error('Exercise not found in database')
                        }
                    }).catch((e) => {
                        return done(e)
                    })
            })
    })
    it('should not update an exercise if an invalid body is given', (done) => {
        let update = {
            description: 13,
            duration: 'xyz'
        }
        request(app)
            .patch(`/exercise/${exercises[1]._id}`)
            .set('x-auth', users[1].tokens[0].token)
            .send(update)
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Exercise.findById(exercises[1]._id).exec()
                    .then((ex) => {
                        expect(ex.description).toBe(exercises[1].description)
                        expect(ex.duration).toBe(exercises[1].duration)
                        expect(ex.date).toBe(exercises[1].date)
                        return done()
                    }).catch((e) => {
                        return done(e)
                    })

            })
    })

    it('should return 404 if exercise is not found', (done) => {
        let update = {
            description: 'Sprinting',
            duration: 15
        }
        let id = new ObjectId()
        request(app)
            .patch(`/exercise/${id}`)
            .set('x-auth', users[1].tokens[0].token)
            .send(update)
            .expect(404)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Exercise.findById(id).exec()
                    .then((ex) => {
                        expect(ex).toBeFalsy()
                        done()
                    }).catch((e) => {
                        return done(e)
                    })

            })
    })
    it('should return 400 with invalid id', (done) => {
        let update = {
            description: 'Sprinting',
            duration: 15
        }
        request(app)
            .patch(`/exercise/123`)
            .set('x-auth', users[0].tokens[0].token)
            .send(update)
            .expect(400)
            .end(done)
    })
    it('should return 401 if the user is not authenticated', (done) => {
        request(app)
            .patch(`/exercise/${exercises[1]._id}`)
            .expect(401)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Exercise.findById(exercises[1]._id).exec()
                    .then((result) => {
                        expect(result).toMatchObject(exercises[1])
                        done()
                    }).catch((e) => {
                        return done(e)
                    })
            })
    })
    it('should return 404 if the user is not the creator of the exercise', (done) => {
        request(app)
            .patch(`/exercise/${exercises[1]._id}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                Exercise.findById(exercises[1]._id).exec()
                    .then((result) => {
                        expect(result).toMatchObject(exercises[1])
                        done()
                    }).catch((e) => {
                        return done(e)
                    })
            })
    })

})

describe('GET /users/', () => {
    it('should return 200', (done) => {
        request(app)
            .get('/users')
            .expect(200)
            .expect((res) => {
                expect(res.body.users.length).toBe(3)
                for (let user of res.body.users) {
                    expect(user).toHaveProperty('username')
                    expect(user).not.toHaveProperty('password')
                    expect(res.body).not.toHaveProperty('tokens')
                    expect(user).toHaveProperty('_id')
                }
            })
            .end(done)
    })
})
describe('GET /users/:id', () => {
    it('Should get a user by id', (done) => {
        request(app)
            .get(`/users/${users[0]._id}`)
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('username')
                expect(res.body).not.toHaveProperty('password')
                expect(res.body).not.toHaveProperty('tokens')
                expect(res.body).toHaveProperty('_id')
            })
            .end(done)
    })
    it('Should return 404 if user not found', (done) => {
        request(app)
            .get(`/users/${new ObjectId()}`)
            .expect(404)
            .end(done)
    })
    it('Should return 400 with invalid id', (done) => {
        request(app)
            .get(`/users/5465767`)
            .expect(400)
            .end(done)
    })
})
describe('POST /users', () => {
    it('Should create a new user and return its username and id', (done) => {
        let username = 'userFour'
        let password = 'userFourPass'
        request(app)
            .post('/users')
            .send({ username, password })
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('username')
                expect(res.body).not.toHaveProperty('password')
                expect(res.body).toHaveProperty('_id')
                expect(res.header['x-auth']).toBeTruthy()
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                User.findOne({ username }).exec()
                    .then((user) => {
                        expect(user).toBeTruthy()
                        expect(user.password).not.toBe(password)
                        expect(user.tokens.length).toBe(1)
                        return done()
                    }).catch((e) => done(e))
            })
    })
    it('Should not create a user if given username is already taken', (done) => {
        let username = 'userOne'
        let password = 'userFourPass'
        request(app)
            .post('/users')
            .send({ username, password })
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                User.find({ username }).exec()
                    .then((users) => {
                        expect(users.length).toBe(1)
                        return done()
                    }).catch((e) => done(e))
            })
    })
    it('Should not create a user with an invalid username', (done) => {
        let username = 'user!@'
        let password = 'userFourPass'
        request(app)
            .post('/users')
            .send({ username, password })
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                User.find({ username }).exec()
                    .then((users) => {
                        expect(users.length).toBe(0)
                        return done()
                    }).catch((e) => done(e))
            })
    })
    it('Should not create a user with an invalid password', (done) => {
        let username = 'userFour'
        let password = 'u'
        request(app)
            .post('/users')
            .send({ username, password })
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                User.find({ username }).exec()
                    .then((users) => {
                        expect(users.length).toBe(0)
                        return done()
                    }).catch((e) => done(e))
            })
    })
})
describe('POST /users/login', () => {
    it('Should login a user with valid credentials', (done) => {
        request(app)
            .post('/users/login')
            .send({
                username: users[0].username,
                password: users[0].password
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.username).toBe(users[0].username)
                expect(res.body.password).toBeFalsy()
                expect(res.body.tokens).toBeFalsy()
                expect(res.headers['x-auth']).toBeTruthy()
            })
            .end(done)
    })
    it('Should not login a user with invalid credentials', (done) => {
        request(app)
            .post('/users/login')
            .send({
                username: users[0].username,
                password: users[1].password
            })
            .expect(400)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeFalsy()
            })
            .end((done))
    })
    it('Should not login a user with missing credentials', (done) => {
        request(app)
            .post('/users/login')
            .send({})
            .expect(400)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeFalsy()
            })
            .end((done))
    })
})
describe('DELETE /users/logout', () => {
    it('should log out a user and remove their token', (done) => {
        request(app)
            .delete('/users/logout')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeFalsy()
            })
            .end((err, res) => {
                if (err) {
                    return done(err)
                }
                User.findById(users[0]._id).exec()
                    .then((user) => {
                        expect(user.tokens.length).toBe(0)
                        done()
                    }).catch((e) => {
                        return done(e)
                    })
            })
    })
})
