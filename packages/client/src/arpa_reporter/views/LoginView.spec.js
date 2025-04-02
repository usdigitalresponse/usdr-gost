import LoginView from '@/arpa_reporter/views/LoginView.vue';

import {
  describe, it, afterEach, vi, expect,
} from 'vitest';
import {
  fireEvent, render, screen, cleanup, waitFor,
} from '@testing-library/vue';

const mockPost = vi.fn();
global.fetch = mockPost;

describe('LoginView component', () => {
  const $route = {
    query: {},
  };

  const mockRouter = {
    push: vi.fn(),
    resolve: vi.fn().mockReturnValue({
      href: '/arpa_reporter/',
    }),
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockPost.mockClear();
  });

  it('it displays expected elements and handles successful login request', async () => {
    mockPost.mockResolvedValueOnce(
      new Promise((resolve) => {
        resolve({
          ok: true,
          success: true,
          json: () => Promise.resolve({ message: 'Email sent to grant-admin@usdigitalresponse.org. Check your inbox', success: true }),
        });
      }),
    );

    render(LoginView, {
      global: {
        mocks: {
          $route,
          $http: { post: mockPost },
          $router: mockRouter,
        },
      },
    });

    screen.getByRole('heading', { name: /ARPA Reporter Login/i, level: 1 });
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const submitButton = screen.getByRole('button');

    await fireEvent.update(emailInput, 'grant-admin@usdigitalresponse.org');
    await fireEvent.click(submitButton);

    await waitFor(() => screen.getByText(/Email sent to grant-admin@usdigitalresponse.org. Check your inbox/i));
  });

  it('handles login error response', async () => {
    mockPost.mockResolvedValueOnce(
      new Promise((resolve) => {
        resolve({
          ok: true,
          success: true,
          json: () => Promise.resolve({ message: 'User "test@eexample.com" not found', success: true }),
        });
      }),
    );

    render(LoginView, {
      global: {
        mocks: {
          $route,
          $http: { post: mockPost },
          $router: mockRouter,
        },
      },
    });

    const emailInput = screen.getByPlaceholderText(/email address/i);
    const submitButton = screen.getByRole('button');

    await fireEvent.update(emailInput, 'test@example.com');
    await fireEvent.click(submitButton);

    await waitFor(() => screen.getByText(/User "test@eexample.com" not found/i));
  });

  it('validates email format before submission', async () => {
    render(LoginView, {
      global: {
        mocks: {
          $route,
          $http: { post: mockPost },
          $router: mockRouter,
        },
      },
    });

    const emailInput = screen.getByPlaceholderText(/email address/i);
    const submitButton = screen.getByRole('button');

    await fireEvent.update(emailInput, 'invalid-email');
    await fireEvent.click(submitButton);

    expect(mockPost).not.toHaveBeenCalled();
    screen.getByText(/please enter a valid email/i);
  });
  it('handles login error status', async () => {
    mockPost.mockResolvedValueOnce(
      new Promise((resolve) => {
        resolve({
          ok: false,
          success: true,
          statusText: 'Unable to connect to the server',
          status: 500,
          json: () => Promise.resolve({ }),
        });
      }),
    );

    render(LoginView, {
      global: {
        mocks: {
          $route,
          $http: { post: mockPost },
          $router: mockRouter,
        },
      },
    });

    const emailInput = screen.getByPlaceholderText(/email address/i);
    const submitButton = screen.getByRole('button');

    await fireEvent.update(emailInput, 'test@example.com');
    await fireEvent.click(submitButton);

    await waitFor(() => screen.getByText(/login: Unable to connect to the server \(500\)/i));
  });
});
