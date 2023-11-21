<template>
  <div>
   <!-- Default avatar w/o badge: style attribute is bound to computed property avatar from the user session.
    -->
    <b-avatar v-if="!editable" :text="initials" :size="avatarSize" v-bind:style="avatar" badge-variant="light">
    </b-avatar>
    
    <div v-if="editable">
      <!-- Editable avatar:style attribute is bound to avatarStyles so changes from the color picker will be reflected -->
      <b-avatar :text="toInitials(userName)" :size="avatarSize" v-bind:style="avatarStyles" badge-variant="light">
      </b-avatar>
      <div class="my-4">
        <p class="text-left">Avatar color</p>
        <div class="color-picker">
          <b-button v-for="(color, index) in allColors" :key="index" :style="{ backgroundColor: color }" @click="handleColorSelection(color)"></b-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { avatarColors } from '@/helpers/constants';

export default {
  props: {
    size: {
      type: String,
      default: '5rem'
    },
    editable: {
      type: Boolean,
      default: false,
    },
    userName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      allColors: Object.keys(avatarColors),
      avatarStyles: null,
    }
  },
  computed: {
    ...mapGetters({
      loggedInUser: 'users/loggedInUser',
    }),
    initials() {
      return this.toInitials(this.loggedInUser.name);
    },
    avatarSize() { 
      return this.size;
    },
    avatar() {
      return this.loggedInUser.avatar;
    }
  },
  created() {
    this.avatarStyles = this.avatar;
  },
  methods: {
    handleColorSelection(bgColor) {
      const textColor = avatarColors[bgColor];
      const updatedStyles= {
        backgroundColor: bgColor,
        color: textColor
      }
      this.avatarStyles = updatedStyles;
      this.$emit('changeColor', updatedStyles);
    },
    toInitials(name) {
      if (!name) return;
      const fullNameArr = name.split(' ');

      if (fullNameArr.length < 2) return fullNameArr[0][0].toUpperCase();
      
      const firstName = fullNameArr.at(0);
      const lastName = fullNameArr.at(-1);
      return (firstName[0] + lastName[0]).toUpperCase();
    }
  }
}
</script>

<style>
.color-picker {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  justify-items: center;
  row-gap: 10px;
}

.color-picker button {
  border: none;
  border-radius: 5px;
  height: 35px;
  width: 35px;
}
</style>
