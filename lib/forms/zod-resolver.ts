import type { FieldValues, Resolver } from "react-hook-form"
import type { ZodType } from "zod"

export function makeZodResolver<TFieldValues extends FieldValues>(
  schema: ZodType<TFieldValues>
): Resolver<TFieldValues> {
  return async (values) => {
    const parsed = schema.safeParse(values)

    if (parsed.success) {
      return {
        values: parsed.data,
        errors: {},
      }
    }

    const fieldErrors = parsed.error.flatten().fieldErrors

    return {
      values: {} as TFieldValues,
      errors: Object.fromEntries(
        Object.entries(fieldErrors).map(([field, messages]) => [
          field,
          {
            type: "validation",
            message: messages?.[0] ?? "Invalid value",
          },
        ])
      ) as never,
    }
  }
}
