import { constants as httpConstants } from 'http2'
import products from '../../db/products.json'
import { handler as getProductsList } from '../getProductsList'

describe('getProducts', () => {
  it('return mocked productsList', async () => {
    // arrange
    const { body, statusCode } = await getProductsList()

    // act
    const result = JSON.parse(body)

    // assert
    expect(result).toEqual(products)
    expect(statusCode).toBe(httpConstants.HTTP_STATUS_OK)
  })
})
