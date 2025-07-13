import { BaseMail } from '@adonisjs/mail'
import User from '#models/user'
import edge from 'edge.js'

export default class VerifyEmailNotification extends BaseMail {
  from = 'guaranty.open@gmail.com'
  subject = 'Confirmez votre adresse e-mail'

  constructor(
    private user: User,
    private token: string
  ) {
    super()
  }

  async prepare() {
    const verificationUrl = `http://localhost:3333/verify-email?token=${this.token}`

    const html = await edge.render('emails/verify_email', {
      user: this.user,
      url: verificationUrl,
    })

    this.message.to(this.user.email).subject(this.subject).html(html)
  }
}
