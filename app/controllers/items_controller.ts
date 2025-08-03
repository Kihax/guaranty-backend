import type { HttpContext } from '@adonisjs/core/http'
import WarrantyTicket from '#models/warranty_ticket'
import { createWarrantyTicketValidator } from '#validators/create_warranty_ticket'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon' // Adonis utilise luxon pour les dates
import UploadFilesController from './upload_files_controller.js'
import fs from 'node:fs'

export default class ItemsController {
  async getAllItems({ response, auth }: HttpContext) {
    const user = auth.user! // récupère l'utilisateur authentifié

    const tickets = await WarrantyTicket.query()
      .where('user_id', user.id)
      .orderBy('purchaseDate', 'desc')

    return response.json(tickets)
  }

  async update({ request, auth, response, params }: HttpContext) {
    const user = await auth.getUserOrFail()
    const ticket = await WarrantyTicket.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    const payload = await vine.validate({
      schema: createWarrantyTicketValidator,
      data: request.all(),
    })
    const { purchase_date: purchaseDate } = payload

    const warrantyExpiryDate = DateTime.fromJSDate(purchaseDate).plus({
      months: payload.warranty_duration_months,
    })
    const purchaseDateLuxon = DateTime.fromJSDate(purchaseDate)

    const receipt = request.file('receipt', {
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'pdf'],
    })

    if (receipt) {
      if (!receipt.isValid) {
        return response.badRequest({ errors: receipt.errors })
      }
      const extension = receipt.extname || 'jpg'
      const fileName = `ticket-${ticket.id}.${extension}`
      ticket.receiptUrl = fileName

      // Read file buffer from tmpPath
      const buffer = fs.readFileSync(receipt.tmpPath!)
      const file = new File([buffer], fileName, { type: receipt.type })
      await UploadFilesController.uploadFile(file)
    }

    if (payload.product_name) ticket.productName = payload.product_name
    if (payload.serial_number) ticket.serialNumber = payload.serial_number
    if (purchaseDateLuxon) ticket.purchaseDate = purchaseDateLuxon
    if (payload.warranty_duration_months)
      ticket.warrantyDurationMonths = payload.warranty_duration_months
    if (warrantyExpiryDate) ticket.warrantyExpiryDate = warrantyExpiryDate
    if (payload.warranty_type) ticket.warrantyType = payload.warranty_type
    if (payload.purchase_location) ticket.purchaseLocation = payload.purchase_location
    if (payload.notes) ticket.notes = payload.notes

    await ticket.save()

    return ticket
  }

  async image(httpContext: HttpContext) {
    const user = await httpContext.auth.getUserOrFail()
    const { id } = httpContext.params

    // Vérifie que l'utilisateur est bien le propriétaire du ticket
    const ticket = await WarrantyTicket.find(id)

    if (!ticket || ticket.userId !== user.id) {
      return httpContext.response.unauthorized({ message: 'Accès interdit ou ticket inexistant.' })
    }

    if (!ticket.receiptUrl) {
      return httpContext.response.notFound({ message: 'Aucun ticket de caisse associé.' })
    }

    UploadFilesController.downloadFile(httpContext, ticket.receiptUrl)
  }

  async store({ request, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const payload = await vine.validate({
      schema: createWarrantyTicketValidator,
      data: request.all(),
    })
    const { purchase_date: purchaseDate, ...restPayload } = payload

    const warrantyExpiryDate = DateTime.fromJSDate(purchaseDate).plus({
      months: payload.warranty_duration_months,
    })
    const purchaseDateLuxon = DateTime.fromJSDate(purchaseDate)

    if (warrantyExpiryDate <= DateTime.now()) {
      return response.badRequest({
        errors: [
          {
            field: 'warrantyExpiryDate',
            message: "La date d'expiration doit être inférieur à aujourd'hui",
          },
        ],
      })
    }

    const receipt = request.file('receipt', {
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'pdf'],
    })

    if (!receipt) {
      return response.badRequest({
        errors: [{ field: 'receipt', message: 'Le ticket de caisse est requis.' }],
      })
    }

    if (!receipt.isValid) {
      return response.badRequest({ errors: receipt.errors })
    }

    // ✅ Étape 1 : Créer le ticket sans le fichier
    const ticket = await WarrantyTicket.create({
      ...restPayload,
      userId: user.id,
      warrantyExpiryDate,
      purchaseDate: purchaseDateLuxon,
    })

    const extension = receipt.extname || 'jpg'
    const fileName = `ticket-${ticket.id}.${extension}`

    // Read file buffer from tmpPath
    const buffer = fs.readFileSync(receipt.tmpPath!)
    const file = new File([buffer], fileName, { type: receipt.type })
    await UploadFilesController.uploadFile(file)
    ticket.receiptUrl = fileName

    await ticket.save()

    return response.created(ticket)
  }

  async get({ params, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const { id } = params

    // Vérifie que l'utilisateur est bien le propriétaire du ticket
    const ticket = await WarrantyTicket.query()
      .where('id', id)
      .where('user_id', user.id)
      .firstOrFail()

    return response.json(ticket)
  }
}
