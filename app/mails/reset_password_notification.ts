import { BaseMail } from '@adonisjs/mail'
import User from '#models/user'
import edge from 'edge.js'
import Env from '#start/env'

export default class ResetPasswordNotification extends BaseMail {
  from = 'guaranty.open@gmail.com'
  subject = 'Réinitialisation du mot de passe'

  constructor(
    private user: User,
    private token: string
  ) {
    super()
  }

  /**
   * The "prepare" method is called automatically when
   * the email is sent or queued.
   */
  async prepare() {
    const verificationUrl = `${Env.get('APP_URL')}/auth/reset-password?token=${this.token}`

    const html = await edge.render('emails/reset_password', {
      user: this.user,
      url: verificationUrl,
    })

    this.message.to(this.user.email).subject(this.subject).html(html)
  }
}
