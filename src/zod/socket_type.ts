import z from "zod";

export const Setup_Schema = z.object({
  id: z.string(),
});

export type Setup_Type = z.infer<typeof Setup_Schema>;
