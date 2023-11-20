<template>
  <b-avatar :text="initials" :size="avatarSize" v-bind:style="avatarStyles"></b-avatar>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  props: {
    size: {
      type: String,
      default: '5rem'
    }
  },
  computed: {
    ...mapGetters({
      loggedInUser: 'users/loggedInUser',
    }),
    initials() {
      const fullNameArr = this.loggedInUser.name.split(' ');
      const firstName = fullNameArr.at(0);
      const lastName = fullNameArr.at(-1);
      return (firstName[0] + lastName[0]).toUpperCase();
    },
    avatarSize() { 
      return this.size;
    },
    
    avatarStyles() {
      return {
        backgroundColor: this.loggedInUser.avatar.bgColor,
        color: this.loggedInUser.avatar.text
      }
    }
  },
}
</script>