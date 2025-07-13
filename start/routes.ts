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

router.post('/login', [AuthController, 'login'])
router.post('/register', [AuthController, 'register'])
router.get('/verify-email', [AuthController, 'verifyEmail'])
router.post('/logout', [AuthController, 'logout']).use(
  middleware.auth({
    guards: ['api'],
  })
)

router.get('/items', [ItemsController, 'getAllItems']).use(
  middleware.auth({
    guards: ['api'],
  })
)
