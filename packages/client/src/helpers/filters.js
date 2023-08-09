// fields with ⚠️ are not yet implemented in the api
const FILTER_FIELD_NAME_MAP = {
  costSharing: 'Cost Sharing',
  opportunityStatuses: 'Opportunity Statuses',
  opportunityCategories: 'Opportunity Categories',
  reviewStatus: 'Review Status',
  includeKeywords: 'Include ⚠️',
  excludeKeywords: 'Exclude ⚠️',
  opportunityNumber: 'Opportunity Number ⚠️',
  postedWithin: 'Posted Within ⚠️',
  fundingType: 'Funding Type ⚠️',
  eligibility: 'Eligibility ⚠️',
};

export function formatFilterDisplay(criteria) {
  const filters = [];
  Object.entries(criteria).forEach(([key, value]) => {
    if (value && FILTER_FIELD_NAME_MAP[key]) {
      // if it's an array, make sure it's not empty
      if (Array.isArray(value) && value.length === 0) {
        return;
      }
      filters.push({
        label: FILTER_FIELD_NAME_MAP[key],
        key,
        value,
      });
    }
  });

  return filters;
}
