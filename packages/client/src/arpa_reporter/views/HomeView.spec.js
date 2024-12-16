import {
  describe, beforeEach, afterEach, it, expect, vi,
} from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import HomeView from '@/arpa_reporter/views/HomeView.vue';
import {
  fireEvent, render, screen, cleanup,
} from '@testing-library/vue';
import userEvent from '@testing-library/user-event';

import * as handlers from '@/arpa_reporter/store';

let store;
let wrapper;
let route;

afterEach(() => {
  store = undefined;
  wrapper = undefined;
  route = { query: { } };
  cleanup();
  vi.clearAllMocks();
});

describe('HomeView.vue', () => {
  describe('when a non-admin loads the home page', () => {
    describe('outside the reporting period', () => {
      beforeEach(() => {
        store = createStore({
          state: { },
          getters: {
            user: () => ({ role: { name: 'not an admin' } }),
          },
        });
        wrapper = shallowMount(HomeView, {
          global: {
            plugins: [store],
          },
        });
      });
      it('should show the Welcome text', () => {
        const welcomeToArpaReporter = wrapper.get('#welcomeToArpaReporter');
        expect(welcomeToArpaReporter.text()).toContain('Welcome to the ARPA reporter');
      });
      it('should show the reporting period as closed', () => {
        const reportingPeriodClosed = wrapper.get('#closedReportingPeriodMessage');
        expect(reportingPeriodClosed.text()).toContain('This reporting period is closed.');
      });
      it('should not show a download button', () => {
        const sendTreasuryReportButton = wrapper.find('#sendTreasuryReportButton');
        expect(sendTreasuryReportButton.exists()).not.toBe(true);
      });
    });
    describe('during the reporting period', () => {
      beforeEach(() => {
        store = createStore({
          state: { },
          getters: {
            user: () => ({ role: { name: 'non-admin' } }),
            viewPeriodIsCurrent: () => true,
          },
        });
        wrapper = shallowMount(HomeView, {
          global: {
            plugins: [store],
            mocks: { $route: route },
          },
        });
      });
      it('should show the submit workbook button', () => {
        const submitWorkbookButton = wrapper.get('#submitWorkbookButton');
        expect(submitWorkbookButton.text()).toContain('Submit Workbook');
      });
    });
  });
  describe('when an admin loads the home page during the reporting period', () => {
    describe('without query params', () => {
      beforeEach(() => {
        store = createStore({
          state: { },
          getters: {
            user: () => ({ role: { name: 'admin' } }),
            viewPeriodIsCurrent: () => true,
          },
        });
        route = { query: { } };
        wrapper = shallowMount(HomeView, {
          global: {
            plugins: [store],
            mocks: { $route: route },
          },
        });
      });
      it('should show the submit workbook button', () => {
        const submitWorkbookButton = wrapper.get('#submitWorkbookButton');
        expect(submitWorkbookButton.text()).toContain('Submit Workbook');
      });
      it('should show the Send Treasury Report by Email Button', () => {
        const sendTreasuryReportButton = wrapper.get('#sendTreasuryReportButton');
        expect(sendTreasuryReportButton.text()).toContain('Send Treasury Report by Email');
      });
      it('should show the DownloadTemplateBtn', () => {
        const sendAuditReportButton = wrapper.findComponent({ name: 'download-template-btn' });
        expect(sendAuditReportButton.exists()).toBe(true);
      });
    });
    describe('with the sync_treasury_download param', () => {
      beforeEach(() => {
        store = createStore({
          state: { },
          getters: {
            user: () => ({ role: { name: 'admin' } }),
            viewPeriodIsCurrent: () => true,
            viewPeriod: () => ({}),
          },
        });
        route = { query: { sync_treasury_download: true } };
        wrapper = shallowMount(HomeView, {
          global: {
            plugins: [store],
            mocks: { $route: route },
          },
        });
      });
      it('should show the Send Treasury Report button', () => {
        const sendTreasuryReportButton = wrapper.get('#sendTreasuryReportButton');
        expect(sendTreasuryReportButton.text()).toContain('Send Treasury Report by Email');
      });
    });
    describe('with the sync_audit_download param', () => {
      beforeEach(() => {
        store = createStore({
          state: { },
          getters: {
            user: () => ({ role: { name: 'admin' } }),
            viewPeriodIsCurrent: () => true,
          },
        });
        route = { query: { sync_audit_download: true } };
        wrapper = shallowMount(HomeView, {
          global: {
            plugins: [store],
            mocks: { $route: route },
          },
        });
      });
      it('should show the Send Treasury Report button', () => {
        const sendTreasuryReportButton = wrapper.get('#sendTreasuryReportButton');
        expect(sendTreasuryReportButton.text()).toContain('Send Treasury Report by Email');
      });
    });
  });
  describe('when an admin loads the home page outside the reporting period', () => {
    describe('without query params', () => {
      beforeEach(() => {
        store = createStore({
          state: { },
          getters: {
            user: () => ({ role: { name: 'admin' } }),
            viewPeriodIsCurrent: () => false,
          },
        });
        route = { query: { } };
        wrapper = shallowMount(HomeView, {
          global: {
            plugins: [store],
            mocks: { $route: route },
          },
        });
      });
      it('should not show the submit workbook button', () => {
        const submitWorkbookButton = wrapper.find('#submitWorkbookButton');
        expect(submitWorkbookButton.exists()).not.toBe(true);
      });
      it('should show the Send Treasury Report by Email Button', () => {
        const sendTreasuryReportButton = wrapper.get('#sendTreasuryReportButton');
        expect(sendTreasuryReportButton.text()).toContain('Send Treasury Report by Email');
      });
      it('should show the reporting period as closed', () => {
        const reportingPeriodClosed = wrapper.get('#closedReportingPeriodMessage');
        expect(reportingPeriodClosed.text()).toContain('This reporting period is closed.');
      });
    });
  });
});
describe('HomeView.vue - react testing tests', () => {
  describe('when a non-admin user views the home page - react testing tests', () => {
    it('displays welcome message and closed reporting period', () => {
      const testStore = createStore({
        getters: {
          user: () => ({ role: { name: 'not an admin' } }),
        },
      });

      render(HomeView, {
        global: {
          plugins: [testStore],
        },
      });

      expect(screen.getByText(/Welcome to the ARPA reporter/i)).toBeInTheDocument();
      expect(screen.getByText(/This reporting period is closed/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Send Treasury Report/i })).not.toBeInTheDocument();
    });
  });
  describe('admin user - during reporting period', () => {
    const testStore = createStore({
      getters: {
        user: () => ({ role: { name: 'admin' } }),
        viewPeriodIsCurrent: () => true,
        viewPeriod: () => ({ id: 124 }),
      },
    });
    describe('basic view checks', () => {
      it('should show expected buttons and welcome message', () => {
        render(HomeView, {
          global: {
            plugins: [testStore],
            mocks: { $route: { query: {} } },
          },
        });
        screen.getByRole('button', { name: /Submit Workbook/i });
        screen.getByRole('link', { name: /Download Empty Template/i });
        screen.getByRole('button', { name: /Send Treasury Report by Email/i });
        screen.getByRole('button', { name: /Send Audit Report by Email/i });
        screen.getByText(/Welcome to the ARPA reporter. To get started, click the "Download Empty Template" button, above, to get a copy of an empty template for reporting./i);
        screen.getByText(/You will need to fill out one template for every EC code that your agency uses. Once you've filled out a template, please return here to submit it. To do that, click the "Submit Workbook" button, above. You can only submit workbooks for the currently-open reporting period./i);
        screen.getByText(/To view a list of all submitted workbooks, please click on the "Uploads" tab./i);
      });
      it('should push /new_upload route when Submit Workbook is clicked', async () => {
        const mockRouter = {
          push: vi.fn(),
        };

        render(HomeView, {
          global: {
            plugins: [testStore],
            mocks: {
              $route: { query: {} },
              $router: mockRouter,
            },
          },
        });
        const submitWorkbook = screen.getByRole('button', { name: /Submit Workbook/i });
        await fireEvent.click(submitWorkbook);
        expect(mockRouter.push).toHaveBeenCalledWith({ path: '/new_upload' });
      });
    });

    describe('click Send Treasury Report By Email', async () => {
      it('click Send Treasury Report By Email -  displays expected alert when error is returned', async () => {
        vi.spyOn(handlers, 'getJson').mockReturnValue(
          new Promise((resolve) => {
            resolve({
              error: 'Unable to generate treasury report and send email.',
            });
          }),
        );

        render(HomeView, {
          global: {
            plugins: [testStore],
            mocks: { $route: { query: {} } },
          },
        });

        const sendTreasuryButton = screen.getByRole('button', { name: /Send Treasury Report by Email/i });
        await fireEvent.click(sendTreasuryButton);
        screen.getByRole('alert');
        screen.getByText('Something went wrong. Unable to send an email containing the treasury report. Reach out to grants-helpdesk@usdigitalresponse.org if this happens again.');
        screen.getByRole('button', { name: /Close/i });
      });
      it('displays expected success message', async () => {
        vi.spyOn(handlers, 'getJson').mockReturnValue(
          new Promise((resolve) => {
            resolve({
              success: true,
            });
          }),
        );

        render(HomeView, {
          global: {
            plugins: [testStore],
            mocks: { $route: { query: {} } },
          },
        });

        const sendTreasuryButton = screen.getByRole('button', { name: /Send Treasury Report by Email/i });
        await fireEvent.click(sendTreasuryButton);
        screen.getByRole('alert');
        screen.getByText(/Sent. Please note, it could take up to 1 hour for this email to arrive./i);
        screen.getByRole('button', { name: /Close/i });
      });
      it('displays error message when Treasury Report fails to send', async () => {
        vi.spyOn(handlers, 'getJson').mockRejectedValue(
          new Promise((reject) => {
            reject(new Error('Failed to send report'));
          }),
        );
        const mockRouter = {
          push: vi.fn(),
        };

        const storeWithError = createStore({
          getters: {
            user: () => ({ role: { name: 'admin' } }),
            viewPeriodIsCurrent: () => true,
            viewPeriod: () => ({}),
          },
        });

        render(HomeView, {
          global: {
            plugins: [storeWithError],
            mocks: {
              $route: { path: '/' },
              $router: mockRouter,
            },
          },
        });

        const treasuryButton = screen.getByRole('button', { name: /Send Treasury Report by Email/i });
        await fireEvent.click(treasuryButton);

        screen.getByText(/Something went wrong. Unable to send an email containing the treasury report. Reach out to grants-helpdesk@usdigitalresponse.org if this happens again./i);
      });
    });
    describe('click Send Audit Report By Email', async () => {
      it('displays expected alert when error is returned', async () => {
        vi.spyOn(handlers, 'getJson').mockReturnValue(
          new Promise((resolve) => {
            resolve({
              error: 'Unable to generate audit report and send email.',
            });
          }),
        );

        render(HomeView, {
          global: {
            plugins: [testStore],
            mocks: { $route: { query: {} } },
          },
        });

        const sendAuditButton = screen.getByRole('button', { name: /Send Audit Report by Email/i });
        await fireEvent.click(sendAuditButton);
        screen.getByRole('alert');
        screen.getByText('Something went wrong. Unable to send an email containing the audit report. Reach out to grants-helpdesk@usdigitalresponse.org if this happens again.');
        await fireEvent.click(screen.getByRole('button', { name: /Close/i }));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
      it('click Send Audit Report By Email -  displays expected success message', async () => {
        const user = userEvent.setup();

        vi.spyOn(handlers, 'getJson').mockReturnValue(
          new Promise((resolve) => {
            resolve({
              success: true,
            });
          }),
        );

        render(HomeView, {
          global: {
            plugins: [testStore],
            mocks: { $route: { query: {} } },
          },
        });

        const sendAuditButton = screen.getByRole('button', { name: /Send Audit Report by Email/i });
        await fireEvent.click(sendAuditButton);
        screen.getByRole('alert');
        screen.getByText(/Sent. Please note, it could take up to 1 hour for this email to arrive./i);
        screen.getByRole('button', { name: /Close/i });
        user.keyboard('[tab]');
        await user.keyboard('[Enter]');
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
      it('displays error message when Audit Report fails to send', async () => {
        vi.spyOn(handlers, 'getJson').mockRejectedValue(
          new Promise((reject) => {
            reject(new Error('Failed to send report'));
          }),
        );
        const mockRouter = {
          push: vi.fn(),
        };

        const storeWithError = createStore({
          getters: {
            user: () => ({ role: { name: 'admin' } }),
            viewPeriodIsCurrent: () => true,
            viewPeriod: () => ({}),
          },
        });

        render(HomeView, {
          global: {
            plugins: [storeWithError],
            mocks: {
              $route: { path: '/' },
              $router: mockRouter,
            },
          },
        });

        const auditButton = screen.getByRole('button', { name: /Send Audit Report by Email/i });
        await fireEvent.click(auditButton);

        screen.getByText(/Something went wrong. Unable to send an email containing the audit report. Reach out to grants-helpdesk@usdigitalresponse.org if this happens again./i);
      });
    });
  });
});
