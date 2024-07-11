'use strict'
//const crypto = require('crypto')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const db = require('../database')
const user = require('../models/User.js')

// passport.initialize()
module.exports = function(app) {
  app.use(passport.initialize())
  app.use(passport.session())

  passport.use(new LocalStrategy(async (username, password, done) => {
    const thisUser = await user.findByUsername(username)
    if(!thisUser) {return done(null, false)}
    if(!thisUser.checkPassword(password)) {
      return done(null, false, {message: 'incorrect Pass'})
    }
    return done(null, thisUser)
  }))

  // TODO: serialize w/o password, and without DB retrieval on each deserialize
  passport.serializeUser((user,done) => {
    done(null, user.id)
  })

  passport.deserializeUser(async (id, done) => {
    const thisUser = await user.findById(id)
    if (thisUser) {done(null,thisUser)}
    else {done(`Couldn't find user with id ${id}`, null)}
  })

}
