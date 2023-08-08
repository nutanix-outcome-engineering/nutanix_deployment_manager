const { Client } = require('ssh2')
const log = require('./logger.js')

module.exports = {
  exec
}

async function exec(options, command, logger=undefined) {
  return new Promise((resolve, reject) => {
    const client = new Client()
    let output = []
    let stderr = []
    client.on('ready', () => {
      client.exec(command, (err, stream) => {
        if (err) {
          throw err
        }
        stream.on('close', (code, signal) => {
          let retVal = {
            stdout: Buffer.concat(output).toString(),
            stderr: Buffer.concat(stderr).toString()
          }
          if (code > 0) {
            let error = new Error(`Command exited with non-zero return code: ${code}`)
            error.output = retVal
            error.exitCode = code
            reject(error)
          } else {
            resolve(retVal)
          }
          client.end()
        }).on('data', async (data) => {
          // console.log(data)
          // const logme = logger && logger(data.toString())
          // if (logme instanceof Promise) {
          //   await logme
          // }
          output.push(data)
        }).stderr.on('data', async (data) => {
          // console.log(data)
          // const logme = logger && logger(data.toString())
          // if (logme instanceof Promise) {
          //   await logme
          // }
          stderr.push(data)
        })
      })

    }).on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
      finish([options.password])
    }).on('error', (err) => {
      client.end()
      reject(err)
    }).connect({
      ...options,
      tryKeyboard: true,
      debug: (info) => {
        log.trace(`SSH DEBUG: ${info}`)
      }
    })
  })
}
