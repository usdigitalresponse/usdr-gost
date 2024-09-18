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
      />
      <b-form-group class="ml-2 flex-grow-1 position-relative">
        <b-form-textarea
          id="note-text-input"
          v-model="noteText"
          class="note-textarea"
          placeholder="Leave a note with tips or barriers to applying..."
          rows="2"
          max-rows="8"
          :formatter="formatter"
          autofocus
          :disabled="submittingNote"
          @keydown="handleKeyDown"
        />
        <b-button
          ref="submitNoteBtn"
          variant="link"
          class="note-send-btn text-weak position-absolute px-2"
          :disabled="noteSendBtnDisabled"
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
      class="user-note mb-1"
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
    <ul class="list-unstyled">
      <li
        v-for="note of notes"
        :key="note.id"
      >
        <GrantNote :note="note" />
      </li>
    </ul>

    <div class="px-3 mb-3">
      <b-button
        block
        size="md"
        variant="light"
        class="show-more-btn"
      >
        Show More Notes
      </b-button>
    </div>
  </section>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import UserAvatar from '@/components/UserAvatar.vue';
import GrantNote from '@/components/GrantNote.vue';

export default {
  components: {
    UserAvatar,
    GrantNote,
  },
  data() {
    return {
      notes: [],
      userNote: null,
      noteText: '',
      submittingNote: false,
      editingNote: false,
    };
  },
  computed: {
    ...mapGetters({
      loggedInUser: 'users/loggedInUser',
      currentGrant: 'grants/currentGrant',
    }),
    noteSendBtnDisabled() {
      return this.noteText.length === 0 || this.submittingNote;
    },
    charCountClass() {
      const errColor = this.noteText.length === 300 ? 'text-error' : '';

      return `ml-auto ${errColor}`;
    },
  },
  async beforeMount() {
    this.fetchUsersNote();
    this.fetchAllNotes();
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
    toggleEditNote() {
      this.editingNote = true;
      this.noteText = this.userNote.text;
    },
    handleKeyDown(e) {
      if (e.key === 'Enter') {
        this.$refs.submitNoteBtn.click();
      }
    },
    submitNote() {
      this.submittingNote = true;
      this.saveNoteForGrant({ grantId: this.currentGrant.grant_id, text: this.noteText })
        .then(async () => {
          await this.fetchUsersNote();
        })
        .catch(() => {
          // Error already logged
        })
        .finally(() => {
          this.submittingNote = false;
        });
    },
    async fetchUsersNote() {
      const result = await this.getNotesForCurrentUser({ grantId: this.currentGrant.grant_id });

      this.userNote = result && result.notes.length ? result.notes[0] : null;
      this.editingNote = !this.userNote;
    },
    async fetchAllNotes() {
      const result = await this.getNotesForGrant({ grantId: this.currentGrant.grant_id, limit: 51 });

      if (result) {
        this.notes = result.notes;
        console.log(result);
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
  padding: 1rem 1.25rem;
}

.note-edit-btn {
  font-size: 0.875rem;
  color: $raw-gray-500
}

.note-send-btn {
  bottom: 1.5625rem;
  right: 0;
  color: $border;
}

.show-more-btn {
  border-color: $raw-gray-300;
  font-size:0.875rem;
}
</style>
