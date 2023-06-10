import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha'
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import * as cdk from 'aws-cdk-lib'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs'

const app = new cdk.App()

const prefix = 'rs-aws-product-service'

const stack = new cdk.Stack(app, `${prefix}-stack`, {
  description: `This stack includes resources needed to deploy ${prefix} application`,
  env: {
    region: 'eu-west-1',
  },
})

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION,
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
