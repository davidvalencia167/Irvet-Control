import { useState, type FormEvent } from "react";
import { resetPassword } from "../../api/auth";

interface ResetPasswordProps {
  token: string;
  onBack: () => void;
}

export default function ResetPassword({ token, onBack }: ResetPasswordProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(token, password);
      setMessage(result.message);
      setPassword("");
      setConfirmation("");
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "No se pudo restablecer la contraseña.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#EEF2F7]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-[#1B2B4B] mb-6">Nueva contraseña</h1>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full border rounded-xl p-3 mb-3"
          placeholder="Nueva contraseña"
          autoComplete="new-password"
          required
        />
        <input
          type="password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="w-full border rounded-xl p-3 mb-4"
          placeholder="Confirmar contraseña"
          autoComplete="new-password"
          required
        />
        {message && <p className="text-emerald-600 text-sm mb-4">{message}</p>}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#2BB5C3] text-white font-bold p-3 rounded-xl disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Restablecer contraseña"}
        </button>
        <button type="button" onClick={onBack} className="w-full mt-3 text-sm text-[#1B2B4B]">
          Volver al inicio de sesión
        </button>
      </form>
    </main>
  );
}
