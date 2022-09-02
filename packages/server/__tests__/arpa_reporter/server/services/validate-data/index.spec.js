/* eslint no-unused-expressions: "off" */

const { validateData } = requireSrc(__filename)
const expect = require('chai').expect

describe.skip('validateData', () => {
  const records = [
    {
      type: 'cover',
      content: {
        'agency code': '1',
        'project id': '100'
      }
    },
    {
      type: 'subrecipient',
      content: {
        'duns number': '1001',
        'legal name': 'Acme',
        'organization type': 'Other'
      }
    },
    {
      type: 'certification',
      content: {
        'agency financial reviewer name': 'John Doe',
        'date': 44175
      }
    },
    {
      type: 'grants',
      content: {
        'compliance': 'Yes',
        'project id': '100',
        'subrecipient id': '1001',
        'award number': '1',
        'award amount': 10, // v2 validation requires >= 50K
        'current quarter obligation': 10,
        'award payment method': 'Lump Sum Payment(s)',
        'award date': 44044,
        'period of performance start date': 44050,
        'primary place of performance address line 1': '85 Pike St',
        'primary place of performance city name': 'Seattle',
        'primary place of performance country name': 'United States',
        'primary place of performance state code': 'WA'
      }
    }
  ]
  it('ignores tagged validations by default', () => {
    const reportingPeriod = {
      start_date: new Date(2020, 3, 1),
      end_date: new Date(2020, 9, 30),
      period_of_performance_end_date: new Date(2020, 12, 30),
      crf_end_date: new Date(2020, 12, 30),
      validation_rule_tags: []
    }
    const fileParts = { agencyCode: '1', projectId: '100' }
    const result = validateData(records, fileParts, reportingPeriod, {}, new Date(2020, 3, 1))
    expect(result, JSON.stringify(result)).to.be.empty
  })
  it('includes tagged validations', () => {
    const reportingPeriod = {
      start_date: new Date(2020, 3, 1),
      end_date: new Date(2020, 9, 30),
      period_of_performance_end_date: new Date(2020, 12, 30),
      crf_end_date: new Date(2020, 12, 30),
      validation_rule_tags: ['v2']
    }
    const fileParts = { agencyCode: '1', projectId: '100' }
    const result = validateData(records, fileParts, reportingPeriod, {}, new Date(2020, 3, 1))
    expect(result, JSON.stringify(result)).to.have.length(1)
    expect(result[0].info.message).to.equal('Contract amount must be at least $50,000')
  })
})

// NOTE: This file was copied from tests/server/services/validate-data/index.spec.js (git @ 98c1aa2586) in the arpa-reporter repo on 2022-09-02T05:09:55.179Z
