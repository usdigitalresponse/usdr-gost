
<template>
  <div class="upload">
    <h1>Submit Spreadsheet</h1>

    <div>
      <div v-if="error" class="mt-3 alert alert-danger" role="alert">
        {{ error }}
      </div>

      <form
        method="post"
        encType="multipart/form-data"
        ref="form"
        @submit.prevent="onSubmit"
      >
        <div class="form-group">
          <input
            class="form-control-file"
            type="file"
            id="spreadsheet"
            name="spreadsheet"
            @change="changeFiles"
            ref="files"
          />
        </div>
        <div class="form-group">
          <button
            class="btn btn-primary"
            type="submit"
            :disabled="uploadDisabled"
            @click.prevent="onSubmit"
          >
            {{ uploadButtonLabel }}
          </button>
          <a class="ml-3" href="#" @click="cancelUpload">Cancel</a>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NewUpload',
  data: function () {
    return {
      error: null,
      files: null,
      uploading: false
    }
  },
  computed: {
    uploadButtonLabel: function () {
      return this.uploading ? 'Uploading...' : 'Upload'
    },
    uploadDisabled: function () {
      return this.files === null || this.uploading
    }
  },
  methods: {
    changeFiles (evt) {
      this.files = evt.target.files
    },
    onSubmit: async function () {
      const file = this.files[0]

      if (!file) {
        this.$refs.files.focus()
        return
      }

      this.error = null
      this.uploading = true

      const formData = new FormData()
      formData.append('spreadsheet', file)

      try {
        const resp = await fetch('/api/uploads', { method: 'POST', body: formData })
        const result = (await resp.json()) || { error: (await resp.body) }

        if (resp.ok) {
          const upload = result.upload
          if (!upload) throw new Error('Upload failed to return an upload ID')

          this.$store.commit('setRecentUploadId', upload.id)
          this.$router.push({ path: `/uploads/${upload.id}` })
        } else {
          const err = result.error || `${resp.statusText} (${resp.status})`
          throw new Error(`Upload failed: ${err}`)
        }
      } catch (e) {
        this.error = e.message
        this.uploading = false
      }
    },

    cancelUpload (e) {
      e.preventDefault()
      this.$router.push({ path: '/' })
    }
  }
}
</script>

<!-- NOTE: This file was copied from src/views/NewUpload.vue (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z -->
