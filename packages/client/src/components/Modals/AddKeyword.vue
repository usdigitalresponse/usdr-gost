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
          :state="!($v.formData.searchTerm.$invalid && $v.$dirty)"
          label="Search Term"
          label-for="searchTerm-input"
          invalid-feedback="Search term is invalid"
        >
          <b-form-input
            id="searchTerm-input"
            v-model="formData.searchTerm"
            :state="!($v.formData.searchTerm.$invalid && $v.$dirty)"
            @change="$v.$touch()"
            required
          ></b-form-input>
        </b-form-group>
        <b-form-group
          label="Type"
          label-for="type-select"
        >
            <b-form-select
              id="type-select"
              v-model="formData.type"
            >
                <b-form-select-option value="include">Include</b-form-select-option>
                <b-form-select-option v-if="this.$negative_keywords_enabled" value="exclude">Exclude</b-form-select-option>
            </b-form-select>
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
            @change="$v.$touch()"
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
    keywordType: String,
    showModal: Boolean,
  },
  data() {
    return {
      formData: {
        notes: null,
        searchTerm: null,
        type: this.keywordType,
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
      createKeyword: 'keywords/createKeyword',
    }),
    resetModal() {
      this.formData = {
        type: this.keywordType,
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
      await this.createKeyword(this.formData);
      // Hide the modal manually
      this.$nextTick(() => {
        this.$bvModal.hide('add-keyword-modal');
      });
    },
  },
};
</script>
