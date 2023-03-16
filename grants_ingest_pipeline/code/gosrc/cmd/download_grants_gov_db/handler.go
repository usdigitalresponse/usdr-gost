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
	logger = log.With(logger,
		"db_date", event.Timestamp.Format("2006-01-02"),
		"source", event.grantsURL(),
		"destination_bucket", env.DestinationBucket,
		"destination_key", event.destinationS3Key(),
	)

	log.Debug(logger, "Starting remote file download")
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, event.grantsURL(), nil)
	if err != nil {
		log.Error(logger, "Error configuring download request for source archive", err)
		return err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Error(logger, "Error initiating download request for source archive", err)
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		err := fmt.Errorf("unexpected http response: %s", resp.Status)
		log.Error(logger, "Error downloading source archive", err)
		return err
	}
	logger = log.With(logger, "source_size_bytes", resp.ContentLength)

	log.Debug(logger, "Streaming remote file to S3")
	_, err = uploader.Upload(ctx, &s3.PutObjectInput{
		Bucket:               aws.String(env.DestinationBucket),
		Key:                  aws.String(event.destinationS3Key()),
		Body:                 resp.Body,
		ServerSideEncryption: types.ServerSideEncryptionAes256,
	})
	if err != nil {
		log.Error(logger, "Error uploading source archive to S3", err)
		return err
	}
	log.Debug(logger, "Finished transfering source file to S3")

	return nil
}
