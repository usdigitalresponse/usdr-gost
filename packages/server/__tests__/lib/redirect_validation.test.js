const { expect } = require('chai');
const { validatePostLoginRedirectPath } = require('../../src/lib/redirect_validation');

describe('Redirect Validation Module', () => {
    context('redirect valiadtion', () => {
        it('returns null if no url is passed in', async () => {
            const result_empty = validatePostLoginRedirectPath('');
            const result_null = validatePostLoginRedirectPath(null);
            const result_undefined = validatePostLoginRedirectPath();

            expect(result_empty).to.equal(null);
            expect(result_null).to.equal(null);
            expect(result_undefined).to.equal(null);
        });
        it('returns URL if part of safe URL list', async () => {
            const grantsModalUrl = '#/grants?manageSettings=true';
            const auditReportUrl = '/api/audit_report/3/99/some-example-file.xlsx';
            const result_grants_modal = validatePostLoginRedirectPath(grantsModalUrl);
            const result_audit_report = validatePostLoginRedirectPath(auditReportUrl);

            expect(result_grants_modal).to.equal(grantsModalUrl);
            expect(result_audit_report).to.equal(auditReportUrl);
        });
        it('returns null if string that does not start with / is passed in', async () => {
            const str1 = 'abcdefg123';
            const result_str1 = validatePostLoginRedirectPath(str1);

            expect(result_str1).to.equal(null);
        });
        it('returns null if a non-safe /api route is passed in', async () => {
            const apiRoute = '/api/abcdefg123';
            const result_api_route = validatePostLoginRedirectPath(apiRoute);

            expect(result_api_route).to.equal(null);
        });
    });
});
