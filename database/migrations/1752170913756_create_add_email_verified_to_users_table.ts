import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddEmailVerifiedToUsers extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('email_verified').defaultTo(false) // Ajoute la colonne avec valeur par défaut false
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('email_verified') // Supprime la colonne si rollback
    })
  }
}