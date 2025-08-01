import { BaseSchema } from '@adonisjs/lucid/schema'

export default class WarrantyTickets extends BaseSchema {
  protected tableName = 'warranty_tickets'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('product_name').nullable()
      table.string('brand').nullable()
      table.date('purchase_date').nullable()
      table.integer('warranty_duration_months').nullable()
      table.date('warranty_expiry_date').nullable()
      table.string('serial_number').nullable()
      table.string('purchase_location').nullable()
      table.string('warranty_type').nullable()
      table.string('receipt_url').nullable()
      table.text('notes').nullable()
      table.string('customer_service_contact').nullable()
      table.timestamps(true, true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
