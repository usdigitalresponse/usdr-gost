/**
 * Helper to manage deprecation warnings from the Vue 2 compat layer in Vue 3.
 *
 * While we're relying on the compat layer, it will emit console warnings for any deprecated syntax
 * usage. Much of this is related to our usage of the bootstrap-vue library, which is a long-term
 * project to upgrade or migrate off, so we want to filter that noise out. For the remaining
 * meaningful deprecation warnings, we want to log the ones we're seeing so we can disable new
 * deprecated syntax usage and create a burndown list of the existing usages.
 *
 * The structure of a Vue 2 deprecation warning looks like this:
 *
 * [Vue warn]: (deprecation RENDER_FUNCTION) (21)
 * at <OpenIndicator tag="component" ref="openIndicator" role="presentation"  ... >
 * at <VSelect id="funding-type" options= (4) [{…}, {…}, {…}, {…}] label="name"  ... >
 * at <BFormGroup id="funding-type-group" label="Funding Type" label-for="funding-type" >
 * at <BaseTransition onBeforeEnter=fn<onBeforeEnter> onAfterEnter=fn<bound onAfterEnter5> onAfterLeave=fn<bound onAfterLeave5>  ... >
 * at <Transition onBeforeEnter=fn<bound onBeforeEnter2> onAfterEnter=fn<bound onAfterEnter5> onAfterLeave=fn<bound onAfterLeave5>  ... >
 * at <BSidebar id="search-panel" ref="searchPanelSideBar" class="search-side-panel"  ... >
 * at <BForm class="search-form" onKeyup=fn onSubmit=fn  ... >
 * at <SearchPanel ref="searchPanel" is-disabled=false search-id=0  ... >
 * at <BRow key=0 class="my-3" >
 * at <GrantsTable hide-grant-items="" >
 * at <GrantsView onVnodeUnmounted=fn<onVnodeUnmounted> ref=Ref< undefined > >
 * at <RouterView>
 * at <BaseLayout onVnodeUnmounted=fn<onVnodeUnmounted> ref=Ref< undefined > >
 * at <RouterView>
 * at <App>
 *
 * So we're using regular expressions to look for:
 *
 * 1. The `[Vue warn]: (deprecation [TYPE])` pattern in the first line tells us it's a deprecation warning
 * 2. Identify if the first element presented in the hierarchy (actually the third element of the array)
 *    is a bootstrap-vue element by checking if it's of the form <BFoo>, since all builtin library
 *    elements share that pattern.
 */

import { datadogRum } from '@datadog/browser-rum';

const warningRegex = /^\[Vue warn\]: \(deprecation (?<deprecationId>\w+)\)/;
const bootstrapVueRegex = /^\s*at <B[A-Z]\w*/;

export default function installVueCompatWarningHandler() {
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    // Short-circuit if it's not a deprecation warning, maintaining standard console.warn behavior
    const vueCompatWarning = warningRegex.exec(args[0]);
    if (vueCompatWarning === null) {
      originalConsoleWarn(...args);
      return;
    }

    const bootstrapComponentWarning = bootstrapVueRegex.exec(args[2]);
    if (bootstrapComponentWarning === null) {
      // Vue compat warnings not related to bootstrap-vue get output and logged
      if (import.meta.env.NODE_ENV !== 'production') {
        originalConsoleWarn(...args);
      }
    }
    // Log all Vue deprecation warnings in DataDog
    // ID reference: https://v3-migration.vuejs.org/migration-build.html#feature-reference
    datadogRum.addAction('Vue 3 deprecation warning', {
      deprecationId: vueCompatWarning.groups.deprecationId,
      isBootstrapVue: bootstrapComponentWarning !== null,
    });
  };
}
