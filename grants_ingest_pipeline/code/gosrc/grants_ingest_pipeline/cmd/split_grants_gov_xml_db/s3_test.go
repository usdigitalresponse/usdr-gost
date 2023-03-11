package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsTransport "github.com/aws/aws-sdk-go-v2/aws/transport/http"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	smithyhttp "github.com/aws/smithy-go/transport/http"
	"github.com/stretchr/testify/assert"
)

type mockGetObjectAPI func(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error)

func (m mockGetObjectAPI) GetObject(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
	return m(ctx, params, optFns...)
}

type mockHeadObjectAPI func(ctx context.Context, params *s3.HeadObjectInput, optFns ...func(*s3.Options)) (*s3.HeadObjectOutput, error)

func (m mockHeadObjectAPI) HeadObject(ctx context.Context, params *s3.HeadObjectInput, optFns ...func(*s3.Options)) (*s3.HeadObjectOutput, error) {
	return m(ctx, params, optFns...)
}

type mockPutObjectAPI func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error)

func (m mockPutObjectAPI) PutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
	return m(ctx, params, optFns...)
}

type mockS3ReadObjectAPI struct {
	mockHeadObjectAPI
	mockGetObjectAPI
}

func createErrorResponseMap() map[int]*awsTransport.ResponseError {
	errorResponses := map[int]*awsTransport.ResponseError{}
	for _, statusCode := range []int{404, 500} {
		errorResponses[statusCode] = &awsTransport.ResponseError{
			ResponseError: &smithyhttp.ResponseError{Response: &smithyhttp.Response{
				Response: &http.Response{StatusCode: statusCode},
			}},
			RequestID: fmt.Sprintf("i-am-a-request-with-%d-status-response", statusCode),
		}
	}
	return errorResponses
}

func TestGetS3LastModified(t *testing.T) {
	now := time.Now()
	nilTime := func() *time.Time { return nil }()
	testBucketName := "test-bucket"
	testObjectKey := "test/key"
	errorResponses := createErrorResponseMap()

	for _, tt := range []struct {
		name            string
		client          func(t *testing.T) s3.HeadObjectAPIClient
		expLastModified *time.Time
		expErr          error
	}{
		{
			"Object exists",
			func(t *testing.T) s3.HeadObjectAPIClient {
				return mockHeadObjectAPI(func(ctx context.Context, params *s3.HeadObjectInput, optFns ...func(*s3.Options)) (*s3.HeadObjectOutput, error) {
					t.Helper()
					assert.Equal(t, params.Bucket, aws.String(testBucketName))
					assert.Equal(t, params.Key, aws.String(testObjectKey))
					return &s3.HeadObjectOutput{LastModified: &now}, nil
				})
			},
			&now,
			nil,
		},
		{
			"Object does not exist",
			func(t *testing.T) s3.HeadObjectAPIClient {
				return mockHeadObjectAPI(func(ctx context.Context, params *s3.HeadObjectInput, optFns ...func(*s3.Options)) (*s3.HeadObjectOutput, error) {
					t.Helper()
					assert.Equal(t, params.Bucket, aws.String(testBucketName))
					assert.Equal(t, params.Key, aws.String(testObjectKey))
					return &s3.HeadObjectOutput{}, fmt.Errorf("not found: %w", errorResponses[404])
				})
			},
			nilTime,
			nil,
		},
		{
			"Unexpected request failure",
			func(t *testing.T) s3.HeadObjectAPIClient {
				return mockHeadObjectAPI(func(ctx context.Context, params *s3.HeadObjectInput, optFns ...func(*s3.Options)) (*s3.HeadObjectOutput, error) {
					t.Helper()
					assert.Equal(t, aws.String(testBucketName), params.Bucket)
					assert.Equal(t, aws.String(testObjectKey), params.Key)
					return &s3.HeadObjectOutput{}, fmt.Errorf("server error: %w", errorResponses[500])
				})
			},
			nilTime,
			errorResponses[500],
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			actualTime, actualErr := GetS3LastModified(
				context.TODO(), tt.client(t), testBucketName, testObjectKey)
			assert.Equal(t, tt.expLastModified, actualTime)
			if tt.expErr != nil {
				assert.ErrorAs(t, tt.expErr, &actualErr)
			}
		})
	}
}

func TestUploadS3Object(t *testing.T) {
	testBucketName := "test-bucket"
	testObjectKey := "test/key"
	testReader := bytes.NewReader([]byte("hello!"))
	testError := fmt.Errorf("oh no this is an error")

	for _, tt := range []struct {
		name   string
		client func(t *testing.T) S3PutObjectAPI
		expErr error
	}{
		{
			"PutObject successful",
			func(t *testing.T) S3PutObjectAPI {
				return mockPutObjectAPI(func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
					t.Helper()
					assert.Equal(t, aws.String(testBucketName), params.Bucket)
					assert.Equal(t, aws.String(testObjectKey), params.Key)
					assert.Equal(t, testReader, params.Body)
					assert.Equal(t, params.ServerSideEncryption, types.ServerSideEncryptionAes256)
					return &s3.PutObjectOutput{}, nil
				})
			},
			nil,
		},
		{
			"PutObject returns error",
			func(t *testing.T) S3PutObjectAPI {
				return mockPutObjectAPI(func(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
					t.Helper()
					assert.Equal(t, aws.String(testBucketName), params.Bucket)
					assert.Equal(t, aws.String(testObjectKey), params.Key)
					return &s3.PutObjectOutput{}, testError
				})
			},
			nil,
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			err := UploadS3Object(context.TODO(), tt.client(t),
				testBucketName, testObjectKey, testReader)
			if tt.expErr != nil {
				assert.EqualError(t, err, tt.expErr.Error())
			}
		})
	}
}

