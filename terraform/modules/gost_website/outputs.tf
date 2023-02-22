output "s3_distribution_base_uri" {
  value = "s3://${module.origin_bucket.bucket_id}${var.origin_bucket_dist_path}/"
}

output "cloudfront_distribution_id" {
  value = module.cdn.cloudfront_distribution_id
}
