import { z } from "zod";

export const accountDetailsSchema = z.object({
  uid: z.string(),
  username: z.string().optional(),
  phoneNumber: z.string().optional(),
  photo: z.instanceof(File).optional(),
});

export type AccountDetailsSchema = z.infer<typeof accountDetailsSchema>; 