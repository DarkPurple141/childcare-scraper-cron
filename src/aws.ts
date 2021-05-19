import { createInterface } from 'readline'
import type { S3Handler } from 'aws-lambda'
import { S3, SQS } from 'aws-sdk'
import { simplifyLocality } from './utils'
import { AWS_POSTCODE_SQS_URL } from './constants'

const s3 = new S3({ apiVersion: '2006-03-01' })
const sqs = new SQS({ region: 'ap-southeast-2' })

/**
 * Lambda function that parses the s3 upload
 * And itemises individual postcodes into postcodes which can be
 * sent to SQS to be distributed into units of work
 */
export const handler: S3Handler = async function handler(event) {
  console.log('Starting lambda...')
  const seen = new Set()
  // Get the object from the event and show its content type
  const bucket = event.Records[0].s3.bucket.name
  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, ' ')
  )
  console.log(`Bucket ${bucket}:${key}`)
  const s3Opts = {
    Bucket: bucket,
    Key: key,
  }

  try {
    const stream = (await s3.getObject(s3Opts)).createReadStream()

    const rl = createInterface({
      input: stream,
    })

    for await (const line of rl) {
      console.log(line)
      const locality = simplifyLocality(JSON.parse(line))

      try {
        const data = await sqs
          .sendMessage({
            MessageBody: JSON.stringify(locality),
            QueueUrl: AWS_POSTCODE_SQS_URL,
          })
          .promise()
        console.log('SQS message successfully sent: ', data.MessageId)
      } catch (err) {
        console.warn('SQS send message failed: ' + err)
      }
    }
  } catch (e) {
    console.warn(e)
  }
  console.log('Finishing lambda...')
}
