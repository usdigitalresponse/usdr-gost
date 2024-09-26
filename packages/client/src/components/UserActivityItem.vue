<template>
  <div class="d-flex has-flexi-truncate">
    <div class="d-flex flex-column">
      <UserAvatar
        :user-name="userName"
        size="2.5rem"
        :color="avatarColor"
      />
      <div :class="avatarSubBarClass" />
    </div>

    <div class="d-flex flex-column flex-grow-1 has-flexi-truncate mx-3">
      <div
        class="text-truncate"
        :title="title"
      >
        <span class="font-weight-bold">{{ userName }}</span>
        <span class="bullet mx-1">&bull;</span>
        <span class="team">{{ teamName }}</span>
      </div>
      <div class="text-gray-500">
        <span v-if="!copyEmailEnabled">{{ userEmail }}</span>
        <CopyButton
          v-if="copyEmailEnabled"
          :copy-text="userEmail"
          hide-icon
        >
          {{ userEmail }}
        </CopyButton>
      </div>
      <div class="mt-1 text-gray-600">
        <slot />
        <slot name="text" />
      </div>
      <div class="d-flex mt-1 align-items-end">
        <span class="activity-date-text">
          {{ timeElapsedString }}
          <span
            v-if="isEdited"
            class="text-gray-500"
          >(edited)</span>
        </span>
        <div class="ml-auto">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { DateTime } from 'luxon';
import UserAvatar from '@/components/UserAvatar.vue';
import CopyButton from '@/components/CopyButton.vue';

export const formatActivityDate = (createdAtISO) => {
  const createdDate = DateTime.fromISO(createdAtISO);
  const today = DateTime.now().endOf('day');

  let dateText = '';
  if (createdDate.hasSame(today, 'day')) {
    dateText = createdDate.toRelativeCalendar({ base: today, unit: 'days' });
  } else if (createdDate > today.minus({ days: 7 })) {
    dateText = createdDate.toRelative({ base: today, unit: 'days' });
  } else {
    dateText = createdDate.toFormat('MMMM d');
  }

  return dateText;
};

export default {
  components: {
    UserAvatar,
    CopyButton,
  },
  props: {
    userName: {
      type: String,
      default: '',
    },
    userEmail: {
      type: String,
      default: '',
    },
    avatarColor: {
      type: String,
      default: '',
    },
    teamName: {
      type: String,
      default: '',
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: String,
      default: '',
    },
    copyEmailEnabled: {
      type: Boolean,
      default: false,
    },
    hideAvatarVertical: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    avatarSubBarClass() {
      return this.hideAvatarVertical ? '' : 'activity_vertical position-relative flex-grow-1';
    },
    title() {
      return `${this.userName} \u2022 ${this.teamName}`;
    },
    timeElapsedString() {
      return formatActivityDate(this.createdAt);
    },
  },
};

</script>

<style lang="scss" scoped>
@import '@/scss/colors-semantic-tokens.scss';
@import '@/scss/colors-base-tokens.scss';

.activity-container {
  padding: 1rem 1.25rem;
}

.text-gray-500 {
  color: $raw-gray-500
}

.activity-date-text {
  font-size: 0.75rem;
}

.activity-date-text:first-letter {
  text-transform: capitalize;
}

.text-gray-600 {
  color: $raw-gray-600;
  font-weight: 400;
}

.activity_vertical:before {
  content: "";
  background: $raw-gray-600;
  height: calc(100% - .5rem);
  width: 1px;
  position: absolute;
  left: calc(2.5rem / 2);
  top: 0.375rem;
  bottom: 0;
}

.team {
  color: $raw-gray-500;
  font-weight: 400;
  font-size: 0.75rem;
}

.bullet {
  color: $raw-gray-600;
  font-size: 0.75rem;
}
</style>
