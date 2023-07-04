import {
  APIGatewayAuthorizerEvent,
  APIGatewayAuthorizerResult,
  APIGatewayProxyResult,
  PolicyDocument,
} from 'aws-lambda'
import { constants as httpConstants } from 'http2'
import { createResponse } from '../utils/apiUtils'

export const handler = async (
  event: APIGatewayAuthorizerEvent
): Promise<APIGatewayAuthorizerResult | APIGatewayProxyResult> => {
  const { type } = event

  if (type !== 'TOKEN') {
    return createResponse(
      httpConstants.HTTP_STATUS_UNAUTHORIZED,
      'Unauthorized'
    )
  }

  try {
    const token = event.authorizationToken
    const encoded = token.split('')[1]
    const buff = Buffer.from(encoded, 'base64')
    const [username, password] = buff.toString('utf-8').split(':')

    console.log(`Username: ${username} and password: ${password}`)

    const storedUserPassword = process.env[username]

    const isValid = storedUserPassword === password
    const effect = isValid ? 'Allow' : 'Deny'
    const policyDocument = generatePolicy(effect, event.methodArn)

    return {
      principalId: encoded,
      policyDocument,
    }
  } catch (error) {
    console.log(error)

    return createResponse(
      httpConstants.HTTP_STATUS_UNAUTHORIZED,
      'Unauthorized'
    )
  }
}

function generatePolicy(effect: string, resource: string): PolicyDocument {
  const policyDocument = {} as PolicyDocument
  if (effect && resource) {
    policyDocument.Version = '2012-10-17'
    policyDocument.Statement = []
    const statementOne: any = {}
    statementOne.Action = 'execute-api:Invoke'
    statementOne.Effect = effect
    statementOne.Resource = resource
    policyDocument.Statement[0] = statementOne
  }
  return policyDocument
}
