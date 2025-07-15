import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'update_warranties' // nom de la mauvaise table

  public async up () {
    this.schema.dropTable(this.tableName)
  }

  public async down () {
  }
}