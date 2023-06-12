import AWS from 'aws-sdk'
import { Product, Stock } from '../src/db'
import products from '../src/db/products.json'
import stocks from '../src/db/stocks.json'

AWS.config.update({
  region: 'eu-west-1',
})

const dynamodb = new AWS.DynamoDB()

const productsTableName = 'rs-aws-products'
const stocksTableName = 'rs-aws-stocks'

async function addProduct(product: Product) {
  const params: AWS.DynamoDB.PutItemInput = {
    TableName: productsTableName,
    Item: {
      id: { S: product.id },
      title: { S: product.title },
      description: { S: product.description },
      price: { N: product.price.toString() },
    },
  }

  try {
    await dynamodb.putItem(params).promise()
    console.log('Product added successfully:', product.title)
  } catch (error) {
    console.error('Error adding product:', product.title, error)
  }
}

async function addStok(stock: Stock) {
  const params: AWS.DynamoDB.PutItemInput = {
    TableName: stocksTableName,
    Item: {
      product_id: { S: stock.product_id },
      count: { N: stock.count.toString() },
    },
  }

  try {
    await dynamodb.putItem(params).promise()
    console.log('Stock added successfully:', stock.product_id)
  } catch (error) {
    console.error('Error adding stock:', stock.product_id, error)
  }
}

products.forEach((product) => {
  addProduct(product)
})

stocks.forEach((stock) => {
  addStok(stock)
})
