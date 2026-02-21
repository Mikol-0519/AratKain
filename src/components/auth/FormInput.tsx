import React from "react";

interface FormInputProps {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  children?: React.ReactNode;
}

export default function FormInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  children,
}: FormInputProps) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {children}
      {error && <div className="error-msg">{error}</div>}
    </div>
  );
}