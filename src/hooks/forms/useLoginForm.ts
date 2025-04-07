import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { LoginFormValues, loginSchema } from '@/schemas/authSchemas';

export function useLoginForm() {
  return useForm<LoginFormValues>({
    mode: 'onSubmit',
    criteriaMode: 'all',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });
}
