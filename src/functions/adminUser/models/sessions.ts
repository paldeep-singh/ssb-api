import axios, { AxiosRequestHeaders } from 'axios'
import { randomBytes } from 'crypto'
import { STAGE } from '../../../env'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import {
  UPSTASH_TOKEN_PARAMETER_NAME,
  UPSTASH_URL_PARAMETER_NAME
} from '../resources'

interface ISessionData {
  userId: string
}

export interface ISession {
  id: string
  data: ISessionData
}

export const getRedisURL = async (): Promise<string> => {
  if (STAGE === 'local') {
    return process.env.UPSTASH_REDIS_REST_URL || ''
  }

  const ssm = new SSMClient({})

  const getURLCommand = new GetParameterCommand({
    Name: UPSTASH_URL_PARAMETER_NAME,
    WithDecryption: true
  })

  const urlParameter = await ssm.send(getURLCommand)

  if (!urlParameter.Parameter)
    throw new Error(`Upstash REST API URL must be provided`)
  else if (!urlParameter.Parameter.Value)
    throw new Error('Invalid value for Upstash REST API URL parameter')

  const {
    Parameter: { Value: redisURL }
  } = urlParameter

  return redisURL
}

const getRedisToken = async (): Promise<string> => {
  if (STAGE === 'local') {
    return process.env.UPSTASH_REDIS_REST_TOKEN || ''
  }

  const ssm = new SSMClient({})

  const getTokenCommand = new GetParameterCommand({
    Name: UPSTASH_TOKEN_PARAMETER_NAME,
    WithDecryption: true
  })

  const tokenParameter = await ssm.send(getTokenCommand)

  if (!tokenParameter.Parameter)
    throw new Error('Upstast REST API token must be provided')
  else if (!tokenParameter.Parameter.Value)
    throw new Error('Invalid value for Upstash REST API token parameter')

  const {
    Parameter: { Value: redisToken }
  } = tokenParameter

  return redisToken
}

export const getRedisHeaders = async (): Promise<
  Partial<AxiosRequestHeaders>
> => {
  const redisToken = await getRedisToken()

  return {
    Authorization: `Bearer ${redisToken}`,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
}

const FIVE_MINUTES = 60 * 5
const THIRTY_DAYS = 60 * 60 * 30

export const createNewSession = async (
  userId: string,
  short = false
): Promise<ISession> => {
  const redisURL = await getRedisURL()
  const sessionId = randomBytes(32).toString('hex')

  const expiry = short ? FIVE_MINUTES : THIRTY_DAYS

  const requestURL = `${redisURL}/set/${sessionId}?EX=${expiry}`

  const data = {
    userId
  }

  const headers = await getRedisHeaders()

  await axios.post(requestURL, data, { headers })

  return {
    id: sessionId,
    data: data
  }
}

export const updateSession = async (
  sessionId: string,
  sessionData: ISessionData
): Promise<ISession> => {
  const redisURL = await getRedisURL()
  const requestURL = `${redisURL}/set/${sessionId}?EX=${THIRTY_DAYS}`
  const headers = await getRedisHeaders()

  await axios.post(requestURL, sessionData, { headers })

  return {
    id: sessionId,
    data: sessionData
  }
}

export const fetchSession = async (
  sessionId: string
): Promise<ISession | null> => {
  const redisURL = await getRedisURL()
  const requestURL = `${redisURL}/get/${sessionId}`

  const headers = await getRedisHeaders()

  const response = await axios.get<{ result: string | null }>(requestURL, {
    headers
  })

  if (!response.data.result) {
    return null
  }

  const data = JSON.parse(response.data.result)

  return {
    id: sessionId,
    data: data
  }
}
