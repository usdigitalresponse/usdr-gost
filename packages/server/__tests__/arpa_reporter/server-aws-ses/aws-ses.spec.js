/* eslint no-unused-expressions: "off" */
require('dotenv').config()
const path = require('path')

const email = require(
  path.resolve(__dirname, '../../src/server/lib/email.js')
)

describe('Check that AWS-SES works', () => {
  it('sends a login email', async () => {
    const toAddress = 'caresreportertest+sending@gmail.com'
    const result = await email.sendPasscode(
      toAddress,
      new Date(),
      'httpOrigin'
    )
    // console.dir(result)
    if (!result.MessageId) {
      throw new Error('AWS-SES failed to send login email')
    }
  })
})

// NOTE: This file was copied from tests/server-aws-ses/aws-ses.spec.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
