<!-- eslint-disable max-len -->
<template>
  <div>
    <b-modal
      id="edit-agency-modal"
      v-model="showDialog"
      ref="modal"
      title="Edit Agency"
      @hidden="resetModal"
      @ok="handleOk"
      :ok-disabled="$v.formData.$invalid"
    >
    <h3>{{this.agency && this.agency.name}}</h3>
      <form ref="form" @submit.stop.prevent="handleSubmit">
      <b-form-group
          label-for="name-input"
      >
          <template slot="label">Name</template>
          <b-form-input
              autofocus
              id="name-input"
              type="text"
              min=2
              v-model="formData.name"
              required
            ></b-form-input>
        </b-form-group>
        <b-form-group
          label-for="abbreviation-input"
        >
          <template slot="label">Abbreviation</template>
          <b-form-input
              id="abbreviation-input"
              type="text"
              min=2
              max=8
              v-model="formData.abbreviation"
              required
            ></b-form-input>
        </b-form-group>
        <b-form-group
          label-for="agency-input"
        >
          <template slot="label">Parent Agency</template>
          <v-select :options="agencies" label="name" :value="this.formData.parentAgency" v-model="formData.parentAgency">
            <template #search="{attributes, events}">
              <input
                class="vs__search"
                v-bind="attributes"
                v-on="events"
              />
            </template>
          </v-select>
        </b-form-group>
        <b-form-group
          :state="!$v.formData.warningThreshold.$invalid"
          label-for="warningThreshold-input"
          invalid-feedback="Warning Threshold must be 2 or greater"
        >
        <template slot="label">Close Date <span class="text-warning">Warning</span> Threshold</template>
        <template slot="description">How many days out to show grant close dates with <span class="text-warning">warning</span> status</template>
          <b-form-input
            autofocus
            id="warningThreshold-input"
            type="number"
            min=2
            v-model="formData.warningThreshold"
            :state="!$v.formData.warningThreshold.$invalid"
            required
          ></b-form-input>
        </b-form-group>
        <b-form-group
          label-for="dangerThreshold-input"
          invalid-feedback="Danger Threshold must be greater than zero and less than Warning Threshold"
        >
        <template slot="label">Close Date <span class="text-danger">Danger</span> Threshold</template>
        <template slot="description">How many days out to show grant close dates with <span class="text-danger">danger</span> status</template>
          <b-form-input
            id="dangerThreshold-input"
            type="number"
            min=1
            v-model="formData.dangerThreshold"
            :state="!$v.formData.dangerThreshold.$invalid"
            required
          ></b-form-input>
        </b-form-group>
        <form ref="form" @click="handleDelete">
          <span id="disabled-wrapper" class="d-inline-block" tabindex="0">
            <b-button v-bind:disabled="userRole !== 'admin'" style="pointer-events: none;" variant="danger">
              Admin Delete Agency
            </b-button>
          </span>
          <b-tooltip v-if="userRole !== 'admin'" target="disabled-wrapper" triggers="hover">
            You cannot delete an agency with children. Reassign child agencies to continue deletion.
          </b-tooltip>
        </form>
      </form>
    </b-modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { required, numeric, minValue } from 'vuelidate/lib/validators';

export default {
  props: {
    agency: Object,
  },
  data() {
    return {
      showDialog: false,
      formData: {
        warningThreshold: null,
        dangerThreshold: null,
        name: null,
        abbreviation: null,
        parentAgency: null,
      },
    };
  },
  validations: {
    formData: {
      warningThreshold: {
        required,
        numeric,
        minValue: minValue(2),
      },
      dangerThreshold: {
        required,
        numeric,
        minValue: minValue(1),
        dangerLessThanWarning: function dangerLessThanWarning() {
          return Number(this.formData.dangerThreshold) < Number(this.formData.warningThreshold);
        },
      },
    },
  },
  watch: {
    agency() {
      this.formData.warningThreshold = this.agency && this.agency.warning_threshold;
      this.formData.dangerThreshold = this.agency && this.agency.danger_threshold;
      this.showDialog = Boolean(this.agency !== null);
    },
  },
  computed: {
    ...mapGetters({
      agencies: 'agencies/agencies',
      userRole: 'users/userRole',
    }),
  },
  mounted() {
  },
  methods: {
    ...mapActions({
      updateThresholds: 'agencies/updateThresholds',
      updateAgencyName: 'agencies/updateAgencyName',
      updateAgencyAbbr: 'agencies/updateAgencyAbbr',
      updateAgencyParent: 'agencies/updateAgencyParent',
      deleteAgency: 'agencies/deleteAgency',
    }),
    resetModal() {
      this.$emit('update:agency', null);
    },
    handleOk(bvModalEvt) {
      bvModalEvt.preventDefault();
      this.handleSubmit();
    },
    async handleDelete() {
      if (this.$v.formData.$invalid) {
        return;
      }
      await this.$bvModal.msgBoxConfirm(
        'Are you sure you want to delete this agency? This cannot be undone. If the agency has children,'
      + ' reassign child agencies to continue deletion.',
      ).then(() => {
        this.deleteAgency({
          agencyId: this.agency.id,
          parent: this.agency.parent,
          name: this.agency.name,
          abbreviation: this.agency.abbreviation,
          warningThreshold: this.formData.warningThreshold,
          dangerThreshold: this.formData.dangerThreshold,
        });
        this.resetModal();
      })
        .catch((err) => {
          console.log(`error in delete agency   ${err}`);
        });
    },
    async handleSubmit() {
      if (this.$v.formData.$invalid) {
        return;
      }
      if (this.formData.dangerThreshold && this.formData.dangerThreshold) {
        this.updateThresholds({ agencyId: this.agency.id, ...this.formData });
        this.resetModal();
        this.$bvModal.hide();
      }
      if (this.formData.name) {
        this.updateAgencyName({ agencyId: this.agency.id, ...this.formData });
        this.resetModal();
        this.$bvModal.hide();
      }
      if (this.formData.abbreviation) {
        this.updateAgencyAbbr({ agencyId: this.agency.id, ...this.formData });
        this.resetModal();
        this.$bvModal.hide();
      }
      if (this.formData.parentAgency.id) {
        this.updateAgencyParent({ agencyId: this.agency.id, parentId: this.formData.parentAgency.id });
        this.resetModal();
        this.$bvModal.hide();
      }
      this.resetModal();
      this.$bvModal.hide();
    },
  },
};
</script>
