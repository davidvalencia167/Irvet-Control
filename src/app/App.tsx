import { useEffect, useMemo, useState } from "react";
import MainLayout from "../Layout/MainLayout";
import Clients from "../Pages/Clients/Clients";
import Manager from "../Pages/Manager/Manager";
import ServiceCatalog from "../Pages/ServiceCatalog/ServiceCatalog";
import Services from "../Pages/Services/Services";
import Veterinary from "../Pages/Veterinary/Veterinary";
import type { Cliente, Medico, Orden, Responsable } from "../types";
import { SERVICIOS_PAQUETES, SERVICIOS_POR_TIPO, type ServicioCatalogo } from "../constants/services";
import Pendings from "../Pages/Pendings/Pendings";

type ModuleKey = "services" | "pending" | "clients" | "veterinary" | "manager" | "catalog";

function cleanServiceCatalog(catalog: Record<string, ServicioCatalogo[]>) {
  const cleaned: Record<string, ServicioCatalogo[]> = {};

  Object.entries(catalog).forEach(([category, services]) => {
    if (category === "Paquete" || category === "Paquetes") return;

    services.forEach((service) => {
      if (SERVICIOS_PAQUETES.some((pack) => pack.nombre === service.nombre)) return;

      const normalizedCategory = category === "Radiografía" ? "Radiología" : category;
      const nextCategory = normalizedCategory === "Combos" ? "Paquetes" : normalizedCategory;

      cleaned[nextCategory] = [...(cleaned[nextCategory] ?? []), { ...service, categoria: nextCategory }];
    });
  });

  return cleaned;
}

function loadOrdenes(): Orden[] {
  const saved = localStorage.getItem("irvet_ordenes");
  if (!saved) return [];

  try {
    const raw = JSON.parse(saved) as Partial<Orden>[];
    return raw.map((orden) => ({
      ...orden,
      mascotas: (orden.mascotas ?? []).map((mascota) => ({
        ...mascota,
        servicios: mascota.servicios ?? [],
      })),
      pagos: (orden.pagos ?? []).map((pago) => ({
        id: pago.id ?? crypto.randomUUID(),
        tipo: pago.tipo ?? "Pago",
        medio: pago.medio ?? "",
        valor: pago.valor ?? "",
        mascotaId: pago.mascotaId ?? "",
        concepto: pago.concepto ?? "",
      })),
      cantidad: orden.cantidad ?? "0",
      estadoPago: orden.estadoPago ?? "Pendiente por pago",
      estadoOrden:
        orden.estadoOrden ??
        ((orden.mascotas ?? []).length ? "Completada" : "Pendiente de recepción"),
      auditoria: orden.auditoria ?? [],
    })) as Orden[];
  } catch {
    return [];
  }
}

const initialClientes: Cliente[] = [
  {
    id: "1",
    nombre: "Clinivet S.A.S",
    nit: "",
    representanteLegal: "",
    direccion: "",
    telefono: "3001234567",
    correo: "info@clinivet.com",
    aniversario: "",
    estado: "Activo",
    observaciones: "Cliente preferencial",
  },
  {
    id: "2",
    nombre: "Pet Care",
    nit: "",
    representanteLegal: "",
    direccion: "",
    telefono: "3109876543",
    correo: "contacto@petcare.com",
    aniversario: "",
    estado: "Inactivo",
    observaciones: "Solicita seguimiento mensual",
  },
];

const initialMedicos: Medico[] = [
  {
    id: "1",
    nombre: "Dr. Juan Pérez Rodríguez",
    matricula: "12345",
    telefono: "3007654321",
    correo: "juan.perez@clinivet.com",
    clinica: "Clinivet S.A.S",
    fechaCumpleanos: "1985-09-20",
    estado: "Activo",
    observaciones: "Médico remitente principal",
  },
];

const initialResponsables: Responsable[] = [
  {
    id: "1",
    nombre: "Elder",
    usuario: "ELDER",
    correo: "elder@irvet.com",
    rol: "Representante Legal",
    estado: "Activo",
  },
  {
    id: "2",
    nombre: "Carlos",
    usuario: "CARLOS",
    correo: "carlos@irvet.com",
    rol: "Administrador",
    estado: "Activo",
  },
  {
    id: "3",
    nombre: "Sebastian",
    usuario: "SEBASTIAN",
    correo: "sebastian@irvet.com",
    rol: "Asistente Administrativo",
    estado: "Activo",
  },
  {
    id: "4",
    nombre: "Brayan",
    usuario: "BRAYAN",
    correo: "brayan@irvet.com",
    rol: "Domiciliario multiservicios",
    estado: "Activo",
  },
  {
    id: "5",
    nombre: "Gissel",
    usuario: "GISSEL",
    correo: "gissel@irvet.com",
    rol: "Domiciliario multiservicios",
    estado: "Activo",
  },
];

