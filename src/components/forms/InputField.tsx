import { Input, InputProps } from '@heroui/react';
import debounce from 'lodash/debounce';
import React, { useCallback, useEffect, useMemo } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface InputFieldProps extends Omit<InputProps, keyof UseFormRegisterReturn> {
  label?: string;
  registration?: UseFormRegisterReturn;
  errorMessage?: string;
  isRequired?: boolean;
  debounceMs?: number;
  onValueChange?: (value: string) => void;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, registration, errorMessage, isRequired, debounceMs = 500, onValueChange, ...props }, ref) => {
    const isInvalid = Boolean(errorMessage);

    const debouncedOnChange = useMemo(
      () =>
        debounce((value: string) => {
          onValueChange?.(value);
        }, debounceMs),
      [onValueChange, debounceMs]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        registration?.onChange?.(e);
        debouncedOnChange(e.target.value);
      },
      [registration, debouncedOnChange]
    );

    useEffect(() => {
      return () => {
        debouncedOnChange.cancel();
      };
    }, [debouncedOnChange]);

    return (
      <Input
        {...registration}
        {...props}
        ref={ref}
        label={label}
        isInvalid={isInvalid}
        errorMessage={errorMessage}
        variant="bordered"
        isRequired={isRequired}
        onChange={handleChange}
      />
    );
  }
);

InputField.displayName = 'InputField';
