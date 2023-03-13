package main

import (
	"bytes"
	"context"
	"encoding/xml"
	"fmt"
	"io"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/go-kit/log/level"
	"github.com/hashicorp/go-multierror"
	"github.com/usdigitalresponse/usdr-gost/grants_ingest_pipeline/code/gosrc/internal/log"
	"github.com/usdigitalresponse/usdr-gost/grants_ingest_pipeline/code/gosrc/pkg/grantData"
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

// handleS3Event handles events representing S3 bucket notifications of type "ObjectCreated:*"
// for XML DB extracts saved from Grants.gov. The XML data from the source S3 object provided
// by each event record is read from S3. Grant opportunity records are extracted from the XML
// and uploaded to a "prepared data" destination bucket as individual S3 objects.
// Uploads are handled by a pool of workers; the size of the pool is determined by the
// MAX_CONCURRENT_UPLOADS environment variable.
// Returns and error that represents any and all errors accumulated during the invocation,
// either while handling a source object or while processing its contents; an error may indicate
// a partial or complete invocation failure.
// Returns nil when all grant opportunities are successfully processed from all source records,
// indicating complete success.
func handleS3EventWithConfig(cfg aws.Config, ctx context.Context, s3Event events.S3Event) error {
	// Configure service clients
	s3svc := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.UsePathStyle = env.UsePathStyleS3Opt
	})

	// Create an opportunities channel to direct grantOpportunity values parsed from the source
	// record to individual S3 object uploads
	opportunities := make(chan opportunity)

	// Create a pool of workers to consume and upload values received from the opportunities channel
	wg := multierror.Group{}
	for i := 0; i < env.MaxConcurrentUploads; i++ {
		wg.Go(func() error {
			return processOpportunities(ctx, s3svc, opportunities)
		})
	}

	// Iterate over all received source records to split into per-grant values and submit them to
	// the opportunities channel for processing by the workers pool. Instead of failing on the
	// first encountered error, we instead accumulate them into a single "multi-error".
	// Only one source record is consumed at a time; in normal cases, the invocation event
	// will only provide a single source record.
	sourcingErrs := &multierror.Error{}
	for i, record := range s3Event.Records {
		sourceBucket := record.S3.Bucket.Name
		sourceKey := record.S3.Object.Key
		logger := log.With(logger, "event_name", record.EventName, "record_index", i,
			"source_bucket", sourceBucket, "source_object_key", sourceKey)
		log.Info(logger, "Splitting Grants.gov DB extract XML object from S3")

		r, err := NewChunkedS3Reader(ctx, s3svc, sourceBucket, sourceKey, env.DownloadChunkLimit*MB)
		if err != nil {
			sourcingErrs = multierror.Append(sourcingErrs, err)
			log.Error(logger, "Error creating reader for source S3 object", err)
			continue
		}
		if err := readOpportunities(ctx, r, opportunities); err != nil {
			sourcingErrs = multierror.Append(sourcingErrs, err)
			log.Error(logger, "Error reading source opportunities from S3", err)
			continue
		}

		log.Info(logger, "Finished splitting Grants.gov DB extract XML")
	}

	// All source records have been consumed; close the channel so that workers shut down
	// after the channel is emptied.
	close(opportunities)

	// Wait for workers to finish processing and collect any errors they encountered
	processingErrs := wg.Wait()

	// Combine any sourcing and processing errors to return as a single "mega-multi-error"
	errs := multierror.Append(sourcingErrs, processingErrs)
	if err := errs.ErrorOrNil(); err != nil {
		var countSourcingErrors, countProcessingErrors int
		if sourcingErrs != nil {
			countSourcingErrors = sourcingErrs.Len()
		}
		if processingErrs != nil {
			countProcessingErrors = processingErrs.Len()
		}
		log.Warn(logger, "Failures occurred during invocation; check logs for details",
			"count_sourcing_errors", countSourcingErrors,
			"count_processing_errors", countProcessingErrors,
			"count_total", errs.Len())
		return err
	}

	// Hooray, no errors!
	return nil
}

