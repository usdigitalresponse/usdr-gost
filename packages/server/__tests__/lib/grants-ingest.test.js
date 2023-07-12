const _ = require('lodash');
const { expect } = require('chai');
const moment = require('moment');
const sinon = require('sinon');
const { processMessages, receiveNextMessageBatch } = require('../../src/lib/grants-ingest');

describe('processMessages', async () => {
    const queueUrl = 'https://sqs.us-west-2.amazonaws.com/123456789012/grants-ingest-events';
    let knexQuery;
    let knexStub;
    let sqsStub;

    const serlializeGrantEvent = (newData = {}, prevData = {}) => {
        const eventData = { detail: { versions: { new: newData, previous: prevData } } };
        if (newData !== {} && prevData !== {}) {
            eventData.detail.type = 'update';
        } else if (newData !== {}) {
            eventData.detail.type = 'create';
        } else {
            eventData.detail.type = 'delete';
        }
        return JSON.stringify(eventData);
    };

    beforeEach(() => {
        knexQuery = {
            insert: sinon.stub().returnsThis(),
            onConflict: sinon.stub().returnsThis(),
            merge: sinon.stub().returnsThis(),
            where: sinon.stub().returnsThis(),
            orWhereNull: sinon.stub().returnsThis(),
            returning: sinon.stub().resolves(),
        };
        knexStub = sinon.stub().returns(knexQuery);
        sqsStub = { send: sinon.stub() };
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should process messages successfully', async () => {
        const jsonMatcher = (expectedString) => (actualString) => _.isEqual(
            JSON.parse(expectedString), JSON.parse(actualString),
        );
        const messages = [
            {
                Body: serlializeGrantEvent({
                    opportunity: {
                        id: '1',
                        number: 'for-some-reason-not-a-number',
                        title: 'Great opportunity',
                        description: 'Here is a description of this cool grant',
                        milestones: { post_date: '2023-06-05', close: { date: '2024-01-02' } },
                        category: { code: 'O', name: 'Other' },
                    },
                    agency: { code: 'ABC-ZYX-QMWN' },
                    award: { ceiling: '98765', floor: '12345' },
                    cost_sharing_or_matching_requirement: true,
                    cfda_numbers: ['12.345'],
                    eligible_applicants: [
                        { code: '00' }, { code: '01' }, { code: '02' }, { code: '03' },
                    ],
                    revision: { id: 'a1' },
                }),
                ReceiptHandle: 'receipt-handle-2',
            },
            {
                Body: serlializeGrantEvent({
                    opportunity: {
                        id: '2',
                        number: 'nope-no-numbers-here',
                        title: 'Awesome opportunity',
                        description: 'Here is a description of this awesome grant',
                        milestones: {
                            post_date: '2023-05-06',
                            close: { date: moment().subtract(7, 'days').format('YYYY-MM-DD') },
                        },
                        category: { code: 'M', name: 'Mandatory' },
                    },
                    agency: { code: 'ZYX-ABC-PZOX' },
                    award: { ceiling: '987' },
                    cost_sharing_or_matching_requirement: false,
                    cfda_numbers: ['98.765', '87.654'],
                    eligible_applicants: [
                        { code: '25' }, { code: '20' },
                        { code: '13' }, { code: '12' },
                        { code: '11' }, { code: '10' },
                    ],
                    revision: { id: 'b2' },
                }),
                ReceiptHandle: 'receipt-handle-1',
            },
            {
                Body: serlializeGrantEvent({
                    opportunity: {
                        id: '3',
                        number: 'not-a-number-either',
                        title: 'Superb opportunity',
                        description: 'Here is a description of this superb grant',
                        milestones: {
                            post_date: '2023-05-06',
                            archive_date: moment().subtract(7, 'days').format('YYYY-MM-DD'),
                        },
                        category: { code: 'M', name: 'Mandatory' },
                    },
                    agency: { code: 'CUVY-MWN-IVUB' },
                    award: { floor: '7654' },
                    cost_sharing_or_matching_requirement: false,
                    cfda_numbers: ['98.765', '87.654'],
                    eligible_applicants: [
                        { code: '25' }, { code: '20' },
                        { code: '13' }, { code: '12' },
                        { code: '11' }, { code: '10' },
                    ],
                    revision: { id: 'c3' },
                }),
                ReceiptHandle: 'receipt-handle-1',
            },
        ];

        await processMessages(knexStub, sqsStub, queueUrl, messages);

        sinon.assert.calledWithExactly(knexStub, 'grants');
        sinon.assert.callCount(knexStub, messages.length);
        sinon.assert.calledWith(knexQuery.insert, sinon.match({
            status: 'inbox',
            grant_id: '1',
            revision_id: 'a1',
            grant_number: 'for-some-reason-not-a-number',
            agency_code: 'ABC-ZYX-QMWN',
            award_ceiling: '98765',
            award_floor: '12345',
            cost_sharing: 'Yes',
            title: 'Great opportunity',
            cfda_list: '12.345',
            open_date: '2023-06-05',
            close_date: '2024-01-02',
            notes: 'auto-inserted by script',
            search_terms: '[in title/desc]+',
            reviewer_name: 'none',
            opportunity_category: 'Other',
            description: 'Here is a description of this cool grant',
            eligibility_codes: '00 01 02 03',
            opportunity_status: 'posted',
            raw_body: sinon.match(
                jsonMatcher(JSON.stringify(JSON.parse(messages[0].Body).detail.versions.new)),
            ),
        }));
        sinon.assert.calledWith(knexQuery.insert, sinon.match({
            status: 'inbox',
            grant_id: '2',
            revision_id: 'b2',
            grant_number: 'nope-no-numbers-here',
            agency_code: 'ZYX-ABC-PZOX',
            award_ceiling: '987',
            award_floor: undefined,
            cost_sharing: 'No',
            title: 'Awesome opportunity',
            cfda_list: '98.765, 87.654',
            open_date: '2023-05-06',
            close_date: moment().subtract(7, 'days').format('YYYY-MM-DD'),
            notes: 'auto-inserted by script',
            search_terms: '[in title/desc]+',
            reviewer_name: 'none',
            opportunity_category: 'Mandatory',
            description: 'Here is a description of this awesome grant',
            eligibility_codes: '25 20 13 12 11 10',
            opportunity_status: 'closed',
            raw_body: sinon.match(
                jsonMatcher(JSON.stringify(JSON.parse(messages[1].Body).detail.versions.new)),
            ),
        }));
        sinon.assert.calledWith(knexQuery.insert, sinon.match({
            status: 'inbox',
            grant_id: '3',
            revision_id: 'c3',
            grant_number: 'not-a-number-either',
            agency_code: 'CUVY-MWN-IVUB',
            award_ceiling: undefined,
            award_floor: '7654',
            cost_sharing: 'No',
            title: 'Superb opportunity',
            cfda_list: '98.765, 87.654',
            open_date: '2023-05-06',
            close_date: '2100-01-01',
            notes: 'auto-inserted by script',
            search_terms: '[in title/desc]+',
            reviewer_name: 'none',
            opportunity_category: 'Mandatory',
            description: 'Here is a description of this superb grant',
            eligibility_codes: '25 20 13 12 11 10',
            opportunity_status: 'archived',
            raw_body: sinon.match(
                jsonMatcher(JSON.stringify(JSON.parse(messages[2].Body).detail.versions.new)),
            ),
        }));
        sinon.assert.callCount(sqsStub.send, messages.length);
        sinon.assert.calledWith(sqsStub.send, sinon.match({
            input: { QueueUrl: queueUrl, ReceiptHandle: messages[0].ReceiptHandle },
        }));
        sinon.assert.calledWith(sqsStub.send, sinon.match({
            input: { QueueUrl: queueUrl, ReceiptHandle: messages[1].ReceiptHandle },
        }));
    });

    it('should skip processing message when error parsing json', async () => {
        const messages = [
            {
                Body: serlializeGrantEvent({
                    opportunity: {
                        id: '1',
                        category: { name: 'Other' },
                        milestones: { post_date: '2023-06-05' },
                    },
                    revision: { id: 'a1' },
                }),
                ReceiptHandle: 'receipt-handle-1',
            },
            {
                Body: 'invalid-json',
                ReceiptHandle: 'receipt-handle-2',
            },
        ];

        await processMessages(knexStub, sqsStub, queueUrl, messages);

        sinon.assert.calledWithExactly(knexStub, 'grants');
        sinon.assert.callCount(knexStub, 1);
        sinon.assert.calledWith(knexQuery.insert, sinon.match({ grant_id: '1' }));
        sinon.assert.callCount(sqsStub.send, 1);
        sinon.assert.calledWith(sqsStub.send, sinon.match({
            input: { QueueUrl: queueUrl, ReceiptHandle: messages[0].ReceiptHandle },
        }));
    });

    it('should not delete the sqs message when error saving grant', async () => {
        const messages = [
            {
                Body: serlializeGrantEvent({
                    opportunity: {
                        id: '1',
                        category: { name: 'Other' },
                        milestones: { post_date: '2023-06-05' },
                    },
                    revision: { id: 'a1' },
                }),
                ReceiptHandle: 'receipt-handle-1',
            },
            {
                Body: serlializeGrantEvent({
                    opportunity: {
                        id: '2',
                        category: { name: 'Mandatory' },
                        milestones: { post_date: '2023-05-06' },
                    },
                    revision: { id: 'b2' },
                }),
                ReceiptHandle: 'receipt-handle-2',
            },
        ];
        knexQuery.insert
            .withArgs(sinon.match({ grant_id: '1' }))
            .throws(new Error('Some knex error'));

        await processMessages(knexStub, sqsStub, queueUrl, messages);

        sinon.assert.calledWithExactly(knexStub, 'grants');
        sinon.assert.callCount(knexStub, 2);
        sinon.assert.calledWith(knexQuery.insert, sinon.match({ grant_id: '1' }));
        sinon.assert.callCount(sqsStub.send, 1);
        sinon.assert.calledWith(sqsStub.send, sinon.match({
            input: { QueueUrl: queueUrl, ReceiptHandle: messages[1].ReceiptHandle },
        }));
    });
});

