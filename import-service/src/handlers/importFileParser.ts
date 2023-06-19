import { S3Event } from 'aws-lambda'
import AWS from 'aws-sdk'
import csvParser from 'csv-parser'
import internal from 'stream'

AWS.config.update({
  region: 'eu-west-1',
})

const s3 = new AWS.S3()

const parseStream = (stream: internal.Readable) => {
  return new Promise((resolve, reject) => {
    const result = []
    stream
      .pipe(csvParser())
      .on('data', (data) => {
        console.log('Parsed record: ', data)
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

  const s3MetaData = event.Records[0].s3
  const bucketName = s3MetaData.bucket.name
  const fileName = s3MetaData.object.key

  console.log('bucketName:', bucketName)
  console.log('fileName:', fileName)

  try {
    const readableStream = s3
      .getObject({ Bucket: bucketName, Key: fileName })
      .createReadStream()

    await parseStream(readableStream)
  } catch (error) {
    console.log('Error: ', error)
  }
}
