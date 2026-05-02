import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || props.name;

  return (
    <div className="flex-col gap-1 w-full" style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '0.4rem' }}>
      {label && (
        <label htmlFor={inputId} style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--dark)',
          fontWeight: 700
        }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx('input-field', className)}
        style={{
          borderColor: error ? 'red' : undefined
        }}
        {...props}
      />
      {error && (
        <span style={{ color: 'red', fontSize: '0.75rem', fontFamily: 'var(--font-outfit)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
