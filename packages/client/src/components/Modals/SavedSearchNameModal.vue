<template>
  <div>
      <b-modal
        id="save-search-name-modal"
        ref="modal"
        title="Save Search Name"
        @show="resetModal"
        @hidden="resetModal"
        @ok="handleOk"
        :ok-disabled="$v.formData.$invalid"
      >
        <form ref="form" @submit.stop.prevent="handleSubmit">
          <b-form-group
            :state="!($v.formData.searchName.$invalid && $v.$dirty)"
            label="Save Search Name"
            label-for="searchName-input"
            invalid-feedback="Saved search name is invalid"
          >
            <b-form-input
              id="searchName-input"
              v-model="formData.searchName"
              :state="!($v.formData.searchName.$invalid && $v.$dirty)"
              @change="$v.$touch()"
              required
            ></b-form-input>
          </b-form-group>
        </form>
      </b-modal>
    </div>
  </template>
<script>

import { mapActions, mapGetters } from 'vuex';
import { required } from 'vuelidate/lib/validators';

export default {
  props: {
    showModal: Boolean,
  },
  data() {
    return {
      formData: {
        searchName: null,
      },
    };
  },
  validations: {
    formData: {
      searchName: {
        required,
      },
    },
  },
  watch: {
    showModal() {
      if (this.showModal) {
        this.$bvModal.show('save-search-name-modal');
      } else {
        this.$bvModal.hide('save-search-name-modal');
      }
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
      savedSearchName: 'keywords/savedSearchName',
    }),
    resetModal() {
      this.formData = {
        searchName: null,
      };
      this.$emit('update:showModal', false);
      this.$v.$reset();
    },
    handleOk(bvModalEvt) {
      // Prevent modal from closing
      bvModalEvt.preventDefault();
      // Trigger submit handler
      this.handleSubmit();
    },
    async handleSubmit() {
      // Exit when the form isn't valid
      if (this.$v.formData.$invalid) {
        return;
      }
      await this.saveSearchName(this.formData);
      // Hide the modal manually
      this.$nextTick(() => {
        this.$emit('update:showModal', false);
        this.$bvModal.hide('save-search-name-modal');
      });
    },
  },
};
</script>
