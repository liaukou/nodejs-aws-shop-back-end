import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha'
import {
  HttpLambdaAuthorizer,
  HttpLambdaResponseType,
} from '@aws-cdk/aws-apigatewayv2-authorizers-alpha'
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import * as cdk from 'aws-cdk-lib'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3notifications from 'aws-cdk-lib/aws-s3-notifications'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import dotenv from 'dotenv'

dotenv.config()

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

const queue = sqs.Queue.fromQueueArn(
  stack,
  `${prefix}-importFileQueue`,
  process.env.IMPORT_FILE_QUEUE_ARN
)

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION,
    bucketName,
    importSqsUrl: queue.queueUrl,
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

const importFileParser = new NodejsFunction(
  stack,
  `${prefix}-importFileParser-lambda`,
  {
    ...sharedLambdaProps,
    functionName: 'importFileParser',
    entry: 'src/handlers/importFileParser.ts',
  }
)

queue.grantSendMessages(importFileParser)

bucket.grantReadWrite(importProductsFile)
bucket.grantReadWrite(importFileParser)

bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3notifications.LambdaDestination(importFileParser),
  { prefix: 'uploaded/' }
)

const authHandler = NodejsFunction.fromFunctionArn(
  stack,
  `${prefix}-authorizer-lambda`,
  process.env.AUTHORIZER_LAMBDA_ARN
)

const authorizer = new HttpLambdaAuthorizer('BooksAuthorizer', authHandler, {
  responseTypes: [HttpLambdaResponseType.IAM],
})

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
  authorizer,
})
