const OpenApiValidator = require('express-openapi-validator')
const express = require('express')
const path = require('path')
const _ = require('lodash')
const { MulterCSVStorage } = require('../../lib/csv')


const apiSpec = path.join(__dirname, 'rx-lite.json')

function registerAPIHandlers(app) {
  app.use('/spec', express.static(apiSpec, {
    setHeaders: (res, path) => {
      res.setHeader('Content-Type', 'text/plain')
    }
  }))
  function catchErrors(handler) {
    return async (req, res, next) => {
      try {
        return await handler(req, res, next)
      } catch (e) {
        next(e)
      }
    }
  }

  // Pattern for possibly injecting route specifc middleware.
  // At least it is an example for adding /api only middleware.
  // function protect(handler) {
  //   return (req,res,next) => {
  //     if(req.isAuthenticated() || req.path=='/api/auth/login') {
  //       return handler(req, res, next)
  //     }
  //     else {
  //       res.redirect('/login')
  //     }
  //   }
  // }
  // To use this change the return of operationHandlers.resolver to:
  // return protect(catchErrors(handler))

  // Wire up express-openapi-validator middleware...
  app.use(
    OpenApiValidator.middleware({
      apiSpec,
      validateResponses: process.env.NODE_ENV !== 'production',
      validateRequests: true,
      operationHandlers: {
        basePath: path.resolve(__dirname, '../../controllers'),
        resolver: (handlersPath, route, apiDoc) => {
          const pathKey = route.openApiRoute.substring(route.basePath.length)
          const schema = apiDoc.paths[pathKey][route.method.toLowerCase()]
          const [controller, ...method] = schema['operationId'].split('.')
          const modulePath = path.join(handlersPath, controller)
          const handler = _.get(require(modulePath), method)
          if (handler === undefined) {
              throw new Error(`Could not find a [${method.join('.')}] function in ${modulePath} when trying to route [${route.method} ${route.expressRoute}].`)
          }
          return catchErrors(handler)
        }
      },
      validateSecurity: {
        handlers: {
          PassportSession: (req, scopes, schema) => {
            return req.isAuthenticated()
          }
        }
      },
      fileUploader: {
        storage: new MulterCSVStorage(),
        fileFilter:(req, file, cb) => {
          if (file.mimetype === 'text/csv') {
            cb(null, true)
          } else {
            cb(null, false)
          }
        }
      }
    })
  )
}

module.exports = { registerAPIHandlers }
