import { APIGatewayProxyEvent } from 'aws-lambda'
import { handler } from '../importProductsFile'

jest.mock('aws-sdk', () => {
  const mockGetSignedUrlPromise = jest
    .fn()
    .mockResolvedValue('https://s3.amazonaws.com/signed-url')

  return {
    S3: jest.fn(() => ({
      getSignedUrlPromise: mockGetSignedUrlPromise,
    })),
    config: {
      update: jest.fn(),
    },
  }
})

describe('Lambda Function', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('return a signed URL for the object upload', async () => {
    process.env.bucketName = 'your-bucket-name'
    const mockSignedUrl = 'https://s3.amazonaws.com/signed-url'
    const mockEvent = {
      queryStringParameters: {
        name: 'products.csv',
      },
    } as unknown as APIGatewayProxyEvent

    const response = await handler(mockEvent)

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).url).toBe(mockSignedUrl)
  })
})
