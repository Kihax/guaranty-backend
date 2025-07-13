import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .unique(async (db, value) => {
        const exists = await db.from('users').where('email', value).first()
        return !exists
      }),
    password: vine
      .string()
      .minLength(8)
      .regex(/^(?=.*[A-Z])(?=.*\d).*/),
  })
)
