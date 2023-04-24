plugin "terraform" {
  enabled = true
  preset  = "recommended"
}

plugin "aws" {
    enabled = true
    version = "0.22.1"
    source  = "github.com/terraform-linters/tflint-ruleset-aws"
}
