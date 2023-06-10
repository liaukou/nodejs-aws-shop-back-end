import { constants as httpConstants } from 'http2'
import { getProducts } from '../db'
import { createResponse } from '../utils/apiUtils'

export const handler = async () => {
  try {
    const productList = (await getProducts()) || []

    return createResponse(httpConstants.HTTP_STATUS_OK, productList)
  } catch (error) {
    return createResponse(
      error.statusCode || httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
      { error: error.message }
    )
  }
}
