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

    return {
      message: 'Inscription réussie. Vérifiez votre email.',
    }
  }

  public async login({ request, response, auth }: HttpContext) {
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
      throw new Exception('Adresse e-mail non vérifiée', { status: 403 })
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
      },
    }
  }

  public async logout({ auth }: HttpContext) {
    // Invalidate the current access token
    await auth.use('api').invalidateToken()
    return {
      message: 'Déconnexion réussie',
    }
  }

  public async verifyEmail({ request, response }: HttpContext) {
    const token = request.input('token')
    const verificationToken = await EmailVerificationToken.query()
      .where('token', token)
      .where('expiresAt', '>', DateTime.now())
      .first()

    if (!verificationToken) {
      throw new Exception('Token de vérification invalide ou expiré', { status: 400 })
    }

    const user = await User.find(verificationToken.userId)
    if (!user) {
      throw new Exception('Utilisateur non trouvé', { status: 404 })
    }

    user.emailVerified = true
    await user.save()

    // Supprimer le token de vérification après utilisation
    await verificationToken.delete()

    return {
      message: 'Adresse e-mail vérifiée avec succès',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    }
  }
}
