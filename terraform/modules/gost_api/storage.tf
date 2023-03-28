module "efs_data_volume" {
  source  = "cloudposse/efs/aws"
  version = "0.33.0"
  context = module.this.context

  name                       = "${var.namespace}-data_volume"
  region                     = data.aws_region.current.name
  vpc_id                     = var.vpc_id
  subnets                    = var.subnet_ids
  allowed_security_group_ids = var.security_group_ids

  access_points = {
    "data" = {
      posix_user = {
        uid = "1000"
        gid = "1000"
      }
      creation_info = {
        uid         = "1000"
        gid         = "1000"
        permissions = "0755"
      }
    }
  }
}
