package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsTransport "github.com/aws/aws-sdk-go-v2/aws/transport/http"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

type S3GetObjectAPI interface {
	GetObject(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error)
}

type S3ReadObjectAPI interface {
	S3GetObjectAPI
	s3.HeadObjectAPIClient
}

type S3PutObjectAPI interface {
	PutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error)
}

// GetS3LastModified gets the "Last Modified" time for the S3 object.
// If the object exists, a pointer to the last modification time is returned along with a nil error.
// If the specified object does not exist, the returned *time.Time and error are both nil.
// If an error is encountered when calling the HeadObject S3 API method, this will return a nil
// *time.Time value along with the encountered error.
func GetS3LastModified(ctx context.Context, c s3.HeadObjectAPIClient, bucket, key string) (*time.Time, error) {
	headOutput, err := c.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key)})
	if err != nil {
		var respError *awsTransport.ResponseError
		if errors.As(err, &respError) && respError.ResponseError.HTTPStatusCode() == 404 {
			return nil, nil
		}
		return nil, err
	}
	return headOutput.LastModified, nil
}

// UploadS3Object uploads bytes read from from r to an S3 object at the given bucket and key.
// If an error was encountered during upload, returns the error.
// Returns nil when the upload was successful.
func UploadS3Object(ctx context.Context, c S3PutObjectAPI, bucket, key string, r io.Reader) error {
	_, err := c.PutObject(ctx, &s3.PutObjectInput{
		Bucket:               aws.String(bucket),
		Key:                  aws.String(key),
		Body:                 r,
		ServerSideEncryption: types.ServerSideEncryptionAes256,
	})
	return err
}

// ChunkedS3Reader is a reader that reads an S3 object in chunks up to a configured chunkSize.
type ChunkedS3Reader struct {
	client interface {
		S3GetObjectAPI
		s3.HeadObjectAPIClient
	}
	bucket       string
	key          string
	ctx          context.Context
	maxChunkSize int64
	totalSize    int64
	buffer       []byte
	bufferPos    int64
	s3bytesRead  int64
}

// NewChunkedS3Reader creates a ChunkedS3ObjectReader that uses the S3 client to read the object
// at key in bucket in one chunked requests, up to chunkSize, at a time.
// An error is returned if the total size of the object cannot be determined.
func NewChunkedS3Reader(ctx context.Context, c S3ReadObjectAPI, bucket, key string, chunkSize int64) (*ChunkedS3Reader, error) {
	headOutput, err := c.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key)},
	)
	if err != nil {
		return nil, err
	}

	reader := &ChunkedS3Reader{
		client:       c,
		bucket:       bucket,
		key:          key,
		ctx:          ctx,
		maxChunkSize: chunkSize,
		totalSize:    headOutput.ContentLength,
	}
	return reader, nil
}

// Read implements the io.Reader interface by reading bytes from the S3 object up to len(b)
// at a time, fetching no more than the configured chunkSize in each request to S3.
// It returns io.EOF when the entire S3 object has been read and the internal buffer is empty,
// indicating that there is no more data to read into p.
func (r *ChunkedS3Reader) Read(p []byte) (int, error) {
	if r.totalSize == 0 {
		return 0, io.EOF
	}

	// Request the next chunk when the buffer has no data or all of its data is consumed
	if r.bufferPos == 0 || r.bufferPos >= int64(len(r.buffer)) {
		offset := r.s3bytesRead
		chunkSize := r.maxChunkSize
		if offset+chunkSize > r.totalSize {
			chunkSize = r.totalSize - r.s3bytesRead
		}
		resp, err := r.client.GetObject(r.ctx, &s3.GetObjectInput{
			Bucket: aws.String(r.bucket),
			Key:    aws.String(r.key),
			Range:  aws.String(fmt.Sprintf("bytes=%d-%d", offset, offset+chunkSize-1)),
		})
		if err != nil {
			return 0, err
		}
		defer resp.Body.Close()

		// Read the response into the buffer
		r.bufferPos = 0
		r.buffer = make([]byte, chunkSize)
		n := 0
		for {
			nn, err := resp.Body.Read(r.buffer[n:])
			n += nn
			if err != nil {
				if err == io.EOF {
					break
				}
				return 0, err
			}
		}
		r.s3bytesRead += int64(n)
	}

	n := copy(p, r.buffer[r.bufferPos:])
	r.bufferPos += int64(n)
	if r.s3bytesRead >= r.totalSize && r.bufferPos >= int64(len(r.buffer)) {
		// All data has been read from S3 and nothing remains in the internal buffer
		return n, io.EOF
	}

	return n, nil
}
