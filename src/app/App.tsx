import { useCallback, useEffect, useMemo, useState } from "react";
import MainLayout from "../Layout/MainLayout";
import Clients from "../Pages/Clients/Clients";
import Manager from "../Pages/Manager/Manager";
import ServiceCatalog from "../Pages/ServiceCatalog/ServiceCatalog";
import Services from "../Pages/Services/Services";
import DashboardAdmin from "../Pages/Dashboard/Dashboard";
import Veterinary from "../Pages/Veterinary/Veterinary";
import type { Cliente, Medico, Orden, Responsable } from "../types";
import {
  SERVICIOS_LABORATORIO,
  SERVICIOS_PAQUETES,
  SERVICIOS_POR_TIPO,
  type ServicioCatalogo,
} from "../constants/services";

import type { ComboCatalogo } from "../constants/services";
import Pendings from "../Pages/Pendings/Pendings";
import Combos from "../Pages/Combo/Combos";
import Login from "../Pages/Login/Login";
import { getCurrentUser, login, logout, setSessionMarker, type AuthUser } from "../api/auth";
import { useInactivityLogout } from "../hooks/useInactivityLogout";
import ForgotPassword from "../Pages/PasswordRecovery/ForgotPassword";
import ResetPassword from "../Pages/PasswordRecovery/ResetPassword";
import { api } from "../api/resources";
import Tasks from "../Pages/Tasks/Tasks";
import type {
  DailyTask,
  TaskCategory,
  TaskForm,
} from "../types/tasks";

type ModuleKey =
  | "dashboard"
  | "services"
  | "pending"
  | "tasks"
  | "clients"
  | "veterinary"
  | "manager"
  | "catalog"
  | "combos";

function cleanServiceCatalog(catalog: Record<string, ServicioCatalogo[]>) {
  const cleaned: Record<string, ServicioCatalogo[]> = {};

  Object.entries(catalog).forEach(([category, services]) => {
    if (category === "Paquete" || category === "Paquetes") return;

    services.forEach((service) => {
      if (SERVICIOS_PAQUETES.some((pack) => pack.nombre === service.nombre)) return;

      const normalizedCategory = category === "Radiografía" ? "Radiología" : category;
      const nextCategory = normalizedCategory === "Combos" ? "Paquetes" : normalizedCategory;
      const catalogService =
        nextCategory === "Laboratorio"
          ? SERVICIOS_LABORATORIO.find((item) => item.nombre === service.nombre)
          : undefined;

      cleaned[nextCategory] = [
        ...(cleaned[nextCategory] ?? []),
        {
          ...service,
          categoria: catalogService?.categoria ?? service.categoria,
        },
      ];
    });
  });

  return cleaned;
}

function catalogWithFallback(catalog: Record<string, ServicioCatalogo[]>) {
  const cleaned = cleanServiceCatalog(catalog);
  const hasServices = Object.values(cleaned).some((services) => services.length > 0);
  return hasServices ? cleaned : SERVICIOS_POR_TIPO;
}

function loadOrdenes(): Orden[] {
  return [];
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
    password: "123456",
    correo: "elder@irvet.com",
    rol: "Representante Legal",
    estado: "Activo",
  },
  {
    id: "2",
    nombre: "Carlos",
    usuario: "CARLOS",
    password: "123456",
    correo: "carlos@irvet.com",
    rol: "Administrador",
    estado: "Activo",
  },
  {
    id: "3",
    nombre: "Sebastian",
    usuario: "SEBASTIAN",
    password: "123456",
    correo: "sebastian@irvet.com",
    rol: "Asistente Administrativo",
    estado: "Activo",
  },
  {
    id: "4",
    nombre: "Brayan",
    usuario: "BRAYAN",
    password: "123456",
    correo: "brayan@irvet.com",
    rol: "Domiciliario multiservicios",
    estado: "Activo",
  },
  {
    id: "5",
    nombre: "Gissel",
    usuario: "GISSEL",
    password: "123456",
    correo: "gissel@irvet.com",
    rol: "Domiciliario multiservicios",
    estado: "Activo",
  },
];

