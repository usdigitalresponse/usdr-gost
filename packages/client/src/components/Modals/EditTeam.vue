<!-- eslint-disable max-len -->
<template>
  <div>
    <b-modal
      id="edit-agency-modal"
      ref="modal"
      v-model="showDialog"
      :title="newTerminologyEnabled ? 'Edit Team' : 'Edit Agency'"
      :ok-disabled="$v.formData.$invalid"
      @hidden="resetModal"
      @ok="handleOk"
    >
      <h3>{{ agency && agency.name }}</h3>
      <form
        ref="form"
        @submit.stop.prevent="handleSubmit"
      >
        <b-form-group
          label-for="name-input"
        >
          <template slot="label">
            Name
          </template>
          <b-form-input
            id="name-input"
            v-model="formData.name"
            autofocus
            type="text"
            min="2"
            required
          />
        </b-form-group>
        <b-form-group
          label-for="abbreviation-input"
        >
          <template slot="label">
            Abbreviation
          </template>
          <template slot="description">
            This is used for displaying lists of {{ newTerminologyEnabled ? 'teams' : 'agencies' }} in compact form (e.g. in a table).
          </template>
          <b-form-input
            id="abbreviation-input"
            v-model="formData.abbreviation"
            type="text"
            min="2"
            max="8"
            required
          />
        </b-form-group>
        <b-form-group
          label-for="code-input"
        >
          <template slot="label">
            Code
          </template>
          <template slot="description">
            This should match the Agency Code field in ARPA Reporter workbook uploads. If not using ARPA Reporter, you can set this the same as Abbreviation. This field must be unique across {{ newTerminologyEnabled ? 'teams' : 'agencies' }}.
          </template>
          <b-form-input
            id="code-input"
            v-model="formData.code"
            type="text"
            min="2"
            max="8"
          />
        </b-form-group>
        <b-form-group
          label-for="agency-input"
        >
          <template slot="label">
            Parent {{ newTerminologyEnabled ? 'Team' : 'Agency' }}
          </template>
          <v-select
            v-model="formData.parentAgency"
            :options="agencies"
            label="name"
            :value="formData.parentAgency"
          >
            <template #search="{attributes, events}">
              <input
                class="vs__search"
                v-bind="attributes"
                v-on="events"
              >
            </template>
          </v-select>
        </b-form-group>
        <b-form-group
          :state="!$v.formData.warningThreshold.$invalid"
          label-for="warningThreshold-input"
          invalid-feedback="Warning Threshold must be 2 or greater"
        >
          <template slot="label">
            Close Date <span class="text-warning">Warning</span> Threshold
          </template>
          <template slot="description">
            How many days out to show grant close dates with <span class="text-warning">warning</span> status
          </template>
          <b-form-input
            id="warningThreshold-input"
            v-model="formData.warningThreshold"
            autofocus
            type="number"
            min="2"
            :state="!$v.formData.warningThreshold.$invalid"
            required
          />
        </b-form-group>
        <b-form-group
          label-for="dangerThreshold-input"
          invalid-feedback="Danger Threshold must be greater than zero and less than Warning Threshold"
        >
          <template slot="label">
            Close Date <span class="text-danger">Danger</span> Threshold
          </template>
          <template slot="description">
            How many days out to show grant close dates with <span class="text-danger">danger</span> status
          </template>
          <b-form-input
            id="dangerThreshold-input"
            v-model="formData.dangerThreshold"
            type="number"
            min="1"
            :state="!$v.formData.dangerThreshold.$invalid"
            required
          />
        </b-form-group>
        <form
          ref="form"
          @click="handleDelete"
        >
          <span
            id="disabled-wrapper"
            class="d-inline-block"
            tabindex="0"
          >
            <b-button
              :disabled="userRole !== 'admin'"
              variant="outline-danger"
            > Delete {{ newTerminologyEnabled ? 'Team' : 'Agency' }}
            </b-button>
          </span>
          <b-tooltip
            v-if="userRole !== 'admin'"
            target="disabled-wrapper"
            triggers="hover"
          >
            You cannot delete a {{ newTerminologyEnabled ? 'team' : 'agency' }} with children. Reassign child {{ newTerminologyEnabled ? 'teams' : 'agencies' }} to continue deletion.
          </b-tooltip>
        </form>
      </form>
    </b-modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import {
  required, numeric, minValue,
} from 'vuelidate/lib/validators';
import { newTerminologyEnabled } from '@/helpers/featureFlags';

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
        code: null,
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
      code: {},
    },
  },
  computed: {
    ...mapGetters({
      agencies: 'agencies/agencies',
      userRole: 'users/userRole',
    }),
    newTerminologyEnabled() {
      return newTerminologyEnabled();
    },
  },
  watch: {
    agency() {
      this.formData.warningThreshold = this.agency && this.agency.warning_threshold;
      this.formData.dangerThreshold = this.agency && this.agency.danger_threshold;
      const parentAgencyId = this.agency && this.agency.parent;
      this.formData.parentAgency = this.agencies.find((agency) => agency.id === parentAgencyId);
      this.formData.name = this.agency && this.agency.name;
      this.formData.abbreviation = this.agency && this.agency.abbreviation;
      this.formData.code = this.agency && this.agency.code;
      this.showDialog = Boolean(this.agency !== null);
    },
  },
  methods: {
    ...mapActions({
      updateThresholds: 'agencies/updateThresholds',
      updateAgencyName: 'agencies/updateAgencyName',
      updateAgencyAbbr: 'agencies/updateAgencyAbbr',
      updateAgencyCode: 'agencies/updateAgencyCode',
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
      const msgBoxConfirmResult = await this.$bvModal.msgBoxConfirm(
        `Are you sure you want to delete this ${this.newTerminologyEnabled ? 'team' : 'agency'}? This cannot be undone. `
      + `If the ${this.newTerminologyEnabled ? 'team' : 'agency'} has children, reassign child ${this.newTerminologyEnabled ? 'teams' : 'agencies'} to continue deletion.`,
        {
          okTitle: 'Delete',
          okVariant: 'danger',
          title: `Delete ${this.newTerminologyEnabled ? 'Team' : 'Agency'}`,
        },
      );
      if (msgBoxConfirmResult === true) {
        await this.deleteAgency({
          agencyId: this.agency.id,
          parent: this.agency.parent,
          name: this.agency.name,
          abbreviation: this.agency.abbreviation,
          warningThreshold: this.formData.warningThreshold,
          dangerThreshold: this.formData.dangerThreshold,
        }).then(() => {
          this.resetModal();
        }).catch(async (e) => {
          await this.$bvModal.msgBoxOk(`Could not delete ${this.newTerminologyEnabled ? 'team' : 'agency'}: ${e.message}`, {
            title: 'Error',
            bodyTextVariant: 'danger',
          });
        });
      }
    },
    async handleSubmit() {
      if (this.$v.formData.$invalid) {
        return;
      }
      // TODO(mbroussard): This feels kinda screwy that we do multiple requests (always, since we
      // preload agency data so these won't be null unless manually emptied out) and each one triggers
      // a fetchAgencies refresh...
      //
      // TODO(mbroussard): some of these can potentially fail if e.g. name or code is not unique, and we
      // don't do anything useful to handle such an error in the UI right now.
      if (this.formData.dangerThreshold && this.formData.dangerThreshold) {
        this.updateThresholds({ agencyId: this.agency.id, ...this.formData });
      }
      if (this.formData.name) {
        this.updateAgencyName({ agencyId: this.agency.id, ...this.formData });
      }
      if (this.formData.abbreviation) {
        this.updateAgencyAbbr({ agencyId: this.agency.id, ...this.formData });
      }
      if (this.formData.code) {
        this.updateAgencyCode({ agencyId: this.agency.id, ...this.formData });
      }
      let ok = true;
      if (this.formData.parentAgency.id) {
        if ((this.formData.parentAgency.id !== this.agency.id) && (this.formData.parentAgency.parent !== this.agency.id)) {
          this.updateAgencyParent({ agencyId: this.agency.id, parentId: this.formData.parentAgency.id });
        } else {
          await this.$bvModal.msgBoxOk(`${this.newTerminologyEnabled ? 'Team' : 'Agency'} cannot be its own parent.`);
          ok = false;
        }
      }
      if (ok) {
        this.resetModal();
        this.$bvModal.hide();
      }
    },
  },
};
</script>
