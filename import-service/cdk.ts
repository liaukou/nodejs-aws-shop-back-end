import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha'
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import * as cdk from 'aws-cdk-lib'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs'
import * as s3 from 'aws-cdk-lib/aws-s3'

const app = new cdk.App()

const prefix = 'rs-aws-import-service'

const bucketName = `${prefix}-bucket`

const stack = new cdk.Stack(app, `${prefix}-stack`, {
  description: `This stack includes resources needed to deploy ${prefix} application`,
  env: {
    region: 'eu-west-1',
  },
})

const bucket = s3.Bucket.fromBucketName(stack, `${prefix}-bucket`, bucketName)

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION,
    bucketName,
  },
}

const importProductsFile = new NodejsFunction(
  stack,
  `${prefix}-importProductsFile-lambda`,
  {
    ...sharedLambdaProps,
    functionName: 'importProductsFile',
    entry: 'src/handlers/importProductsFile.ts',
  }
)

// const importFileParser = new NodejsFunction(
//   stack,
//   `${prefix}-importFileParser-lambda`,
//   {
//     ...sharedLambdaProps,
//     functionName: 'importFileParser',
//     entry: 'src/handlers/importFileParser.ts',
//   }
// )

bucket.grantReadWrite(importProductsFile)

// bucket.addEventNotification(
//   s3.EventType.OBJECT_CREATED,
//   new s3notifications.LambdaDestination(importFileParser)
// )

const api = new apigatewayv2.HttpApi(stack, `${prefix}-api`, {
  corsPreflight: {
    allowHeaders: ['*'],
    allowOrigins: ['*'],
    allowMethods: [apigatewayv2.CorsHttpMethod.ANY],
  },
})

api.addRoutes({
  integration: new HttpLambdaIntegration(
    `${prefix}-importProductsFile-lambda-integration`,
    importProductsFile
  ),
  path: '/import',
  methods: [apigatewayv2.HttpMethod.GET],
})
