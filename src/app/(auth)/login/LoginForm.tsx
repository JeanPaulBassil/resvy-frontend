'use client';

import { Alert, Button, Form } from '@heroui/react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { AuthCard } from '@/components/auth/AuthCard';
import { InputField } from '@/components/forms/InputField';
import { InputPasswordField } from '@/components/forms/InputPasswordField';
import { useLoginForm } from '@/hooks/forms/useLoginForm';
import { useAuthState } from '@/hooks/useAuthState';
import { signIn } from '@/services/authService';
import { handleAuthError } from '@/utils/firebaseErrors';

interface LoginFormProps {
  reason?: string | null;
}

export default function LoginForm({ reason }: LoginFormProps) {
  const { state, startEmailLoading, stopAllLoading, setError } = useAuthState();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useLoginForm();
  const router = useRouter();
  const [formInitialized, setFormInitialized] = useState(false);

  // Handle browser autofill with improved approach
  useEffect(() => {
    // Add an event listener for 'animationstart' which triggers on autofill
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;

    // Handle autofilled inputs
    const handleAutofill = () => {
      // Small delay to ensure autofill has completed
      setTimeout(() => {
        if (emailInput?.value) {
          setValue('email', emailInput.value);
        }
        
        if (passwordInput?.value) {
          setValue('password', passwordInput.value);
        }
        
        clearErrors();
      }, 100);
    };

    // Add event listeners for input changes (for autofill detection)
    emailInput?.addEventListener('input', handleAutofill);
    passwordInput?.addEventListener('input', handleAutofill);

    // Also run once on mount to catch any pre-filled values
    handleAutofill();
    
    // Mark the form as initialized
    setFormInitialized(true);

    return () => {
      emailInput?.removeEventListener('input', handleAutofill);
      passwordInput?.removeEventListener('input', handleAutofill);
    };
  }, [setValue, clearErrors]);

  // Get message based on reason
  const getReasonMessage = () => {
    if (!reason) return null;
    
    switch (reason) {
      case 'deactivated':
        return 'Your account has been deactivated. Please contact an administrator.';
      case 'expired':
        return 'Your session has expired. Please log in again.';
      case 'revoked':
        return 'Your session has been revoked. Please log in again.';
      case 'auth_error':
        return 'Authentication error. Please log in again.';
      default:
        return null;
    }
  };

  const reasonMessage = getReasonMessage();

  async function onSubmit(data: { email: string; password: string }) {
    startEmailLoading();
    try {
      const userData = await signIn(data.email, data.password, false);
      // Check if user is admin and redirect to clients page instead of home
      if (
        userData?.role === 'ADMIN' ||
        userData?.user?.role === 'ADMIN' ||
        userData?.payload?.user?.role === 'ADMIN'
      ) {
        router.replace('/admin/clients');
      } else {
        router.replace('/dashboard');
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED_EMAIL') {
        return;
      }
      setError(handleAuthError(err));
    } finally {
      stopAllLoading();
    }
  }

  return (
    <AuthCard
      title="Log In"
      error={state.error}
      loading={state.emailLoading}
      footerText="Need to create an account?"
      footerLinkText="Sign Up"
      footerLinkHref="/signup"
    >
      {reasonMessage && (
        <Alert color="danger" className="mb-4">
          {reasonMessage}
        </Alert>
      )}
      <Form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
        <InputField
          {...register('email')}
          isRequired
          label="Email Address"
          placeholder="Enter your email"
          isInvalid={!!errors.email}
          errorMessage={errors.email?.message}
          type="email"
          autoComplete="username"
        />
        <InputPasswordField
          {...register('password')}
          isRequired
          label="Password"
          placeholder="Enter your password"
          isInvalid={!!errors.password}
          errorMessage={errors.password?.message}
          autoComplete="current-password"
        />

        <Button
          className="w-full"
          color="primary"
          type="submit"
          isLoading={state.emailLoading}
          disabled={state.emailLoading || !formInitialized}
        >
          Log In
        </Button>
      </Form>
    </AuthCard>
  );
}
