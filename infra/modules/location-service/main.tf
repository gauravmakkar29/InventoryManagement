# =============================================================================
# IMS Gen 2 — Amazon Location Service Module
# Epic 10, Story 10.6: Map, Place Index, Geofence Collection, Tracker
# =============================================================================

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.id

  # Construct ARNs for resources that may not export them directly
  map_arn               = "arn:aws:geo:${local.region}:${local.account_id}:map/${var.project_prefix}-map"
  place_index_arn       = "arn:aws:geo:${local.region}:${local.account_id}:place-index/${var.project_prefix}-places"
  geofence_collection_arn = "arn:aws:geo:${local.region}:${local.account_id}:geofence-collection/${var.project_prefix}-geofences"
  tracker_arn           = "arn:aws:geo:${local.region}:${local.account_id}:tracker/${var.project_prefix}-tracker"
}

# --- Map Resource (Story 10.1) ---
resource "aws_location_map" "ims_map" {
  map_name    = "${var.project_prefix}-map"
  description = "IMS Gen2 interactive map for device geolocation"

  configuration {
    style = var.map_style
  }

  tags = var.tags
}

# --- Place Index (Story 10.3) ---
resource "aws_location_place_index" "ims_places" {
  index_name  = "${var.project_prefix}-places"
  description = "IMS Gen2 geocoding index for location search"
  data_source = var.places_data_source

  data_source_configuration {
    intended_use = "SingleUse"
  }

  tags = var.tags
}

# --- Geofence Collection (Story 10.4) ---
resource "aws_location_geofence_collection" "ims_geofences" {
  collection_name = "${var.project_prefix}-geofences"
  description     = "IMS Gen2 geofence collection for service zones and warehouse boundaries"

  tags = var.tags
}

# --- Tracker (Story 10.5) ---
resource "aws_location_tracker" "ims_tracker" {
  tracker_name = "${var.project_prefix}-tracker"
  description  = "IMS Gen2 device position tracker"

  tags = var.tags
}

# --- Tracker-Geofence Association ---
# Links the tracker to the geofence collection so that device position updates
# are evaluated against geofence boundaries (ENTER/EXIT events via EventBridge)
resource "aws_location_tracker_association" "tracker_geofence" {
  tracker_name = aws_location_tracker.ims_tracker.tracker_name
  consumer_arn = local.geofence_collection_arn
}
