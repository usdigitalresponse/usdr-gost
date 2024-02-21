import { expect } from 'chai';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import Home from '../../../../src/arpa_reporter/views/Home.vue';

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

describe('Home.vue', () => {
  describe('when a non-admin loads the home page', () => {
    describe('outside the reporting period', () => {
      beforeEach(() => {
        store = new Vuex.Store({
          state: { },
          getters: {
            user: () => ({ role: { name: 'not an admin' } }),
          },
        });
        wrapper = shallowMount(Home, {
          store,
          localVue,
        });
      });
      it('should show the Welcome text', () => {
        const welcomeToArpaReporter = wrapper.get('#welcomeToArpaReporter');
        expect(welcomeToArpaReporter.text()).to.include('Welcome to the ARPA reporter');
      });
      it('should show the reporting period as closed', () => {
        const reportingPeriodClosed = wrapper.get('#closedReportingPeriodMessage');
        expect(reportingPeriodClosed.text()).to.include('This reporting period is closed.');
      });
      it('should not show a download button', () => {
        const sendTreasuryReportButton = wrapper.find('#sendTreasuryReportButton');
        expect(sendTreasuryReportButton.exists()).to.not.true;
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
        wrapper = shallowMount(Home, {
          store,
          localVue,
          mocks: { $route: route },
        });
      });
      it('should show the submit workbook button', () => {
        const submitWorkbookButton = wrapper.get('#submitWorkbookButton');
        expect(submitWorkbookButton.text()).to.include('Submit Workbook');
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
        wrapper = shallowMount(Home, {
          store,
          localVue,
          mocks: { $route: route },
        });
      });
      it('should show the submit workbook button', () => {
        const submitWorkbookButton = wrapper.get('#submitWorkbookButton');
        expect(submitWorkbookButton.text()).to.include('Submit Workbook');
      });
      it('should show the Send Treasury Report by Email Button', () => {
        const sendTreasuryReportButton = wrapper.get('#sendTreasuryReportButton');
        expect(sendTreasuryReportButton.text()).to.include('Send Treasury Report by Email');
      });
      it('should show the DownloadTemplateBtn', () => {
        const sendAuditReportButton = wrapper.getComponent({ name: 'DownloadTemplateBtn' });
        expect(sendAuditReportButton).not.to.be.undefined;
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
        wrapper = shallowMount(Home, {
          store,
          localVue,
          mocks: { $route: route },
        });
      });
      it('should show the Send Treasury Report button', () => {
        const sendTreasuryReportButton = wrapper.get('#sendTreasuryReportButton');
        expect(sendTreasuryReportButton.text()).to.include('Send Treasury Report by Email');
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
        wrapper = shallowMount(Home, {
          store,
          localVue,
          mocks: { $route: route },
        });
      });
      it('should show the Send Treasury Report button', () => {
        const sendTreasuryReportButton = wrapper.get('#sendTreasuryReportButton');
        expect(sendTreasuryReportButton.text()).to.include('Send Treasury Report by Email');
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
        wrapper = shallowMount(Home, {
          store,
          localVue,
          mocks: { $route: route },
        });
      });
      it('should not show the submit workbook button', () => {
        const submitWorkbookButton = wrapper.find('#submitWorkbookButton');
        expect(submitWorkbookButton.exists()).to.not.true;
      });
      it('should show the Send Treasury Report by Email Button', () => {
        const sendTreasuryReportButton = wrapper.get('#sendTreasuryReportButton');
        expect(sendTreasuryReportButton.text()).to.include('Send Treasury Report by Email');
      });
      it('should show the reporting period as closed', () => {
        const reportingPeriodClosed = wrapper.get('#closedReportingPeriodMessage');
        expect(reportingPeriodClosed.text()).to.include('This reporting period is closed.');
      });
    });
  });
});
