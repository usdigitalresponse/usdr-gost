<template>
  <b-modal
    id="edit-user-modal"
    title="Edit your profile"
    header-class="heading"
    footer-class="footer"
    ok-title="Save"
    :ok-disabled="v$.formData.$invalid"
    @show="resetModal"
    @hidden="resetModal"
    @ok="handleOk"
  >
    <div class="text-center my-3">
      <UserAvatar
        :user-name="formData.name"
        :color="formData.avatarColor"
      />
    </div>
    <b-form>
      <b-form-group
        label="Avatar color"
        label-for="avatar-color"
      >
        <b-form-radio-group
          id="avatar-color"
          v-model="formData.avatarColor"
          class="color-picker"
          buttons
        >
          <b-form-radio
            v-for="color in avatarColors"
            :key="color"
            :value="color"
            button
            :style="{ backgroundColor: color}"
          />
        </b-form-radio-group>
      </b-form-group>

      <b-form-group
        :state="!v$.formData.name.$invalid"
        label="Name"
        label-for="name-input"
        invalid-feedback="Please enter your preferred first and last name"
      >
        <b-form-input
          id="name-input"
          v-model="formData.name"
          type="text"
          required
          trim
          autofocus
          @keydown.enter.native="handleSubmit"
        />
      </b-form-group>
    </b-form>
  </b-modal>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { useVuelidate } from '@vuelidate/core';
import { required, minLength } from '@vuelidate/validators';
import { avatarColors } from '@/helpers/constants';
import UserAvatar from '@/components/UserAvatar.vue';

export default {
  components: {
    UserAvatar,
  },
  setup() {
    return { v$: useVuelidate() };
  },
  data() {
    return {
      avatarColors: Object.keys(avatarColors),
      formData: {
        name: null,
        avatarColor: null,
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
      this.formData.avatarColor = this.loggedInUser.avatar_color;
    },
    handleOk(bvModalEvt) {
      // Prevent modal from closing
      bvModalEvt.preventDefault();
      this.handleSubmit();
    },
    handleChangeColor(bgColor) {
      this.formData.avatarColor = bgColor;
    },
    async handleSubmit() {
      this.formData.id = this.loggedInUser.id;
      // Exit when the form isn't valid
      if (this.v$.formData.$invalid) {
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
  #avatar-color {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    justify-items: center;
    row-gap: 10px;
  }
  #avatar-color .btn {
    border: none;
    border-radius: 5px;
    height: 35px;
    width: 35px;
  }
</style>
