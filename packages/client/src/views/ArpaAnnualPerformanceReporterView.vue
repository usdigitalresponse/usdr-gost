<template>
  <div class="container-fluid mt-3">
    <h2>Annual Report Generator</h2>
    <p>
      Upload all of your Annual Performance Report workbooks below and then
      click Generate Report.
      <br>
      After generating the report, a download link will appear.
      <a
        download
        href="./ARPA_Annual_Performance_Report_Workbook.xlsx"
      >
        (workbook template)
      </a>
    </p>

    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/interactive-supports-focus vuejs-accessibility/no-static-element-interactions -->
    <div
      class="drop-zone"
      @dragenter.prevent
      @dragover.prevent
      @drop.prevent="onDrop"
      @change="onChange"
    >
      <div class="drop-zone-child">
        <input
          id="file-input"
          ref="file"
          type="file"
          multiple
          accept=".xlsx, .xlsm, .xls"
        >
        <!-- eslint-disable-next-line vuejs-accessibility/label-has-for -->
        <label for="file-input">
          Drag and drop files or <span class="underline pointer">click here to upload</span>.
        </label>
      </div>
    </div>
    <div
      v-if="errorMessages.length"
      class="text-danger text-center"
    >
      <p
        v-for="msg in errorMessages"
        :key="msg"
      >
        {{ msg }}
      </p>
    </div>
    <div class="mt-2">
      <div class="text-center">
        <b-overlay
          :show="busy"
          rounded
          opacity="0.6"
          spinner-variant="primary"
          class="d-inline-block"
        >
          <button
            class="btn btn-primary px-5 py-2"
            :class="{disabled: !fileList.length}"
            :disabled="!fileList.length"
            type="button"
            @click="post"
          >
            {{ reportGenerated ? 'Regenerate Report' : 'Generate Report' }}
          </button>
        </b-overlay>
        <br>
        <a
          id="download-link"
          href="#"
          class="mt-2 btn btn-success d-inline-block"
          :class="{visible: reportGenerated && !busy, invisible: !reportGenerated || busy}"
        >Download Annual Report Template</a>
      </div>
      <h4>Files Uploaded:</h4>
      <ul class="overflow-scroll">
        <li
          v-for="file in fileList"
          :key="file.name"
        >
          {{ file.name }}&nbsp;
          <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
          <div
            class="d-inline-block border border-white rounded px-2 py-1 bg-danger text-white pointer"
            @click="removeFile(file.name)"
          >
            X
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
<script>
import { apiURL } from '@/helpers/fetchApi';

export default {
  data() {
    return {
      // easier dupe checking
      fileNameSet: new Set(),
      fileList: [],
      errorMessages: [],
      reportGenerated: false,
      busy: false,
    };
  },
  methods: {
    temporaryErrorMessage(msg) {
      this.errorMessages.push(msg);

      // this is janky but it'll do the trick
      setTimeout(() => { this.errorMessages = []; }, 5000);
    },
    removeFile(fileName) {
      this.fileList = this.fileList.filter((f) => f.name !== fileName);
      this.fileNameSet.delete(fileName);
    },
    addFiles(files) {
      Array.from(files).forEach((f) => {
        if (this.fileNameSet.has(f.name)) {
          this.temporaryErrorMessage(`File is already uploaded: ${f.name}`);
        } else if (!f.name.includes('xls')) {
          this.temporaryErrorMessage('Files must be .xls, .xlsx, or .xlsm');
        } else {
          this.fileNameSet.add(f.name);
          this.fileList.push(f);
        }
      });
    },
    onDrop(e) {
      this.addFiles(e.dataTransfer.files);
    },
    onChange(e) {
      this.addFiles(e.target.files);
    },
    post() {
      this.busy = true;
      const formData = new FormData();
      this.fileList.forEach((file) => {
        formData.append('files', file);
      });

      fetch(apiURL('/api/annual-reports'), { body: formData, method: 'POST' })
        .then((res) => res.arrayBuffer())
        .then((data) => {
          const blob = new Blob([data], { type: 'application/octet-stream' });
          const link = document.getElementById('download-link');
          link.href = URL.createObjectURL(blob);
          link.download = 'AnnualReportTemplate.docx';
          this.reportGenerated = true;
          this.busy = false;
        })
        .catch(console.error);
    },
  },
};
</script>
<style scoped>
.drop-zone {
  background-color: #ADADAD;
  border: 1px solid gray;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 250px;
  margin: auto;
  width: 100%;
}
#file-input {
  display: none;
}
.underline {
  text-decoration: underline;
  cursor: pointer;
}
.disabled {
  cursor: not-allowed;
}
.pointer {
  cursor: pointer;
}
.overflow-scroll {
  overflow-y: scroll;
}
</style>
