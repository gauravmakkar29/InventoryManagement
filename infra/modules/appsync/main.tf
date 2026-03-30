# =============================================================================
# AppSync — GraphQL API + Schema + Data Sources
# Cognito auth, DynamoDB data source, HTTP data source (OpenSearch)
# =============================================================================

data "aws_region" "current" {}

resource "aws_appsync_graphql_api" "main" {
  name                = "${var.project_name}-${var.environment}-api"
  authentication_type = "AMAZON_COGNITO_USER_POOLS"

  user_pool_config {
    aws_region     = data.aws_region.current.name
    user_pool_id   = var.cognito_user_pool_id
    default_action = "ALLOW"
  }

  schema = file("${path.module}/schema.graphql")

  tags = {
    Name = "${var.project_name}-${var.environment}-api"
  }
}

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

# --- HTTP Data Source (OpenSearch) ---
# Used by search resolvers when OpenSearch is enabled

resource "aws_appsync_datasource" "opensearch" {
  count            = var.opensearch_endpoint != "" ? 1 : 0
  api_id           = aws_appsync_graphql_api.main.id
  name             = "OpenSearchDataSource"
  type             = "HTTP"
  service_role_arn = var.appsync_role_arn

  http_config {
    endpoint = var.opensearch_endpoint

    authorization_config {
      authorization_type = "AWS_IAM"

      aws_iam_config {
        signing_region       = data.aws_region.current.name
        signing_service_name = "aoss"
      }
    }
  }
}
