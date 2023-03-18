package main

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/xml"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
	"text/template"
	"time"

	goenv "github.com/Netflix/go-env"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/go-kit/log"
	"github.com/hashicorp/go-multierror"
	"github.com/johannesboyne/gofakes3"
	"github.com/johannesboyne/gofakes3/backend/s3mem"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/usdigitalresponse/usdr-gost/grants_ingest_pipeline/code/gosrc/pkg/grantData"
)

func TestOpportunityS3ObjectKey(t *testing.T) {
	opp := &opportunity{OpportunityID: "123456789"}
	assert.Equal(t, opp.S3ObjectKey(), "123/123456789/grants.gov/v2.xml")
}

func setupLambdaEnvForTesting(t *testing.T) {
	t.Helper()

	// Suppress normal lambda log output
	logger = log.NewNopLogger()

	// Configure environment variables
	goenv.Unmarshal(goenv.EnvSet{
		"GRANTS_PREPARED_DATA_BUCKET_NAME": "test-destination-bucket",
		"S3_USE_PATH_STYLE":                "true",
		"DOWNLOAD_CHUNK_LIMIT":             "10",
	}, &env)
}

func setupS3ForTesting(t *testing.T, sourceBucketName string) (*s3.Client, aws.Config, error) {
	t.Helper()

	// Start the S3 mock server and shut it down when the test ends
	backend := s3mem.New()
	faker := gofakes3.New(backend)
	ts := httptest.NewServer(faker.Server())
	t.Cleanup(ts.Close)

	cfg, _ := config.LoadDefaultConfig(
		context.TODO(),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider("TEST", "TEST", "TESTING"),
		),
		config.WithHTTPClient(&http.Client{
			Transport: &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}},
		}),
		config.WithEndpointResolverWithOptions(
			aws.EndpointResolverWithOptionsFunc(func(_, _ string, _ ...interface{}) (aws.Endpoint, error) {
				return aws.Endpoint{URL: ts.URL}, nil
			}),
		),
	)

	// Create an Amazon S3 v2 client, important to use o.UsePathStyle
	// alternatively change local DNS settings, e.g., in /etc/hosts
	// to support requests to http://<bucketname>.127.0.0.1:32947/...
	client := s3.NewFromConfig(cfg, func(o *s3.Options) { o.UsePathStyle = true })
	ctx := context.TODO()
	bucketsToCreate := []string{sourceBucketName, env.DestinationBucket}
	for _, bucketName := range bucketsToCreate {
		_, err := client.CreateBucket(ctx, &s3.CreateBucketInput{Bucket: aws.String(bucketName)})
		if err != nil {
			return client, cfg, err
		}
	}
	return client, cfg, nil
}

const SOURCE_OPPORTUNITY_TEMPLATE = `
<OpportunitySynopsisDetail_1_0>
	<OpportunityID>{{.OpportunityID}}</OpportunityID>
	<OpportunityTitle>Fun Grant</OpportunityTitle>
	<OpportunityNumber>ABCD-1234</OpportunityNumber>
	<OpportunityCategory>Some Category</OpportunityCategory>
	<FundingInstrumentType>Clarinet</FundingInstrumentType>
	<CategoryOfFundingActivity>My Funding Category</CategoryOfFundingActivity>
	<CategoryExplanation>Meow meow meow</CategoryExplanation>
	<CFDANumbers>1234.567</CFDANumbers>
	<EligibleApplicants>25</EligibleApplicants>
	<AdditionalInformationOnEligibility>This is some additional information on eligibility.</AdditionalInformationOnEligibility>
	<AgencyCode>TEST-AC</AgencyCode>
	<AgencyName>Bureau of Testing</AgencyName>
	<PostDate>09082022</PostDate>
	<CloseDate>01022023</CloseDate>
	<LastUpdatedDate>{{.LastUpdatedDate}}</LastUpdatedDate>
	<AwardCeiling>600000</AwardCeiling>
	<AwardFloor>400000</AwardFloor>
	<EstimatedTotalProgramFunding>600000</EstimatedTotalProgramFunding>
	<ExpectedNumberOfAwards>10</ExpectedNumberOfAwards>
	<Description>Here is a description of the opportunity.</Description>
	<Version>Synopsis 2</Version>
	<CostSharingOrMatchingRequirement>No</CostSharingOrMatchingRequirement>
	<ArchiveDate>02012023</ArchiveDate>
	<GrantorContactEmail>test@example.gov</GrantorContactEmail>
	<GrantorContactEmailDescription>Inquiries</GrantorContactEmailDescription>
	<GrantorContactText>Tester Person, Bureau of Testing, Office of Stuff &amp;lt;br/&amp;gt;</GrantorContactText>
</OpportunitySynopsisDetail_1_0>
`

