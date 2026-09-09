import type { PetEntry, PaymentRow } from "../types";

export const IC =
  "w-full px-3 py-2 text-sm bg-[#F4F7FA] border border-[rgba(27,43,75,0.1)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2BB5C3]/25 focus:border-[#2BB5C3] transition-colors placeholder:text-gray-400 text-[#1B2B4B]";

export const CLIENTES = [
  "Agro Veterinaria Servipets", "Agroclinica Veterinaria Tachira", "Agroinsumos La Negra", "Agromascotas", "Agronegocios El Corral Ganadero",
  "Agropecuaria La Pradera", "Agroteverinaria El Templo", "Agrovet", "Agroveterinaria El Tigre Chinacota", "Amor Animal", "Animal Center", "Animal Club Vip",
  "Animal Habitat Vetpet", "Animal Life", "Animal Planet", "Animal Puppy", "Animal Sos", "Animal Super Word", "Animal Word Chinacota", "Animal World", "Animal World Plus",
  "Animales De Noe", "Animalia", "Animall", "Animals Shop Tibu", "Animals Vets", "Antonio Solano", "Arcadiapuppy's", "Bacanos Pet Shop", "Betomascotas", "Boutique & Spa Para Tu Mascota Isis",
  "Cabaña Spa Centro Veterinario", "Canel", "Carovet", "Casa Sabuesos", "Cat Dog", "Cean", "Central Veterinaria", "Centro De Salud Veterinaria Andres Leon", "Centro Diagnostico Veterinario Home Vet",
  "Centro Medico Veterinario Clinivet", "Centro Médico Veterinario Danipets", "Centro Médico Veterinario Dr. Álvaro Contreras", "Centro Médico Veterinario Fox", "Centro Medico Veterinario San Jorge",
  "Centro Veterinario El Bosque", "Centro Veterinario Mascotas", "Centro Veterinario Mascotitas", "Centro Veterinario San Angel","Chiky Peludos Pet Shop", "Cim Vet", "Clínica Agrovet Tu Mascota", "Clínica Dogtors'Vet",
  "Clinica Veterinaria  Zoospa Y Pet Shop", "Clinica Veterinaria & Groomer Jim'House", "Clínica Veterinaria Baruch", "Clínica Veterinaria Campestre El Viejo Jeiar", "Clínica Veterinaria Can & Cat'S", "Clínica Veterinaria Doctor Maldonado Aeropuerto",
  "Clínica Veterinaria Don Perro", "Clinica Veterinaria Dr. Tiago", "Clinica Veterinaria El Rebaño", "Clínica Veterinaria El Rey", "Clinica Veterinaria F&C", "Clinica Veterinaria Happy Mascotas", "Clínica Veterinaria Healthy Pets", "Clínica Veterinaria Leon Pets",
  "Clínica Veterinaria Los Labradores", "Clinica Veterinaria Mascodannia", "Clinica Veterinaria Medical Vet", "Clínica Veterinaria Mundo Vet", "Clínica Veterinaria Prados Pets", "Clínica Veterinaria Prevetsanar", "Clinicmascoticas", "Club Happy Dog", "Consultorio Medico Veterinario San Ángel",
  "Consultorio Veterinario Cat Can", "Consultorio Veterinario Dr Andrés Sánchez", "Criadero Mi Gran Amor", "De Pelos", "Doct Vet", "Doctor Vet", "Dog House", "Dogtor Spa", "Don Bruno", "Dr Alvaro Andres", "Dr Jose Luis", "Dr Tony Halmar Pinillos", "Dra Diane Meneses", "Dra Jennifer", "Dra Leidy Katherine Cifuentes",
  "Dr Juan Guillermo", "Eden Canino", "El Bufalo", "El Campi", "El Gato Pescador", "El Gurmet De Todas Las Mascotas", "El Mundo Según Los Gatos", "El Rancho", "Equinorte", "Farmanimal", "Flipo", "Gigi Spa", "Giuseppe", "Guapos Consultorio Veterinario", "Happy Pet", "Hermavet", "Hospital Veterinario San Rafel", "Hospital Veterinario",
  "Jardin De Las Mascotas", "La Belleza De Tus Mascotas", "La Casona", "La Tropa Gatuna", "M&M", "Mascoaventura", "Mascotas Club", "Mascotas Felices", "Mascotas Prinx", "Mascotas Wow", "Mascoticas Kukuta", "Mascotilandia", "Mascovet", "Medic Pet Shop", "Medical Care Vet", "Medical Pet", "Medvet", "Mi Gran Cachorro", "Mi Granja Veterinaria Bochalema",
  "Mi Mejor Amigo", "Mis Joyitas", "Mis Peluditos", "Mister Wamba", "Mundo Animal Vipet", "Mundo Canino", "Mundo De Mascota La Villa", "Mundo Pets C.V S.A.S", "Naladu", "Nutrimascotas", "Orange Clinica Veterinaria", "Park Animal Vet", "Patitas", "Patitas & Garritas Vet House", "Peluditos", "Perros Y Gatos", "Pet Chan", "Pet Corp", "Pet Doctor", "Pet Garden",
  "Pet Guau", "Pet Home", "Pet Shop Animal Print", "Pet Shop Cafe La Estacion", "Pet Shop Feli-Can", "Pet Shop Horeb", "Pet Shop La Granja De Las Américas", "Pet Shop La Granja De Mi Mascota", "Pet Shop Shaira", "Pet Shop Thor", "Pet Shop Villa", "Pet You", "Pets Boutique", "Pets Friendly", "Pet's Shop Prinx", "Pilky", "Primavera", "Quinta Velez", "Ross Mascot", 
  "Salud Animal", "Sanitos", "Scooby Doo", "Servicios Veterinarios Sander", "Servivet", "Spa Canino Arca De Noe", "Spa Canino Fiel Amigo", "Spa De Mascotas", "Super Mascotas", "Tienda De Mascotas Millán Dog", "Tienda De Mascotas Mr. Dog", "Tienda De Mascotas Tony", "Tienda De Mascotas Y Spa Bluey", "Tienda Mascotas Can House",
  "Tienda Mascotas Doggy Love", "Tienda Para Mascotas Firulais", "Tienda Para Tu Mascota", "Tu Mascoticas.Com", "Unidad Movil Bochalema", "Urgency Pets", "Vet In House", "Vet Souls", "Vet Zen", "Vet plus", "Veterinaria & Petshop Familyvet", "Veterinaria Agrocampo", "Veterinaria Agro-Patios", "Veterinaria Agrovilla Del Rosario", "Veterinaria Animal Medical", "Veterinaria Animalandia 24/7",
  "Veterinaria Caobos", "Veterinaria Dog Charles", "Veterinaria El Campo", "Veterinaria El Trigal", "Veterinaria Faun Vet", "Veterinaria Felix", "Veterinaria Fenix", "Veterinaria Health", "Veterinaria Medical Planet", "Veterinaria Oddy", "Veterinaria Osvaldo", "Veterinaria San Eduardo", "Veterinaria Su Campeon", "Veterinaria Vida De Perros", "Veterinaria Y Peluquería Canina Mundo Wau Guau", 
  "Veterinaria Zona Animal", "VetJuli", "Vetopia", "Vida Animal", "Vida De Mascotas", "Vida Mascotas", "Vida Pets Clínica Veterinaria", "Villa Nueva", "Vital Vet", "Yefran Mascotas", "Yoel Vet", "Zoolomascotas", "Zoolomascotas C&M"
];

