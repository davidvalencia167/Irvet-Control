import { useState, type FormEvent } from "react";


interface LoginProps {
    onLogin: (usuario: string, password: string) => Promise<void>;
    onForgotPassword: () => void;
}

export default function Login({ onLogin, onForgotPassword }: LoginProps) {
    const [usuario, setUsuario] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

      const handleSubmit = async (
        event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onLogin(usuario, password);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Usuario o contraseña incorrectos.",
      );
    } finally {
      setLoading(false);
    }
  };

    return(
    <main className="min-h-screen flex items-center justify-center bg-[#EEF2F7]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg"
      >
        <h1 className="text-2xl font-bold text-[#1B2B4B] mb-6">
          IRVET Control
        </h1>

        <label className="block mb-2 font-bold">
          Usuario
        </label>

        <input
          value={usuario}
          onChange={(event) => {
            setUsuario(event.target.value);
            setError("");
          }}
          className="w-full border rounded-xl p-3 mb-4"
          placeholder="Ej: SEBASTIAN"
          autoComplete="username"
          required
        />

        <label className="block mb-2 font-bold">
          Contraseña
        </label>

        <input
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError("");
          }}
          className="w-full border rounded-xl p-3 mb-1"
          placeholder="Contraseña"
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-[#2BB5C3] text-white font-bold p-3 rounded-xl disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <button
          type="button"
          onClick={onForgotPassword}
          className="w-full mt-3 text-sm text-[#1B2B4B]"
        >
          ¿Olvidaste tu contraseña?
        </button>

        {error && (
          <p className="text-red-500 mt-4 text-sm">
            {error}
          </p>
        )}
      </form>
    </main>
    );
}