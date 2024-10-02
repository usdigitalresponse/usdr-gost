import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import GrantNote from '@/components/GrantNote.vue';
import { id } from '@/helpers/testHelpers';

const note = {
  id: id(),
  createdAt: new Date().toISOString(),
  isRevised: true,
  text: 'Text',
  grant: { id: id() },
  user: {
    id: id(),
    name: 'User',
    email: 'email@net',
    avatarColor: 'red',
    team: {
      id: id(),
      name: 'Team',
    },
    organization: {
      id: id(),
      name: 'Org',
    },
  },
};

describe('GrantNote component', () => {
  it('renders', () => {
    const wrapper = mount(GrantNote, {
      props: {
        note,
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
