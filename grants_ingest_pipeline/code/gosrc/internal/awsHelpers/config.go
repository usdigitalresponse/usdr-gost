package awsHelpers

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
)

func GetConfig(ctx context.Context) (aws.Config, error) {
	optionsFunc := func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		if lsHostname, isSet := os.LookupEnv("LOCALSTACK_HOSTNAME"); isSet {
			lsPort := "4566"
			if edgePort, isSet := os.LookupEnv("EDGE_PORT"); isSet {
				lsPort = edgePort
			}
			awsEndpoint := fmt.Sprintf("http://%s:%s", lsHostname, lsPort)
			return aws.Endpoint{URL: awsEndpoint}, nil
		}

		// Allow fallback to default resolution
		return aws.Endpoint{}, &aws.EndpointNotFoundError{}
	}
	resolver := aws.EndpointResolverWithOptionsFunc(optionsFunc)
	return config.LoadDefaultConfig(ctx, config.WithEndpointResolverWithOptions(resolver))
}
