import { Icon } from '@iconify/react';
import React from 'react';

import { useToggle } from '@/hooks/useToggle';

import { InputField } from './InputField';

interface InputPasswordFieldProps extends React.ComponentProps<typeof InputField> {}

export const InputPasswordField = React.forwardRef<HTMLInputElement, InputPasswordFieldProps>(
  (props, ref) => {
    const [isVisible, toggleVisibility] = useToggle();

    const PasswordToggle = () => (
      <button type="button" onClick={toggleVisibility}>
        <Icon
          className="text-2xl text-default-400"
          icon={isVisible ? 'solar:eye-closed-linear' : 'solar:eye-bold'}
        />
      </button>
    );

    return (
      <InputField
        {...props}
        ref={ref}
        type={isVisible ? 'text' : 'password'}
        endContent={<PasswordToggle />}
      />
    );
  }
);

InputPasswordField.displayName = 'InputPasswordField';
