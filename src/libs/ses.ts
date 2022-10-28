import { SESClient } from '@aws-sdk/client-ses'
import { STAGE } from '../env'

export const sesClient = new SESClient(
  STAGE === 'local' ? { region: STAGE } : {}
)
