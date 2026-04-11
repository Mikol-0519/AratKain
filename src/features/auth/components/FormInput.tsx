import React from 'react';

interface FormInputProps {
  label:        string;
  type?:        string;
  placeholder:  string;
  value:        string;
  onChange:     (val: string) => void;
  error?:       string;
  children?:    React.ReactNode;
}

export default function FormInput({
  label, type = 'text', placeholder, value, onChange, error, children,
}: FormInputProps) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className={`form-input${error ? ' input-error' : ''}`}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {children}
      {error && (
        <div className="field-error">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}