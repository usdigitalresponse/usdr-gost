<!-- eslint-disable max-len -->
<template>
  <div>
    <b-modal
      id="add-agency-modal"
      v-model="showDialog"
      ref="modal"
      title="Add Agency"
      @hidden="resetModal"
      @ok="handleOk"
      :ok-disabled="$v.formData.$invalid"
    >
      <form ref="form" @submit.stop.prevent="handleSubmit">
        <b-form-group
          :state="!$v.formData.name.$invalid"
          label-for="name-input"
        >
          <template slot="label">Name</template>
          <b-form-input
              autofocus
              id="name-input"
              type="text"
              min=2
              v-model="formData.name"
              :state="!$v.formData.name.$invalid"
              required
            ></b-form-input>
        </b-form-group>
        <b-form-group
          :state="!$v.formData.abbreviation.$invalid"
          label-for="abbreviation-input"
        >
          <template slot="label">Abbreviation</template>
          <b-form-input
              id="abbreviation-input"
              type="text"
              min=2
              max=8
              v-model="formData.abbreviation"
              :state="!$v.formData.abbreviation.$invalid"
              required
            ></b-form-input>
        </b-form-group>
        <b-form-group
          :state="!$v.formData.abbreviation.$invalid"
          label-for="agency-input"
          invalid-feedback="Must select a parent agency"
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
        </b-form-group>
        <b-form-group
          :state="!$v.formData.warningThreshold.$invalid"
          label-for="warningThreshold-input"
          invalid-feedback="Warning Threshold must be 2 or greater"
        >
        <template slot="label">Close Date <span class="text-warning">Warning</span> Threshold</template>
        <template slot="description">How many days out to show grant close dates with <span class="text-warning">warning</span> status</template>
          <b-form-input
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
      </form>
    </b-modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { required, numeric, minValue } from 'vuelidate/lib/validators';

export default {
  props: {
    showDialog: Boolean,
  },
  data() {
    return {
      formData: {
        name: null,
        abbreviation: null,
        warningThreshold: null,
        dangerThreshold: null,
        parentAgency: null,
      },
    };
  },
  validations: {
    formData: {
      name: {
        required,
      },
      abbreviation: {
        required,
      },
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
      parentAgency: {
        required,
      },
    },
  },
  watch: {
  },
  computed: {
    ...mapGetters({
      loggedInUser: 'users/loggedInUser',
    }),
    agencies() {
      if (!this.loggedInUser) {
        return [];
      }
      return this.loggedInUser.agency.subagencies;
    },
  },
  mounted() {
  },
  methods: {
    ...mapActions({
      createAgency: 'agencies/createAgency',
    }),
    resetModal() {
      this.$emit('update:showDialog', false);
    },
    handleOk(bvModalEvt) {
      bvModalEvt.preventDefault();
      this.handleSubmit();
    },
    async handleSubmit() {
      if (this.$v.formData.$invalid) {
        return;
      }
      const body = {
        ...this.formData,
        parentId: this.formData.parentAgency.id,
      };
      await this.createAgency(body);
      this.resetModal();
    },
  },
};
</script>
