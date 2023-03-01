terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

module "this" {
  source  = "cloudposse/label/null"
  version = "0.25.0"

  enabled = var.enabled
  name    = var.namespace
  tags    = var.tags
}

module "vpc" {
  source  = "cloudposse/vpc/aws"
  version = "2.0.0"
  context = module.this.context

  ipv4_primary_cidr_block         = var.vpc_ipv4_primary_cidr_block
  default_network_acl_deny_all    = true
  default_security_group_deny_all = true
}

module "subnets" {
  source  = "cloudposse/dynamic-subnets/aws"
  version = "2.1.0"
  context = module.this.context

  vpc_id                  = module.vpc.vpc_id
  igw_id                  = [module.vpc.igw_id]
  ipv4_cidr_block         = [cidrsubnet(module.vpc.vpc_cidr_block, 4, 0)]
  availability_zones      = var.availability_zones
  private_subnets_enabled = true
  public_subnets_enabled  = true
  nat_gateway_enabled     = true
  map_public_ip_on_launch = false
}
