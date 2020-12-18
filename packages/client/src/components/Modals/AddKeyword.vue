<template>
  <div>
    <b-modal
      id="add-keyword-modal"
      ref="modal"
      title="Add Keyword"
      @show="resetModal"
      @hidden="resetModal"
      @ok="handleOk"
      :ok-disabled="$v.formData.$invalid"
    >
      <form ref="form" @submit.stop.prevent="handleSubmit">
        <b-form-group
          :state="!$v.formData.searchTerm.$invalid"
          label="Search Term"
          label-for="searchTerm-input"
          invalid-feedback="Search term is invalid"
        >
          <b-form-input
            id="searchTerm-input"
            v-model="formData.searchTerm"
            :state="!$v.formData.searchTerm.$invalid"
            required
          ></b-form-input>
        </b-form-group>
        <b-form-group
          :state="!$v.formData.notes.$invalid"
          label="Notes"
          label-for="notes-input"
          invalid-feedback="Note is invalid"
        >
          <b-form-textarea
            id="notes-input"
            v-model="formData.notes"
            :state="!$v.formData.notes.$invalid"
            rows="3"
            max-rows="6"
          ></b-form-textarea>
        </b-form-group>
      </form>
    </b-modal>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { required, maxLength } from 'vuelidate/lib/validators';

export default {
  props: {
    showModal: Boolean,
  },
  data() {
    return {
      formData: {
        notes: null,
        searchTerm: null,
      },
    };
  },
  validations: {
    formData: {
      searchTerm: {
        required,
      },
      notes: {
        maxLength: maxLength(512),
      },
    },
  },
  watch: {
    showModal() {
      this.$bvModal.show('add-keyword-modal');
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
      createKeyword: 'grants/createKeyword',
    }),
    resetModal() {
      this.formData = {};
      this.$emit('update:showModal', false);
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
      await this.createKeyword(this.formData);
      // Hide the modal manually
      this.$nextTick(() => {
        this.$bvModal.hide('add-keyword-modal');
      });
    },
  },
};
</script>
