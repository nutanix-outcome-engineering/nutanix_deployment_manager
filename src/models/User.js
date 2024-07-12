const db = require('../database')
const bcrypt = require('bcryptjs')

const USERS_TABLE = 'user'

class User {
  constructor(u) {
    this.id = u.id
    this.changePass = u.changePass
    this.username = u.username
    this.password = u.password
  }

  checkPassword(password) {
    return bcrypt.compareSync(password, this.password)
  }

  async changePassword(password) {
    const newHash = bcrypt.hashSync(password, bcrypt.genSaltSync())
    this.password = newHash
    this.changePass = false

    await db(USERS_TABLE).update(this.serialize()).where({id: this.id})
  }

  serialize() {
    return {
      id: this.id,
      changePass: this.changePass,
      username: this.username,
      password: this.password
    }
  }

  static fromDatabase(record) {
    return new User({
      id: record.id,
      username: record.username,
      password: record.password,
      changePass: record.changePass
    })
  }

  static async findByUsername(username) {
    const record = await db(USERS_TABLE).where({username}).first()
    if(record) {
      return User.fromDatabase(record)
    }
    return null
  }

  static async findById(id) {
    const record = await db(USERS_TABLE).where({id}).first()
    if(record) {
      return User.fromDatabase(record)
    }
    return null
  }

  static verifyPassword(password, dbPassword) {
    return bcrypt.compareSync(password, dbPassword)
  }
}


// async function run() {
//   const username = 'admin'
//   const password = 'nutanix/4u'
//   const badPass = 'flibblydeeBorf'
//   let user = await User.findByUsername('admin')
//   console.log(user)
//   let ret = User.verifyPassword(password,user.password)
//   console.log(ret)
//   ret = User.verifyPassword(badPass,user.password)
//   console.log(ret)
//   let badUser = await User.findByUsername('bob')
//   console.log(badUser)
//   return user
// }
// run()
module.exports = User
