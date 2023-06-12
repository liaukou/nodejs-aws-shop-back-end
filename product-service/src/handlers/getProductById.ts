import { APIGatewayProxyEvent } from 'aws-lambda'
import AWS from 'aws-sdk'
import { constants as httpConstants } from 'http2'
import { createResponse } from '../utils/apiUtils'

AWS.config.update({
  region: 'eu-west-1',
})

const dynamodb = new AWS.DynamoDB.DocumentClient()

const getDynamodbItem = async (params: AWS.DynamoDB.DocumentClient.QueryInput) => {
  let output: AWS.DynamoDB.DocumentClient.QueryOutput
  try {
    output = await dynamodb.query(params).promise()
  } catch (error) {
    console.error('Error getting item:', error)
  }

  return output?.Items
}

export const handler = async (event: APIGatewayProxyEvent) => {
  const { productId } = event.pathParameters || {}

  try {
    const products = await getDynamodbItem({
      TableName: process.env.PRODUCTS_TABLE_NAME,
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: { ':id': productId },
    })
    const stocks = await getDynamodbItem({
      TableName: process.env.STOCKS_TABLE_NAME,
      KeyConditionExpression: 'product_id = :product_id',
      ExpressionAttributeValues: { ':product_id': productId },
    })

    if (!products || !products[0]) {
      return createResponse(
        httpConstants.HTTP_STATUS_NOT_FOUND,
        'Product with provided productId not found'
      )
    }

    const product = { ...products[0], count: stocks[0]?.count || 0 }

    return createResponse(httpConstants.HTTP_STATUS_OK, product)
  } catch (error) {
    return createResponse(
      error.statusCode || httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
      { error: error.message }
    )
  }
}
