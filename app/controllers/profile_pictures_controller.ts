import type { HttpContext } from '@adonisjs/core/http'
import path from 'node:path'
import fs from 'node:fs'
import app from '@adonisjs/core/services/app'

export default class ProfilePicturesController {
  public static async update(url: string, auth: any) {
    const user = auth.user
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to download image')

    const ext = path.extname(new URL(url).pathname).split('?')[0] || '.jpg'
    const fileName = `profile_${user.id}_${Date.now()}${ext}`
    const uploadDir = app.makePath('uploads/profile-pictures')

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    const filePath = path.join(uploadDir, fileName)
    await fs.promises.writeFile(filePath, buffer)

    user.profilePicture = `uploads/profile-pictures/${fileName}`
    await user.save()

    return {
      message: 'Profile picture updated successfully',
      profilePictureUrl: user.profilePicture,
    }
  }

  async image({ response, auth }: HttpContext) {
    const user = await auth.getUserOrFail()

    if (!user.profilePicture) {
      const filePath = path.join(app.makePath('public'), 'default-profile-picture.avif')
      if (!fs.existsSync(filePath)) {
        return response.notFound({ message: 'Fichier non trouvé.' })
      }

      return response.download(filePath)
    }

    // Chemin absolu du fichier
    const filePath = path.join(app.makePath('public'), user.profilePicture)

    if (!fs.existsSync(filePath)) {
      return response.notFound({ message: 'Fichier non trouvé.' })
    }

    return response.download(filePath)
  }
}
