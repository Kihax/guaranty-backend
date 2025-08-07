import type { HttpContext } from '@adonisjs/core/http'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import User from '#models/user'
import { registerValidator } from '#validators/register'
import { loginValidator } from '#validators/login'
import VerifyEmailNotification from '#mails/verify_email_notification'
import EmailVerificationToken from '#models/email_verification_token'
import mail from '@adonisjs/mail/services/main'
import { Exception } from '@adonisjs/core/exceptions'
import crypto from 'node:crypto'
import PasswordResetToken from '#models/password_reset_token'
import ResetPasswordNotification from '#mails/reset_password_notification'
import ProfilePicturesController from './profile_pictures_controller.js'

export default class AuthController {
  public async register({ request }: HttpContext) {
    const data = await request.validateUsing(registerValidator)
    const user = await User.create(data)

    const token = await EmailVerificationToken.create({
      userId: user.id,
      token: randomUUID(),
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    await mail.send(new VerifyEmailNotification(user, token.token))

    const userToken = await User.accessTokens.create(user)

    return {
      message: 'Inscription réussie. Vérifiez votre email.',
      token: userToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified,
        profilePicture: user.profilePicture || 'default-profile-picture.avif',
      },
    }
  }

  public async login({ request }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    // 1. Vérifie si l’utilisateur existe
    const user = await User.findBy('email', email)
    if (!user) {
      throw new Exception('Email ou mot de passe invalide', { status: 401 })
    }

    // 2. Vérifie si l’email a été confirmé
    if (!user.emailVerified) {
      const token = await EmailVerificationToken.create({
        userId: user.id,
        token: randomUUID(),
        expiresAt: DateTime.now().plus({ hours: 24 }),
      })

      await mail.send(new VerifyEmailNotification(user, token.token))
      return {
        message: 'Adresse mail non vérifiée',
        token: token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          emailVerified: user.emailVerified,
          profilePicture: user.profilePicture || 'default-profile-picture.avif',
        },
      }
    }

    // 3. Vérifie le mot de passe
    const isPasswordValid = await user.verifyPassword(password)
    if (!isPasswordValid) {
      throw new Exception('Email ou mot de passe invalide', { status: 401 })
    }

    // 4. Génère un token JWT via AdonisJS Auth
    const token = await User.accessTokens.create(user)

    return {
      message: 'Connexion réussie',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified,
        profilePicture: user.profilePicture || 'default-profile-picture.avif',
      },
    }
  }

  public async logout({ auth: authCtx }: HttpContext) {
    // Invalidate the current access token
    await authCtx.use('api').invalidateToken()
    return {
      message: 'Déconnexion réussie',
    }
  }

  public async loginWithGoogle({ request, response }: HttpContext) {
    const { idToken } = request.only(['idToken'])

    try {
      const googleRes = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${idToken}`
      )
      if (!googleRes.ok) {
        throw new Error('Invalid token')
      }
      const data = await googleRes.json()
      const { email, name, picture } = data as { email: string; name: string; picture: string }

      const user = await User.firstOrCreate(
        { email },
        {
          fullName: name,
          password: crypto.randomUUID(),
          emailVerified: true,
          profilePicture: 'default-profile-picture.avif',
        }
      )
      // If the user does not have a profile picture, update it
      try {
        if (
          user.profilePicture === null ||
          user.profilePicture === '' ||
          user.profilePicture === undefined ||
          user.profilePicture === 'default-profile-picture.avif'
        ) {
          const profilePicture = await ProfilePicturesController.update(picture, user)
        }
      } catch (error) {
        console.error('Error updating profile picture:', error)
      }

      const token = await User.accessTokens.create(user)

      return {
        message: 'Connexion réussie',
        token: token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          emailVerified: user.emailVerified,
          profilePicture: user.profilePicture || 'default-profile-picture.avif',
        },
      }
    } catch (error) {
      return response.unauthorized({ message: 'Token Google invalide' })
    }
  }

  public async verifyEmail({ response, request }: HttpContext) {
    const token = request.input('token')

    if (!token) {
      return response.badRequest({ message: 'Token manquant' })
    }

    const verificationToken = await EmailVerificationToken.query()
      .where('token', token)
      .where('expiresAt', '>', DateTime.now().toJSDate())
      .first()

    if (!verificationToken) {
      return response.badRequest({ message: 'Token invalide ou expiré' })
    }

    const user = await User.findOrFail(verificationToken.userId)
    user.emailVerified = true
    await user.save()

    // Supprimer le token de vérification après utilisation
    await verificationToken.delete()

    return {
      message: 'Email vérifié avec succès',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    }
  }

  public async resendVerificationEmail({ auth: authCtx, response }: HttpContext) {
    const user = await authCtx.getUserOrFail()

    if (user.emailVerified) {
      return response.badRequest({ message: 'Email déjà vérifié' })
    }

    const token = await EmailVerificationToken.create({
      userId: user.id,
      token: randomUUID(),
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    await mail.send(new VerifyEmailNotification(user, token.token))

    return {
      message: 'Email de vérification renvoyé',
    }
  }

  public async forgotPassword({ request, response }: HttpContext) {
    const { email } = request.only(['email'])

    const user = await User.findBy('email', email)
    if (!user) {
      return response.notFound({ message: 'Utilisateur non trouvé' })
    }

    const token = crypto.randomBytes(32).toString('hex')

    // Générer un token de réinitialisation
    await PasswordResetToken.create({
      userId: user.id,
      token,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })
    // Envoyer l'email avec le lien de réinitialisation
    await mail.send(new ResetPasswordNotification(user, token))

    return {
      message: 'Email de réinitialisation envoyé',
    }
  }

  public async resetPassword({ request, response }: HttpContext) {
    const { token, newPassword } = request.only(['token', 'newPassword'])

    const resetToken = await PasswordResetToken.query()
      .where('token', token)
      .where('expiresAt', '>', DateTime.now().toJSDate())
      .first()

    if (!resetToken) {
      return response.badRequest({ message: 'Token invalide ou expiré' })
    }

    const user = await User.findOrFail(resetToken.userId)
    user.password = newPassword
    await user.save()

    // Supprimer le token de réinitialisation après utilisation
    await resetToken.delete()

    return {
      message: 'Mot de passe réinitialisé avec succès',
    }
  }
}
