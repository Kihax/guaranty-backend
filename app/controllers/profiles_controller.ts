import type { HttpContext } from '@adonisjs/core/http'
import fs from 'node:fs'
import UploadFilesController from './upload_files_controller.js'

export default class ProfilesController {
  public async getUser({ auth: authCtx }: HttpContext) {
    const user = await authCtx.getUserOrFail()
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      emailVerified: user.emailVerified,
    }
  }

  public async updateProfile({ request, auth: authCtx, response }: HttpContext) {
    const user = await authCtx.getUserOrFail()
    const data = request.only(['fullName'])

    const image = request.file('profileImage', {
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'pdf'],
    })

    if (image) {
      if (!image.isValid) {
        return response.badRequest({ errors: image.errors })
      }

      // Vérifie si l'image est valide
      const ext = image.extname || 'jpg'
      const fileName = `profile_${user.id}.${ext}`

      // Read file buffer from tmpPath
      const buffer = fs.readFileSync(image.tmpPath!)
      const file = new File([buffer], fileName, { type: image.type })
      await UploadFilesController.uploadFile(file)
      user.profilePicture = fileName
    }

    user.fullName = data.fullName || user.fullName
    await user.save()

    return {
      message: 'Profil mis à jour avec succès',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        profilePicture: user.profilePicture || 'default-profile-picture.avif',
      },
    }
  }

  public async delete({ auth: authCtx, request }: HttpContext) {
    const user = await authCtx.getUserOrFail()
    const data = request.only(['password'])
    if (!user.verifyPassword(data.password)) {
      return {
        message: 'Mot de passe incorrect',
      }
    }

    await user.delete()
    return {
      message: 'Profil supprimé avec succès',
    }
  }
}
