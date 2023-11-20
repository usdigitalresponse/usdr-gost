<template>
  <div>
    <!-- Clickable avatar with badge, activated by passing badge prop -->
    <b-avatar v-if="badge" id="user-avatar" :text="initials" :size="avatarSize" v-bind:style="avatarStyles" badge-variant="light" button>
      <template #badge><b-icon icon="pencil-fill" scale="0.8"></b-icon></template>
    </b-avatar>
    <!-- Default avatar w/o badge -->
    <b-avatar v-else :text="initials" :size="avatarSize" v-bind:style="avatarStyles" badge-variant="light">
    </b-avatar>

    <b-popover target="user-avatar" triggers="click" placement="bottom">
     <div class="color-picker">

     </div>
    </b-popover>

  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  props: {
    size: {
      type: String,
      default: '5rem'
    },
    badge: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    
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

<style>
#user-avatar .b-avatar-badge {
  font-size: 0.9rem !important;
  cursor: pointer;
}
</style>