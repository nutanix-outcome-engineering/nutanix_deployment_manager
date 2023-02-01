const passport = require('passport')
const user = require('../models/user.js')

module.exports = {
  login: async (req, res, next) => {
    console.log("IN HANDLER")
    console.log(req.body)
    let tu = await user.findByUsername(req.body.username)
    console.log(tu)
    try {
      //TODO: failureFlash:true and handle flashes?
      // authenticate also accepts a third parameter of a callback, if used, must session save and next() or directly use res yourself
      // see: https://github.com/jaredhanson/passport/blob/master/lib/middleware/authenticate.js
      passport.authenticate('local', { failureRedirect: '/login' ,failureMessage:'AUTH FAILURE', successRedirect: '/'})(req,res,next)
    }
    catch(err) {
      console.log(err)
    }
  }
}

