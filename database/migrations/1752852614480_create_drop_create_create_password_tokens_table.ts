import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'create_password_tokens'

  async up() {
    this.schema.dropTable(this.tableName)
  }

  async down() {}
}
