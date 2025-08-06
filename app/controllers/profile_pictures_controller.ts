import type { HttpContext } from '@adonisjs/core/http'
import path from 'node:path'
import fs from 'node:fs'
import app from '@adonisjs/core/services/app'
import User from '#models/user'
import UploadFilesController from './upload_files_controller.js'

export default class ProfilePicturesController {
  public static async update(url: string, user: User) {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to download image')

    const ext = path.extname(new URL(url).pathname).split('?')[0] || '.jpg'
    const fileName = `profile_${user.id}.${ext}`

    const buffer = Buffer.from(await res.arrayBuffer())

    const file = new File([buffer], fileName, { type: 'image/jpeg' })

    await UploadFilesController.uploadFile(file)

    user.profilePicture = `${fileName}`
    await user.save()

    return {
      message: 'Profile picture updated successfully',
      profilePictureUrl: user.profilePicture,
    }
  }

  async image(httpContext: HttpContext) {
    const user = await httpContext.auth.getUserOrFail()

    if (!user.profilePicture) {
      const filePath = path.join(app.makePath('public'), 'default-profile-picture.avif')
      if (!fs.existsSync(filePath)) {
        return httpContext.response.notFound({ message: 'Fichier non trouvé.' })
      }

      return httpContext.response.download(filePath)
    }

    return UploadFilesController.downloadFile(httpContext, user.profilePicture)
  }
}
