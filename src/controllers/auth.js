const passport = require('passport')
const log = require('../lib/logger.js')

module.exports = {
  login: async (req, res, next) => {
    try {
      //TODO: failureFlash:true and handle flashes?
      // authenticate also accepts a third parameter of a callback, if used, must session save and next() or directly use res yourself
      // see: https://github.com/jaredhanson/passport/blob/master/lib/middleware/authenticate.js
      // MAGIC: https://stackoverflow.com/questions/36648350/passport-local-temporary-password-change-on-first-login
      passport.authenticate('local', {
        session: true
      },
      (err, user, info, status) => {
        if (err) { res.redirect('/login') }
        req.login(user, (err) => {
          if (user.changePass) {
            res.redirect('/passreset')
          } else {
            res.redirect('/')
          }
        })
      }
      )(req, res, next)
    }
    catch(err) {
      log.error(`Error during login: ${err}`)
      res.redirect('/login')
    }
  }
}

