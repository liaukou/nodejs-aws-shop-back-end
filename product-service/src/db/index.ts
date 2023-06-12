import prducts from './products.json'

export type Product = {
  id: string
  title: string
  description: string
  price: number
}

export type Stock = {
  product_id: string
  count: number
}

export const getProducts = async () => prducts

export const getProductById = async (id: string) =>
  prducts.find((product) => product.id === id)
