import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { restaurantApi } from '@/api/restaurant';
import useAppMutation from './useAppMutation';
import { useRouter } from 'next/navigation';
import { countryCodes } from '@/constants/countryCodes';
import { useRestaurant } from '@/components/providers/RestaurantProvider';

// Define the validation schema using Zod
const createRestaurantSchema = z.object({
  name: z.string().min(3, 'Restaurant name must be at least 3 characters'),
  description: z.string().optional(),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  phone: z.string().min(6, 'Phone number must be at least 6 digits'),
  email: z.string().email('Please enter a valid email address'),
  countryCode: z.string().default('+961'),
});

// Infer the type from the schema
export type CreateRestaurantFormData = z.infer<typeof createRestaurantSchema>;

export function useCreateRestaurant() {
  const router = useRouter();
  const { refetchRestaurants, setCurrentRestaurant } = useRestaurant();

  // Initialize the form with React Hook Form and Zod validation
  const form = useForm<CreateRestaurantFormData>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      countryCode: '+961',
    },
  });

  // Use the app mutation hook for API calls
  const createRestaurantMutation = useAppMutation({
    mutationFn: (data: CreateRestaurantFormData) => 
      restaurantApi.createRestaurant({
        name: data.name,
        description: data.description || undefined,
        address: data.address,
        phone: `${data.countryCode}${data.phone}`,
        email: data.email,
      }),
    successMessage: 'Restaurant created successfully!',
    errorMessage: 'Failed to create restaurant. Please try again.',
    onSuccessCallback: async (newRestaurant) => {
      // Refetch restaurants to update the list
      await refetchRestaurants();
      
      // Set the newly created restaurant as the current restaurant
      setCurrentRestaurant(newRestaurant);
      
      // Navigate to dashboard after setting the current restaurant
      router.push('/dashboard');
    },
  });

  // Handle form submission
  const onSubmit = form.handleSubmit((data) => {
    createRestaurantMutation.mutate(data);
  });

  return {
    form,
    onSubmit,
    isSubmitting: createRestaurantMutation.isPending,
    isSuccess: createRestaurantMutation.isSuccess,
    isError: createRestaurantMutation.isError,
    error: createRestaurantMutation.error,
    countryCodes,
  };
} 