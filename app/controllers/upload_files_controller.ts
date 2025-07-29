import type { HttpContext } from '@adonisjs/core/http'
import drive from '@adonisjs/drive/services/main'

export default class UploadFilesController {
  public static async uploadFile(file: File) {
    const disk = drive.use('spaces')

    // Read the file as a buffer
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)

    // Upload the file to the specified disk
    await disk.put(file.name, uint8Array, {
      visibility: 'public',
      contentType: file.type,
    })

    // Return the URL of the uploaded file
    return disk.getUrl(file.name)
  }

  public static async downloadFile({ response }: HttpContext, fileName: string) {
    const disk = drive.use('spaces')
    const file = await disk.get(fileName)
    if (!file) {
      return response.notFound({ message: 'File not found' })
    }
    const fileMetaData = await disk.getMetaData(fileName)

    console.log(fileMetaData)
    response.send(file)
  }
}
