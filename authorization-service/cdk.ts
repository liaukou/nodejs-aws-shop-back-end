import * as cdk from 'aws-cdk-lib'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs'
import dotenv from 'dotenv'

dotenv.config()

const app = new cdk.App()

const prefix = 'rs-aws-authorization-service'

const stack = new cdk.Stack(app, `${prefix}-stack`, {
  description: `This stack includes resources needed to deploy ${prefix} application`,
  env: {
    region: process.env.PRODUCT_AWS_REGION,
  },
})

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION,
    liaukou: process.env.liaukou,
  },
}

new NodejsFunction(stack, `${prefix}-basicAuthorizer-lambda`, {
  ...sharedLambdaProps,
  functionName: 'basicAuthorizer',
  entry: 'src/handlers/basicAuthorizer.ts',
})
