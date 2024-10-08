import LoginView from '@/views/LoginView.vue';

import {
  describe, it, expect, beforeEach,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';

describe('LoginView', () => {
  const $route = {
    query: {},
  };

  let wrapper;

  beforeEach(() => {
    wrapper = shallowMount(LoginView, {
      global: {
        mocks: {
          $route,
        },
      },
    });
  });

  it('renders', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should show the Login heading', () => {
    const heading = wrapper.find('h1');
    expect(heading.text()).toEqual('Log in to Federal Grant Finder');
  });

  it('should show error if email submitted is invalid', async () => {
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toEqual('Email address');

    await input.setValue('invalid email');

    const button = wrapper.find('b-button-stub');
    expect(button.text()).toEqual('Send me the link');

    await button.trigger('click');

    const divs = wrapper.findAll('div');
    expect(divs[2].text()).toBe('Please enter a valid email address');
  });

  // Reenable after setting up mock for the API call to /api/sessions
  it.skip('should show "check inbox" message if known email is submitted', async () => {
    const input = wrapper.find('input');
    await input.setValue('staff@example.com');

    const button = wrapper.find('b-button-stub');
    await button.trigger('click');

    const divs = wrapper.findAll('div');
    expect(divs[2].text()).toBe('Email sent to staff@example.com. Check your inbox');
  });

  // Reenable after setting up mock for the API call to /api/sessions
  it.skip('should show error message if unknown email is submitted', async () => {
    const input = wrapper.find('input');
    await input.setValue('test@test.com');

    const button = wrapper.find('b-button-stub');
    await button.trigger('click');

    const divs = wrapper.findAll('div');
    expect(divs[2].text()).toBe('User \'test@test.com\' not found');
  });

  it('should have expected hrefs and text for registration links', () => {
    const links = wrapper.findAll('a');

    const newJerseyLink = links[0];
    const nevadaLink = links[1];
    const usdrLink = links[2];
    const contactUSDREmail = links[3];

    expect(newJerseyLink.attributes('aria-label')).toEqual('link to New Jersey registration form');
    expect(newJerseyLink.attributes('href')).toEqual('https://forms.office.com/pages/responsepage.aspx?id=0cN2UAI4n0uzauCkG9ZCp7ITdp07WUhBmfHGHVfxwctUNVFJNFNPUllWSTBQNFZCQlMyMjlWWU5NUiQlQCN0PWcu&route=shorturl');

    expect(nevadaLink.attributes('aria-label')).toEqual('link to Nevada registration form');
    expect(nevadaLink.attributes('href')).toEqual('https://forms.office.com/pages/responsepage.aspx?id=5kCj5J64aE6OqhVE0nA5gBT1YIeXbrtMjy6yqM5ILm1UQVQwT0xOT1QxU0dNU1BDN05WWDdaVFRBRS4u&route=shorturl');

    expect(usdrLink.text()).toBe('connect with USDR here.');
    expect(usdrLink.attributes('href')).toEqual('https://form.jotform.com/240083950102041');

    expect(contactUSDREmail.text()).toBe('Contact USDR for support.');
    expect(contactUSDREmail.attributes('href')).toEqual('mailto:grants-helpdesk@usdigitalresponse.org?subject=Federal Grant Finder Login Issue');
  });
});
