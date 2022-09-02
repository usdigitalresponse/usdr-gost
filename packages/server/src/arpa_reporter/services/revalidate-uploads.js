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

// NOTE: This file was copied from src/server/services/revalidate-uploads.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
