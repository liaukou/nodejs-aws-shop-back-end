import { APIGatewayProxyEvent } from 'aws-lambda'
import AWS from 'aws-sdk'
import { constants as httpConstants } from 'http2'
import { createResponse } from '../utils/apiUtils'

AWS.config.update({
  region: 'eu-west-1',
})

const s3 = new AWS.S3()

export const handler = async (event: APIGatewayProxyEvent) => {
  const fileName = event.queryStringParameters?.name || 'products.csv'
  const bucketName = process.env.bucketName
  const objectKey = `uploaded/${fileName}`

  try {
    const params = {
      Bucket: bucketName,
      Key: objectKey,
      Expires: 600,
      ContentType: 'text/csv',
    }

    const url = await s3.getSignedUrlPromise('putObject', params)

    return createResponse(httpConstants.HTTP_STATUS_OK, { url })
  } catch (error) {
    return createResponse(
      error.statusCode || httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
      { error: error.message }
    )
  }
}
