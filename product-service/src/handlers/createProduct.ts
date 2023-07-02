import { APIGatewayProxyEvent } from 'aws-lambda'
import AWS from 'aws-sdk'
import { constants as httpConstants } from 'http2'
import { v4 as uuidv4 } from 'uuid'
import { createResponse } from '../utils/apiUtils'

const invalidProduct = 'Product data is invalid'

AWS.config.update({
  region: 'eu-west-1',
})

const dynamodb = new AWS.DynamoDB.DocumentClient()

const createItemsFromBody = (body: string) => {
  const bodyItem = JSON.parse(body)

  if (!bodyItem.description || !bodyItem.title) return

  const id = uuidv4()

  return {
    product: {
      id,
      title: bodyItem.title,
      description: bodyItem.description,
      price: +bodyItem.price || 0,
    },
    stock: { product_id: id, count: +bodyItem.count || 0 },
  }
}

export const createProduct = async (body: string) => {
  try {
    const items = createItemsFromBody(body)

    if (!items) {
      throw new Error(invalidProduct)
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

    await dynamodb
      .transactWrite({
        TransactItems: transactItems,
      })
      .promise()

    return items
  } catch (error) {
    throw new Error(error)
  }
}

export const handler = async (event: APIGatewayProxyEvent) => {
  const body = event.body

  console.log('createProduct called with body', body)

  try {
    const items = await createProduct(body)

    return createResponse(httpConstants.HTTP_STATUS_OK, items)
  } catch (error) {
    let code: number
    if (error.message === invalidProduct) {
      code = httpConstants.HTTP_STATUS_BAD_REQUEST
    }
    return createResponse(
      error.statusCode ||
        code ||
        httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
      { error: error.message }
    )
  }
}
