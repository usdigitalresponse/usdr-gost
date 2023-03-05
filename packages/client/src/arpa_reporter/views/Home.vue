<template>
  <div>
    <div class="row mt-5 mb-5" v-if="viewingOpenPeriod">
      <div class="col" v-if="isAdmin">
        <DownloadButton :href="downloadTreasuryReportURL()" class="btn btn-primary btn-block">Download Treasury Report</DownloadButton>
      </div>

      <div class="col" v-if="isAdmin">
        <DownloadButton :href="downloadAuditReportURL()" class="btn btn-info btn-block">Download Audit Report</DownloadButton>
      </div>

      <div class="col">
        <button @click.prevent="startUpload" class="btn btn-primary btn-block">Submit Workbook</button>
      </div>

      <div class="col">
        <DownloadTemplateBtn :block="true" />
      </div>
    </div>

    <div class="row border border-danger rounded m-3 mb-3 p-3" v-else>
      <div class="col">
        This reporting period is closed.
      </div>
    </div>

    <p>
      Welcome to the ARPA reporter.
      To get started, click the "Download Empty Template" button, above, to get a copy of an empty template for reporting.
    </p>

    <p>
      You will need to fill out one template for every EC code that your agency uses.
      Once you've filled out a template, please return here to submit it.
      To do that, click the "Submit Workbook" button, above.
      You can only submit workbooks for the currently-open reporting period.
    </p>

    <p>
      To view a list of all submitted workbooks, please click on the "Uploads" tab.
    </p>
  </div>
</template>

<script>
import { apiURL } from '@/helpers/fetchApi';
import DownloadButton from '../components/DownloadButton.vue';
import DownloadTemplateBtn from '../components/DownloadTemplateBtn.vue';

export default {
  name: 'Home',
  computed: {
    isAdmin() {
      return this.role === 'admin';
    },
    role() {
      return this.$store.getters.user.role.name;
    },
    viewingOpenPeriod() {
      return this.$store.getters.viewPeriodIsCurrent;
    },
    isClosed() {
      return !(this.$store.getters.viewPeriodIsCurrent);
    },
  },
  methods: {
    downloadAuditReportURL() {
      return apiURL('/api/audit_report');
    },
    downloadTreasuryReportURL() {
      const periodId = this.$store.getters.viewPeriod.id || 0;
      return apiURL(`/api/exports?period_id=${periodId}`);
    },
    startUpload() {
      if (this.viewingOpenPeriod) {
        this.$router.push({ path: '/new_upload' });
      }
    },
  },
  components: {
    DownloadButton,
    DownloadTemplateBtn,
  },
};
</script>

<!-- NOTE: This file was copied from src/views/Home.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->
