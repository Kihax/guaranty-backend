import type { HttpContext } from '@adonisjs/core/http'

export default class ItemsController {
  async getAllItems({ response, auth }: HttpContext) {
    // Simulate fetching items from a database
    console.log(auth.user) // User
    console.log(auth.authenticatedViaGuard) // 'api'
    console.log(auth.user!.currentAccessToken) // AccessToken
    
    const items = [
      { id: 1, name: 'Item 1', description: 'Description for Item 1' },
      { id: 2, name: 'Item 2', description: 'Description for Item 2' },
    ]

    return response.json(items)
  }
}
