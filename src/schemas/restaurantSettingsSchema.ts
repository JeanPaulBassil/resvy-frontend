import { z } from "zod";

export const restaurantSettingsSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
});

export type RestaurantSettingsSchema = z.infer<typeof restaurantSettingsSchema>;

export const restaurantDeleteSchema = z.object({
  confirmationName: z.string(),
})

export type RestaurantDeleteSchema = z.infer<typeof restaurantDeleteSchema>; 