<template>
  <section>
    <!-- Note Edit -->
    <div
      v-if="editingNote"
      data-test-edit-form
      class="d-flex note-edit-container"
    >
      <UserAvatar
        size="2.5rem"
        :user-name="loggedInUser.name"
        :color="loggedInUser.avatar_color"
      />
      <b-form-group class="mx-3 mb-2 flex-grow-1 position-relative">
        <b-form-textarea
          ref="noteTextarea"
          v-model="noteText"
          class="note-textarea"
          placeholder="Leave a note with tips or barriers to applying..."
          rows="2"
          max-rows="8"
          :formatter="formatter"
          :disabled="savingNote"
          data-test-note-input
          @keydown="handleKeyDown"
        />
        <b-button
          ref="submitNoteBtn"
          variant="link"
          class="note-send-btn position-absolute px-2"
          :disabled="noteSendBtnDisabled"
          data-test-submit-btn
          @click="submitNote"
        >
          <b-icon
            class="p-0"
            icon="send"
          />
        </b-button>

        <template #description>
          <div class="d-flex">
            <small class="pl-2">
              e.g. need co-applicants, we applied last year
            </small>
            <div :class="charCountClass">
              {{ filteredNoteText.length }} / 300
            </div>
          </div>
        </template>
      </b-form-group>
    </div>

    <!-- Current User's Note -->
    <UserActivityItem
      v-if="userNote && !editingNote"
      :class="userNoteClass"
      :user-name="userNote.user.name"
      :user-email="userNote.user.email"
      :team-name="userNote.user.team.name"
      :avatar-color="userNote.user.avatarColor"
      :created-at="userNote.createdAt"
      :is-edited="userNote.isRevised"
      copy-email-enabled
      data-test-user-note-id="userNote.id"
    >
      {{ userNote.text }}
      <template #actions>
        <b-dropdown
          right
          variant="link"
          toggle-class="p-0"
          no-caret
          :disabled="savingNote"
        >
          <template #button-content>
            <span class="note-edit-btn">
              <b-icon
                icon="pencil-square"
                class="mr-1"
              />
              <span class="note-edit-btn-text">EDIT</span>
            </span>
          </template>
          <b-dropdown-item-button
            title="Edit note"
            data-test-edit-note-btn
            @click="toggleEditNote"
          >
            Edit
          </b-dropdown-item-button>
          <b-dropdown-item-button
            title="Delete note"
            variant="danger"
            data-test-delete-note-btn
            @click="deleteUserNote"
          >
            Delete
          </b-dropdown-item-button>
        </b-dropdown>
      </template>
    </UserActivityItem>

    <!-- Other Notes -->
    <ul class="list-unstyled mb-0">
      <li
        v-for="note of otherNotes"
        :key="note.id"
      >
        <UserActivityItem
          class="activity-container"
          :user-name="note.user.name"
          :user-email="note.user.email"
          :team-name="note.user.team.name"
          :avatar-color="note.user.avatarColor"
          :created-at="note.createdAt"
          :is-edited="note.isRevised"
          copy-email-enabled
          :data-test-other-note-id="note.id"
        >
          {{ note.text }}
        </UserActivityItem>
      </li>
    </ul>

    <div
      v-if="loadMoreVisible"
      class="px-3 mb-3 mt-1"
    >
      <b-button
        block
        size="md"
        variant="light"
        class="show-more-btn"
        data-test-show-more-btn
        @click="fetchNextNotes"
      >
        Show More Notes
      </b-button>
    </div>
  </section>
</template>

<script>
import { nextTick } from 'vue';
import { mapActions, mapGetters } from 'vuex';
import UserAvatar from '@/components/UserAvatar.vue';
import UserActivityItem from '@/components/UserActivityItem.vue';
import { grantNotesLimit } from '@/helpers/featureFlags';

