import AWS from 'aws-sdk'
import { constants as httpConstants } from 'http2'
import { createResponse } from '../utils/apiUtils'

AWS.config.update({
  region: 'eu-west-1',
})

const dynamodb = new AWS.DynamoDB.DocumentClient()

const getDynamodbItems = async (
  params: AWS.DynamoDB.DocumentClient.ScanInput
) => {
  let output: AWS.DynamoDB.DocumentClient.ScanOutput
  try {
    output = await dynamodb.scan(params).promise()
  } catch (error) {
    console.error('Error getting items:', error)
  }

  return output?.Items
}

export const handler = async () => {
  console.log('getProductsList called')

  try {
    const products = await getDynamodbItems({
      TableName: process.env.PRODUCTS_TABLE_NAME,
    })

    const stocks = await getDynamodbItems({
      TableName: process.env.STOCKS_TABLE_NAME,
    })

    const productList = products.map((product) => {
      const stock = stocks.find((stock) => stock.product_id === product.id)
      return { ...product, count: stock?.count || 0 }
    })

    return createResponse(httpConstants.HTTP_STATUS_OK, productList)
  } catch (error) {
    return createResponse(
      error.statusCode || httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
      { error: error.message }
    )
  }
}
