<template>
  <div class="d-flex">
    <UserAvatar
      :user-name="note.user.name"
      size="2.5rem"
    />
    <div class="d-flex flex-column flex-grow-1 has-flexi-truncate ml-2">
      <div class="d-flex align-items-center text-nowrap">
        <span class="font-weight-bold">{{ note.user.name }}</span>
        <span class="mx-1">&bull;</span>
        <span
          class="text-truncate text-gray-500"
          :title="note.user.team.name"
        >{{ note.user.team.name }}</span>
      </div>
      <div class="text-gray-500">
        {{ note.user.email }}
      </div>
      <div class="mt-1 text-gray-600">
        {{ note.text }}
      </div>
      <div class="d-flex mt-1">
        <div class="mt-2">
          {{ timeElapsedString }}
        </div>
        <div class="ml-auto">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import UserAvatar from '@/components/UserAvatar.vue';
import { ISO_DATE } from '@/helpers/dates';

export const formatNoteFollowDate = (createdAtTimestamp) => {
  const createdDate = moment(moment(createdAtTimestamp).format(ISO_DATE));
  let dateText = '';
  if (createdDate.isSame(moment(), 'day')) {
    dateText = 'Today';
  } else if (createdDate.isAfter(moment().subtract(7, 'days'))) {
    const dayCount = moment().diff(createdDate, 'days');
    dateText = `${dayCount} ${dayCount === 1 ? 'day' : 'days'} ago`;
  } else {
    dateText = createdDate.format('MMMM D');
  }

  return dateText;
};

export default {
  components: {
    UserAvatar,
  },
  props: {
    note: {
      type: Object,
      required: true,
    },
  },
  computed: {
    timeElapsedString() {
      return formatNoteFollowDate(this.note.createdAt);
    },
  },
};

</script>

<style lang="scss" scoped>
@import '@/scss/colors-semantic-tokens.scss';
@import '@/scss/colors-base-tokens.scss';

.text-gray-500 {
  color: $raw-gray-500
}

.text-gray-600 {
  color: $raw-gray-600;
  font-weight: 400;
}

.has-flexi-truncate {
  -webkit-box-flex: 1;
  -ms-flex: 1 1 0%;
  flex: 1 1 0%;
  min-width: 0;
}
</style>
