import {
  describe, beforeEach, afterEach, it, expect,
} from 'vitest';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import HomeView from '@/arpa_reporter/views/HomeView.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

let store;
let wrapper;
let route;

afterEach(() => {
  store = undefined;
  wrapper = undefined;
  route = { query: { } };
});

describe('HomeView.vue', () => {
  describe('when a non-admin loads the home page', () => {
    describe('outside the reporting period', () => {
      beforeEach(() => {
        store = new Vuex.Store({
          state: { },
          getters: {
            user: () => ({ role: { name: 'not an admin' } }),
          },
        });
        wrapper = shallowMount(HomeView, {
          store,
          localVue,
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
        store = new Vuex.Store({
          state: { },
          getters: {
            user: () => ({ role: { name: 'non-admin' } }),
            viewPeriodIsCurrent: () => true,
          },
        });
        wrapper = shallowMount(HomeView, {
          store,
          localVue,
          mocks: { $route: route },
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
        store = new Vuex.Store({
          state: { },
          getters: {
            user: () => ({ role: { name: 'admin' } }),
            viewPeriodIsCurrent: () => true,
          },
        });
        route = { query: { } };
        wrapper = shallowMount(HomeView, {
          store,
          localVue,
          mocks: { $route: route },
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
        const sendAuditReportButton = wrapper.getComponent({ name: 'DownloadTemplateBtn' });
        expect(sendAuditReportButton).toBeDefined();
      });
    });
    describe('with the sync_treasury_download param', () => {
      beforeEach(() => {
        store = new Vuex.Store({
          state: { },
          getters: {
            user: () => ({ role: { name: 'admin' } }),
            viewPeriodIsCurrent: () => true,
            viewPeriod: () => ({}),
          },
        });
        route = { query: { sync_treasury_download: true } };
        wrapper = shallowMount(HomeView, {
          store,
          localVue,
          mocks: { $route: route },
        });
      });
      it('should show the Send Treasury Report button', () => {
        const sendTreasuryReportButton = wrapper.get('#sendTreasuryReportButton');
        expect(sendTreasuryReportButton.text()).toContain('Send Treasury Report by Email');
      });
    });
    describe('with the sync_audit_download param', () => {
      beforeEach(() => {
        store = new Vuex.Store({
          state: { },
          getters: {
            user: () => ({ role: { name: 'admin' } }),
            viewPeriodIsCurrent: () => true,
          },
        });
        route = { query: { sync_audit_download: true } };
        wrapper = shallowMount(HomeView, {
          store,
          localVue,
          mocks: { $route: route },
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
        store = new Vuex.Store({
          state: { },
          getters: {
            user: () => ({ role: { name: 'admin' } }),
            viewPeriodIsCurrent: () => false,
          },
        });
        route = { query: { } };
        wrapper = shallowMount(HomeView, {
          store,
          localVue,
          mocks: { $route: route },
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
