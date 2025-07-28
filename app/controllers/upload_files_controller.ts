import type { HttpContext } from '@adonisjs/core/http'
import drive from '@adonisjs/drive/services/main'

export default class UploadFilesController {
  public static async uploadFile(file: File) {


    drive
      .use('spaces')
      .put(file.name, file.stream, {
        visibility: 'public',
        contentType: file.type,
      })
      .then(() => {
        console.log(`File uploaded successfully: ${file.name}`)
      })
      .catch((error: any) => {
        console.error(`Error uploading file: ${error.message}`)
      })
  }

  public static async downloadFile({ response }: HttpContext, fileName: string) {
    const file = await drive.use('spaces').get(fileName)
    if (!file) {
      return response.notFound({ message: 'File not found' })
    }
    response.header('Content-Disposition', `attachment; filename="${fileName}"`)
    response.header('Content-Type', file.type)
    response.send(file.content)
  }
}
