import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { GSI2PK, GSI2SK, limit, nextToken } = ctx.args;
  const query = {
    operation: "Query",
    index: "GSI2",
    query: {
      expression: "GSI2PK = :pk",
      expressionValues: util.dynamodb.toMapValues({ ":pk": GSI2PK }),
    },
    limit: limit || 50,
  };
  if (GSI2SK) {
    query.query.expression += " AND begins_with(GSI2SK, :sk)";
    query.query.expressionValues[":sk"] = util.dynamodb.toDynamoDB(GSI2SK);
  }
  if (nextToken) {
    query.nextToken = nextToken;
  }
  return query;
}

export function response(ctx) {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }
  return { items: ctx.result.items, nextToken: ctx.result.nextToken };
}