// readOpportunities reads XML from r, sending all parsed grantOpportunity records to ch.
// Returns nil when the end of the file is reached.
// readOpportunities stops and returns an error when the context is canceled
// or an error is encountered while reading.
func readOpportunities(ctx context.Context, r io.Reader, ch chan<- opportunity) error {
	d := xml.NewDecoder(r)
	for {
		// Check for context cancelation between reads
		if err := ctx.Err(); err != nil {
			log.Warn(logger, "Context canceled before reading was complete", "reason", err)
			return err
		}

		token, err := d.Token()
		if err != nil {
			if err == io.EOF {
				// EOF means that we're done reading
				break
			}
			level.Error(logger).Log("msg", "Error reading XML token", "error", err)
			return err
		}

		// When reading the start of a new element, check if it is a grant opportunity
		se, ok := token.(xml.StartElement)
		if ok && se.Name.Local == GRANT_OPPORTUNITY_XML_NAME {
			var opportunity opportunity
			if err := d.DecodeElement(&opportunity, &se); err != nil {
				level.Error(logger).Log("msg", "Error decoding XML token", "error", err)
				return err
			}
			ch <- opportunity
		}
	}
	log.Info(logger, "Finished reading opportunities from source")
	return nil
}

// processOpportunities is a work loop that receives and processes grantOpportunity value until
// the receive channel is closed and returns or the context is canceled.
// It returns a multi-error containing any errors encountered while processing a received
// grantOpportunity as well as the reason for the context cancelation, if any.
// Returns nil if all opportunities were processed successfully until the channel was closed.
func processOpportunities(ctx context.Context, svc *s3.Client, ch <-chan opportunity) (errs error) {
	whenCanceled := func() error {
		err := ctx.Err()
		log.Debug(logger, "Done processing opportunities because context canceled", "reason", err)
		errs = multierror.Append(errs, err)
		return errs
	}

	// Since channel selection is pseudo-random, this loop runs a preliminary check for
	// canceled context on each iteration to ensure that cancelation is prioritized.
	for {
		select {
		case <-ctx.Done():
			return whenCanceled()

		default:

			select {
			case opportunity, ok := <-ch:
				if !ok {
					log.Debug(logger, "Done processing opportunities because channel is closed")
					return
				}
				if err := processOpportunity(ctx, svc, opportunity); err != nil {
					errs = multierror.Append(errs, err)
				}

			case <-ctx.Done():
				return whenCanceled()
			}
		}
	}
}

// processOpportunity takes a single opportunity and conditionally uploads an XML
// representation of the opportunity to its configured S3 destination. Before uploading,
// any extant S3 object with a matching key in the bucket named by env.DestinationBucket
// is compared with the opportunity. An upload is initiated when the opportunity was updated
// more recently than the extant object was last modified, or when no extant object exists.
func processOpportunity(ctx context.Context, svc *s3.Client, opp opportunity) error {
	logger := log.With(logger,
		"opportunity_id", opp.OpportunityID, "opportunity_number", opp.OpportunityNumber)

	lastModified, err := opp.LastUpdatedDate.Time()
	if err != nil {
		log.Error(logger, "Error getting last modified time for opportunity", err)
		return err
	}
	log.Debug(logger, "Parsed last modified time from opportunity last update date",
		"raw_value", opp.LastUpdatedDate, "parsed_value", lastModified)
	logger = log.With(logger, "opportunity_last_modified", lastModified)

	key := opp.S3ObjectKey()
	logger = log.With(logger, "bucket", env.DestinationBucket, "key", key)
	remoteLastModified, err := GetS3LastModified(ctx, svc, env.DestinationBucket, key)
	if err != nil {
		log.Error(logger, "Error determining last modified time for remote opportunity", err)
		return err
	}
	logger = log.With(logger, "remote_last_modified", remoteLastModified)
	if remoteLastModified != nil {
		if remoteLastModified.After(lastModified) {
			log.Info(logger, "Skipping opportunity upload because the extant record is up-to-date")
			return nil
		}
		log.Info(logger, "Uploading updated opportunity to replace outdated remote record")
	} else {
		log.Info(logger, "Uploading new opportunity")
	}

	b, err := xml.Marshal(grantData.OpportunitySynopsisDetail_1_0(opp))
	if err != nil {
		log.Error(logger, "Error marshaling XML for opportunity", err)
		return err
	}

	if err := UploadS3Object(ctx, svc, env.DestinationBucket, key, bytes.NewReader(b)); err != nil {
		log.Error(logger, "Error uploading prepared grant opportunity to S3", err)
		return err
	}

	log.Info(logger, "Successfully uploaded opportunity")
	return nil
}
