import { useState } from "react";
import type { ServicioCatalogo } from "../../constants/services";
import { Plus, Trash2 } from "lucide-react";



interface ServiceCatalogProps {
    catalogo: Record<string, ServicioCatalogo[]>;
    onAdd: (service: ServicioCatalogo) => void;
    onDelete: (categoria: string, nombre: string) => void;
}


export default function ServiceCatalog({catalogo, onAdd, onDelete}: ServiceCatalogProps) {

    const [categoria, setCategoria] = useState("");
    const [nombre, setNombre] = useState("");
    const [precio, setPrecio] = useState("");
    const [error, setError] = useState("");

    const handleAdd = () => {
        const category = categoria.trim();
        const serviceName = nombre.trim();
        const servicePrice = Number(precio);

        if (!category || !serviceName || !servicePrice || servicePrice <= 0) {
            setError("Completa la categoría, descripción y precio.");
            return;
        }

        onAdd({
            categoria: category,
            nombre: serviceName,
            precio: servicePrice
        });

        setNombre("");
        setPrecio("");
        setError("");
    };

    return(
        <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-[rgba(27, 43, 75, 0.06)] p-6">
                <h2 className="text-[16px] font-extrabold text-[#1B2B4B]">
                    Agregar servicio
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoría. Ej: Inmunológicos" className="w-full px-3 py-2 text-sm bg-[#F4F7FA] border rounded-xl"/>
                    <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Descripción del servicio" className="w-full px-3 py-2 text-sm bg-[#F4F7FA] border rounded-xl"/>
                    <input type="number" min="1" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Precio" className="w-full px-3 py-2 text-sm bg-[#F4F7FA] border rounded-xl"  />
                </div>

                {
                    error && (
                        <p className="text-[12px] text-rose-500 mt-2">{error}</p>
                    )}

                    <button type="button" onClick={handleAdd} className="mt-4 flex items-center gap-2 text-white text-[13px] font-bold px-4 py-2.5 rounded-xl" style={{background: "#2BB5C3"}}>
                        <Plus size={15}/>
                        Agregar servicio
                    </button>
            </div>

            <div className="bg-white rounded-2xl border border-[rgba(27, 43, 75, 0.06)] p-6">
                <h2 className="text-[16px] font-extrabold text-[#1B2B4B] mb-4">
                    Servicios registrados
                </h2>

                <div className="space-y-5">
                    {
                        Object.entries(catalogo).map(([category, services]) => (
                            <div key={category}>
                                <h3 className="text-[13px] font-bold text-[#2BB5C3] mb-2">
                                    {category}
                                </h3>

                                <div className="space-y-2">
                                    {
                                        services.map((service) => (
                                            <div key={`${service.categoria}-${service.nombre}`} className="flex items-center justify-between gap-4 border rounded-xl px-4 py-3">
                                                <div>
                                                    <p className="text-[13px] font-semibold text-[#1B2B4B]">
                                                        {service.nombre}
                                                    </p>
                                                    <p className="text-[12px] text-[#6B7A99]">
                                                        ${service.precio.toLocaleString("es-CO")}
                                                    </p>
                                                </div>

                                                <button type="button" title="Eliminar servicio" onClick={() => onDelete(category, service.nombre)} className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100">
                                                    <Trash2 size={14}/>
                                                </button>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}