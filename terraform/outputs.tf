output "website_cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution serving the GOST website."
  value       = module.website.cloudfront_distribution_id
}
