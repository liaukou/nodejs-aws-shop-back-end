import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'
import { constants as httpConstants } from 'http2'
import { createResponse } from '../utils/apiUtils'
import { createProduct } from './createProduct'

const region = process.env.PRODUCT_AWS_REGION

const client = new SNSClient({ region })

export const handler = async (event) => {
  console.log('catalogBatchProcess called with event:', event)

  try {
    const records = event.Records
    for (const record of records) {
      const items = await createProduct(record.body)

      client.send(
        new PublishCommand({
          Subject: 'New files added to catalog',
          Message: JSON.stringify(items.product),
          TopicArn: process.env.IMPORT_PRODUCTS_TOPIC_ARN,
          MessageAttributes: {
            count: {
              DataType: 'Number',
              StringValue: items.stock.count.toString(),
            },
          },
        })
      )
    }

    return createResponse(httpConstants.HTTP_STATUS_OK, records)
  } catch (error) {
    return createResponse(
      error.statusCode || httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
      { error: error.message }
    )
  }
}
