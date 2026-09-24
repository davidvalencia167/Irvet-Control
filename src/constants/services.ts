export interface ServicioCatalogo {
  categoria: string;
  nombre: string;
  precio: number;
}

import type { ServicioOrden } from "../types";

const laboratorio = (categoria: string, nombre: string, precio: number): ServicioCatalogo => ({ categoria, nombre, precio });

export const SERVICIOS_LABORATORIO: ServicioCatalogo[] = [
  laboratorio("Hematología", "Cuadro hemático canino/felino (glóbulos rojos, leucocitos y plaquetas)", 18000),
  laboratorio("Hematología", "Conteo de reticulocitos", 18000),
  laboratorio("Hematología", "Frotis hemoparásitos en lámina", 18000),
  laboratorio("Bioquímicas sanguíneas", "Albúmina", 14000),
  laboratorio("Bioquímicas sanguíneas", "Alanina aminotransferasa SGPT/ALT", 14000),
  laboratorio("Bioquímicas sanguíneas", "Amilasa pancreática", 14000),
  laboratorio("Bioquímicas sanguíneas", "Aspartato aminotransferasa SGOT/AST", 14000),
  laboratorio("Bioquímicas sanguíneas", "Bilirrubina directa", 16000),
  laboratorio("Bioquímicas sanguíneas", "Bilirrubina total", 16000),
  laboratorio("Bioquímicas sanguíneas", "Nitrógeno ureico BUN", 14000),
  laboratorio("Bioquímicas sanguíneas", "Calcio sérico", 17000),
  laboratorio("Bioquímicas sanguíneas", "Cloro sérico", 17000),
  laboratorio("Bioquímicas sanguíneas", "Colesterol", 14000),
  laboratorio("Bioquímicas sanguíneas", "Creatinina", 14000),
  laboratorio("Bioquímicas sanguíneas", "Fosfatasa alcalina", 14000),
  laboratorio("Bioquímicas sanguíneas", "Fósforo sérico", 17000),
  laboratorio("Bioquímicas sanguíneas", "Gama glutamil transferasa GGT", 23000),
  laboratorio("Bioquímicas sanguíneas", "Glicemia", 14000),
  laboratorio("Bioquímicas sanguíneas", "Magnesio sérico", 17000),
  laboratorio("Bioquímicas sanguíneas", "Triglicéridos", 14000),
  laboratorio("Uroanálisis", "Citoquímico de orina", 14000),
  laboratorio("Uroanálisis", "Espermograma", 25000),
  laboratorio("Coproparasitológicos", "Coprológico", 14000),
  laboratorio("Coproparasitológicos", "Coprológico seriado (3 muestras)", 38000),
  laboratorio("Dermatológicos", "KOH", 16000),
  laboratorio("Dermatológicos", "Cerumen", 17000),
  laboratorio("Microbiología", "Coprocultivo + Antibiograma (1 semana)", 90000),
  laboratorio("Microbiología", "Cultivo de Secreciones y Antibiograma (1 semana)", 90000),
  laboratorio("Microbiología", "Urocultivo y Antibiograma (1 semana)", 90000),
  laboratorio("Inmunológicos", "Test de parvovirus", 33000),
  laboratorio("Inmunológicos", "Test de parvovirus, coronavirus y giardia canino", 50000),
  laboratorio("Inmunológicos", "Test de distemper", 39000),
  laboratorio("Inmunológicos", "Test de ehrlichia Canis", 39000),
  laboratorio("Inmunológicos", "Test de ehrlichia, anaplasma y babesia", 55000),
  laboratorio("Inmunológicos", "Test Embarazo canino", 40000),
  laboratorio("Inmunológicos", "Test de inmunodeficiencia felina (FIV) y leucemia felina (FeLV)", 49000),
  laboratorio("Exámenes especializados", "TSH", 75000),
  laboratorio("Exámenes especializados", "T4 total", 75000),
  laboratorio("Exámenes especializados", "TSH-T4 total-Triglicéridos-Colesterol para canino", 164000),
  laboratorio("Exámenes especializados", "T4 total-Triglicéridos-Colesterol para felino", 89000),
  laboratorio("Exámenes especializados", "Lipasa específica canina", 68000),
  laboratorio("Exámenes especializados", "Lipasa específica felina", 68000),
  laboratorio("Exámenes especializados", "Histopatología (10 días hábiles)", 155000),
];