function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("services");
  const [ordenes, setOrdenes] = useState<Orden[]>(loadOrdenes);
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [medicos, setMedicos] = useState<Medico[]>(initialMedicos);
  const [responsables, setResponsables] = useState<Responsable[]>(initialResponsables);
  const [catalogo, setCatalogo] = useState<Record<string, ServicioCatalogo[]>>(() => {
    const saved = localStorage.getItem("irvet_catalogo_servicios");
    if (!saved) return SERVICIOS_POR_TIPO;

    try {
      return cleanServiceCatalog(JSON.parse(saved) as Record<string, ServicioCatalogo[]>);
    } catch {
      return SERVICIOS_POR_TIPO;
    }
  });

  useEffect(() => {
    localStorage.setItem("irvet_catalogo_servicios", JSON.stringify(catalogo));
  }, [catalogo]);

  useEffect(() => {
    localStorage.setItem("irvet_ordenes", JSON.stringify(ordenes));
  }, [ordenes]);

  const sidebarItems = useMemo(
    () => [
      { key: "services", label: "Registro de Servicios" },
      { key: "pending", label: "Pendientes" },
      { key: "clients", label: "Clientes" },
      { key: "veterinary", label: "Médicos Veterinarios" },
      { key: "manager", label: "Responsables" },
      { key: "catalog", label: "Catálogo de Servicios" },
    ],
    []
  );

  const handleAddService = (service: ServicioCatalogo) => {
    setCatalogo((current) => ({
      ...current,
      [service.categoria]: [...(current[service.categoria] ?? []), service],
    }));
  };

  const handleDeleteService = (categoria: string, nombre: string) => {
    setCatalogo((current) => ({
      ...current,
      [categoria]: current[categoria].filter((service) => service.nombre !== nombre),
    }));
  };

  const handleSaveCliente = (data: Omit<Cliente, "id">, id?: string) => {
    setClientes((prev) => {
      if (id) {
        return prev.map((cliente) => (cliente.id === id ? { ...cliente, ...data } : cliente));
      }

      return [{ ...data, id: crypto.randomUUID() }, ...prev];
    });
  };

  const handleToggleCliente = (id: string) => {
    setClientes((prev) =>
      prev.map((cliente) =>
        cliente.id === id
          ? {
              ...cliente,
              estado: cliente.estado === "Activo" ? "Inactivo" : "Activo",
            }
          : cliente
      )
    );
  };

  const handleSaveMedico = (data: Omit<Medico, "id">, id?: string) => {
    setMedicos((prev) => {
      if (id) {
        return prev.map((medico) => (medico.id === id ? { ...medico, ...data } : medico));
      }

      return [{ ...data, id: crypto.randomUUID() }, ...prev];
    });
  };

  const handleToggleMedico = (id: string) => {
    setMedicos((prev) =>
      prev.map((medico) =>
        medico.id === id
          ? {
              ...medico,
              estado: medico.estado === "Activo" ? "Inactivo" : "Activo",
            }
          : medico
      )
    );
  };

  const handleSaveResponsable = (data: Omit<Responsable, "id">, id?: string) => {
    setResponsables((prev) => {
      if (id) {
        return prev.map((responsable) => (responsable.id === id ? { ...responsable, ...data } : responsable));
      }

      return [{ ...data, id: crypto.randomUUID() }, ...prev];
    });
  };

  const handleToggleResponsable = (id: string) => {
    setResponsables((prev) =>
      prev.map((responsable) =>
        responsable.id === id
          ? {
              ...responsable,
              estado: responsable.estado === "Activo" ? "Inactivo" : "Activo",
            }
          : responsable
      )
    );
  };

    if (activeModule === "pending") {
    return (
      <MainLayout
        ordenes={ordenes}
        title="Pendientes"
        showNewOrderButton={false}
        activeModule={activeModule}
        onSelectModule={(moduleKey) => setActiveModule(moduleKey as ModuleKey)}
        sidebarItems={sidebarItems}
      >
        <Pendings ordenes={ordenes} />
      </MainLayout>
    );
  }

  if (activeModule === "clients") {
    return (
      <MainLayout
        ordenes={[]}
        title="Clientes"
        showNewOrderButton={false}
        activeModule={activeModule}
        onSelectModule={(moduleKey) => setActiveModule(moduleKey as ModuleKey)}
        sidebarItems={sidebarItems}
      >
        <Clients clientes={clientes} onSave={handleSaveCliente} onToggle={handleToggleCliente} />
      </MainLayout>
    );
  }

  if (activeModule === "catalog") {
    return (
      <MainLayout
        ordenes={[]}
        title="Catálogo de Servicios"
        showNewOrderButton={false}
        activeModule={activeModule}
        onSelectModule={(moduleKey) => setActiveModule(moduleKey as ModuleKey)}
        sidebarItems={sidebarItems}
      >
        <ServiceCatalog
          catalogo={catalogo}
          onAdd={handleAddService}
          onDelete={handleDeleteService}
        />
      </MainLayout>
    );
  }

  if (activeModule === "veterinary") {
    return (
      <MainLayout
        ordenes={[]}
        title="Médicos Veterinarios"
        showNewOrderButton={false}
        activeModule={activeModule}
        onSelectModule={(moduleKey) => setActiveModule(moduleKey as ModuleKey)}
        sidebarItems={sidebarItems}
      >
        <Veterinary medicos={medicos} onSave={handleSaveMedico} onToggle={handleToggleMedico} />
      </MainLayout>
    );
  }

  if (activeModule === "manager") {
    return (
      <MainLayout
        ordenes={[]}
        title="Responsables"
        showNewOrderButton={false}
        activeModule={activeModule}
        onSelectModule={(moduleKey) => setActiveModule(moduleKey as ModuleKey)}
        sidebarItems={sidebarItems}
      >
        <Manager
          responsables={responsables}
          onSave={handleSaveResponsable}
          onToggle={handleToggleResponsable}
        />
      </MainLayout>
    );
  }

  return (
    <Services
      activeModule={activeModule}
      onSelectModule={(moduleKey) => setActiveModule(moduleKey as ModuleKey)}
      sidebarItems={sidebarItems}
      catalogo={catalogo}
      ordenes={ordenes}
      onOrdenesChange={setOrdenes}
    />
  );
}

export default App;