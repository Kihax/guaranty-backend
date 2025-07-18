/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
const AuthController = () => import('#controllers/auth_controller')
const ItemsController = () => import('#controllers/items_controller')
import { middleware } from '#start/kernel'

router.get('/test', async () => {
  return {
    hello: 'world',
  }
})

router
  .group(() => {
    // Public routes
    router
      .group(() => {
        /* section publique et avec préfixe domaine/api/auth/... */
        router.post('/login', [AuthController, 'login'])
        router.post('/register', [AuthController, 'register'])
        router.get('/verify-email', [AuthController, 'verifyEmail'])
        router.post('/resend-verification-email', [AuthController, 'resendVerificationEmail']).use(
          // lien sécurisé
          middleware.auth({
            guards: ['api'],
          })
        )
        router.post('/forgot-password', [AuthController, 'forgotPassword'])
        router.post('/reset-password', [AuthController, 'resetPassword'])
        router.post('/logout', [AuthController, 'logout']).use(
          // lien sécurisé
          middleware.auth({
            guards: ['api'],
          })
        )
      })
      .prefix('/auth')

    router
      .group(() => {
        /* section sécurisée et avec le préfixe domaine/api/items/... */
        router.get('/get', [ItemsController, 'getAllItems'])
        router.post('/store', [ItemsController, 'store'])
        router.get('/image/:id', [ItemsController, 'image'])
        router.post('/update/:id', [ItemsController, 'update'])
        router.get('/get/:id', [ItemsController, 'get'])
      })
      .prefix('/items')
      .use(
        middleware.auth({
          guards: ['api'],
        })
      )
  })
  .prefix('/api')
