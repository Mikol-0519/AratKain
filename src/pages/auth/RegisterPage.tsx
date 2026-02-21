import { useState } from "react";
import "../../styles/auth.css";
import { AuthMode, FormState, FormErrors } from "../../types/auth";
import FormInput from "../../components/auth/FormInput";
import StrengthMeter from "../../components/auth/StrengthMeter";
import MapVisual from "../../components/auth/MapVisual";
import { getPasswordStrength } from "../../utils/auth";

interface RegisterPageProps {
  onSwitch: (mode: AuthMode) => void;
  onRegister: () => void;
}

export default function RegisterPage({ onSwitch, onRegister }: RegisterPageProps) {
  const [form, setForm] = useState<FormState>({ email: "", name: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<FormErrors>({});

  const update = (field: keyof FormState, val: string): void => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (!form.name.trim()) e.name = "Name is required";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (): void => {
    if (validate()) onRegister();
  };

  const strength = getPasswordStrength(form.password);

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
            <div className="form-eyebrow">Join AratKain</div>
            <div className="form-title">Create New<br />Account</div>
            <div className="form-subtitle">Start your food discovery journey</div>
          </div>
          <FormInput label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={(v) => update("email", v)} error={errors.email} />
          <FormInput label="Name" placeholder="Your full name" value={form.name} onChange={(v) => update("name", v)} error={errors.name} />
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={(e) => update("password", e.target.value)} />
            {form.password && <StrengthMeter score={strength} />}
            {errors.password && <div className="error-msg">{errors.password}</div>}
          </div>
          <FormInput label="Confirm your password" type="password" placeholder="••••••••" value={form.confirm} onChange={(v) => update("confirm", v)} error={errors.confirm} />
          <button className="btn-primary" onClick={handleSubmit}>Create Account</button>
          <div className="divider"><span>or</span></div>
          <div className="switch-link">
            Already have an account? <button onClick={() => onSwitch("login")}>Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}