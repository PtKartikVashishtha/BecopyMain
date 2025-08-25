'use client';

import React from 'react';

interface BootstrapSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const BootstrapSwitch: React.FC<BootstrapSwitchProps> = ({
  checked,
  onChange,
  label,
  className = '',
}) => {
  return (
    <div>
      <label className={`inline-flex items-center gap-2 cursor-pointer ${className} my-2`}>
        <div className="relative">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only peer"
          />
          <div
            className={`
            w-10 h-5 rounded-full bg-gray-300 peer-checked:bg-blue-600
            transition-colors
          `}
          />
          <div
            className={`
            absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full
            transition-transform peer-checked:translate-x-5
          `}
          />
        </div>
        {label && <span className="text-sm text-primary-800">{label}</span>}
      </label>
    </div>
  );
};
