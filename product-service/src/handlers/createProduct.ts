import { APIGatewayProxyEvent } from 'aws-lambda'
import AWS from 'aws-sdk'
import { constants as httpConstants } from 'http2'
import { createResponse } from '../utils/apiUtils'

AWS.config.update({
  region: 'eu-west-1',
})

const dynamodb = new AWS.DynamoDB.DocumentClient()

const createItemsFromBody = (body: string) => {
  const bodyItem = JSON.parse(body)

  if (!bodyItem.id || !bodyItem.title) return

  return {
    product: {
      id: bodyItem.id,
      title: bodyItem.title,
      description: bodyItem.description || '',
      price: bodyItem.price || 0,
    },
    stock: { product_id: bodyItem.id, count: bodyItem.count || 0 },
  }
}

export const handler = async (event: APIGatewayProxyEvent) => {
  const body = event.body

  console.log('createProduct called with body', body)

  try {
    const items = createItemsFromBody(body)

    if (!items) {
      return createResponse(
        httpConstants.HTTP_STATUS_BAD_REQUEST,
        'Product data is invalid'
      )
    }

    const transactItems = [
      {
        Put: {
          TableName: process.env.PRODUCTS_TABLE_NAME,
          Item: items.product,
        },
      },
      {
        Put: {
          TableName: process.env.STOCKS_TABLE_NAME,
          Item: items.stock,
        },
      },
    ]

    await dynamodb.transactWrite({
      TransactItems: transactItems,
    }).promise()

    return createResponse(httpConstants.HTTP_STATUS_OK, items)
  } catch (error) {
    return createResponse(
      error.statusCode || httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
      { error: error.message }
    )
  }
}