func TestNewS3ObjectReader(t *testing.T) {
	testBucketName := "test-bucket"
	testObjectKey := "test/key"
	testError := fmt.Errorf("error i am")

	for _, tt := range []struct {
		name   string
		client func(t *testing.T) S3ReadObjectAPI
	}{
		{
			"HeadObject error",
			func(t *testing.T) S3ReadObjectAPI {
				return mockS3ReadObjectAPI{
					func(ctx context.Context, params *s3.HeadObjectInput, optFns ...func(*s3.Options)) (*s3.HeadObjectOutput, error) {
						t.Helper()
						assert.Equal(t, params.Bucket, aws.String(testBucketName))
						assert.Equal(t, params.Key, aws.String(testObjectKey))
						return &s3.HeadObjectOutput{}, testError
					},
					func(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
						panic("unexpected call to GetObject")
					},
				}
			},
		},
		{
			"Creation success",
			func(t *testing.T) S3ReadObjectAPI {
				return mockS3ReadObjectAPI{
					func(ctx context.Context, params *s3.HeadObjectInput, optFns ...func(*s3.Options)) (*s3.HeadObjectOutput, error) {
						t.Helper()
						assert.Equal(t, params.Bucket, aws.String(testBucketName))
						assert.Equal(t, params.Key, aws.String(testObjectKey))
						return &s3.HeadObjectOutput{ContentLength: 9876}, nil
					},
					func(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
						panic("unexpected call to GetObject")
					},
				}
			},
		},
	} {
		t.Run(tt.name, func(t *testing.T) {
			testCtx := context.TODO()
			testClient := tt.client(t)
			r, err := NewChunkedS3Reader(testCtx, testClient, testBucketName, testObjectKey, 123)
			if err != nil {
				assert.Nil(t, r)
				assert.EqualError(t, err, testError.Error())
			} else {
				assert.ObjectsAreEqual(testClient, r.client)
				assert.Equal(t, testBucketName, r.bucket)
				assert.Equal(t, testObjectKey, r.key)
				assert.Equal(t, testCtx, r.ctx)
				assert.Equal(t, int64(123), r.maxChunkSize)
				assert.Equal(t, int64(9876), r.totalSize)
				assert.Zero(t, r.bufferPos)
				assert.Zero(t, r.s3bytesRead)
			}
		})
	}
}

func TestChunkedS3ReaderRead(t *testing.T) {
	for _, tt := range []struct {
		testContent string
		chunkSize   int64
	}{
		{"abcd", 2},
		{"abcdefghijk", 1},
		{"abcdefghijk", 2},
		{"abcdefghijk", 3},
		{"abcdefghijk", 4},
		{"abcdefghijk", 5},
		{"abcdefghijk", 7},
		{"abcdefghijk", 11},
		{"abcdefghijk", 100},
		{"abcdefghijk", 1 * MB},
	} {
		name := fmt.Sprintf("Read source of %d bytes in chunks of %d",
			len(tt.testContent), tt.chunkSize)
		t.Run(name, func(t *testing.T) {
			getObjectCounter := int64(0)
			testReader := &ChunkedS3Reader{
				bucket:       "test-bucket",
				key:          "test/key",
				ctx:          context.TODO(),
				maxChunkSize: tt.chunkSize,
				totalSize:    int64(len(tt.testContent)),
			}
			testReader.client = mockS3ReadObjectAPI{
				func(ctx context.Context, params *s3.HeadObjectInput, optFns ...func(*s3.Options)) (*s3.HeadObjectOutput, error) {
					t.Helper()
					assert.Equal(t, params.Bucket, aws.String(testReader.bucket))
					assert.Equal(t, params.Key, aws.String(testReader.key))
					return &s3.HeadObjectOutput{ContentLength: int64(len(tt.testContent))}, nil
				},
				func(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
					t.Helper()
					getObjectCounter++
					expRangeStart := (getObjectCounter - 1) * testReader.maxChunkSize
					expRangeEnd := expRangeStart + testReader.maxChunkSize
					if maxLen := int64(len(tt.testContent)); expRangeEnd > maxLen {
						expRangeEnd = maxLen
					}
					assert.Equalf(t,
						fmt.Sprintf("bytes=%d-%d", expRangeStart, expRangeEnd-1),
						*params.Range,
						"Unexpected Range header on GetObject request %d", getObjectCounter)

					responseContent := tt.testContent[expRangeStart:expRangeEnd]
					output := &s3.GetObjectOutput{
						Body: io.NopCloser(strings.NewReader(responseContent)),
					}
					return output, nil
				},
			}

			readResult, err := ioutil.ReadAll(testReader)
			assert.NoError(t, err)
			assert.Equal(t, tt.testContent, string(readResult))
		})
	}
}
