import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { GSI3PK, GSI3SK, limit, nextToken } = ctx.args;
  const query = {
    operation: "Query",
    index: "GSI3",
    query: {
      expression: "GSI3PK = :pk",
      expressionValues: util.dynamodb.toMapValues({ ":pk": GSI3PK }),
    },
    limit: limit || 50,
  };
  if (GSI3SK) {
    query.query.expression += " AND begins_with(GSI3SK, :sk)";
    query.query.expressionValues[":sk"] = util.dynamodb.toDynamoDB(GSI3SK);
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
