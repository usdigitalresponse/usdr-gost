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
        <!-- <b-form-group
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
          <v-select :options="agencies" label="name" :value="formData.parentAgency" v-model="formData.parentAgency">
            <template #search="{attributes, events}">
              <input
                class="vs__search"
                :required="!formData.parentAgency"
                v-bind="attributes"
                v-on="events"
              />
            </template>
          </v-select>
        </b-form-group> -->
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
        <form ref="form" @submit.stop.prevent="handleDelete">
          <b-button v-if="userRole === 'admsn'" variant="danger">Admin Delete Agency</b-button>
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
        // abbreviation: null,
        // parentAgency: null,
      },
    };
  },
  validations: {
    formData: {
      // name: {
      //   required,
      // },
      // abbreviation: {
      //   required,
      // },
      // // parentAgency: {
      // //   required,
      // // },
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
      userRole: 'users/userRole',
    }),
  },
  mounted() {
  },
  methods: {
    ...mapActions({
      updateThresholds: 'agencies/updateThresholds',
      updateAgencyName: 'agencies/updateAgencyName',
      // updateAgencyAbbr: 'agencies/updateAgencyAbbr',
      // updateAgencyParent: 'agencies/updateAgencyParent',
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
      const body = {
        ...this.formData,
        parentId: this.formData.parentAgency.id,
      };
      await this.deleteAgency(body);
    },
    async handleSubmit() {
      if (this.$v.formData.$invalid) {
        return;
      }
      // const body = {
      //   ...this.formData,
      //   parentId: this.formData.parentAgency.id,
      // };
      await this.updateThresholds({ agencyId: this.agency.id, ...this.formData });
      await this.updateAgencyName({ agencyId: this.agency.id, ...this.formData });
      // await this.updateAgencyAbbr({ agencyId: this.agency.id, ...this.formData });
      // await this.updateAgencyParent({ agencyId: this.agency.id, ...this.formData });
      this.resetModal();
    },
  },
};
</script>
