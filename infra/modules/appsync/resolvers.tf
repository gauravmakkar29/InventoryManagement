# =============================================================================
# AppSync JS Resolvers
# 11 DynamoDB resolvers + 4 OpenSearch search resolvers
# =============================================================================

# --- DynamoDB Resolvers ---

resource "aws_appsync_resolver" "get_entity" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "getDevice"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/getEntity.js")
}

resource "aws_appsync_resolver" "get_location" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "getLocation"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/getEntity.js")
}

resource "aws_appsync_resolver" "get_work_order" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "getWorkOrder"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/getEntity.js")
}

resource "aws_appsync_resolver" "get_firmware" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "getFirmware"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/getEntity.js")
}

resource "aws_appsync_resolver" "get_vulnerability" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "getVulnerability"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/getEntity.js")
}

resource "aws_appsync_resolver" "list_by_gsi1" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listDevices"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/listByGSI1.js")
}

resource "aws_appsync_resolver" "list_devices_by_status" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listDevicesByStatus"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/listByGSI1.js")
}

resource "aws_appsync_resolver" "list_devices_by_location" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listDevicesByLocation"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/queryByGSI2.js")
}

resource "aws_appsync_resolver" "list_locations" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listLocations"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/listByGSI1.js")
}

resource "aws_appsync_resolver" "list_work_orders" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listWorkOrders"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/listByGSI1.js")
}

resource "aws_appsync_resolver" "list_work_orders_by_status" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listWorkOrdersByStatus"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/listByGSI1.js")
}

resource "aws_appsync_resolver" "list_firmware" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listFirmware"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/listByGSI1.js")
}

resource "aws_appsync_resolver" "list_firmware_by_status" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listFirmwareByStatus"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/listByGSI1.js")
}

resource "aws_appsync_resolver" "list_vulnerabilities" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "listVulnerabilities"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/listByGSI1.js")
}

resource "aws_appsync_resolver" "get_audit_trail" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "getAuditTrail"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/queryByGSI3.js")
}

resource "aws_appsync_resolver" "get_dashboard_kpis" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "getDashboardKPIs"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/queryByPK.js")
}

resource "aws_appsync_resolver" "get_compliance_status" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "getComplianceStatus"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/queryByPK.js")
}

# --- Mutation Resolvers ---

resource "aws_appsync_resolver" "create_device" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "createDevice"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/createEntity.js")
}

resource "aws_appsync_resolver" "update_device" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "updateDevice"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/updateStatus.js")
}

resource "aws_appsync_resolver" "update_device_status" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "updateDeviceStatus"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/updateStatus.js")
}

resource "aws_appsync_resolver" "create_work_order" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "createWorkOrder"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/createEntity.js")
}

resource "aws_appsync_resolver" "update_work_order" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "updateWorkOrder"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/updateStatus.js")
}

resource "aws_appsync_resolver" "create_entity" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "createEntity"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/createEntity.js")
}

resource "aws_appsync_resolver" "approve_firmware" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "approveFirmware"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/approveFirmware.js")
}

resource "aws_appsync_resolver" "advance_firmware_stage" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "advanceFirmwareStage"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/advanceFirmwareStage.js")
}

resource "aws_appsync_resolver" "update_vulnerability_status" {
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Mutation"
  field       = "updateVulnerabilityStatus"
  data_source = aws_appsync_datasource.dynamodb.name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/updateVulnerabilityStatus.js")
}

# --- Search Resolvers (OpenSearch) ---

resource "aws_appsync_resolver" "search_global" {
  count       = var.opensearch_endpoint != "" ? 1 : 0
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "searchGlobal"
  data_source = aws_appsync_datasource.opensearch[0].name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/searchGlobal.js")
}

resource "aws_appsync_resolver" "search_devices" {
  count       = var.opensearch_endpoint != "" ? 1 : 0
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "searchDevices"
  data_source = aws_appsync_datasource.opensearch[0].name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/searchDevices.js")
}

resource "aws_appsync_resolver" "search_vulnerabilities" {
  count       = var.opensearch_endpoint != "" ? 1 : 0
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "searchVulnerabilities"
  data_source = aws_appsync_datasource.opensearch[0].name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/searchVulnerabilities.js")
}

resource "aws_appsync_resolver" "get_aggregations" {
  count       = var.opensearch_endpoint != "" ? 1 : 0
  api_id      = aws_appsync_graphql_api.main.id
  type        = "Query"
  field       = "getAggregations"
  data_source = aws_appsync_datasource.opensearch[0].name

  runtime {
    name            = "APPSYNC_JS"
    runtime_version = "1.0.0"
  }

  code = file("${path.module}/resolvers/getAggregations.js")
}
