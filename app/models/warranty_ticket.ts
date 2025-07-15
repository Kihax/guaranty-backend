import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class WarrantyTicket extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare productName?: string | null

  @column()
  declare brand?: string | null

  @column.date()
  declare purchaseDate?: DateTime | null

  @column()
  declare warrantyDurationMonths?: number | null

  @column.date()
  declare warrantyExpiryDate?: DateTime

  @column()
  declare serialNumber?: string | null

  @column()
  declare purchaseLocation?: string | null

  @column()
  declare warrantyType?: string | null

  @column()
  declare receiptUrl?: string | null

  @column()
  declare notes?: string | null

  @column()
  declare customerServiceContact?: string | null
}
