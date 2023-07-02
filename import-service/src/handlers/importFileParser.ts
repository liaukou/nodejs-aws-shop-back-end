import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import { S3Event } from 'aws-lambda'
import AWS from 'aws-sdk'
import csvParser from 'csv-parser'
import internal from 'stream'

const region = process.env.PRODUCT_AWS_REGION

AWS.config.update({
  region,
})

const s3 = new AWS.S3()

const client = new SQSClient({ region })

const parseStream = (stream: internal.Readable, onData: (data) => void) => {
  return new Promise((resolve, reject) => {
    const result = []
    stream
      .pipe(csvParser())
      .on('data', (data) => {
        console.log('Parsed record: ', data)
        onData(data)
        result.push(data)
      })
      .on('error', (error: any) => {
        console.error('Error occurred during parsing: ', error)
        reject(error)
      })
      .on('end', () => {
        console.log('Parsing completed.')
        resolve(result)
      })
  })
}

export const handler = async (event: S3Event) => {
  console.log('Received event:', JSON.stringify(event, null, 2))

  try {
    for (let record of event.Records) {
      const s3MetaData = record.s3
      const bucketName = s3MetaData.bucket.name
      const objectKey = s3MetaData.object.key
      const destinationKey = objectKey.replace('uploaded/', 'parsed/')

      const readableStream = s3
        .getObject({ Bucket: bucketName, Key: objectKey })
        .createReadStream()

      const onData = (data) => {
        client.send(
          new SendMessageCommand({
            QueueUrl: process.env.importSqsUrl,
            MessageBody: JSON.stringify(data),
          })
        )
      }

      await parseStream(readableStream, onData)

      await s3
        .copyObject({
          Bucket: bucketName,
          CopySource: `${bucketName}/${objectKey}`,
          Key: destinationKey,
        })
        .promise()

      await s3
        .deleteObject({
          Bucket: bucketName,
          Key: objectKey,
        })
        .promise()

      console.log('File moved successfully.')
    }
  } catch (error) {
    console.log('Error: ', error)
  }
}
