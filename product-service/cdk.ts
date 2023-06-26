import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha'
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import dotenv from 'dotenv'
import { productsTableName, stocksTableName } from './src/db'

dotenv.config()

const app = new cdk.App()

const prefix = 'rs-aws-product-service'

const stack = new cdk.Stack(app, `${prefix}-stack`, {
  description: `This stack includes resources needed to deploy ${prefix} application`,
  env: {
    region: 'eu-west-1',
  },
})

const productsTable = dynamodb.Table.fromTableArn(
  stack,
  'productsTable',
  process.env.PRODUCTS_TABLE_ARN
)
const stocksTable = dynamodb.Table.fromTableArn(
  stack,
  'stocksTable',
  process.env.STOCKS_TABLE_ARN
)

const importProductTopic = new sns.Topic(
  stack,
  `${prefix}-import-product-topic`,
  {
    topicName: 'import-product-topic',
  }
)

const importQueue = new sqs.Queue(stack, `${prefix}-import-queue`, {
  queueName: 'import-file-queue',
})

new sns.Subscription(stack, `${prefix}-stock-subscription`, {
  protocol: sns.SubscriptionProtocol.EMAIL,
  endpoint: process.env.STOCK_EMAIL,
  topic: importProductTopic,
})

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION,
    PRODUCTS_TABLE_NAME: productsTableName,
    STOCKS_TABLE_NAME: stocksTableName,
    IMPORT_PRODUCTS_TOPIC_ARN: importProductTopic.topicArn,
  },
}

const getProductsList = new NodejsFunction(
  stack,
  `${prefix}-getProductsList-lambda`,
  {
    ...sharedLambdaProps,
    functionName: 'getProductsList',
    entry: 'src/handlers/getProductsList.ts',
  }
)

const getProductById = new NodejsFunction(
  stack,
  `${prefix}-getProductById-lambda`,
  {
    ...sharedLambdaProps,
    functionName: 'getProductById',
    entry: 'src/handlers/getProductById.ts',
  }
)

const createProduct = new NodejsFunction(
  stack,
  `${prefix}-createProduct-lambda`,
  {
    ...sharedLambdaProps,
    functionName: 'createProduct',
    entry: 'src/handlers/createProduct.ts',
  }
)

const catalogBtachProcess = new NodejsFunction(
  stack,
  `${prefix}-catalogBtachProcess-lambda`,
  {
    ...sharedLambdaProps,
    functionName: 'catalogBtachProcess',
    entry: 'src/handlers/catalogBatchProcess.ts',
  }
)

productsTable.grantReadData(getProductsList)
stocksTable.grantReadData(getProductsList)

productsTable.grantReadData(getProductById)
stocksTable.grantReadData(getProductById)

productsTable.grantFullAccess(createProduct)
stocksTable.grantFullAccess(createProduct)

productsTable.grantFullAccess(catalogBtachProcess)
stocksTable.grantFullAccess(catalogBtachProcess)

importProductTopic.grantPublish(catalogBtachProcess)

catalogBtachProcess.addEventSource(
  new SqsEventSource(importQueue, { batchSize: 5 })
)

const api = new apigatewayv2.HttpApi(stack, `${prefix}-api`, {
  corsPreflight: {
    allowHeaders: ['*'],
    allowOrigins: ['*'],
    allowMethods: [apigatewayv2.CorsHttpMethod.ANY],
  },
})

api.addRoutes({
  integration: new HttpLambdaIntegration(
    `${prefix}-getProductsList-lambda-integration`,
    getProductsList
  ),
  path: '/products',
  methods: [apigatewayv2.HttpMethod.GET],
})

api.addRoutes({
  integration: new HttpLambdaIntegration(
    `${prefix}-getProductById-lambda-integration`,
    getProductById
  ),
  path: '/products/{productId}',
  methods: [apigatewayv2.HttpMethod.GET],
})

api.addRoutes({
  integration: new HttpLambdaIntegration(
    `${prefix}-createProduct-lambda-integration`,
    createProduct
  ),
  path: '/products',
  methods: [apigatewayv2.HttpMethod.POST],
})
