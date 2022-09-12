<template>
  <a :href="`/api/uploads/${upload.id}/download`" class="btn-sm btn-primary ml-2">
      Download file
  </a>
</template>

<script>
export default {
  name: 'DownloadFileButton',
  props: {
    upload: Object
  }
}
</script>

<!-- NOTE: This file was copied from src/components/DownloadFileButton.vue (git @ 26f71a0d6d) in the arpa-reporter repo on 2022-09-12T21:06:59.476Z -->