describe('receiveNextMessageBatch', () => {
    const queueUrl = 'https://sqs.us-west-2.amazonaws.com/123456789012/grants-ingest-events';
    const receiveCommandArgs = { QueueUrl: queueUrl, WaitTimeSeconds: 20, MaxNumberOfMessages: 10 };
    let sqsStub;

    beforeEach(() => {
        sqsStub = { send: sinon.stub() };
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should receive messages successfully', async () => {
        const response = {
            Messages: [
                { MessageId: 'message-id-1' },
                { MessageId: 'message-id-2' },
            ],
        };
        sqsStub.send
            .withArgs(sinon.match({ input: receiveCommandArgs }))
            .returns(response);

        const messages = await receiveNextMessageBatch(sqsStub, queueUrl);

        sinon.assert.callCount(sqsStub.send, 1);
        expect(messages).to.deep.equal(response.Messages);
    });
    it('should return an empty array if no messages received', async () => {
        sqsStub.send
            .withArgs(sinon.match({ input: receiveCommandArgs }))
            .returns({});

        const messages = await receiveNextMessageBatch(sqsStub, queueUrl);

        expect(sqsStub.send.calledOnce).to.be.true;
        expect(messages).to.deep.equal([]);
    });

    it('should return an empty array if no messages in response', async () => {
        sqsStub.send
            .withArgs(sinon.match({ input: receiveCommandArgs }))
            .returns({ Messages: [] });

        const messages = await receiveNextMessageBatch(sqsStub, queueUrl);

        expect(sqsStub.send.calledOnce).to.be.true;
        expect(messages).to.deep.equal([]);
    });
});
