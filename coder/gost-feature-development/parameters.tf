data "coder_parameter" "git_checkout_branch_name" {
  name        = "Git: Checkout Branch"
  description = "The branch to check out. This will be created if it does not already exist."
  type        = "string"
  default     = "_staging"
  mutable     = true
}

data "coder_parameter" "git_base_branch_name" {
  name        = "Git: Checkout Branch Base"
  description = "The starting point when checking out a new branch."
  type        = "string"
  mutable     = true
  default     = "_staging"
}

data "coder_parameter" "git_config_auto_user" {
  name        = "Git Config: Auto-populate `git config --global user.name` and `user.email`?"
  description = "If not selected, you will have to configure these before you can commit."
  type        = "bool"
  default     = "false"
}

data "coder_parameter" "sharing_mode" {
  name        = "Enable Shared Access"
  description = "Whether to enable access for other team members. We recommend leaving this on!"
  type        = "string"
  default     = "authenticated"

  option {
    name  = "Enabled"
    value = "authenticated"
  }

  option {
    name  = "Disabled"
    value = "owner"
  }
}

data "coder_parameter" "preferred_shell" {
  name        = "Preferred shell"
  description = "What command-line shell do you want to use?"
  type        = "string"
  mutable     = true
  default     = "bash"

  option {
    name  = "bash"
    value = "bash"
  }

  option {
    name  = "zsh"
    value = "zsh"
  }
}

data "coder_parameter" "oh_my_zsh_plugins" {
  name        = "Preferred shell: Oh My Zsh plugins"
  description = "Select [plugins](https://github.com/ohmyzsh/ohmyzsh/wiki/Plugins) to enable for [Oh My ZSH](https://ohmyz.sh/). Only effective if zsh is the preferred shell."
  type        = "list(string)"
  mutable     = true
  default = jsonencode([
    "aws",
    "docker",
    "docker-compose",
    "extract",
    "fd",
    "git",
    "npm",
    "nvm",
    "postgres",
    "pre-commit",
    "ripgrep",
    "terraform",
    "themes",
    "yarn",
  ])
}

data "coder_parameter" "nvm_version" {
  name        = "JS: NVM Version"
  description = "Specify an [NVM release](https://github.com/nvm-sh/nvm/releases) to install on first boot."
  type        = "string"
  mutable     = true
  default     = "v0.39.3"
}

data "coder_parameter" "yarn_network_timeout_ms" {
  name        = "JS: Yarn network-timeout (ms)"
  description = "Try setting this to a high value (e.g. 1000000000) if yarn times out during workspace creation. Otherwise, leave as-is."
  type        = "number"
  mutable     = true
  default     = "0"
}

data "coder_parameter" "vscode_extensions" {
  name        = "VS Code Extensions"
  description = "Identify [Visual Studio Code marketplace](https://marketplace.visualstudio.com/vscode) extensions to install."
  type        = "list(string)"
  mutable     = true
  default = jsonencode([
    "dbaeumer.vscode-eslint",
    "vue.volar",
    "cweijan.vscode-postgresql-client2",
    "ms-azuretools.vscode-docker",
    "hashicorp.terraform",
    "4ops.terraform",
  ])
}
