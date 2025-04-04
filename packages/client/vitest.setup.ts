import { config } from '@vue/test-utils';
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

expect.extend(matchers);

const stubs = [
  'v-select',
  'b-modal',
  'b-form-input',
  'b-avatar',
  'b-overlay',
  'b-link',
  'b-icon',
  'b-row',
  'b-button',
  'b-form-group',
  'b-form-radio-group',
  'b-form',
  'b-form-radio',
  'b-form-select',
  'b-tab',
  'b-img',
  'b-nav',
  'b-navbar-brand',
  'b-dropdown-item',
  'b-dropdown-item-button',
  'b-nav-item-dropdown',
  'b-navbar-nav',
  'b-collapse',
  'b-navbar',
  'b-nav-item',
  'b-col',
  'b-breadcrumb',
  'b-form-checkbox',
  'b-card',
  'b-pagination-nav',
  'b-button-close',
  'b-form-checkbox-group',
  'b-dropdown',
  'b-table',
  'b-pagination',
  'b-sidebar',
  'b-spinner',
  'b-container',
  'b-card-img',
  'b-card-text',
  'b-tabs',
  'b-tooltip',
  'router-link',
  'b-form-textarea',
];

const directives = {
  'b-tooltip': true,
};

config.global.renderStubDefaultSlot = true;
config.global.stubs = stubs;
config.global.directives = directives;
