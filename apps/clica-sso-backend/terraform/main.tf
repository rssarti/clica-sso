# Terraform configuration for Clica SSO Backend on Digital Ocean App Platform

terraform {
  required_version = ">= 1.0"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.34.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

# Configure the DigitalOcean Provider
provider "digitalocean" {
  token             = var.do_token
  spaces_access_id  = var.spaces_access_key
  spaces_secret_key = var.spaces_secret_key
}

# Generate random suffix for bucket name
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Create PostgreSQL Database (without VPC for basic accounts)
resource "digitalocean_database_cluster" "clica_sso_db" {
  name       = "clica-sso-db"
  engine     = "pg"
  version    = "15"
  size       = var.db_size
  region     = var.region
  node_count = 1

  tags = ["clica-sso", "database"]
}

# Create database user
resource "digitalocean_database_user" "clica_sso_user" {
  cluster_id = digitalocean_database_cluster.clica_sso_db.id
  name       = "clica_sso_user"
}

# Create database
resource "digitalocean_database_db" "clica_sso_database" {
  cluster_id = digitalocean_database_cluster.clica_sso_db.id
  name       = "clica_sso"
}

# Create Spaces bucket for S3 storage
resource "digitalocean_spaces_bucket" "clica_sso_storage" {
  name   = "clica-sso-storage-${random_string.bucket_suffix.result}"
  region = var.spaces_region

  lifecycle_rule {
    id      = "delete_incomplete_uploads"
    enabled = true

    abort_incomplete_multipart_upload_days = 7
  }
}

# Create Spaces access key
resource "digitalocean_spaces_bucket_object" "bucket_policy" {
  region       = digitalocean_spaces_bucket.clica_sso_storage.region
  bucket       = digitalocean_spaces_bucket.clica_sso_storage.name
  key          = ".keep"
  content      = "# This file ensures the bucket is not empty"
  content_type = "text/plain"
}

# Create App Platform App
resource "digitalocean_app" "clica_sso_app" {
  spec {
    name   = "clica-sso-backend"
    region = var.region

    service {
      name               = "api"
      environment_slug   = "node-js"
      instance_count     = var.app_instance_count
      instance_size_slug = var.app_instance_size

      github {
        repo           = var.github_repo
        branch         = var.github_branch
        deploy_on_push = true
      }

      dockerfile_path = "Dockerfile.prod"

      http_port = 3000

      health_check {
        http_path                = "/health"
        initial_delay_seconds    = 300
        period_seconds          = 60
        timeout_seconds         = 30
        failure_threshold       = 10
        success_threshold       = 2
      }

      # Environment variables
      env {
        key   = "NODE_ENV"
        value = "production"
      }

      env {
        key   = "PORT"
        value = "3000"
      }

      env {
        key   = "DB_HOST"
        value = digitalocean_database_cluster.clica_sso_db.host
      }

      env {
        key   = "DB_PORT"
        value = tostring(digitalocean_database_cluster.clica_sso_db.port)
      }

      env {
        key   = "DB_USERNAME"
        value = digitalocean_database_user.clica_sso_user.name
      }

      env {
        key   = "DB_PASSWORD"
        value = digitalocean_database_user.clica_sso_user.password
        type  = "SECRET"
      }

      env {
        key   = "DB_NAME"
        value = digitalocean_database_db.clica_sso_database.name
      }

      env {
        key   = "DB_SSL"
        value = "true"
      }

      env {
        key   = "PGSSLMODE"
        value = "require"
      }

      env {
        key   = "JWT_SECRET"
        value = var.jwt_secret
        type  = "SECRET"
      }

      env {
        key   = "S3_ENDPOINT"
        value = "https://${digitalocean_spaces_bucket.clica_sso_storage.bucket_domain_name}"
      }

      env {
        key   = "S3_REGION"
        value = digitalocean_spaces_bucket.clica_sso_storage.region
      }

      env {
        key   = "S3_ACCESS_KEY"
        value = var.spaces_access_key
        type  = "SECRET"
      }

      env {
        key   = "S3_SECRET_KEY"
        value = var.spaces_secret_key
        type  = "SECRET"
      }

      env {
        key   = "S3_BUCKET_NAME"
        value = digitalocean_spaces_bucket.clica_sso_storage.name
      }

      env {
        key   = "RABBITMQ_URL"
        value = var.rabbitmq_url
        type  = "SECRET"
      }

      env {
        key   = "RESEND_API"
        value = var.resend_api_key
        type  = "SECRET"
      }

      env {
        key   = "BANCO_INTER_CLIENT_ID"
        value = var.banco_inter_client_id
        type  = "SECRET"
      }

      env {
        key   = "BANCO_INTER_CLIENT_SECRET"
        value = var.banco_inter_client_secret
        type  = "SECRET"
      }

      env {
        key   = "BANCO_INTER_CERT_PATH"
        value = "./cert/banco-inter-cert.crt"
      }

      env {
        key   = "BANCO_INTER_KEY_PATH"
        value = "./cert/banco-inter-cert.key"
      }

      env {
        key   = "BANCO_INTER_BASE_URL"
        value = "https://cdpj.partners.bancointer.com.br"
      }

      env {
        key   = "BANCO_INTER_SCOPE"
        value = "rec.read rec.write cob.write cob.read payloadlocationrec.write boleto-cobranca.read boleto-cobranca.write"
      }
    }

    # Database as a service
    database {
      name       = "clica-sso-db"
      engine     = "PG"
      production = var.environment == "production"
    }
  }

  depends_on = [
    digitalocean_database_cluster.clica_sso_db,
    digitalocean_spaces_bucket.clica_sso_storage
  ]
}
