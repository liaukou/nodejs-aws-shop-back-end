import { APIGatewayProxyEvent } from 'aws-lambda'
import { constants as httpConstants } from 'http2'
import { handler as getProductById } from '../getProductById'

describe('getProductById', () => {
  it('return "not found message"', async () => {
    // arrange
    const event = {
      pathParameters: { productId: 'non existing id' },
    } as unknown as APIGatewayProxyEvent
    const { body, statusCode } = await getProductById(event)

    // act
    const result = JSON.parse(body)

    // assert
    expect(result).toStrictEqual('Product with provided productId not found')
    expect(statusCode).toBe(httpConstants.HTTP_STATUS_NOT_FOUND)
  })

  it('return founded product', async () => {
    // arrange
    const event = {
      pathParameters: { productId: '1' },
    } as unknown as APIGatewayProxyEvent

    const { body, statusCode } = await getProductById(event)

    // act
    const result = JSON.parse(body)

    // assert
    expect(result).toStrictEqual({
      id: '1',
      title: 'product 1',
      description: '',
      price: 11,
    })
    expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })
})
