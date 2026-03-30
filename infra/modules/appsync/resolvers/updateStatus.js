import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const { PK, SK, status } = ctx.args;
  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({ PK, SK }),
    update: {
      expression: "SET #status = :status, updatedAt = :now",
      expressionNames: { "#status": "status" },
      expressionValues: util.dynamodb.toMapValues({
        ":status": status,
        ":now": util.time.nowISO8601(),
      }),
    },
    condition: {
      expression: "attribute_exists(PK)",
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}
