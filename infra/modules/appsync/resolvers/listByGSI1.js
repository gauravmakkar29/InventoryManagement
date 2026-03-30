import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { GSI1PK, GSI1SK, limit, nextToken } = ctx.args;
  const query = {
    operation: "Query",
    index: "GSI1",
    query: {
      expression: "GSI1PK = :pk",
      expressionValues: util.dynamodb.toMapValues({ ":pk": GSI1PK }),
    },
    limit: limit || 50,
  };
  if (GSI1SK) {
    query.query.expression += " AND begins_with(GSI1SK, :sk)";
    query.query.expressionValues[":sk"] = util.dynamodb.toDynamoDB(GSI1SK);
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
