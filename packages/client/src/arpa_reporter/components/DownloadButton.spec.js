import DownloadButton from '@/arpa_reporter/components/DownloadButton.vue';
import { render, screen } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';

// TODO: Investigate and un-skip (https://github.com/usdigitalresponse/usdr-gost/issues/3259)
describe.skip('DownloadButton component', () => {
  it('renders', () => {
    const wrapper = shallowMount(DownloadButton, {
      props: {
        href: 'https://www.usdigitalresponse.org/',
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
  it('renders a button', () => {
    render(DownloadButton, {
      props: {
        href: 'https://www.usdigitalresponse.org/',
      },
    });
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
  it('renders a button with the correct text', () => {
    render(DownloadButton, {
      props: {
        href: 'https://www.usdigitalresponse.org/',
      },
    });
    screen.getByRole('button', { name: 'Download Template' });
  });
  it('renders a button with the correct href', () => {
    render(DownloadButton, {
      props: {
        href: 'https://www.usdigitalresponse.org/',
      },
    });
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('href', 'https://www.usdigitalresponse.org/');
  });
});
