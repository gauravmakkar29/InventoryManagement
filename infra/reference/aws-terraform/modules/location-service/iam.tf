# =============================================================================
# IMS Gen 2 — Amazon Location Service Module — IAM Policies
# Epic 10, Story 10.6: Cognito Identity Pool permissions for Location Service
# =============================================================================

# IAM policy document granting all required Location Service permissions
data "aws_iam_policy_document" "location_service_access" {
  # Map tile access (Story 10.1)
  statement {
    sid    = "LocationMapAccess"
    effect = "Allow"
    actions = [
      "geo:GetMapTile",
      "geo:GetMapSprites",
      "geo:GetMapGlyphs",
      "geo:GetMapStyleDescriptor",
    ]
    resources = [
      local.map_arn,
    ]
  }

  # Places API geocoding (Story 10.3)
  statement {
    sid    = "LocationPlacesAccess"
    effect = "Allow"
    actions = [
      "geo:SearchPlaceIndexForText",
      "geo:SearchPlaceIndexForPosition",
      "geo:SearchPlaceIndexForSuggestions",
      "geo:GetPlace",
    ]
    resources = [
      local.place_index_arn,
    ]
  }

  # Geofence operations (Story 10.4)
  statement {
    sid    = "LocationGeofenceAccess"
    effect = "Allow"
    actions = [
      "geo:GetGeofence",
      "geo:ListGeofences",
      "geo:PutGeofence",
      "geo:BatchDeleteGeofence",
      "geo:BatchPutGeofence",
    ]
    resources = [
      local.geofence_collection_arn,
    ]
  }

  # Tracker operations (Story 10.5)
  statement {
    sid    = "LocationTrackerAccess"
    effect = "Allow"
    actions = [
      "geo:BatchUpdateDevicePosition",
      "geo:GetDevicePosition",
      "geo:GetDevicePositionHistory",
      "geo:ListDevicePositions",
      "geo:BatchGetDevicePosition",
    ]
    resources = [
      local.tracker_arn,
    ]
  }
}

# IAM policy resource
resource "aws_iam_policy" "location_service_policy" {
  name        = "${var.project_prefix}-location-service-policy"
  description = "IAM policy for Amazon Location Service access (IMS Gen2 Epic 10)"
  policy      = data.aws_iam_policy_document.location_service_access.json

  tags = var.tags
}

# Attach policy to Cognito authenticated role (if role name is provided)
resource "aws_iam_role_policy_attachment" "cognito_location_access" {
  count      = var.cognito_authenticated_role_name != "" ? 1 : 0
  role       = var.cognito_authenticated_role_name
  policy_arn = aws_iam_policy.location_service_policy.arn
}