function loadResponsables(): Responsable[] {
  return [];
}

function normalizeLoginValue(value: string | undefined) {
  return value?.trim().toLocaleUpperCase("es-CO") ?? "";
}

void cleanServiceCatalog;
void loadOrdenes;
void initialClientes;
void initialMedicos;
void initialResponsables;
void loadResponsables;

function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authScreen, setAuthScreen] = useState<"login" | "forgot" | "reset">("login");
  const [activeModule, setActiveModule] = useState<ModuleKey>("dashboard");
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [catalogo, setCatalogo] = useState<Record<string, ServicioCatalogo[]>>(SERVICIOS_POR_TIPO);
  const [combos, setCombos] = useState<ComboCatalogo[]>([]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);

  useEffect(() => {
  getCurrentUser()
    .then((result) => {
      setAuthUser(result?.user ?? null);
    })
    .catch(() => {
      setAuthUser(null);
    })
    .finally(() => {
      setAuthLoading(false);
    });
}, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setSessionMarker(false);
      setAuthUser(null);
    };

    window.addEventListener("irvet:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("irvet:unauthorized", handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!authUser) return;

    const loadData = async () => {
      try {
        const [
          clients,
          veterinarians,
          catalog,
          combosResult,
          orders,
          users,
          tasksResult,
        ] = await Promise.all([
          api.clients(),
          api.veterinarians(),
          api.catalog(),
          api.combos(),
          api.orders(),
          api.users(),
          api.tasks(),
        ]);

        setClientes(clients.clients);
        setMedicos(veterinarians.veterinarians);
        setCatalogo(catalogWithFallback(catalog.catalog));
        setCombos(combosResult.combos);
        setOrdenes(orders.orders);
        setResponsables(users.users);
        setTasks(tasksResult.tasks);
        setTaskCategories(tasksResult.categories);
      } catch (error) {
        console.error("No se pudieron cargar los datos", error);
      }
    };

    void loadData();
  }, [authUser]);

  const canViewDashboard = authUser
    ? ["ELDER", "CARLOS"].includes(normalizeLoginValue(authUser.usuario))
    : false;

  const handleAuthLogin = async (
  usuario: string,
  password: string,
) => {
  const result = await login(usuario, password);
  setAuthUser(result.user);
};

const handleAuthLogout = useCallback(async () => {
  await logout();
  setAuthUser(null);
  setActiveModule("services");
}, []);

useInactivityLogout(
  authUser !== null,
  handleAuthLogout,
  30 * 60 * 1000,
);

  const sidebarItems = useMemo(() => {
    const items = [
      { key: "dashboard", label: "Dashboard" },
      { key: "services", label: "Registro de Servicios" },
      { key: "pending", label: "Pendientes" },
      { key: "tasks", label: "Tareas diarias" },
      { key: "combos", label: "Combos" },
      { key: "clients", label: "Clientes" },
      { key: "veterinary", label: "Médicos Veterinarios" },
      { key: "manager", label: "Responsables" },
      { key: "catalog", label: "Catálogo de Servicios" },
    ];

    return canViewDashboard
      ? items
      : items.filter((item) => item.key !== "dashboard");
  }, [canViewDashboard]);

