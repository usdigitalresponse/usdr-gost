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
    }),
  },
  mounted() {
  },
  methods: {
    ...mapActions({
      updateThresholds: 'agencies/updateThresholds',
    }),
    resetModal() {
      this.$emit('update:agency', null);
    },
    handleOk(bvModalEvt) {
      bvModalEvt.preventDefault();
      this.handleSubmit();
    },
    async handleSubmit() {
      if (this.$v.formData.$invalid) {
        return;
      }
      await this.updateThresholds({ agencyId: this.agency.id, ...this.formData });
      this.resetModal();
    },
  },
};
</script>
