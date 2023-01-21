const { expect } = require('chai')
const { mock } = require('sinon')
const fs = require('fs/promises')

const XLSX = require('xlsx')
const {
  _uploadFSName,
  _jsonFSName,
  _persistJson,
  _jsonForUpload,
  persistUpload,
  workbookForUpload,
} = require('../../../../src/arpa_reporter/services/persist-upload')

const MOCK_WORKBOOK = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(MOCK_WORKBOOK, XLSX.utils.aoa_to_sheet([[0, 1, 2]]), 'sheet_1');

describe('persist-upload', () => {
  describe('uploadFSName', () => {
    it('generates a filesystem name based on upload ID', () => {
      expect(
        _uploadFSName({
          id: 'abcd',
          filename: 'upload01.xlsm',
        }),
      ).include('abcd.xlsm')
    })
  })

  describe('jsonFSName', () => {
    it('generates a filesystem name based on upload ID', () => {
      expect(_jsonFSName({ id: 'abcd', filename: 'upload01.xlsm' })).include(
        'abcd.json',
      )
    })
  })

  describe('persistJson', () => {
    let fsMock
    beforeEach(() => {
      fsMock = mock(fs)
    })

    afterEach(() => {
      fsMock.restore()
    })

    it('serializes a workbook object and saves it to disk', async () => {
      const upload = { id: 'abcd', filename: 'upload01.xlsm' }
      fsMock.expects('mkdir').once()
      fsMock.expects('writeFile').once().withArgs(_jsonFSName(upload))
      await _persistJson(upload, MOCK_WORKBOOK)
      fsMock.verify()
    })
  })

  describe('jsonForUpload', () => {
    it('serializing and deserializing an upload are reversible', async () => {
      const upload = { id: 'abcd', filename: 'upload01.xlsm' }
      await _persistJson(upload, MOCK_WORKBOOK)
      const workbook = await _jsonForUpload(upload)
      expect(workbook).deep.equal(MOCK_WORKBOOK)
    })

    it('preserves Date objects', async () => {
      const upload = { id: 'efgh', filename: 'upload02.xlsm' }
      const mockWorkbook = { ...MOCK_WORKBOOK, date: new Date(0) }
      await _persistJson(upload, mockWorkbook)
      const workbook = await _jsonForUpload(upload)
      expect(workbook).deep.equal(mockWorkbook)
      expect(workbook.date instanceof Date).is.true
    })
  })
})
