<template>
  <b-avatar
    :text="initials"
    :size="size"
    :style="colorStyles"
  />
</template>

<script>
import { avatarColors } from '@/helpers/constants';

export default {
  props: {
    userName: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: Object.keys(avatarColors)[0],
    },
    size: {
      type: String,
      default: '5rem',
    },
  },
  computed: {
    initials() {
      if (!this.userName) return '';

      const fullNameArr = this.userName.split(' ');

      if (fullNameArr.length < 2) return fullNameArr[0][0].toUpperCase();

      const firstName = fullNameArr.at(0);
      const lastName = fullNameArr.at(-1);
      return (firstName[0] + lastName[0]).toUpperCase();
    },
    colorStyles() {
      return {
        backgroundColor: this.color,
        color: avatarColors[this.color],
      };
    },
  },
};
</script>
