'use client';

import { Button, Form } from '@heroui/react';
import { useRouter } from 'next/navigation';
import React from 'react';

import { AuthCard } from '@/components/auth/AuthCard';
import { InputField } from '@/components/forms/InputField';
import { InputPasswordField } from '@/components/forms/InputPasswordField';
import { useSignUpForm } from '@/hooks/forms/useSignupForm';
import { useAuthState } from '@/hooks/useAuthState';
import { signInWithGoogle, signUp } from '@/services/authService';
import { handleAuthError } from '@/utils/firebaseErrors';

export default function SignUpForm() {
  const { state, startEmailLoading, startGoogleLoading, stopAllLoading, setError } = useAuthState();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useSignUpForm();
  const router = useRouter();

  async function onSubmit(data: { email: string; password: string }) {
    startEmailLoading();
    try {
      await signUp(data.email, data.password);
      router.replace('/');
    } catch (err) {
      setError(handleAuthError(err));
    } finally {
      stopAllLoading();
    }
  }

  const handleGoogleSignIn = async () => {
    startGoogleLoading();
    try {
      await signInWithGoogle();
      router.replace('/');
    } catch (err) {
      setError(handleAuthError(err));
    } finally {
      stopAllLoading();
    }
  };

  return (
    <AuthCard
      title="Sign Up"
      error={state.error}
      loading={state.googleLoading}
      onGoogleClick={handleGoogleSignIn}
      footerText="Already have an account?"
      footerLinkText="Log In"
      footerLinkHref="/login"
    >
      <Form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
        <InputField
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          errorMessage={errors.email?.message}
          {...register('email')}
          isRequired
        />

        <InputPasswordField
          {...register('password')}
          label="Password"
          placeholder="Enter your password"
          errorMessage={errors.password?.message}
          isRequired
        />

        <InputPasswordField
          {...register('confirmPassword')}
          label="Confirm Password"
          placeholder="Confirm your password"
          errorMessage={errors.confirmPassword?.message}
          isRequired
        />

        <Button
          className="w-full"
          color="primary"
          type="submit"
          isLoading={state.emailLoading}
          disabled={state.emailLoading || state.googleLoading}
        >
          Sign Up
        </Button>
      </Form>
    </AuthCard>
  );
}
