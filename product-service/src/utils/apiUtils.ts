export const CORS_HEADER = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,GET',
}

type Headers = Record<string, string>

export const createResponse = (
  statusCode: number,
  body: any,
  headers: Headers = CORS_HEADER
) => ({
  statusCode,
  headers,
  body: JSON.stringify(body, null, 2),
})