if (authLoading) {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-[#1B2B4B] font-semibold">
        Cargando sesión...
      </p>
    </main>
  );
}

  if (!authUser) {
    const resetToken = new URLSearchParams(window.location.search).get("token");
    if (resetToken) {
      return <ResetPassword token={resetToken} onBack={() => setAuthScreen("login")} />;
    }
    if (authScreen === "forgot") {
      return <ForgotPassword onBack={() => setAuthScreen("login")} />;
    }
    return (
      <Login
        onLogin={handleAuthLogin}
        onForgotPassword={() => setAuthScreen("forgot")}
      />
    );
  }

  const handleAddCombo = async (combo: ComboCatalogo) => {
    await api.addCombo(combo);
    const result = await api.combos();
    setCombos(result.combos);
  };

  const handleDeleteCombo = async (id: string) => {
    await api.deleteCombo(id);
    const result = await api.combos();
    setCombos(result.combos);
  };

  const handleSaveTask = async (data: TaskForm, id?: string) => {
    await api.saveTask(data, id);

    const result = await api.tasks();

    setTasks(result.tasks);
    setTaskCategories(result.categories);
  };

  const handleDeleteTask = async (id: string) => {
    await api.deleteTask(id);

    const result = await api.tasks();

    setTasks(result.tasks);
    setTaskCategories(result.categories);
  };

  const handleCreateTaskCategory = async (name: string) => {
    await api.createTaskCategory(name);

    const result = await api.tasks();

    setTasks(result.tasks);
    setTaskCategories(result.categories);
  };

  const handleAddService = async (service: ServicioCatalogo) => {
    await api.addService(service);
    const result = await api.catalog();
    setCatalogo(catalogWithFallback(result.catalog));
  };

  const handleDeleteService = async (categoria: string, nombre: string) => {
    await api.deleteService(categoria, nombre);
    const result = await api.catalog();
    setCatalogo(catalogWithFallback(result.catalog));
  };

  const handleSaveCliente = async (data: Omit<Cliente, "id">, id?: string) => {
    await api.saveClient(data, id);
    const result = await api.clients();
    setClientes(result.clients);
  };

  const handleToggleCliente = async (id: string) => {
    const cliente = clientes.find((item) => item.id === id);
    if (!cliente) return;
    await api.toggleClient(id, cliente.estado === "Activo" ? "Inactivo" : "Activo");
    const result = await api.clients();
    setClientes(result.clients);
  };

  const handleSaveMedico = async (data: Omit<Medico, "id">, id?: string) => {
    await api.saveVeterinarian(data, id);
    const result = await api.veterinarians();
    setMedicos(result.veterinarians);
  };

  const handleToggleMedico = async (id: string) => {
    const medico = medicos.find((item) => item.id === id);
    if (!medico) return;
    await api.toggleVeterinarian(id, medico.estado === "Activo" ? "Inactivo" : "Activo");
    const result = await api.veterinarians();
    setMedicos(result.veterinarians);
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

  const visibleModule = !canViewDashboard && activeModule === "dashboard"
    ? "services"
    : activeModule;
  const visibleSidebarItems = canViewDashboard
    ? sidebarItems
    : sidebarItems.filter((item) => item.key !== "dashboard");

  if (visibleModule === "dashboard") {
    return (
      <MainLayout
        ordenes={ordenes}
        title="Dashboard"
        showNewOrderButton={false}
        activeModule={visibleModule}
        onSelectModule={(moduleKey) => setActiveModule(moduleKey as ModuleKey)}
        sidebarItems={visibleSidebarItems}
        userName={authUser.nombre}
        onLogout={handleAuthLogout}
      >
        <DashboardAdmin
          ordenes={ordenes}
          clientes={clientes}
          medicos={medicos}
          responsables={responsables}
          catalogo={catalogo}
          combos={combos}
          tasks={tasks}
        />
      </MainLayout>
    );
  }

  if (visibleModule === "pending") {
    return (
      <MainLayout
        ordenes={ordenes}
        title="Pendientes"
        showNewOrderButton={false}
        activeModule={visibleModule}
        onSelectModule={(moduleKey) => setActiveModule(moduleKey as ModuleKey)}
        sidebarItems={visibleSidebarItems}
        userName={authUser.nombre}
        onLogout={handleAuthLogout}
      >
        <Pendings ordenes={ordenes} onOrdenesChange={setOrdenes} />
      </MainLayout>
    );
  }

  if (visibleModule === "combos") {
      return(
        <MainLayout
          ordenes={ordenes}
          title="Combos"
          showNewOrderButton={false}
          activeModule={visibleModule}
          onSelectModule={(modulekey) => setActiveModule(modulekey as ModuleKey)}
          sidebarItems={visibleSidebarItems}
          userName={authUser.nombre}
          onLogout={handleAuthLogout}
          >
            <Combos
                combos={combos}
                catalogo={catalogo}
                onAdd={handleAddCombo}
                onDelete={handleDeleteCombo}
            />
          </MainLayout>
      );
  }

  if (visibleModule === "clients") {
    return (
      <MainLayout
        ordenes={[]}
        title="Clientes"
        showNewOrderButton={false}
        activeModule={visibleModule}
        onSelectModule={(moduleKey) => setActiveModule(moduleKey as ModuleKey)}
        sidebarItems={visibleSidebarItems}
        userName={authUser.nombre}
        onLogout={handleAuthLogout}
      >
        <Clients clientes={clientes} onSave={handleSaveCliente} onToggle={handleToggleCliente} />
      </MainLayout>
    );
  }

  if (visibleModule === "catalog") {
    return (
      <MainLayout
        ordenes={[]}
        title="Catálogo de Servicios"
        showNewOrderButton={false}
        activeModule={visibleModule}
        onSelectModule={(moduleKey) => setActiveModule(moduleKey as ModuleKey)}
        sidebarItems={visibleSidebarItems}
        userName={authUser.nombre}
        onLogout={handleAuthLogout}
      >
        <ServiceCatalog
          catalogo={catalogo}
          onAdd={handleAddService}
          onDelete={handleDeleteService}
        />
      </MainLayout>
    );
  }

  if (visibleModule === "veterinary") {
    return (
      <MainLayout
        ordenes={[]}
        title="Médicos Veterinarios"
        showNewOrderButton={false}
        activeModule={visibleModule}
        onSelectModule={(moduleKey) => setActiveModule(moduleKey as ModuleKey)}
        sidebarItems={visibleSidebarItems}
        userName={authUser.nombre}
        onLogout={handleAuthLogout}
      >
        <Veterinary medicos={medicos} onSave={handleSaveMedico} onToggle={handleToggleMedico} />
      </MainLayout>
    );
  }

  if (visibleModule === "manager") {
    return (
      <MainLayout
        ordenes={[]}
        title="Responsables"
        showNewOrderButton={false}
        activeModule={visibleModule}
        onSelectModule={(moduleKey) => setActiveModule(moduleKey as ModuleKey)}
        sidebarItems={visibleSidebarItems}
        userName={authUser.nombre}
        onLogout={handleAuthLogout}
      >
        <Manager
          responsables={responsables}
          onSave={handleSaveResponsable}
          onToggle={handleToggleResponsable}
        />
      </MainLayout>
    );
  }

  if (visibleModule === "tasks") {
    return (
      <MainLayout
        ordenes={ordenes}
        title="Tareas diarias"
        showNewOrderButton={false}
        activeModule={visibleModule}
        onSelectModule={(moduleKey) =>
          setActiveModule(moduleKey as ModuleKey)
        }
        sidebarItems={visibleSidebarItems}
        userName={authUser.nombre}
        onLogout={handleAuthLogout}
      >
        <Tasks
          tasks={tasks}
          categories={taskCategories}
          responsables={responsables}
          currentUser={authUser.nombre}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onCreateCategory={handleCreateTaskCategory}
        />
      </MainLayout>
    );
  }

  return (
    <Services
      activeModule={visibleModule}
      onSelectModule={(moduleKey) => setActiveModule(moduleKey as ModuleKey)}
      sidebarItems={visibleSidebarItems}
      catalogo={catalogo}
      ordenes={ordenes}
      responsables={responsables}
      tasks={tasks}
      onOrdenesChange={setOrdenes}
      userName={authUser.nombre}
      onLogout={handleAuthLogout}
    />
  );
}

export default App;