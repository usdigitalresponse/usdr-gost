provider "docker" {}

data "coder_workspace" "this" {}


resource "docker_container" "dind" {
  count        = data.coder_workspace.this.start_count
  image        = "docker:dind"
  privileged   = true
  network_mode = "host"
  name         = "dind-${data.coder_workspace.this.id}"
  entrypoint   = ["dockerd", "-H", "tcp://0.0.0.0:2375"]
}

#resource "docker_container" "localstack" {
#  count        = data.coder_workspace.this.start_count
#  image        = "localstack/localstack"
#  network_mode = "host"
#  name         = "localstack-${data.coder_workspace.this.id}"
#
#  # LocalStack Gateway
#  ports {
#    internal = 4566
#    external = 4566
#  }
#
#  # External services port range
#  dynamic "ports" {
#    for_each = range(4510, 4560) # 4510-4559
#    content {
#      internal = ports.value
#      external = ports.value
#    }
#  }
#}

resource "docker_image" "workspace" {
  name = "coder-${data.coder_workspace.this.id}"

  build {
    context = "${path.module}/docker"
    build_args = {
      USER = data.coder_workspace.this.owner
    }
  }

  triggers = {
    dir_sha1 = sha1(join("", [for f in fileset(path.module, "docker/*") : filesha1(f)]))
  }
}

resource "docker_container" "workspace" {
  count        = data.coder_workspace.this.start_count
  image        = docker_image.workspace.name
  name         = "dev-${data.coder_workspace.this.id}"
  command      = ["sh", "-c", coder_agent.coder.init_script]
  network_mode = "host"
  env = [
    "CODER_AGENT_TOKEN=${coder_agent.coder.token}",
    "DOCKER_HOST=localhost:2375",
    "PGUSER=${local.postgres_user}",
    "EDGE_PORT=4566",
    "LOCALSTACK_HOSTNAME=localhost",
    "AWS_REGION=us-west-2",
    "AWS_DEFAULT_REGION=us-west-2",
  ]

  volumes {
    container_path = "/home/coder/"
    volume_name    = docker_volume.persistent_data["coder_home"].name
    read_only      = false
  }

  volumes {
    container_path = "/var/lib/postgresql/"
    volume_name    = docker_volume.persistent_data["postgres_data"].name
    read_only      = false
  }

  volumes {
    container_path = "/var/lib/localstack/"
    volume_name    = docker_volume.persistent_data["localstack_data"].name
    read_only      = false
  }
}

resource "docker_volume" "persistent_data" {
  for_each = toset(["coder_home", "postgres_data", "localstack_data"])

  name = "coder-${data.coder_workspace.this.id}-${each.key}"


  # Protect the volume from being deleted due to changes in attributes.
  lifecycle {
    ignore_changes = all
  }

  labels {
    label = "container_path"
    value = each.value
  }

  # Add labels in Docker to keep track of orphan resources.
  labels {
    label = "coder.owner_id"
    value = data.coder_workspace.this.owner_id
  }

  labels {
    label = "coder.workspace_id"
    value = data.coder_workspace.this.id
  }

  # These fields becomes outdated if the workspace is renamed but can
  # be useful for debugging or cleaning out dangling volumes.
  labels {
    label = "coder.owner_name_at_creation"
    value = data.coder_workspace.this.owner
  }

  labels {
    label = "coder.workspace_name_at_creation"
    value = data.coder_workspace.this.name
  }
}
