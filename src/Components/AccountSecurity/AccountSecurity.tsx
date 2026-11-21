import { useState, type FormEvent } from "react";
import { changePassword } from "../../api/auth";

interface AccountSecurityProps {
  onClose: () => void;
}

export default function AccountSecurity({ onClose }: AccountSecurityProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener mínimo 8 caracteres.");
      return;
    }
    if (newPassword !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      setMessage(result.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : "No se pudo cambiar la contraseña.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-extrabold text-[#1B2B4B]">Cambiar contraseña</h2>
          <button type="button" onClick={onClose} className="text-[#6B7A99]">Cerrar</button>
        </div>
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="w-full border rounded-xl p-3 mb-3"
          placeholder="Contraseña actual"
          autoComplete="current-password"
          required
        />
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
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
          placeholder="Confirmar nueva contraseña"
          autoComplete="new-password"
          required
        />
        {message && <p className="text-emerald-600 text-sm mb-4">{message}</p>}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border p-3 font-bold text-[#1B2B4B]">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-[#2BB5C3] p-3 font-bold text-white disabled:opacity-60">
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
