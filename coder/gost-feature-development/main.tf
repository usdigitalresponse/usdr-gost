terraform {
  required_providers {
    coder = {
      source = "coder/coder"
    }
    docker = {
      source = "kreuzwerker/docker"
    }
  }
}

locals {
  git_config_auto_user    = data.coder_parameter.git_config_auto_user.value == "true"
  git_repo_name           = "usdr-gost"
  postgres_user           = "postgres"
  postgres_password       = "password123"
  postgres_dev_dbname     = "usdr_grants"
  postgres_test_dbname    = "usdr_grants_test"
  node_version            = "16.14.0"
  port_forward_url_scheme = "${data.coder_workspace.this.access_port == 443 ? "https" : "http"}://"
  port_forward_domains = {
    for port in ["8080", "3000"] :
    port => join("--", [
      port,
      "coder",
      data.coder_workspace.this.name,
      data.coder_workspace.this.owner,
      trimprefix(data.coder_workspace.this.access_url, local.port_forward_url_scheme),
    ])
  }
  port_forward_urls = {
    for port, domain in local.port_forward_domains :
    port => "${local.port_forward_url_scheme}${domain}"
  }
  omz_plugins     = jsondecode(data.coder_parameter.oh_my_zsh_plugins.value)
  omz_plugins_cmd = length(local.omz_plugins) > 0 ? "source .zshrc && omz plugin enable ${join(" ", local.omz_plugins)}" : "true"
}

resource "coder_agent" "coder" {
  os   = "linux"
  arch = "amd64"
  dir  = "/home/coder/${local.git_repo_name}"

  env = {
    GITHUB_TOKEN = data.coder_git_auth.github.access_token
    PGUSER       = local.postgres_user
  }

  startup_script_timeout = 300
  startup_script = templatefile("${path.module}/tpl/coder_agent_startup_script.bash", {
    preferred_shell        = data.coder_parameter.preferred_shell.value
    oh_my_zsh_plugins_cmd  = local.omz_plugins_cmd
    dotfiles_uri           = "todo"
    postgres_user          = local.postgres_user
    postgres_password      = local.postgres_password
    postgres_dbs_to_create = [local.postgres_dev_dbname, local.postgres_test_dbname]
    postgres_envvar_dbname_map = {
      POSTGRES_URL      = local.postgres_dev_dbname
      POSTGRES_TEST_URL = local.postgres_test_dbname
    }
    nvm_install_script_url     = "https://raw.githubusercontent.com/nvm-sh/nvm/${data.coder_parameter.nvm_version.value}/install.sh"
    yarn_network_timeout       = data.coder_parameter.yarn_network_timeout_ms.value
    git_config_auto_user_name  = local.git_config_auto_user ? data.coder_workspace.this.owner : ""
    git_config_auto_user_email = local.git_config_auto_user ? data.coder_workspace.this.owner_email : ""
    git_clone_url              = "git@github.com:usdigitalresponse/${local.git_repo_name}.git"
    git_repo_name              = local.git_repo_name
    git_checkout_branch        = data.coder_parameter.git_checkout_branch_name.value
    git_base_branch            = data.coder_parameter.git_base_branch_name.value
    gost_api_url               = local.port_forward_urls["3000"]
    website_url                = local.port_forward_urls["8080"]
    vscode_extensions          = jsondecode(data.coder_parameter.vscode_extensions.value)
  })
}

# code-server
resource "coder_app" "code-server" {
  agent_id     = coder_agent.coder.id
  slug         = "code-server"
  display_name = "VS Code Web"
  icon         = "/icon/code.svg"
  url          = "http://localhost:13337?folder=/home/coder/${local.git_repo_name}"
  subdomain    = false
  share        = data.coder_parameter.sharing_mode.value

  healthcheck {
    url       = "http://localhost:13337/healthz"
    interval  = 3
    threshold = 10
  }
}

resource "coder_metadata" "workspace_info" {
  count       = data.coder_workspace.this.start_count
  resource_id = docker_container.workspace[0].id
  item {
    key   = "Docker host name"
    value = "localhost:2375"
  }
  item {
    key   = "base image"
    value = "docker.io/codercom/enterprise-base:ubuntu"
  }
  item {
    key   = "agent id"
    value = coder_agent.coder.id
  }
}

data "coder_git_auth" "github" {
  id = "github"
}
