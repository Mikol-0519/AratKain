import { useState } from "react";
import "../../styles/auth.css";
import { AuthMode, FormState, FormErrors } from "../../types/auth";
import FormInput from "../../components/auth/FormInput";
import MapVisual from "../../components/auth/MapVisual";

interface LoginPageProps {
  onSwitch: (mode: AuthMode) => void;
  onLogin: () => void;
}

export default function LoginPage({ onSwitch, onLogin }: LoginPageProps) {
  const [form, setForm] = useState<Pick<FormState, "email" | "password">>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Pick<FormErrors, "email" | "password">>({});

  const update = (field: "email" | "password", val: string): void => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const validate = (): boolean => {
    const e: Pick<FormErrors, "email" | "password"> = {};
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (): void => {
    if (validate()) onLogin();
  };

  return (
    <div className="auth-container">
      <div className="left-panel">
        <div className="brand">
          <div className="brand-tag">Discover · Explore · Savor</div>
          <div className="brand-name">Arat<span>Kain</span></div>
          <div className="brand-tagline">Find the best cafes & restaurants near you</div>
        </div>
        <div className="visual-block"><MapVisual /></div>
        <div className="left-footer">
          <p>Connecting food lovers with hidden gems, local favorites, and new discoveries in your neighborhood — one pin at a time.</p>
        </div>
      </div>

      <div className="right-panel">
        <div className="form-card fade-in">
          <div className="form-header">
            <div className="form-eyebrow">Welcome back</div>
            <div className="form-title">Login</div>
            <div className="form-subtitle">Sign in to discover nearby spots</div>
          </div>
          <FormInput label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={(v) => update("email", v)} error={errors.email} />
          <FormInput label="Password" type="password" placeholder="••••••••" value={form.password} onChange={(v) => update("password", v)} error={errors.password}>
            <span className="forgot-link" onClick={() => alert("Reset link sent!")}>Forgot Password?</span>
          </FormInput>
          <button className="btn-primary" onClick={handleSubmit}>Login</button>
          <div className="divider"><span>or</span></div>
          <div className="switch-link">
            Don't have an account? <button onClick={() => onSwitch("register")}>Register</button>
          </div>
        </div>
      </div>
    </div>
  );
}