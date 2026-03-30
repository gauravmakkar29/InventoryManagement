import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { GSI4PK, GSI4SK, limit, nextToken } = ctx.args;
  const query = {
    operation: "Query",
    index: "GSI4",
    query: {
      expression: "GSI4PK = :pk",
      expressionValues: util.dynamodb.toMapValues({ ":pk": GSI4PK }),
    },
    limit: limit || 50,
  };
  if (GSI4SK) {
    query.query.expression += " AND begins_with(GSI4SK, :sk)";
    query.query.expressionValues[":sk"] = util.dynamodb.toDynamoDB(GSI4SK);
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
