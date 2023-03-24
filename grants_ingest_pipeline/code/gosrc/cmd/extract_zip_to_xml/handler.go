package main

import (
	"archive/zip"
	"bufio"
	"context"
	"fmt"
	"io"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/usdigitalresponse/usdr-gost/grants_ingest_pipeline/code/gosrc/internal/log"
	"github.com/usdigitalresponse/usdr-gost/grants_ingest_pipeline/code/gosrc/pkg/grantData"
	"gopkg.in/DataDog/dd-trace-go.v1/ddtrace/tracer"
)

const (
	MB                         = int64(1024 * 1024)
	GRANT_XML_NS               = "http://apply.grants.gov/system/OpportunityDetail-V1.0"
	GRANT_OPPORTUNITY_XML_NAME = "OpportunitySynopsisDetail_1_0"
)

var logger log.Logger

type opportunity grantData.OpportunitySynopsisDetail_1_0

// S3ObjectKey returns a string to use as the object key when saving the opportunity to an S3 bucket.
func (o *opportunity) S3ObjectKey() string {
	return fmt.Sprintf("%s/%s/grants.gov/v2.xml", o.OpportunityID[0:3], o.OpportunityID)
}

// handleS3Event does the following
/*
Allows invocation from the "Grants Source Data" S3 bucket
Expects to receive an S3 Bucket Notification from the "Grants Source Data" bucket for s3:ObjectCreated event that indicates a grants.gov download is fully (not partially) saved to S3, with the following object key filters:
Prefix: /sources/
Suffix: /grants.gov/archive.zip
When invoked, performs the following actions:
Identifies the key of the source S3 object presented in the invocation event payload.
Streams the zip file S3 object using range requests, and progressively unzips the stream contents.
Streams the unzipped content (an XML file) to a new S3 object in the "Grants Source Data bucket" with an object containing the same base path of the source object, but with a filename of extract.xml (i.e. /sources/YYYY/mm/dd/grants.gov/extract.xml).
*/
func handleS3EventWithConfig(cfg aws.Config, ctx context.Context, s3Event events.S3Event) error {
	// Configure service clients
	s3svc := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.UsePathStyle = env.UsePathStyleS3Opt
	})

	// Iterate over the records and only take action on ones that have the following eventName
	// s3:ObjectCreated:CompleteMultipartUpload
	sourcingSpan, sourcingCtx := tracer.StartSpanFromContext(ctx, "handle.records")
	for i, record := range s3Event.Records {
		recordSpan, recordCtx := tracer.StartSpanFromContext(sourcingCtx, "handle.record")
		log.Info(logger, fmt.Sprintf("Handling record %d with event name %s", i, record.EventName))

		// Ensures we only care about events when the file is fully uploaded
		if record.EventName != "ObjectCreated:CompleteMultipartUpload" {
			continue
		}

		// Ensures we only care about events in the GRANTS_SOURCE_DATA bucket.
		if record.S3.Bucket.Name != env.SourceBucket {
			continue
		}

		// Assume we have the right object. Now Get the object.
		// This retrives a small amount of this object.
		resp, err := s3svc.GetObject(recordCtx, &s3.GetObjectInput{
			Bucket: aws.String(record.S3.Bucket.Name),
			Key:    aws.String(record.S3.Object.Key),
		})
		if err != nil {
			log.Error(logger, "Error getting source S3 object", err)
			return err
		}

		// 1. Start the process of buffering the file
		buffer := bufio.NewReaderSize(resp.Body, int(env.DownloadChunkLimit*MB))

		// buffer contains a full stream. Zipreader can understand the buffer.
		// A function in the zip library that accepts a Reader as input
		// Provides a "extract" function for each chunk.
		buffer.Read(make([]byte, 100))

		if err := handleChunk(recordCtx, buffer); err != nil {
			log.Error(logger, "Error reading source opportunities from S3", err)
			return err
		}
	}

	return nil
}

func handleChunk(ctx context.Context, reader io.Reader) error {
	// 1,23,4,5,,5
	console.log(reader.Read())
	zip.Reader.Open(reader)

	return nil
}
