<template>
  <b-modal
    id="edit-user-modal"
    title="Edit your profile"
    header-class="heading"
    footer-class="footer"
    ok-title="Save"
    @show="resetModal"
    @hidden="resetModal"
    @ok="handleOk"
    :ok-disabled="$v.formData.$invalid"
    >
    <b-form>
       <b-form-group
          :state="!$v.formData.name.$invalid"
          label="Name"
          label-for="name-input"
          invalid-feedback="Please enter your preferred first and last name"
        >
        <b-form-input
          type="text"
          id="name-input"
          v-model="formData.name"
          required
          trim
        ></b-form-input>
      </b-form-group>
    </b-form>
  </b-modal>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { required, minLength } from 'vuelidate/lib/validators';

export default {
  data() {
    return {
      formData: {
        name: null,
      },
    };
  },
  validations: {
    formData: {
      name: {
        required,
        minLength: minLength(4),
      },
    },
  },
  computed: {
    ...mapGetters({
      loggedInUser: 'users/loggedInUser',
    }),
  },
  methods: {
    ...mapActions({
      updateUser: 'users/updateUser',
    }),
    resetModal() {
      this.formData.name = this.loggedInUser.name;
    },
    handleOk(bvModalEvt) {
      // Prevent modal from closing
      bvModalEvt.preventDefault();
      this.handleSubmit();
    },
    async handleSubmit() {
      this.formData.id = this.loggedInUser.id;

      // Exit when the form isn't valid
      if (this.$v.formData.$invalid) {
        return;
      }
      try {
        await this.updateUser(this.formData);
      } catch (error) {
        this.$store.commit('alerts/addAlert', {
          text: `Error updating user: ${error.message}`,
          level: 'err',
        });
      }
      // // Hide the modal manually
      this.$nextTick(() => {
        this.$bvModal.hide('edit-user-modal');
      });
    },
  },
};

</script>

<style>
  .heading > h5 {
    font-family: Inter, Helvetica, Arial, sans-serif;
    font-size: 20px;
    font-weight: 700;
  }

  .footer {
    border: none;
  }
</style>
