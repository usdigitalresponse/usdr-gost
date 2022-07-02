<template>
    <div class="container-fluid mt-3">
      <h2>Annual Report Generator</h2>
      <p>
        Upload all of your Annual Performance Report workbooks below and then
        click Generate Report.
        <br>
        After generating the report, a download link will appear.
      </p>
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
            type="file"
            multiple
            accept=".xlsx, .xlsm, .xls"
            ref="file"
          />
          <label for="file-input">
            Drag and drop files or <span class="underline pointer">click here to upload</span>.
          </label>
        </div>
      </div>
      <div class="text-danger text-center" v-if="errorMessages.length">
        <p v-for="msg in errorMessages" :key="msg">{{msg}}</p>
      </div>
      <div class="mt-2">
        <div class="text-center">
          <button
            class="btn btn-primary px-5 py-2"
            :disabled="!fileList.length"
            type="button"
            @click="post"
          >{{ reportGenerated ? 'Regenerate Report' : 'Generate Report' }}</button>
          <br>
          <a
            id="download-link"
            href="#"
            class="mt-2 btn btn-success d-inline-block"
            :class="{visible: reportGenerated, invisible: !reportGenerated}"
          >Download Annual Report Template</a>
        </div>
        <h4>Files Uploaded:</h4>
        <ul class="overflow-scroll">
          <li :key="file.name" v-for="file in fileList">
            {{file.name}}&nbsp;
            <div
              class="d-inline-block border border-white rounded px-2 py-1 bg-danger text-white pointer"
              @click="removeFile(file.name)"
            >X</div>
          </li>
        </ul>
      </div>
    </div>
</template>
<script>
export default {
  name: 'AnnualRollup',
  data() {
    return {
      // easier dupe checking
      fileNameSet: new Set(),
      fileList: [],
      errorMessages: [],
      reportGenerated: false,
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
      const formData = new FormData();
      this.fileList.forEach((file) => {
        formData.append('files', file);
      });

      const baseUrl = process.env.VUE_APP_GRANTS_API_URL;
      fetch(`${baseUrl}/api/annual-reports`, { body: formData, method: 'POST' })
        .then((res) => res.arrayBuffer())
        .then((data) => {
          const blob = new Blob([data], { type: 'application/octet-stream' });
          const link = document.getElementById('download-link');
          link.href = URL.createObjectURL(blob);
          link.download = 'AnnualReportTemplate.docx';
          this.reportGenerated = true;
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
.pointer {
  cursor: pointer;
}
.overflow-scroll {
  overflow-y: scroll;
}
</style>
