# =============================================================================
# AppSync — GraphQL API + Schema + Data Sources + JS Resolvers
# Cognito auth, DynamoDB data source, HTTP data source (OpenSearch)
# =============================================================================

resource "aws_appsync_graphql_api" "main" {
  name                = "${var.project_name}-${var.environment}-api"
  authentication_type = "AMAZON_COGNITO_USER_POOLS"

  user_pool_config {
    aws_region     = data.aws_region.current.name
    user_pool_id   = var.cognito_user_pool_id
    default_action = "ALLOW"
  }

  # TODO: Upload schema from file — schema = file("${path.module}/schema.graphql")
  schema = <<-EOF
    type Query {
      _placeholder: String
    }
    type Mutation {
      _placeholder: String
    }
    type Subscription {
      _placeholder: String
    }
    schema {
      query: Query
      mutation: Mutation
      subscription: Subscription
    }
  EOF

  tags = {
    Name = "${var.project_name}-${var.environment}-api"
  }
}

data "aws_region" "current" {}

# --- DynamoDB Data Source ---

resource "aws_appsync_datasource" "dynamodb" {
  api_id           = aws_appsync_graphql_api.main.id
  name             = "DynamoDBDataSource"
  type             = "AMAZON_DYNAMODB"
  service_role_arn = var.appsync_role_arn

  dynamodb_config {
    table_name = var.dynamodb_table_name
    region     = data.aws_region.current.name
  }
}

# --- HTTP Data Source (OpenSearch Serverless) ---
# TODO: Uncomment when OpenSearch module is enabled
# resource "aws_appsync_datasource" "opensearch" {
#   api_id           = aws_appsync_graphql_api.main.id
#   name             = "OpenSearchDataSource"
#   type             = "HTTP"
#   service_role_arn = var.appsync_role_arn
#
#   http_config {
#     endpoint = "https://<collection-endpoint>.aoss.amazonaws.com"
#     authorization_config {
#       authorization_type = "AWS_IAM"
#       aws_iam_config {
#         signing_region  = data.aws_region.current.name
#         signing_service_name = "aoss"
#       }
#     }
#   }
# }

# --- JS Resolvers ---
# TODO: Create resolver source files under modules/appsync/resolvers/
# and wire up each resolver below. Example pattern:
#
# resource "aws_appsync_resolver" "get_device" {
#   api_id    = aws_appsync_graphql_api.main.id
#   type      = "Query"
#   field     = "getDevice"
#   runtime {
#     name            = "APPSYNC_JS"
#     runtime_version = "1.0.0"
#   }
#   code = file("${path.module}/resolvers/getDevice.js")
#   data_source = aws_appsync_datasource.dynamodb.name
# }

# TODO: Wire up the following 15 JS resolvers:
# Query resolvers:
#   1. getDevice          — Fetch single device by PK/SK
#   2. listDevices        — List devices with pagination
#   3. getLocation        — Fetch single location
#   4. listLocations      — List locations by org
#   5. getWorkOrder       — Fetch single work order
#   6. listWorkOrders     — List work orders with filters
#   7. getAuditTrail      — Fetch audit entries for an entity
#   8. getFirmware        — Fetch firmware metadata
#   9. listFirmware       — List firmware versions
#  10. getDashboardKPIs   — Aggregated KPI metrics
#  11. getComplianceStatus — Compliance summary for entity
#
# Mutation resolvers:
#  12. createDevice       — Create new device record
#  13. updateDevice       — Update device attributes
#  14. createWorkOrder    — Create work order
#  15. updateWorkOrder    — Update work order status
