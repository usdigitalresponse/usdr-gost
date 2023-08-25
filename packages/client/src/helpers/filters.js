// fields with ⚠️ are not yet implemented in the api
const FILTER_FIELD_NAME_MAP = {
  includeKeywords: 'Include',
  excludeKeywords: 'Exclude',
  opportunityNumber: 'Opportunity Number',
  opportunityStatuses: 'Opportunity Statuses',
  fundingType: 'Funding Type',
  agency: 'Agency Code',
  costSharing: 'Cost Sharing',
  opportunityCategories: 'Opportunity Categories',
  reviewStatus: 'Review Status',
  postedWithin: 'Posted Within',
  eligibility: 'Eligibility',
};

export function formatFilterDisplay(criteria) {
  const filters = [];
  Object.entries(criteria).forEach(([key, value]) => {
    if (value && FILTER_FIELD_NAME_MAP[key]) {
      // if it's an array, make sure it's not empty
      if (Array.isArray(value) && value.length === 0) {
        return;
      }
      let newVal = value;
      if (['includeKeywords', 'opportunityStatuses', 'opportunityCategories', 'reviewStatus'].includes(key)) {
        if (typeof (value) === 'string') {
          newVal = value.split(',').join(' or ');
        } else if (Array.isArray(value)) {
          newVal = value.join(' or ');
        }
      } else if (key === 'excludeKeywords') {
        newVal = value.split(',').join(' and ');
      } else if (key === 'eligibility') {
        newVal = value.map((i) => i.label).join(' or ');
      }

      filters.push({
        label: FILTER_FIELD_NAME_MAP[key],
        key,
        value: newVal,
      });
    }
  });

  return filters;
}