export { SERVICIOS_POR_TIPO } from "./services";

export const MEDIOS_PAGO = [
  "Efectivo", "Nequi", "Bancolombia", "Daviplata", "Cruce", "Transferencia",
];

export const DOMICILIARIOS = ["Gissel", "Elder", "Brayan"];
export const RESPONSABLES = ["Elder", "Carlos", "Sebastian", "Brayan", "Gissel"];

export const currentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export const currentTime = () => new Date().toTimeString().slice(0, 5);

let _counter = 30000;
export const nextFactura = () => `FAC-${++_counter}`;

export const newPet = (): PetEntry => ({
  id: crypto.randomUUID(),
  numeroOrden: "",
  nombre: "", propietario: "", telefono: "", correo: "",
  especie: "", raza: "", sexo: "", edad: "", edadAnios: "", edadMeses: "",
  horaEnvio: "", estadoMuestra: "Normal",
});

export const newPaymentRow = (mascotaId?: string): PaymentRow => ({
  id: crypto.randomUUID(),
  medio: "", valor: "",
  mascotaId,
});

export const EMPTY_FORM = () => ({
  fecha: currentDate(),
  horaSolicitud: currentTime(),
  numeroOrden: "",
  responsable: "Gissel",
  cliente: "",
  tipoServicio: "",
  descripcionServicio: "",
  serviciosSeleccionados: [],
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