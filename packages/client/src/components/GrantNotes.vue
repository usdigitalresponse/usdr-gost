<template>
  <section>
    <!-- Note Edit -->
    <div
      v-if="editingNote"
      class="d-flex note-edit-container"
    >
      <UserAvatar
        :user-name="loggedInUser.name"
        size="2.5rem"
        :color="loggedInUser.avatar_color"
      />
      <b-form-group class="ml-2 mb-2 flex-grow-1 position-relative">
        <b-form-textarea
          ref="noteTextarea"
          v-model="noteText"
          class="note-textarea"
          placeholder="Leave a note with tips or barriers to applying..."
          rows="2"
          max-rows="8"
          :formatter="formatter"
          :disabled="submittingNote"
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
              {{ noteText.length }} / 300
            </div>
          </div>
        </template>
      </b-form-group>
    </div>

    <!-- Users Note -->
    <GrantNote
      v-if="userNote && !editingNote"
      data-test-user-note
      :class="userNoteClass"
      :note="userNote"
    >
      <template #actions>
        <b-button
          class="note-edit-btn p-0"
          variant="link"
          @click="toggleEditNote"
        >
          <b-icon
            icon="pencil-square"
            class="mr-1"
          />
          <span>EDIT</span>
        </b-button>
      </template>
    </GrantNote>

    <!-- Other Notes -->
    <ul class="list-unstyled mb-0">
      <li
        v-for="note of otherNotes"
        :key="note.id"
      >
        <GrantNote
          :note="note"
          data-test-other-note
        />
      </li>
    </ul>

    <div
      v-if="loadMoreVisible"
      class="px-3 mb-3"
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
import GrantNote from '@/components/GrantNote.vue';

export default {
  components: {
    UserAvatar,
    GrantNote,
  },
  emits: ['noteSaved'],
  data() {
    return {
      otherNotes: [],
      userNote: null,
      noteText: '',
      submittingNote: false,
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
    noteSendBtnDisabled() {
      return this.noteText.length === 0 || this.submittingNote;
    },
    charCountClass() {
      const errColor = this.noteText.length === 300 ? 'text-error' : '';

      return `ml-auto ${errColor}`;
    },
    userNoteClass() {
      const corners = this.otherNotes.length === 0 ? 'rounded-bottom-corners' : '';

      return `user-note ${corners}`;
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
    }),
    formatter(value) {
      return value.substring(0, 300);
    },
    async toggleEditNote() {
      this.editingNote = true;
      this.noteText = this.userNote.text;

      await nextTick();
      this.$refs.noteTextarea.focus();
    },
    handleKeyDown(e) {
      if (e.key === 'Enter') {
        this.$refs.submitNoteBtn.click();
      }
    },
    async submitNote() {
      this.submittingNote = true;

      try {
        await this.saveNoteForGrant({ grantId: this.currentGrant.grant_id, text: this.noteText });
        this.$emit('noteSaved');
        await this.fetchUsersNote();
      } catch (e) {
        // Error already logged
      }

      this.submittingNote = false;
    },
    async fetchUsersNote() {
      const result = await this.getNotesForCurrentUser({ grantId: this.currentGrant.grant_id });

      this.userNote = result && result.notes.length ? result.notes[0] : null;
      this.editingNote = !this.userNote;
    },
    async fetchNextNotes() {
      const query = {
        grantId: this.currentGrant.grant_id,
        limit: 4,
      };

      if (this.notesNextCursor !== null) {
        query.paginateFrom = this.notesNextCursor;
      }

      const result = await this.getNotesForGrant(query);

      if (result) {
        const nextOtherNotes = result.notes.filter((note) => note.user.id !== this.loggedInUser.id);
        this.otherNotes = this.otherNotes.concat(nextOtherNotes);
        this.notesNextCursor = result.pagination.next;
      }
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
  padding-right:2.25rem;
}

textarea.note-textarea::placeholder {
  font-size:0.875rem
}

.note-edit-container {
  padding: 1rem 1.25rem 0;
}

.note-edit-btn {
  font-size: 0.875rem;
  color: $raw-gray-500
}

.note-send-btn {
  bottom: 1.5625rem;
  right: 0;
}

.show-more-btn {
  border-color: $raw-gray-300;
  font-size:0.875rem;
}

.rounded-bottom-corners {
  border-bottom-left-radius: .5rem !important;
  border-bottom-right-radius: .5rem !important;
}
</style>
