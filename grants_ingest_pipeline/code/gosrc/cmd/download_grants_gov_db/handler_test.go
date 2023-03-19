package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	goenv "github.com/Netflix/go-env"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/go-kit/log"
	"github.com/johannesboyne/gofakes3"
	"github.com/johannesboyne/gofakes3/backend/s3mem"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupLambdaEnvForTesting(t *testing.T) {
	t.Helper()

	// Suppress normal lambda log output
	logger = log.NewNopLogger()

	// Configure environment variables
	err := goenv.Unmarshal(goenv.EnvSet{
		"GRANTS_SOURCE_DATA_BUCKET_NAME": "test-destination-bucket",
		"S3_USE_PATH_STYLE":              "true",
		"GRANTS_GOV_BASE_URL":            "https://example.gov",
	}, &env)
	require.NoError(t, err, "Error configuring lambda environment for testing")
}

func setupS3ForTesting(t *testing.T) (*s3.Client, aws.Config) {
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
	_, err := client.CreateBucket(ctx, &s3.CreateBucketInput{
		Bucket: aws.String(env.DestinationBucket),
	})
	require.NoError(t, err, "Error creating mock S3 destination bucket")
	return client, cfg
}

func TestScheduledEventGrantsURL(t *testing.T) {
	setupLambdaEnvForTesting(t)
	env.GrantsGovBaseURL = "https://example.gov"
	estTZ := time.FixedZone("America/New_York", -5*3600)

	assert.Equal(t, "https://example.gov/extract/GrantsDBExtract20230102v2.zip",
		(&ScheduledEvent{time.Date(2023, 1, 2, 3, 4, 5, 6, estTZ)}).grantsURL())
	assert.Equal(t, "https://example.gov/extract/GrantsDBExtract20230203v2.zip",
		(&ScheduledEvent{time.Date(2023, 2, 3, 4, 5, 6, 7, time.UTC)}).grantsURL())
	assert.Equal(t, "https://example.gov/extract/GrantsDBExtract20231112v2.zip",
		(&ScheduledEvent{time.Date(2023, 11, 12, 0, 0, 0, 0, time.UTC)}).grantsURL())
}

func TestScheduledEventDestinationS3Key(t *testing.T) {
	estTZ := time.FixedZone("America/New_York", -5*3600)

	assert.Equal(t, "sources/2023/01/02/grants.gov/archive.zip",
		(&ScheduledEvent{time.Date(2023, 1, 2, 3, 4, 5, 6, estTZ)}).destinationS3Key())
	assert.Equal(t, "sources/2023/02/03/grants.gov/archive.zip",
		(&ScheduledEvent{time.Date(2023, 2, 3, 4, 5, 6, 7, time.UTC)}).destinationS3Key())
	assert.Equal(t, "sources/2023/11/12/grants.gov/archive.zip",
		(&ScheduledEvent{time.Date(2023, 11, 12, 0, 0, 0, 0, time.UTC)}).destinationS3Key())
}

func TestHandleWithConfig(t *testing.T) {
	setupLambdaEnvForTesting(t)
	s3client, cfg := setupS3ForTesting(t)
	testEvent := ScheduledEvent{time.Now()}

	server := httptest.NewServer(http.HandlerFunc(func(resp http.ResponseWriter, req *http.Request) {
		require.Fail(t, "Test HTTP server handler should be overridden in each test case")
	}))
	t.Cleanup(server.Close)

	type mockResponse struct {
		contentType string
		statusCode  int
		body        []byte
	}

	for _, tt := range []struct {
		name              string
		downloadURL       string
		resp              mockResponse
		expectErr         error
		destinationBucket string
	}{
		{
			"Fails when download results in 404",
			server.URL,
			mockResponse{"text/html", 404, []byte{}},
			fmt.Errorf("Error downloading source archive"),
			env.DestinationBucket,
		},
		{
			"Fails when invalid source URL is configured",
			"badscheme://invalid",
			mockResponse{},
			fmt.Errorf("Error initiating download request for source archive"),
			env.DestinationBucket,
		},
		{
			"Failed upload",
			server.URL,
			mockResponse{"application/zip", 200, []byte("this is a fake zip file")},
			fmt.Errorf("The specified bucket does not exist"),
			"bucket-that-does-not-exist",
		},
		{
			"Successful upload",
			server.URL,
			mockResponse{"application/zip", 200, []byte("this is a fake zip file")},
			nil,
			env.DestinationBucket,
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			setupLambdaEnvForTesting(t)
			env.GrantsGovBaseURL = tt.downloadURL
			env.DestinationBucket = tt.destinationBucket
			server.Config.Handler = http.HandlerFunc(func(resp http.ResponseWriter, req *http.Request) {
				u, parseErr := url.Parse(testEvent.grantsURL())
				assert.NoError(t, parseErr)
				assert.Equal(t, u.Path, req.URL.Path)

				resp.Header().Add("Content-Type", tt.resp.contentType)
				resp.WriteHeader(tt.resp.statusCode)
				resp.Write(tt.resp.body)
			})

			err := handleWithConfig(cfg, context.TODO(), testEvent)
			if tt.expectErr != nil {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.expectErr.Error())
			} else {
				assert.NoError(t, err)
				resp, err := s3client.GetObject(context.TODO(), &s3.GetObjectInput{
					Bucket: aws.String(env.DestinationBucket),
					Key:    aws.String(testEvent.destinationS3Key()),
				})
				assert.NoError(t, err)
				uploadedBytes, err := ioutil.ReadAll(resp.Body)
				assert.NoError(t, err)
				assert.Equal(t, tt.resp.body, uploadedBytes)
			}
		})
	}
}

func TestValidateDownloadResponse(t *testing.T) {
	t.Run("Response is valid", func(t *testing.T) {
		assert.NoError(t, validateDownloadResponse(&http.Response{
			StatusCode: 200,
			Header:     http.Header{"Content-Type": []string{"application/zip"}},
		}))
	})

	t.Run("Unexpected status code", func(t *testing.T) {
		for statusCode := 201; statusCode <= 500; statusCode++ {
			t.Run(fmt.Sprintf("%d", statusCode), func(t *testing.T) {
				assert.EqualError(t, validateDownloadResponse(&http.Response{
					StatusCode: statusCode,
					Status:     http.StatusText(statusCode),
					Header:     http.Header{"Content-Type": []string{"application/zip"}},
				}), fmt.Sprintf("unexpected http response status: %s", http.StatusText(statusCode)))
			})
		}
	})

	t.Run("Unexpected Content-Type header", func(t *testing.T) {
		for _, contentType := range []string{
			"application/json",
			"application/xml",
			"text/html",
			"text/plain",
			"text/xml",
		} {
			t.Run(fmt.Sprintf("%q", contentType), func(t *testing.T) {
				assert.EqualError(t, validateDownloadResponse(&http.Response{
					StatusCode: 200,
					Header:     http.Header{"Content-Type": {contentType}},
				}), fmt.Sprintf("unexpected http response Content-Type header: %s", contentType))
			})
		}
	})
}
