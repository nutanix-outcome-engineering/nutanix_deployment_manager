const User = require('../models/User.js')


module.exports = {
  resetpassword: async (req, res, next) => {
    const user = req.user
    if (req.user.checkPassword(req.body.oldPass)) {
      if (req.body.oldPass == req.body.newPass) {
        next(new Error(`New password is same as old password.`))
      } else if (req.body.newPass == req.body.newPassVerify) {
        await user.changePassword(req.body.newPass)
        req.logout((err) => {next(err)})
        res.send()
      } else {
        next(new Error(`Passwords don't match.`))
      }
    } else {
      res.status(401).send()
    }

  }
}