export default {
  components: {
    UserAvatar,
    UserActivityItem,
  },
  emits: ['noteSaved'],
  data() {
    return {
      otherNotes: [],
      userNote: null,
      noteText: '',
      savingNote: false,
      editingNote: false,
      notesNextCursor: null,
    };
  },
  computed: {
    ...mapGetters({
      loggedInUser: 'users/loggedInUser',
      currentGrant: 'grants/currentGrant',
    }),
    loadMoreVisible() {
      return this.notesNextCursor !== null;
    },
    filteredNoteText() {
      return this.noteText.trim();
    },
    emptyNoteText() {
      return this.filteredNoteText.length === 0;
    },
    noteSendBtnDisabled() {
      return this.emptyNoteText || this.savingNote;
    },
    charCountClass() {
      const errColor = this.filteredNoteText.length === 300 ? 'text-error' : '';

      return `ml-auto ${errColor}`;
    },
    userNoteClass() {
      const corners = this.otherNotes.length === 0 ? 'rounded-bottom-corners' : '';

      return `user-note activity-container ${corners}`;
    },
  },
  async beforeMount() {
    this.fetchUsersNote();
    this.fetchNextNotes();
  },
  methods: {
    ...mapActions({
      getNotesForGrant: 'grants/getNotesForGrant',
      getNotesForCurrentUser: 'grants/getNotesForCurrentUser',
      saveNoteForGrant: 'grants/saveNoteForGrant',
      deleteGrantNoteForUser: 'grants/deleteGrantNoteForUser',
    }),
    formatter(value) {
      return value.substring(0, 300);
    },
    async toggleEditNote() {
      this.editingNote = true;

      await nextTick();
      this.$refs.noteTextarea.focus();
    },
    handleKeyDown(e) {
      if (e.key === 'Enter') {
        this.$refs.submitNoteBtn.click();
      }
    },
    async submitNote() {
      this.savingNote = true;

      try {
        await this.saveNoteForGrant({ grantId: this.currentGrant.grant_id, text: this.filteredNoteText });
        this.$emit('noteSaved');
        await this.fetchUsersNote();
      } catch (e) {
        // Error already logged
      }

      this.savingNote = false;
    },
    setUserNote(result) {
      this.userNote = result && result.notes.length ? result.notes[0] : null;
      this.editingNote = !this.userNote;
      this.noteText = this.userNote ? this.userNote.text : '';
    },
    async fetchUsersNote() {
      const result = await this.getNotesForCurrentUser({ grantId: this.currentGrant.grant_id });
      this.setUserNote(result);
    },
    async fetchNextNotes() {
      const query = {
        grantId: this.currentGrant.grant_id,
        limit: grantNotesLimit(),
      };

      if (this.notesNextCursor !== null) {
        query.cursor = this.notesNextCursor;
      }

      const result = await this.getNotesForGrant(query);

      if (result) {
        const nextOtherNotes = result.notes.filter((note) => note.user.id !== this.loggedInUser.id);
        this.otherNotes = this.otherNotes.concat(nextOtherNotes);
        this.notesNextCursor = result.pagination.next;
      }
    },
    async deleteUserNote() {
      this.savingNote = true;
      try {
        await this.deleteGrantNoteForUser({ grantId: this.currentGrant.grant_id });
        this.$emit('noteSaved');
        this.setUserNote(null);
      } catch (e) {
        // Error already logged
      }
      this.savingNote = false;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/scss/colors-semantic-tokens.scss';
@import '@/scss/colors-base-tokens.scss';

.user-note {
  background: $raw-blue-50
}

.text-gray-500 {
  color: $raw-gray-500
}

.text-error {
  color: $negative-hover
}

textarea.note-textarea {
  overflow: visible !important;
  padding-right: 2.25rem;
}

.activity-container {
  padding: 1.25rem;
}

textarea.note-textarea::placeholder {
  font-size: 0.875rem
}

.note-edit-container {
  padding: 1rem 1.25rem 0.25rem;
}

.note-edit-btn {
  vertical-align: middle;
  color: $raw-gray-500
}

.note-edit-btn-text {
  font-size: 0.75rem;
}

.note-send-btn {
  bottom: 1.5625rem;
  right: 0;
}

.show-more-btn {
  border-color: $raw-gray-300;
  font-size: 0.875rem;
}

.rounded-bottom-corners {
  border-bottom-left-radius: .5rem !important;
  border-bottom-right-radius: .5rem !important;
}
</style>
