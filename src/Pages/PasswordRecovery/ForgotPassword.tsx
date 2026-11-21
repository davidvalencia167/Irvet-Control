import { useState, type FormEvent } from "react";
import { requestPasswordReset } from "../../api/auth";

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [correo, setCorreo] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await requestPasswordReset(correo);
      setMessage(result.message);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo solicitar la recuperación.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#EEF2F7]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-[#1B2B4B] mb-2">Recuperar contraseña</h1>
        <p className="text-sm text-[#6B7A99] mb-6">
          Escribe tu correo y recibirás un enlace para restablecerla.
        </p>
        <input
          type="email"
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
          className="w-full border rounded-xl p-3 mb-4"
          placeholder="correo@irvet.com"
          autoComplete="email"
          required
        />
        {message && <p className="text-emerald-600 text-sm mb-4">{message}</p>}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#2BB5C3] text-white font-bold p-3 rounded-xl disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar enlace"}
        </button>
        <button type="button" onClick={onBack} className="w-full mt-3 text-sm text-[#1B2B4B]">
          Volver al inicio de sesión
        </button>
      </form>
    </main>
  );
}
