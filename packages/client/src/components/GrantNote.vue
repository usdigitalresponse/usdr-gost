<template>
  <div class="d-flex note-container">
    <div class="d-flex flex-column">
      <UserAvatar
        :user-name="note.user.name"
        size="2.5rem"
        :color="note.user.avatarColor"
      />
      <div class="note_vertical position-relative flex-grow-1" />
    </div>

    <div class="d-flex flex-column flex-grow-1 has-flexi-truncate ml-2">
      <UserHeaderText
        :name="note.user.name"
        :team="note.user.team.name"
      />
      <div class="text-gray-500">
        <CopyButton
          :copy-text="note.user.email"
          hide-icon
        >
          {{ note.user.email }}
        </CopyButton>
      </div>
      <div class="mt-1 text-gray-600">
        {{ note.text }}
      </div>
      <div class="d-flex mt-1 align-items-end">
        <span class="note-date-text">
          {{ timeElapsedString }}
          <span
            v-if="note.isRevised"
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
import UserHeaderText from '@/components/UserHeaderText.vue';

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
    UserHeaderText,
  },
  props: {
    note: {
      type: Object,
      required: true,
    },
  },
  computed: {
    timeElapsedString() {
      return formatActivityDate(this.note.createdAt);
    },
  },
};

</script>

<style lang="scss" scoped>
@import '@/scss/colors-semantic-tokens.scss';
@import '@/scss/colors-base-tokens.scss';

.note-container {
  padding: 1rem 1.25rem;
}

.text-gray-500 {
  color: $raw-gray-500
}

.note-date-text {
  font-size:0.75rem;
}

.note-date-text:first-letter {
  text-transform: capitalize;
}

.text-gray-600 {
  color: $raw-gray-600;
  font-weight: 400;
}

.note_vertical:before {
  content: "";
  background: $raw-gray-600;
  height: calc(100% - .5rem);
  width: 1px;
  position: absolute;
  left: calc(2.5rem / 2);
  top: 0.375rem;
  bottom: 0;
}

</style>
