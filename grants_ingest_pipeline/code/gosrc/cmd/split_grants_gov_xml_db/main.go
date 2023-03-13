package main

import (
	"context"
	"fmt"
	goLog "log"

	ddlambda "github.com/DataDog/datadog-lambda-go"
	goenv "github.com/Netflix/go-env"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/usdigitalresponse/usdr-gost/grants_ingest_pipeline/code/gosrc/internal/log"
)

type Environment struct {
	LogLevel             string `env:"LOG_LEVEL,default=INFO"`
	DownloadChunkLimit   int64  `env:"DOWNLOAD_CHUNK_LIMIT,default=10"`
	DestinationBucket    string `env:"GRANTS_PREPARED_DATA_BUCKET_NAME,required=true"`
	MaxConcurrentUploads int    `env:"MAX_CONCURRENT_UPLOADS,default=1"`
	UsePathStyleS3Opt    bool   `env:"S3_USE_PATH_STYLE,default=false"`
	Extras               goenv.EnvSet
}

var env Environment

func main() {
	es, err := goenv.UnmarshalFromEnviron(&env)
	if err != nil {
		goLog.Fatalf("error configuring environment variables: %v", err)
	}
	env.Extras = es
	log.ConfigureLogger(&logger, env.LogLevel)

	lambda.Start(ddlambda.WrapFunction(func(ctx context.Context, s3Event events.S3Event) error {
		cfg, err := config.LoadDefaultConfig(ctx)
		if err != nil {
			return fmt.Errorf("could not create AWS SDK config: %w", err)
		}
		log.Debug(logger, "Starting Lambda")
		return handleS3EventWithConfig(cfg, ctx, s3Event)
	}, nil))
}
