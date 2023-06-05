import { APIGatewayProxyEvent } from 'aws-lambda'
import { constants as httpConstants } from 'http2'
import { getProductById } from '../db'
import { createResponse } from '../utils/apiUtils'

export const handler = async (event: APIGatewayProxyEvent) => {
  const { productId } = event.pathParameters || {}
  try {
    const product = await getProductById(productId)

    if (product) return createResponse(httpConstants.HTTP_STATUS_OK, product)

    return createResponse(
      httpConstants.HTTP_STATUS_NOT_FOUND,
      'Product with provided productId not found'
    )
  } catch (error) {
    return createResponse(
      error.statusCode || httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
      { error: error.message }
    )
  }
}