export const SERVICIOS_PAQUETES: ServicioCatalogo[] = [
  laboratorio("Paquete", "3 Exámenes", 38000),
  laboratorio("Paquete", "4 Exámenes", 42000),
  laboratorio("Paquete", "5 Exámenes", 45000),
  laboratorio("Paquete", "6 Exámenes", 48000),
  laboratorio("Paquete", "7 Exámenes", 51000),
  laboratorio("Paquete", "8 Exámenes", 54000),
  laboratorio("Paquete", "9 Exámenes", 57000),
  laboratorio("Paquete", "13 Exámenes o Prehospitalario", 110000),
];

export const SERVICIOS_RADIOLOGIA: ServicioCatalogo[] = [
  { categoria: "Radiología", nombre: "2 imágenes radiográficas (canino o felino)", precio: 70000 },
  { categoria: "Radiología", nombre: "Imagen adicional", precio: 10000 },
  { categoria: "Radiología", nombre: "3 imágenes más lectura", precio: 90000 },
  { categoria: "Radiología", nombre: "Radiografía con medio de contraste sulfato de bario para mascotas de 2 a 10 kg", precio: 140000 },
  { categoria: "Radiología", nombre: "Radiografía con medio de contraste sulfato de bario para mascotas de 11 a 20 kg", precio: 160000 },
  { categoria: "Radiología", nombre: "Radiografía con medio de contraste sulfato de bario para mascotas de 20 a 30 kg", precio: 180000 },
];

export const SERVICIOS_ECOGRAFIA: ServicioCatalogo[] = [
  { categoria: "Ecografía", nombre: "Ecografía abdominal canina", precio: 70000 },
  { categoria: "Ecografía", nombre: "Ecografía abdominal felina", precio: 70000 },
];

export const SERVICIOS_POR_TIPO: Record<string, ServicioCatalogo[]> = {
  Laboratorio: SERVICIOS_LABORATORIO,
  Radiología: SERVICIOS_RADIOLOGIA,
  Ecografía: SERVICIOS_ECOGRAFIA,
};

const PRECIOS_COMBO: Record<number, number> = {
  3: 38000,
  4: 42000,
  5: 45000,
  6: 48000,
  7: 51000,
  8: 54000,
  9: 57000,
};

export const calculatePetServicesTotal = (services: ServicioOrden[]) => {
  const laboratorio = services.filter((service) => service.tipo === "Laboratorio");
  const individuales = services.filter((service) => service.tipo !== "Laboratorio");
  const elegiblesParaCombo = laboratorio.filter(
    (service) =>
      service.categoria === "Hematología" || service.precio === 14000,
  );
  const adicionales = laboratorio.filter(
    (service) =>
      service.categoria !== "Hematología" && service.precio !== 14000,
  );
  const totalIndividual = services.reduce(
    (total, service) => total + service.precio * service.cantidad,
    0,
  );

  if (elegiblesParaCombo.length < 3) {
    return totalIndividual;
  }

  const cantidadLaboratorio = elegiblesParaCombo.length;

  if (cantidadLaboratorio >= 13) {
    return (
      110000 +
      elegiblesParaCombo.slice(13).reduce(
        (total, service) => total + service.precio * service.cantidad,
        0,
      ) +
      adicionales.reduce(
        (total, service) => total + service.precio * service.cantidad,
        0,
      ) +
      individuales.reduce(
        (total, service) => total + service.precio * service.cantidad,
        0,
      )
    );
  }

  const cantidadCombo = Math.min(cantidadLaboratorio, 9);
  const precioCombo = PRECIOS_COMBO[cantidadCombo] ?? 0;
  const extras = elegiblesParaCombo.slice(cantidadCombo).reduce(
    (total, service) => total + service.precio * service.cantidad,
    0,
  );

  return (
    precioCombo +
    extras +
    adicionales.reduce(
      (total, service) => total + service.precio * service.cantidad,
      0,
    ) +
    individuales.reduce(
      (total, service) => total + service.precio * service.cantidad,
      0,
    )
  );
};

export const calculateServiceTotal = (
  type: string,
  selectedNames: string[],
  catalogo: Record<string, ServicioCatalogo[]> = SERVICIOS_POR_TIPO
) => {
  const services = catalogo[type] ?? [];
  const selected = services.filter((service) =>
    selectedNames.includes(service.nombre)
  );

  return selected.reduce((total, service) => total + service.precio, 0);
};
