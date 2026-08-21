import type { PetEntry, PaymentRow } from "../types";

export const IC =
  "w-full px-3 py-2 text-sm bg-[#F4F7FA] border border-[rgba(27,43,75,0.1)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2BB5C3]/25 focus:border-[#2BB5C3] transition-colors placeholder:text-gray-400 text-[#1B2B4B]";

export const CLIENTES = [
  "CLINIVET", "CAN CANTS", "EL RANCHO", "EL RANCHU", "PET SHOP PELICAN",
  "CIMVET", "SU CAMPEON", "LA GRANJA BELEN", "AGROVILLA", "MIS JOYITAS",
  "VET FERALES", "CENTRO VET MASCOT", "PET SHOP HOREB", "JEOS PETS",
  "FIRULAIS", "VIDA MASCOTAS", "LABRADOR", "DR ALVARO CONTRERAS", "MASCOVET",
];

export const SERVICIOS_POR_TIPO: Record<string, string[]> = {
  Laboratorio: [
    "Hemograma completo", "Química sanguínea básica", "Uroanálisis",
    "Coprológico", "Perfil hepático", "Perfil renal", "Perfil tiroideo",
    "Electrolitos", "Proteínas totales", "Serología - Parvovirus",
    "Serología - Moquillo", "Serología - Ehrlichia", "ALT-CREA",
    "CH-ALT-CREA", "CH-ALT-CREA-PARVO", "CH-ALT-CREA-MOQ",
    "CH-ALT-CREA-ALP", "CH-ALT-CREA-SIDA", "CERUMEN", "CH-CERUMEN",
  ],
  Ecografía: [
    "Ecografía abdominal", "Ecografía reproductiva", "Ecocardiograma",
    "Ecografía musculoesquelética", "Ecografía ocular",
  ],
  Radiología: [
    "Radiografía simple", "Radiografía con contraste", "RX tórax",
    "RX abdomen", "RX columna vertebral", "RX extremidades anteriores",
    "RX extremidades posteriores", "Estudio radiográfico completo",
    "RX con adicionado",
  ],
  "Consulta Médica": [
    "Consulta general", "Consulta especializada", "Segunda opinión médica",
    "Control postoperatorio", "Valoración prequirúrgica",
  ],
};

export const MEDIOS_PAGO = [
  "Efectivo", "Nequi", "Bancolombia", "Daviplata", "Cruce", "Transferencia",
];

export const DOMICILIARIOS = ["GISSEL", "ELDER", "BRAYAN"];
export const RESPONSABLES  = ["GISSEL", "ELDER", "BRAYAN"];

let _counter = 30000;
export const nextFactura = () => `FAC-${++_counter}`;

export const newPet = (): PetEntry => ({
  id: crypto.randomUUID(),
  nombre: "", propietario: "", telefono: "", correo: "",
  especie: "", raza: "", sexo: "", edad: "",
  horaEnvio: "", estadoMuestra: "Normal",
});

export const newPaymentRow = (): PaymentRow => ({
  id: crypto.randomUUID(),
  medio: "", valor: "",
});

export const EMPTY_FORM = () => ({
  fecha: new Date().toISOString().split("T")[0],
  numeroOrden: "",
  responsable: "GISSEL",
  cliente: "",
  tipoServicio: "",
  descripcionServicio: "",
  cantidad: "1",
  nombreMedico: "",
  matriculaMedico: "",
  mascotas: [newPet()],
  domiciliario: "",
  horaLlamada: "",
  horaLlegada: "",
  prioridad: "Normal" as const,
  valorTotal: "",
  pagos: [newPaymentRow()],
  estadoPago: "Pendiente por pago" as const,
  movimiento: "Ingreso" as const,
  observaciones: "",
});