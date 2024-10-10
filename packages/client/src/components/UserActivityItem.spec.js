import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import UserActivityItem from '@/components/UserActivityItem.vue';
import { id } from '@/helpers/testHelpers';

const activity = {
  id: id(),
  createdAt: new Date().toISOString(),
  isEdited: false,
  userName: 'User',
  teamName: 'Team',
  userEmail: 'e@net.com',
  avatarColor: 'red',
};

describe('GrantNote component', () => {
  it('renders', () => {
    const wrapper = mount(UserActivityItem, {
      props: {
        ...activity,
      },
      slots: {
        default: '<div data-test-text>Text</div>',
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('[data-test-text]').exists()).toBe(true);
  });
});
