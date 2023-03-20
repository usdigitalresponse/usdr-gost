package main

import (
	"context"
	"fmt"
	goLog "log"
	"net/http"

	ddlambda "github.com/DataDog/datadog-lambda-go"
	goenv "github.com/Netflix/go-env"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/usdigitalresponse/usdr-gost/grants_ingest_pipeline/code/gosrc/internal/awsHelpers"
	"github.com/usdigitalresponse/usdr-gost/grants_ingest_pipeline/code/gosrc/internal/log"
	awstrace "gopkg.in/DataDog/dd-trace-go.v1/contrib/aws/aws-sdk-go-v2/aws"
	httptrace "gopkg.in/DataDog/dd-trace-go.v1/contrib/net/http"
)

type Environment struct {
	LogLevel          string `env:"LOG_LEVEL,default=INFO"`
	DestinationBucket string `env:"GRANTS_SOURCE_DATA_BUCKET_NAME,required=true"`
	GrantsGovBaseURL  string `env:"GRANTS_GOV_BASE_URL,required=true"`
	UsePathStyleS3Opt bool   `env:"S3_USE_PATH_STYLE,default=false"`
	Extras            goenv.EnvSet
}

var env Environment

func main() {
	es, err := goenv.UnmarshalFromEnviron(&env)
	if err != nil {
		goLog.Fatalf("error configuring environment variables: %v", err)
	}
	env.Extras = es
	log.ConfigureLogger(&logger, env.LogLevel)
	log.Debug(logger, "Starting Lambda")
	lambda.Start(ddlambda.WrapFunction(func(ctx context.Context, event ScheduledEvent) error {
		cfg, err := awsHelpers.GetConfig(ctx)
		if err != nil {
			return fmt.Errorf("could not create AWS SDK config: %w", err)
		}
		awstrace.AppendMiddleware(&cfg)
		httptrace.WrapClient(http.DefaultClient)
		return handleWithConfig(cfg, ctx, event)
	}, nil))
}
