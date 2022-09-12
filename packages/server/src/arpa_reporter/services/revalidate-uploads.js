const { validateUpload } = require('./validate-upload')
const { uploadsInPeriod } = require('../db/uploads')

async function revalidateUploads (period, user, trns) {
  const uploads = await uploadsInPeriod(period.id, trns)

  const updates = []
  for (const upload of uploads) {
    const errors = await validateUpload(upload, user, trns)
    updates.push({
      upload,
      errors
    })
  }

  return updates
}

module.exports = { revalidateUploads }

// NOTE: This file was copied from src/server/services/revalidate-uploads.js (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z
