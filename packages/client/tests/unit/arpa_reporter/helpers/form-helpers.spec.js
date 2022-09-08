import { expect } from 'chai'
import { validate } from '../../../../src/arpa_reporter/helpers/form-helpers'

describe('failing validations', () => {
  it('can require an attribute', () => {
    const columns = [{ name: 'name', required: true }]
    const record = {}
    const { messages } = validate(columns, record)
    expect(messages[0]).to.equal('Name is required')
  })
  it('can require a minimum length', () => {
    const columns = [{ name: 'id', required: true, minimumLength: 6 }]
    const record = { id: 'ABC' }
    const { messages } = validate(columns, record)
    expect(messages[0]).to.equal('Id must be at least 6 characters long')
  })
  it('can require a maximum length', () => {
    const columns = [{ name: 'id', required: true, maximumLength: 6 }]
    const record = { id: 'ABCDEFGHIJKLMNOP' }
    const { messages } = validate(columns, record)
    expect(messages[0]).to.equal('Id must be no more than 6 characters long')
  })
  it('can require a numeric value', () => {
    const columns = [{ name: 'amount', required: true, numeric: true }]
    const record = { amount: 'One' }
    const { messages } = validate(columns, record)
    expect(messages[0]).to.equal('Amount must be numeric')
  })
  it('can require a JSON string', () => {
    const columns = [{ name: 'content', required: true, json: true }]
    const record = { content: '][' }
    const { messages } = validate(columns, record)
    expect(messages[0]).to.equal(
      'Content Unexpected token ] in JSON at position 0'
    )
  })
  it('can require a pattern', () => {
    const columns = [{ name: 'id', required: true, pattern: '[A-Z][0-9]+' }]
    const record = { id: '123' }
    const { messages } = validate(columns, record)
    expect(messages[0]).to.equal('Id does not match the pattern "[A-Z][0-9]+"')
  })
})

describe('passing validations', () => {
  it('can require an attribute', () => {
    const columns = [{ name: 'name', required: true }]
    const record = { name: 'Adam' }
    const { messages } = validate(columns, record)
    expect(messages.length).to.equal(0)
  })
  it('can require a minimum length', () => {
    const columns = [{ name: 'id', required: true, minimumLength: 6 }]
    const record = { id: 'ABCDEF' }
    const { messages } = validate(columns, record)
    expect(messages.length).to.equal(0)
  })
  it('can require a maximum length', () => {
    const columns = [{ name: 'id', required: true, maximumLength: 6 }]
    const record = { id: 'ABCDEF' }
    const { messages } = validate(columns, record)
    expect(messages.length).to.equal(0)
  })
  it('can require a numeric value', () => {
    const columns = [{ name: 'amount', required: true, numeric: true }]
    const record = { amount: '100' }
    const { messages } = validate(columns, record)
    expect(messages.length).to.equal(0)
  })
  it('can require a JSON string', () => {
    const columns = [{ name: 'content', required: true, json: true }]
    const record = { content: '{"size": "large"}' }
    const { messages } = validate(columns, record)
    expect(messages.length).to.equal(0)
  })
  it('can require a pattern', () => {
    const columns = [{ name: 'id', required: true, pattern: '[A-Z][0-9]+' }]
    const record = { id: 'A123' }
    const { messages } = validate(columns, record)
    expect(messages.length).to.equal(0)
  })
})

// NOTE: This file was copied from tests/unit/helpers/form-helpers.spec.js (git @ d124c44d0e) in the arpa-reporter repo on 2022-09-08T23:48:24.330Z
