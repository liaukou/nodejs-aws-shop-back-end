import prducts from './products.json'

export const getProducts = async () => prducts

export const getProductById = async (id: string) =>
  prducts.find((product) => product.id === id)
