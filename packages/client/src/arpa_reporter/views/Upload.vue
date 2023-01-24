<template>
  <div>
    <div class="row">
      <AlertBox v-if="alert" :text="alert.text" :level="alert.level" v-on:dismiss="clearAlert" />
    </div>

    <div class="row">
      <h4 v-if="errors.length > 0" class="col text-danger">Validation Results</h4>
    </div>

    <div v-if="errors.length > 0" class="row">
      <div class="col">
        <table class="table table-sm table-bordered table-striped col-sm-12 col-md-6">
          <thead>
            <tr>
              <th>#</th>
              <th>Level</th>
              <th>Message</th>
              <th>Tab</th>
              <th>Row</th>
              <th>Col</th>
            </tr>
          </thead>
          <tbody>
            <tr :key="n" v-for="(error, n) in errors">
              <td>{{ n + 1 }}</td>
              <td :class="{ 'table-danger': error.severity === 'err', 'table-warning': error.severity !== 'err' }">
                {{ error.severity === 'err' ? 'Error' : 'Warning' }}
              </td>
              <td>{{ error.message }}</td>
              <td>{{ titleize(error.tab) }}</td>
              <td>{{ error.row }}</td>
              <td>{{ error.col }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="row">
      <h4 class="col">Upload {{ shortUploadId }} details:</h4>
    </div>

    <div v-if="upload" class="row">
      <div class="col-sm-12 col-md-6 mb-sm-3 mb-md-1">
        <ul class="list-group">
          <li class="list-group-item">
            <span class="font-weight-bold">Filename: </span>
            {{ upload.filename }}
            <DownloadFileButton :upload="upload" />
          </li>

          <li class="list-group-item">
            <span class="font-weight-bold">Reporting Period: </span>
            {{ reportingPeriodName }}
          </li>

          <li class="list-group-item" :class="{ 'list-group-item-warning': !upload.agency_id }">
            <span class="font-weight-bold">Agency: </span>
            {{ upload.agency_code || 'Not set' }}
          </li>

          <li class="list-group-item" :class="{ 'list-group-item-warning': !upload.ec_code }">
            <span class="font-weight-bold">EC Code: </span>
            {{ upload.ec_code || 'Not set' }}
          </li>

          <li class="list-group-item">
            <span class="font-weight-bold">Created: </span>
            {{ displayTs(upload.created_at) }} ({{ fromNow(upload.created_at) }}) by {{ upload.created_by }}
          </li>

          <li class="list-group-item" :class="validatedLiClass">
            <span class="font-weight-bold">Validation: </span>

            <span v-if="upload.validated_at">
              {{ displayTs(upload.validated_at) }} ({{ fromNow(upload.validated_at) }}) by {{ upload.validated_by_email }}
            </span>
            <span v-else>
              Not Validated
            </span>

            <button class="btn btn-primary ml-2" @click="validateUpload" :disabled="validating">
              <span v-if="validating">Validating...</span>
              <span v-else-if="upload.validated_at">Re-validate</span>
              <span v-else>Validate</span>
            </button>
          </li>
        </ul>
      </div>

      <div class="col-sm-12 col-md-6" v-if="upload.agency_id && upload.ec_code">
        <h4>
          All from agency
          <span class="text-primary bg-light">{{ upload.agency_code }}</span>
          EC Code
          <span class="text-primary bg-light">{{ upload.ec_code }}</span>
          in period {{ reportingPeriodName }}
        </h4>

        <template v-if="seriesExported">
          <p v-if="seriesExported.id === upload.id">
            The currently-displayed upload will be used for Treasury reporting.
          </p>
          <p v-else>
            Upload
            <router-link :to="`/uploads/${seriesExported.id}`">{{ seriesExported.id }}</router-link>
            will be used for Treasury reporting.
          </p>
        </template>

        <template v-else>
          <p>
            Agency {{ upload.agency_code }}
            <span class="text-danger">does not</span>
            have a valid upload with code
            <span>{{ upload.ec_code }}</span>
            to use in Treasury reporting for period {{ upload.reporting_period_id }}.</p>
        </template>

        <table class="table table-sm table-stripped">
          <thead>
            <tr>
              <th>#</th>
              <th>Uploaded</th>
              <th>Validated</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="sUpload in series"
              :key="sUpload.id"
              :class="{ 'table-success': seriesExported && seriesExported.id == sUpload.id }">
              <template v-if="sUpload.id === upload.id">
                <td>{{ upload.id }}</td>
                <td colspan="2">This upload</td>
              </template>

              <template v-else>
                <td><router-link :to="`/uploads/${sUpload.id}`">{{ sUpload.id }}</router-link></td>
                <td>{{ displayTs(sUpload.created_at) }}</td>
                <td v-if="sUpload.validated_at">{{ displayTs(sUpload.validated_at) }}</td>
                <td v-else>Not Validated</td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="row">
      <span class="col">Loading...</span>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import { titleize } from '../helpers/form-helpers';
import AlertBox from '../components/AlertBox';
import DownloadFileButton from '../components/DownloadFileButton';
import { getJson, post } from '../store/index';
import { shortUuid } from '../helpers/short-uuid';

export default {
  name: 'Upload',
  components: {
    AlertBox,
    DownloadFileButton,
  },
  data() {
    return {
      upload: null,
      errors: [],
      series: [],
      seriesExported: null,
      alert: null,
      validating: false,
    };
  },
  computed: {
    uploadId() {
      return this.$route.params.id;
    },
    shortUploadId() {
      return shortUuid(this.uploadId);
    },
    isRecentlyUploaded() {
      return this.uploadId === this.$store.state.recentUploadId;
    },
    validatedLiClass() {
      if (!this.upload) return {};

      return {
        'list-group-item-success': this.upload.validated_at,
        'list-group-item-warning': !this.upload.validated_at,
      };
    },
    reportingPeriodName() {
      const reportingPeriod = this.$store.state.reportingPeriods.find((per) => per.id === this.upload.reporting_period_id);
      return reportingPeriod ? reportingPeriod.name : `ID: ${this.upload.reporting_period_id}`;
    },
  },
  methods: {
    titleize,
    clearAlert() {
      this.alert = null;
    },
    displayTs(ts) {
      return moment(ts).format('LTS ll');
    },
    fromNow(ts) {
      return moment(ts).fromNow();
    },
    preview(o) {
      const s = JSON.stringify(o, null, '  ');
      const maxLength = 120;
      if (s.length < maxLength) {
        return s;
      }
      return `${s.slice(0, maxLength)}...`;
    },
    async validateUpload() {
      this.validating = true;

      try {
        const result = await post(`/api/uploads/${this.uploadId}/validate`);
        await this.loadUpload();

        if (result.errors?.length) {
          this.errors = result.errors;
        } else {
          this.alert = {
            text: 'Upload successfully validated!',
            level: 'ok',
          };
        }
      } catch (error) {
        // we got an error from the backend, but the backend didn't send reasons
        this.alert = {
          text: `validateUpload Error: ${error.message}`,
          level: 'err',
        };
      }

      this.validating = false;
    },
    async loadUpload() {
      this.upload = null;
      this.errors = [];

      const result = await getJson(`/api/uploads/${this.uploadId}`);
      if (result.error) {
        this.$store.commit('addAlert', {
          text: `loadUpload Error (${result.status}): ${result.error}`,
          level: 'err',
        });
      } else {
        this.upload = result.upload;
      }

      // each time we refresh the upload, also refresh the series
      this.loadSeries();
    },
    async loadSeries() {
      this.series = [];
      this.seriesExported = null;

      const result = await getJson(`/api/uploads/${this.uploadId}/series`);
      if (result.error) {
        this.$store.commit('addAlert', {
          text: `loadSeries Error (${result.status}): ${result.error}`,
          level: 'err',
        });
      } else {
        this.series = result.series;
        this.seriesExported = result.seriesExported;
      }
    },
    async initialValidation() {
      if (!this.isRecentlyUploaded) return;

      this.$store.commit('setRecentUploadId', null);
      this.validateUpload();
    },
    async onLoad() {
      this.clearAlert();
      await this.loadUpload();
      this.initialValidation();
    },
  },
  watch: {
    uploadId(to, from) {
      this.onLoad();
    },
  },
  async mounted() {
    this.onLoad();
  },
};
</script>

<!-- NOTE: This file was copied from src/views/Upload.vue (git @ ada8bfdc98) in the arpa-reporter repo on 2022-09-23T20:05:47.735Z -->