func TestLambdaInvocationScenarios(t *testing.T) {
	setupLambdaEnvForTesting(t)
	sourceBucketName := "test-source-bucket"
	now := time.Now()
	s3client, cfg, err := setupS3ForTesting(t, sourceBucketName)
	assert.NoError(t, err, "Error configuring test environment")

	type grantValues struct {
		template        string
		OpportunityID   string
		LastUpdatedDate string
		isExtant        bool
		isValid         bool
	}

	for _, tt := range []struct {
		name        string
		grantValues []grantValues
	}{
		{
			"Well-formed source XML for single new grant",
			[]grantValues{
				{
					SOURCE_OPPORTUNITY_TEMPLATE,
					"1234",
					now.AddDate(-1, 0, 0).Format("01022006"),
					false,
					true,
				},
			},
		},
		{
			"One grant to update and one to ignore",
			[]grantValues{
				{
					SOURCE_OPPORTUNITY_TEMPLATE,
					"2345",
					now.AddDate(-1, 0, 0).Format("01022006"),
					true,
					true,
				},
				{
					SOURCE_OPPORTUNITY_TEMPLATE,
					"3456",
					now.AddDate(1, 0, 0).Format("01022006"),
					true,
					true,
				},
			},
		},
		{
			"One grant to update and one with malformed source data",
			[]grantValues{
				{
					SOURCE_OPPORTUNITY_TEMPLATE,
					"4567",
					now.AddDate(-1, 0, 0).Format("01022006"),
					true,
					true,
				},
				{
					`<OpportunitySynopsisDetail_1_0>
					<OpportunityID>{{.OpportunityID}}</OpportunityID>
					<LastUpdatedDate>{{.LastUpdatedDate}}</LastUpdatedDate>
					<OpportunityTitle>Fun Grant`,
					"5678",
					now.AddDate(-1, 0, 0).Format("01022006"),
					false,
					false,
				},
			},
		},
		{
			"One grant with invalid date format",
			[]grantValues{
				{
					SOURCE_OPPORTUNITY_TEMPLATE,
					"6789",
					now.AddDate(-1, 0, 0).Format("01/02/06"),
					false,
					false,
				},
			},
		},
		{
			"Source contains invalid token",
			[]grantValues{
				{
					"<invalidtoken",
					"7890",
					now.AddDate(-1, 0, 0).Format("01/02/06"),
					false,
					false,
				},
			},
		},
	} {
		var sourceGrantsData bytes.Buffer
		sourceOpportunitiesData := make(map[string][]byte)
		_, err := sourceGrantsData.WriteString("<Grants>")
		require.NoError(t, err)
		for _, values := range tt.grantValues {
			var sourceOpportunityData bytes.Buffer
			sourceTemplate := template.Must(
				template.New("xml").Delims("{{", "}}").Parse(values.template),
			)
			require.NoError(t, sourceTemplate.Execute(&sourceOpportunityData, map[string]string{
				"OpportunityID":   values.OpportunityID,
				"LastUpdatedDate": values.LastUpdatedDate,
			}))
			if values.isExtant {
				extantKey := fmt.Sprintf("%s/%s/grants.gov/v2.xml",
					values.OpportunityID[0:3], values.OpportunityID)
				_, err := s3client.PutObject(context.TODO(), &s3.PutObjectInput{
					Bucket: aws.String(env.DestinationBucket),
					Key:    aws.String(extantKey),
					Body:   bytes.NewReader(sourceOpportunityData.Bytes()),
				})
				require.NoError(t, err)
			}
			_, err = sourceGrantsData.Write(sourceOpportunityData.Bytes())
			require.NoError(t, err)
			sourceOpportunitiesData[values.OpportunityID] = sourceOpportunityData.Bytes()
		}
		_, err = sourceGrantsData.WriteString("</Grants>")
		require.NoError(t, err)

		t.Run(tt.name, func(t *testing.T) {
			objectKey := fmt.Sprintf("sources/%s/grants.gov/extract.xml", now.Format("2006/01/02"))
			_, err := s3client.PutObject(context.TODO(), &s3.PutObjectInput{
				Bucket: aws.String(sourceBucketName),
				Key:    aws.String(objectKey),
				Body:   bytes.NewReader(sourceGrantsData.Bytes()),
			})
			require.NoErrorf(t, err, "Error creating test source object %s", objectKey)

			invocationErr := handleS3EventWithConfig(cfg, context.TODO(), events.S3Event{
				Records: []events.S3EventRecord{{
					S3: events.S3Entity{
						Bucket: events.S3Bucket{Name: sourceBucketName},
						Object: events.S3Object{Key: objectKey},
					},
				}},
			})
			sourceContainsInvalidOpportunities := false
			for _, v := range tt.grantValues {
				if !v.isValid {
					sourceContainsInvalidOpportunities = true
				}
			}
			if sourceContainsInvalidOpportunities {
				require.Error(t, invocationErr)
			} else {
				require.NoError(t, invocationErr)
			}

			var expectedGrants grantData.Grants
			err = xml.Unmarshal(sourceGrantsData.Bytes(), &expectedGrants)
			if !sourceContainsInvalidOpportunities {
				require.NoError(t, err)
			}

			for _, v := range tt.grantValues {
				key := fmt.Sprintf("%s/%s/grants.gov/v2.xml",
					v.OpportunityID[0:3], v.OpportunityID)
				resp, err := s3client.GetObject(context.TODO(), &s3.GetObjectInput{
					Bucket: aws.String(env.DestinationBucket),
					Key:    aws.String(key),
				})

				if !v.isValid && !v.isExtant {
					assert.Error(t, err)
				} else {
					require.NoError(t, err)
					b, err := ioutil.ReadAll(resp.Body)
					require.NoError(t, err)
					var sourceOpportunity, savedOpportunity grantData.OpportunitySynopsisDetail_1_0
					assert.NoError(t, xml.Unmarshal(b, &savedOpportunity))
					require.NoError(t, xml.Unmarshal(
						sourceOpportunitiesData[v.OpportunityID],
						&sourceOpportunity))
					assert.Equal(t, sourceOpportunity, savedOpportunity)
				}
			}
		})
	}
}

