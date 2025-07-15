import vine from '@vinejs/vine'

export const createWarrantyTicketValidator = vine.object({
  product_name: vine.string().trim().minLength(2).maxLength(100),
  brand: vine.string().trim().maxLength(50),
  purchase_date: vine.date(),
  warranty_duration_months: vine.number().min(0).max(120),
  warranty_expiry_date: vine.date().optional(),
  serial_number: vine.string().trim().maxLength(100).optional(),
  purchase_location: vine.string().trim().maxLength(100).optional(),
  warranty_type: vine.enum(['constructeur', 'magasin'] as const).optional(),
  notes: vine.string().trim().maxLength(500).optional(),
  customer_service_contact: vine.string().trim().maxLength(100).optional(),
})
