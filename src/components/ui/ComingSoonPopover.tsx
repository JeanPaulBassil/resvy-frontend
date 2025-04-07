import { Popover, PopoverContent, PopoverTrigger } from '@heroui/react';
import React from 'react';

interface ComingSoonPopoverProps {
  children: React.ReactNode;
  feature?: string;
}

const ComingSoonPopover = ({ children, feature = 'Feature' }: ComingSoonPopoverProps) => {
  return (
    <Popover placement="right">
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent>
        <div className="px-1 py-2">
          <div className="text-small font-bold">Coming Soon</div>
          <div className="text-tiny">{feature} will be available soon!</div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ComingSoonPopover; 