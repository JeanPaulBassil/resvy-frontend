import React from 'react';
import { DatePicker } from '@heroui/react';
import { CalendarDate } from '@internationalized/date';

interface DatePickerAdapterProps {
  value: CalendarDate;
  onChange: (date: CalendarDate) => void;
  classNames?: {
    base?: string;
    input?: string;
  };
}

/**
 * Adapter component for DatePicker to handle type conversions properly
 */
export function DatePickerAdapter({ value, onChange, classNames }: DatePickerAdapterProps) {
  const handleChange = (date: CalendarDate | null) => {
    if (date) {
      onChange(date);
    }
  };

  return (
    <DatePicker
      value={value}
      onChange={handleChange}
      classNames={classNames}
    />
  );
} 