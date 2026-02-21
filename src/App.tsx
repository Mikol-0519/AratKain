import { useState } from "react";
import { AuthMode } from "./types/auth";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import HomePage from "./pages/auth/HomePage";

type AppPage = "login" | "register" | "home";

export default function App() {
  const [page, setPage] = useState<AppPage>("login");

  const handleAuthSwitch = (mode: AuthMode) => setPage(mode);

  if (page === "home") return <HomePage />;

  return page === "login"
    ? <LoginPage onSwitch={handleAuthSwitch} onLogin={() => setPage("home")} />
    : <RegisterPage onSwitch={handleAuthSwitch} onRegister={() => setPage("home")} />;
}