func TestLambdaInvocationWithMissingSourceObject(t *testing.T) {
	setupLambdaEnvForTesting(t)

	sourceBucketName := "test-source-bucket"
	s3client, cfg, err := setupS3ForTesting(t, sourceBucketName)
	require.NoError(t, err)
	sourceTemplate := template.Must(
		template.New("xml").Delims("{{", "}}").Parse(SOURCE_OPPORTUNITY_TEMPLATE),
	)
	var sourceData bytes.Buffer
	_, err = sourceData.WriteString("<Grants>")
	require.NoError(t, err)
	require.NoError(t, sourceTemplate.Execute(&sourceData, map[string]string{
		"OpportunityID":   "12345",
		"LastUpdatedDate": "01022023",
	}))
	_, err = sourceData.WriteString("</Grants>")
	require.NoError(t, err)
	_, err = s3client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(sourceBucketName),
		Key:    aws.String("sources/2023/02/03/grants.gov/extract.xml"),
		Body:   bytes.NewReader(sourceData.Bytes()),
	})
	require.NoError(t, err)
	err = handleS3EventWithConfig(cfg, context.TODO(), events.S3Event{
		Records: []events.S3EventRecord{
			{S3: events.S3Entity{
				Bucket: events.S3Bucket{Name: sourceBucketName},
				Object: events.S3Object{Key: "does/not/exist"},
			}},
			{S3: events.S3Entity{
				Bucket: events.S3Bucket{Name: sourceBucketName},
				Object: events.S3Object{Key: "sources/2023/02/03/grants.gov/extract.xml"},
			}},
		},
	})
	require.Error(t, err)
	if errs, ok := err.(*multierror.Error); ok {
		assert.Equalf(t, 1, errs.Len(),
			"Invocation accumulated an unexpected number of errors: %s", errs)
	} else {
		require.Fail(t, "Invocation error could not be interpreted as *multierror.Error")
	}

	_, err = s3client.GetObject(context.Background(), &s3.GetObjectInput{
		Bucket: aws.String(env.DestinationBucket),
		Key:    aws.String("123/12345/grants.gov/v2.xml"),
	})
	assert.NoError(t, err, "Expected destination object was not created")
}

func TestLambdaInvocationWithContextCancelation(t *testing.T) {
	setupLambdaEnvForTesting(t)
	_, cfg, err := setupS3ForTesting(t, "source-bucket")
	require.NoError(t, err)

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	err = handleS3EventWithConfig(cfg, ctx, events.S3Event{
		Records: []events.S3EventRecord{
			{S3: events.S3Entity{
				Bucket: events.S3Bucket{Name: "source-bucket"},
				Object: events.S3Object{Key: "does/not/matter"},
			}},
		},
	})
	require.Error(t, err)
	if errs, ok := err.(*multierror.Error); ok {
		for _, wrapped := range errs.WrappedErrors() {
			assert.ErrorIs(t, wrapped, context.Canceled,
				"context.Canceled missing in accumulated error's chain")
		}
	} else {
		require.Fail(t, "Invocation error could not be interpreted as *multierror.Error")
	}
}
