import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { AccountDetailsSchema, accountDetailsSchema } from '@/schemas/settingsSchema';

export function useAccountDetailsForm() {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<AccountDetailsSchema>({
    resolver: zodResolver(accountDetailsSchema),
  });

  console.log('errors', errors);

  return {
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    isDirty,
    isSubmitting,
  };
}
