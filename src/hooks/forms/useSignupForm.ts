import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { SignUpFormValues, signUpSchema } from '@/schemas/authSchemas';

export function useSignUpForm() {
  return useForm<SignUpFormValues>({
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(signUpSchema),
  });
}
