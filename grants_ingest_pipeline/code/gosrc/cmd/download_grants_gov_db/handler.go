package main

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/usdigitalresponse/usdr-gost/grants_ingest_pipeline/code/gosrc/internal/log"
)

var logger log.Logger

type ScheduledEvent struct {
	Timestamp time.Time `json:"timestamp"`
}

func (e *ScheduledEvent) grantsURL() string {
	return fmt.Sprintf("%s/extract/GrantsDBExtract%sv2.zip",
		env.GrantsGovBaseURL,
		e.Timestamp.Format("20060102"),
	)
}

func (e *ScheduledEvent) destinationS3Key() string {
	return fmt.Sprintf("sources/%s/grants.gov/archive.zip", e.Timestamp.Format("2006/01/02"))
}

func handleWithConfig(cfg aws.Config, ctx context.Context, event ScheduledEvent) error {
	uploader := manager.NewUploader(s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.UsePathStyle = env.UsePathStyleS3Opt
	}))
	logger := log.With(logger,
		"db_date", event.Timestamp.Format("2006-01-02"),
		"source", event.grantsURL(),
		"destination_bucket", env.DestinationBucket,
		"destination_key", event.destinationS3Key(),
	)

	log.Debug(logger, "Starting remote file download")
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, event.grantsURL(), nil)
	if err != nil {
		return log.Errorf(logger, "Error configuring download request for source archive", err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return log.Errorf(logger, "Error initiating download request for source archive", err)
	}
	defer resp.Body.Close()
	if err := validateDownloadResponse(resp); err != nil {
		return log.Errorf(logger, "Error downloading source archive", err)
	}
	logger = log.With(logger, "source_size_bytes", resp.ContentLength)

	log.Debug(logger, "Streaming remote file to S3")
	if _, err := uploader.Upload(ctx, &s3.PutObjectInput{
		Bucket:               aws.String(env.DestinationBucket),
		Key:                  aws.String(event.destinationS3Key()),
		Body:                 resp.Body,
		ServerSideEncryption: types.ServerSideEncryptionAes256,
	}); err != nil {
		return log.Errorf(logger, "Error uploading source archive to S3", err)
	}

	log.Info(logger, "Finished transfering source file to S3")
	return nil
}

func validateDownloadResponse(r *http.Response) error {
	if r.StatusCode != 200 {
		return fmt.Errorf("unexpected http response status: %s", r.Status)
	}
	if contentType := r.Header.Get("Content-Type"); contentType != "application/zip" {
		return fmt.Errorf("unexpected http response Content-Type header: %s", contentType)
	}
	return nil
}
