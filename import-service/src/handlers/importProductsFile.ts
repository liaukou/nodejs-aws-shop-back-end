import { APIGatewayProxyEvent } from 'aws-lambda'
import AWS from 'aws-sdk'
import { PutObjectRequest } from 'aws-sdk/clients/s3'
import { constants as httpConstants } from 'http2'
import { createResponse } from '../utils/apiUtils'

AWS.config.update({
  region: 'eu-west-1',
})

const s3 = new AWS.S3()

export const handler = async (event: APIGatewayProxyEvent) => {
  const fileName = event.queryStringParameters?.name || 'products'
  const bucketName = process.env.bucketName
  const objectKey = `uploaded/${fileName}`

  try {
    const putParams: PutObjectRequest = {
      Bucket: bucketName,
      Key: objectKey,
      Body: 'Temp content',
    }

    const params = {
      Bucket: bucketName,
      Key: objectKey,
      Expires: 600,
    }

    await s3.putObject(putParams).promise()
    const url = await s3.getSignedUrlPromise('getObject', params)

    console.log('importProductsFile file is written successfully')

    return createResponse(httpConstants.HTTP_STATUS_OK, { url })
  } catch (error) {
    return createResponse(
      error.statusCode || httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
      { error: error.message }
    )
  }
}
