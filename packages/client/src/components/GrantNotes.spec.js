import {
  describe, it, vi, expect, beforeEach,
  vitest,
} from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createStore } from 'vuex';
import GrantNotes from '@/components/GrantNotes.vue';
import { id } from '@/helpers/testHelpers';

const CURRENT_USER_ID = id();

const getMockNotes = (count, hasMoreCursor = null, userId = id()) => ({
  notes: Array.from(Array(count), () => ({
    id: id(),
    createdAt: new Date().toISOString(),
    isRevised: true,
    text: 'Text',
    grant: {},
    user: {
      id: userId,
      name: 'User',
      email: 'email@net',
      avatarColor: 'red',
      team: {},
      organization: {},
    },
  })),
  pagination: {
    next: hasMoreCursor,
  },
});

const getMockUserNote = (count) => getMockNotes(count, null, CURRENT_USER_ID);

const mockStore = {
  getters: {
    'users/loggedInUser': vi.fn().mockImplementation(() => ({ id: CURRENT_USER_ID })),
    'grants/currentGrant': vi.fn().mockImplementation(() => ({ grant_id: 55 })),
  },
  actions: {
    'grants/getNotesForGrant': vi.fn(),
    'grants/getNotesForCurrentUser': vi.fn(),
    'grants/saveNoteForGrant': vi.fn(),
  },
};

const store = createStore(mockStore);

beforeEach(() => {
  vitest.clearAllMocks();
});

describe('GrantNotes component', () => {
  it('renders', () => {
    const wrapper = mount(GrantNotes, {
      global: { plugins: [store] },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('Correctly displays existing notes', async () => {
    const userNote = getMockUserNote(1);

    const allNotes = getMockNotes(5);
    allNotes.notes.push(userNote.notes[0]);

    mockStore.actions['grants/getNotesForCurrentUser'].mockResolvedValue(userNote);
    mockStore.actions['grants/getNotesForGrant'].mockResolvedValue(allNotes);

    const wrapper = mount(GrantNotes, {
      global: { plugins: [store] },
    });

    await flushPromises();

    const inputCmp = wrapper.findComponent('[data-test-note-input]');
    expect(inputCmp.exists()).toEqual(false);

    const userNoteCmp = wrapper.findComponent('[data-test-user-note]');
    expect(userNoteCmp.exists()).equal(true);

    const otherNoteCmps = wrapper.findAllComponents('[data-test-other-note]');
    expect(otherNoteCmps).toHaveLength(5);

    // excludes user note
    otherNoteCmps.forEach((cmp) => {
      expect(cmp.props('note').id).not.toEqual(userNote.notes[0].id);
    });
  });

  it('Correctly displays note input when user has no notes', async () => {
    const userNote = getMockUserNote(0);
    const allNotes = getMockNotes(2);

    mockStore.actions['grants/getNotesForCurrentUser'].mockResolvedValue(userNote);
    mockStore.actions['grants/getNotesForGrant'].mockResolvedValue(allNotes);

    const wrapper = mount(GrantNotes, {
      global: { plugins: [store] },
    });

    await flushPromises();

    const inputCmp = wrapper.findComponent('[data-test-note-input]');
    expect(inputCmp.exists()).toEqual(true);
  });

  it('Correctly saves grant note for user', async () => {
    const userNoteEmpty = getMockUserNote(0);
    const allNotes = getMockNotes(2);

    mockStore.actions['grants/getNotesForCurrentUser'].mockResolvedValue(userNoteEmpty);
    mockStore.actions['grants/getNotesForGrant'].mockResolvedValue(allNotes);

    const wrapper = mount(GrantNotes, {
      global: { plugins: [store] },
    });

    await flushPromises();

    const submitBtn = wrapper.findComponent('[data-test-submit-btn]');
    expect(submitBtn.element.hasAttribute('disabled')).toBe(true);

    const inputCmp = wrapper.findComponent('[data-test-note-input]');
    inputCmp.setValue('My Note');
    mockStore.actions['grants/getNotesForCurrentUser'].mockResolvedValue(getMockNotes(1));

    submitBtn.trigger('click');

    await flushPromises();

    expect(mockStore.actions['grants/saveNoteForGrant'].mock.lastCall[1].text).toEqual('My Note');
    const userNoteCmp = wrapper.findComponent('[data-test-user-note]');
    expect(userNoteCmp.exists()).equal(true);
  });

  it('Correctly retrieves more notes using "Show More"', async () => {
    const userNote = getMockUserNote(1);

    const NEXT_ID = id();
    const allNotesBatch1 = getMockNotes(2, NEXT_ID);

    mockStore.actions['grants/getNotesForCurrentUser'].mockResolvedValue(userNote);
    mockStore.actions['grants/getNotesForGrant'].mockResolvedValue(allNotesBatch1);

    const wrapper = mount(GrantNotes, {
      global: { plugins: [store] },
    });

    await flushPromises();

    const allNotesBatch2 = getMockNotes(2);
    mockStore.actions['grants/getNotesForGrant'].mockResolvedValue(allNotesBatch2);

    const showMoreBtn = wrapper.findComponent('[data-test-show-more-btn]');

    showMoreBtn.trigger('click');

    await flushPromises();

    expect(mockStore.actions['grants/getNotesForGrant'].mock.lastCall[1].paginateFrom).toEqual(NEXT_ID);
    const otherNoteCmps = wrapper.findAllComponents('[data-test-other-note]');
    expect(otherNoteCmps).toHaveLength(4);
    expect(wrapper.findComponent('[data-test-show-more-btn]').exists()).toEqual(false);
  });
});
