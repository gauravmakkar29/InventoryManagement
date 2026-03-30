import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { PK, SKPrefix, limit, nextToken } = ctx.args;
  const query = {
    operation: "Query",
    query: {
      expression: "PK = :pk",
      expressionValues: util.dynamodb.toMapValues({ ":pk": PK }),
    },
    limit: limit || 50,
  };
  if (SKPrefix) {
    query.query.expression += " AND begins_with(SK, :sk)";
    query.query.expressionValues[":sk"] = util.dynamodb.toDynamoDB(SKPrefix);
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
