import type { HttpContext } from '@adonisjs/core/http'
import AWS from 'aws-sdk'

export default class UploadFilesController {
  public static async uploadFile(file: File) {
    const s3 = new AWS.S3({
      endpoint: process.env.SPACES_ENDPOINT,
      accessKeyId: process.env.SPACES_KEY,
      secretAccessKey: process.env.SPACES_KEY_SECRET,
      signatureVersion: 'v4',
    })

    const params = {
      Bucket: process.env.SPACES_NAME!,
      Key: file.name,
      Body: await file.arrayBuffer(),
      ACL: 'private',
    }

    try {
      const data = await s3.upload(params).promise()
      return data.Location
    } catch (error) {
      throw new Error(`File upload failed: ${error.message}`)
    }
  }

  public static async downloadFile({ response }: HttpContext, fileName: string) {
    const s3 = new AWS.S3({
      endpoint: process.env.SPACES_ENDPOINT,
      accessKeyId: process.env.SPACES_KEY,
      secretAccessKey: process.env.SPACES_KEY_SECRET,
      signatureVersion: 'v4',
    })

    const params = {
      Bucket: process.env.SPACES_NAME!,
      Key: fileName,
    }

    try {
      const url = s3.getSignedUrl('getObject', params)
      return response.redirect(url)
    } catch (error) {
      return response.notFound({ message: `File not found: ${error.message}` })
    }
  }
}
