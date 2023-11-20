<template>
  <div>
    <!-- Clickable avatar with badge, activated by passing badge prop 
        style attribute is bound to avatarStyles so changes from the color picker will be reflected
    -->
    <b-avatar v-if="badge" id="user-avatar" :text="initials" :size="avatarSize" v-bind:style="avatarStyles" badge-variant="light" button>
      <template #badge><b-icon icon="pencil-fill" scale="0.8"></b-icon></template>
    </b-avatar>

    <!-- Default avatar w/o badge. Style attribute is bound to computed property avatar because
      it should always reflect value from the user session.
    -->
    <b-avatar v-else :text="initials" :size="avatarSize" v-bind:style="avatar" badge-variant="light">
    </b-avatar>

    <!-- TODO: Tabbing from avatar should go here next -->
    <b-popover v-if="badge" target="user-avatar" triggers="click blur" placement="bottom">
     <div class="color-picker">
        <b-button v-for="(color, index) in allColors" :key="index" :style="{ backgroundColor: color }" @click="handleColorSelection(color)"></b-button>
     </div>
    </b-popover>

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
    badge: {
      type: Boolean,
      default: false,
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
      const fullNameArr = this.loggedInUser.name.split(' ');
      const firstName = fullNameArr.at(0);
      const lastName = fullNameArr.at(-1);
      return (firstName[0] + lastName[0]).toUpperCase();
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
    }
  }
}
</script>

<style>
#user-avatar .b-avatar-badge {
  font-size: 0.9rem !important;
  cursor: pointer;
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 5px;

}

.color-picker button {
  border: none;
  border-radius: 5px;
  height: 30px;
  width: 30px;
}
</style>
