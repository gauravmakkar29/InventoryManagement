# =============================================================================
# IMS Gen 2 — Amazon Location Service Module — Outputs
# =============================================================================

output "map_name" {
  description = "Name of the Amazon Location Map resource"
  value       = aws_location_map.ims_map.map_name
}

output "map_arn" {
  description = "ARN of the Amazon Location Map resource"
  value       = local.map_arn
}

output "place_index_name" {
  description = "Name of the Amazon Location Place Index"
  value       = aws_location_place_index.ims_places.index_name
}

output "place_index_arn" {
  description = "ARN of the Amazon Location Place Index"
  value       = local.place_index_arn
}

output "geofence_collection_name" {
  description = "Name of the Geofence Collection"
  value       = aws_location_geofence_collection.ims_geofences.collection_name
}

output "geofence_collection_arn" {
  description = "ARN of the Geofence Collection"
  value       = local.geofence_collection_arn
}

output "tracker_name" {
  description = "Name of the Amazon Location Tracker"
  value       = aws_location_tracker.ims_tracker.tracker_name
}

output "tracker_arn" {
  description = "ARN of the Amazon Location Tracker"
  value       = local.tracker_arn
}

output "location_service_policy_arn" {
  description = "ARN of the IAM policy for Location Service access"
  value       = aws_iam_policy.location_service_policy.arn
}
