/**
 * AuraFit Food Database & Smart Nutrition Compensator
 * Curated Latin/Peruvian nutrition database, Open Food Facts connector,
 * natural language text food parser, and post-snack compensatory rebalancing algorithms.
 */

export const CURATED_PERUVIAN_FOODS = [
  // Snacks y Ultraprocesados típicos peruanos
  {
    id: 'snack-chifles-50g',
    name: 'Chifles Piuranos Salados (Inka Chips / Caseros)',
    brand: 'Inka Chips / Caseros',
    servingDesc: '1 bolsa chica (50g)',
    grams: 50,
    calories: 255,
    protein: 1.5,
    carbs: 31.0,
    fat: 14.0,
    fiber: 2.2,
    category: 'snack',
    isSnack: true,
    isUltraProcessed: true,
    icon: '🍌'
  },
  {
    id: 'snack-chifles-100g',
    name: 'Chifles Clásicos Salados (Porción 100g)',
    brand: 'Tradicional',
    servingDesc: '1 porción grande (100g)',
    grams: 100,
    calories: 510,
    protein: 3.0,
    carbs: 62.0,
    fat: 28.0,
    fiber: 4.4,
    category: 'snack',
    isSnack: true,
    isUltraProcessed: true,
    icon: '🍌'
  },
  {
    id: 'snack-kekito-naranja',
    name: 'Kekito de Naranja Casero',
    brand: 'Pastelería Tradicional',
    servingDesc: '1 porción / tajada (60g)',
    grams: 60,
    calories: 216,
    protein: 3.2,
    carbs: 34.0,
    fat: 7.5,
    fiber: 0.8,
    category: 'snack',
    isSnack: true,
    isUltraProcessed: true,
    icon: '🧁'
  },
  {
    id: 'snack-kekito-platano',
    name: 'Kekito / Keke de Plátano Casero',
    brand: 'Casero',
    servingDesc: '1 tajada (70g)',
    grams: 70,
    calories: 235,
    protein: 3.8,
    carbs: 38.0,
    fat: 8.0,
    fiber: 1.5,
    category: 'snack',
    isSnack: true,
    isUltraProcessed: true,
    icon: '🍌'
  },
  {
    id: 'snack-quequito-bimbo',
    name: 'Quequito Marmoleado Bimbo',
    brand: 'Bimbo',
    servingDesc: '1 unidad (55g)',
    grams: 55,
    calories: 210,
    protein: 2.8,
    carbs: 32.0,
    fat: 8.0,
    fiber: 0.5,
    category: 'snack',
    isSnack: true,
    isUltraProcessed: true,
    icon: '🧁'
  },
  {
    id: 'snack-galletas-casino',
    name: 'Galletas Casino Rellenas (Menta / Lúcuma)',
    brand: 'Victoria',
    servingDesc: '1 paquete (43g)',
    grams: 43,
    calories: 205,
    protein: 2.1,
    carbs: 29.5,
    fat: 9.0,
    fiber: 0.6,
    category: 'snack',
    isSnack: true,
    isUltraProcessed: true,
    icon: '🍪'
  },
  {
    id: 'snack-galletas-morochas',
    name: 'Galletas Morochas Bañadas',
    brand: 'Nestlé',
    servingDesc: '1 paquete (45g)',
    grams: 45,
    calories: 220,
    protein: 2.5,
    carbs: 31.0,
    fat: 9.8,
    fiber: 1.0,
    category: 'snack',
    isSnack: true,
    isUltraProcessed: true,
    icon: '🍫'
  },
  {
    id: 'snack-chocolate-sublime',
    name: 'Chocolate Sublime Clásico con Maní',
    brand: 'Nestlé',
    servingDesc: '1 barra (30g)',
    grams: 30,
    calories: 160,
    protein: 3.5,
    carbs: 16.0,
    fat: 9.2,
    fiber: 1.2,
    category: 'snack',
    isSnack: true,
    isUltraProcessed: true,
    icon: '🍫'
  },
  {
    id: 'snack-canchita-popcorn',
    name: 'Canchita Salada / Popcorn',
    brand: 'Casero',
    servingDesc: '1 tazón mediano (50g)',
    grams: 50,
    calories: 195,
    protein: 4.5,
    carbs: 31.0,
    fat: 6.5,
    fiber: 5.0,
    category: 'snack',
    isSnack: true,
    isUltraProcessed: false,
    icon: '🍿'
  },
  {
    id: 'snack-empanada-carne',
    name: 'Empanada de Carne Tradicional',
    brand: 'Horno Tradicional',
    servingDesc: '1 unidad (120g)',
    grams: 120,
    calories: 340,
    protein: 11.0,
    carbs: 38.0,
    fat: 16.0,
    fiber: 1.8,
    category: 'snack',
    isSnack: true,
    isUltraProcessed: true,
    icon: '🥟'
  },

  // Alimentos de Alto Valor Biológico & Fitness Staples
  {
    id: 'fit-pechuga-pollo',
    name: 'Pechuga de Pollo a la Plancha',
    brand: 'Cocina Limpia',
    servingDesc: '1 filete mediano (150g)',
    grams: 150,
    calories: 195,
    protein: 39.0,
    carbs: 0.0,
    fat: 3.5,
    fiber: 0.0,
    category: 'proteina',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🍗'
  },
  {
    id: 'fit-claras-huevo',
    name: 'Claras de Huevo Cocidas / Revueltas',
    brand: 'Natural',
    servingDesc: '4 claras (130g)',
    grams: 130,
    calories: 68,
    protein: 14.5,
    carbs: 0.9,
    fat: 0.2,
    fiber: 0.0,
    category: 'proteina',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🍳'
  },
  {
    id: 'fit-huevo-entero',
    name: 'Huevo Entero de Gallina (Cocido / Sancochado)',
    brand: 'Natural',
    servingDesc: '2 unidades (100g)',
    grams: 100,
    calories: 145,
    protein: 13.0,
    carbs: 1.1,
    fat: 10.0,
    fiber: 0.0,
    category: 'proteina',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🥚'
  },
  {
    id: 'fit-huevo-frito',
    name: 'Huevo Entero Frito en Sartén',
    brand: 'Natural / Casero',
    servingDesc: '1 unidad (50g)',
    grams: 50,
    calories: 73,
    protein: 6.5,
    carbs: 0.6,
    fat: 5.0,
    fiber: 0.0,
    category: 'proteina',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🍳'
  },
  {
    id: 'fit-mantequilla-14g',
    name: 'Mantequilla con Sal / Sin Sal (Laive / Gloria)',
    brand: 'Laive / Gloria',
    servingDesc: '1 cucharada (14g)',
    grams: 14,
    calories: 102,
    protein: 0.1,
    carbs: 0.1,
    fat: 11.5,
    fiber: 0.0,
    category: 'grasa',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🧈'
  },
  {
    id: 'fit-aceite-oliva-14g',
    name: 'Aceite de Oliva Extra Virgen',
    brand: 'El Olivar / Carbonell',
    servingDesc: '1 cucharada (14g)',
    grams: 14,
    calories: 120,
    protein: 0.0,
    carbs: 0.0,
    fat: 14.0,
    fiber: 0.0,
    category: 'grasa_saludable',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🫒'
  },
  {
    id: 'fit-pan-frances',
    name: 'Pan Francés / Ciabatta Tradicional',
    brand: 'Panadería Tradicional',
    servingDesc: '1 unidad (40g)',
    grams: 40,
    calories: 110,
    protein: 3.5,
    carbs: 22.0,
    fat: 1.0,
    fiber: 1.2,
    category: 'carbohidrato',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🥖'
  },
  {
    id: 'fit-atun-agua',
    name: 'Atún en Lata al Agua (Campomar / Florida)',
    brand: 'Campomar',
    servingDesc: '1 lata escurrida (120g)',
    grams: 120,
    calories: 132,
    protein: 29.0,
    carbs: 0.0,
    fat: 1.2,
    fiber: 0.0,
    category: 'proteina',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🐟'
  },
  {
    id: 'fit-yogur-griego',
    name: 'Yogur Griego Natural 0% Grasa (Danlac / Vakimu)',
    brand: 'Danlac',
    servingDesc: '1 taza (200g)',
    grams: 200,
    calories: 118,
    protein: 20.0,
    carbs: 7.0,
    fat: 0.4,
    fiber: 0.0,
    category: 'proteina',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🥣'
  },
  {
    id: 'fit-whey-isolate',
    name: 'Proteína Whey Isolate 100%',
    brand: 'Optimum / Dymatize / UN',
    servingDesc: '1 scoop (30g)',
    grams: 30,
    calories: 115,
    protein: 25.0,
    carbs: 1.5,
    fat: 0.8,
    fiber: 0.2,
    category: 'suplemento',
    isSnack: false,
    isUltraProcessed: false,
    icon: '⚡'
  },
  {
    id: 'fit-arroz-blanco',
    name: 'Arroz Blanco Cocido',
    brand: 'Costeño / Faraón',
    servingDesc: '1 taza colmada (180g)',
    grams: 180,
    calories: 234,
    protein: 4.8,
    carbs: 51.5,
    fat: 0.6,
    fiber: 0.8,
    category: 'carbohidrato',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🍚'
  },
  {
    id: 'fit-avena-hojuelas',
    name: 'Avena en Hojuelas Cruda/Cocida',
    brand: '3 Ositos / Quaker',
    servingDesc: 'Porción 50g',
    grams: 50,
    calories: 190,
    protein: 6.8,
    carbs: 33.0,
    fat: 3.5,
    fiber: 5.2,
    category: 'carbohidrato',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🌾'
  },
  {
    id: 'fit-papa-sancochada',
    name: 'Papa Amarilla / Canchán Sancochada',
    brand: 'Tubérculo Natural',
    servingDesc: '1 papa mediana (150g)',
    grams: 150,
    calories: 130,
    protein: 3.0,
    carbs: 29.0,
    fat: 0.2,
    fiber: 2.5,
    category: 'carbohidrato',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🥔'
  },
  {
    id: 'fit-camote-horno',
    name: 'Camote Dulce al Horno',
    brand: 'Tubérculo Natural',
    servingDesc: '1 camote mediano (150g)',
    grams: 150,
    calories: 135,
    protein: 2.4,
    carbs: 31.5,
    fat: 0.3,
    fiber: 3.8,
    category: 'carbohidrato',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🍠'
  },
  {
    id: 'fit-palta-fuerte',
    name: 'Palta Fuerte / Hass',
    brand: 'Natural',
    servingDesc: '1/2 palta mediana (80g)',
    grams: 80,
    calories: 130,
    protein: 1.6,
    carbs: 3.0,
    fat: 12.5,
    fiber: 5.4,
    category: 'grasa_saludable',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🥑'
  },
  {
    id: 'fit-platano-seda',
    name: 'Plátano de Seda Maduro',
    brand: 'Fruta Natural',
    servingDesc: '1 plátano mediano (110g)',
    grams: 110,
    calories: 98,
    protein: 1.2,
    carbs: 25.0,
    fat: 0.3,
    fiber: 2.8,
    category: 'fruta',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🍌'
  },
  {
    id: 'fit-brocoli-vapor',
    name: 'Brócoli al Vapor con Limón',
    brand: 'Vegetal',
    servingDesc: '1 plato hondo (150g)',
    grams: 150,
    calories: 45,
    protein: 4.2,
    carbs: 7.5,
    fat: 0.5,
    fiber: 4.5,
    category: 'vegetal',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🥦'
  },

  // Platos Tradicionales Peruanos
  {
    id: 'plato-lomo-saltado',
    name: 'Lomo Saltado Criollo con Arroz y Papas',
    brand: 'Restaurante / Casero',
    servingDesc: '1 plato completo (400g)',
    grams: 400,
    calories: 680,
    protein: 36.0,
    carbs: 72.0,
    fat: 26.0,
    fiber: 4.0,
    category: 'plato_fuerte',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🥩'
  },
  {
    id: 'plato-pollo-brasa',
    name: '1/4 Pollo a la Brasa (Pechuga + Papas Fritas)',
    brand: 'Pollería Tradicional',
    servingDesc: '1/4 pollo con papas (380g)',
    grams: 380,
    calories: 780,
    protein: 58.0,
    carbs: 48.0,
    fat: 38.0,
    fiber: 3.5,
    category: 'plato_fuerte',
    isSnack: false,
    isUltraProcessed: true,
    icon: '🍗'
  },
  {
    id: 'plato-aji-gallina',
    name: 'Ají de Gallina con Arroz, Huevo y Aceituna',
    brand: 'Criollo',
    servingDesc: '1 plato (380g)',
    grams: 380,
    calories: 640,
    protein: 34.0,
    carbs: 68.0,
    fat: 24.0,
    fiber: 3.2,
    category: 'plato_fuerte',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🍲'
  },
  {
    id: 'plato-arroz-chaufa',
    name: 'Arroz Chaufa de Pollo',
    brand: 'Chifa Tradicional',
    servingDesc: '1 plato (350g)',
    grams: 350,
    calories: 610,
    protein: 31.0,
    carbs: 76.0,
    fat: 18.0,
    fiber: 2.8,
    category: 'plato_fuerte',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🥡'
  },
  {
    id: 'plato-ceviche-mixto',
    name: 'Ceviche Mixto con Camote y Choclo',
    brand: 'Cevichería',
    servingDesc: '1 porción clásica (320g)',
    grams: 320,
    calories: 320,
    protein: 42.0,
    carbs: 26.0,
    fat: 3.8,
    fiber: 3.5,
    category: 'plato_fuerte',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🐟'
  },
  {
    id: 'plato-causa-pollo',
    name: 'Causa Rellena de Pechuga de Pollo',
    brand: 'Criollo',
    servingDesc: '1 porción (200g)',
    grams: 200,
    calories: 360,
    protein: 18.0,
    carbs: 42.0,
    fat: 14.0,
    fiber: 3.0,
    category: 'plato_fuerte',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🥔'
  },
  {
    id: 'fit-jugo-verde-alcalinizante',
    name: 'Jugo Verde Alcalinizante & Biohacking (Espinaca, Apio, Manzana, Kion, Limón)',
    brand: 'Casero / Natural',
    servingDesc: '1 vaso estándar (300ml)',
    grams: 300,
    calories: 85,
    protein: 2.5,
    carbs: 18.0,
    fat: 0.5,
    fiber: 3.5,
    category: 'bebida_saludable',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🥬'
  },
  {
    id: 'peru-humita-dulce',
    name: 'Humita Dulce Andina con Pasas y Canela (Choclo Tierno)',
    brand: 'Tradicional Casera',
    servingDesc: '1 unidad (120g)',
    grams: 120,
    calories: 240,
    protein: 5.5,
    carbs: 45.0,
    fat: 4.8,
    fiber: 3.2,
    category: 'desayuno',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🌽'
  },
  {
    id: 'peru-humita-salada',
    name: 'Humita Salada con Queso Serrano / Pollo',
    brand: 'Tradicional Casera',
    servingDesc: '1 unidad (130g)',
    grams: 130,
    calories: 260,
    protein: 9.0,
    carbs: 38.0,
    fat: 8.5,
    fiber: 3.5,
    category: 'desayuno',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🌽'
  },
  {
    id: 'peru-tamal-pollo',
    name: 'Tamal Criollo de Pollo Tradicional (Maíz Amarillo, Huevo y Aceituna)',
    brand: 'Tradicional',
    servingDesc: '1 unidad mediana (160g)',
    grams: 160,
    calories: 340,
    protein: 16.0,
    carbs: 38.0,
    fat: 14.0,
    fiber: 3.8,
    category: 'desayuno',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🫔'
  },
  {
    id: 'peru-tamal-chancho',
    name: 'Tamal Criollo de Chancho / Cerdo',
    brand: 'Tradicional',
    servingDesc: '1 unidad mediana (160g)',
    grams: 160,
    calories: 410,
    protein: 15.0,
    carbs: 37.0,
    fat: 22.0,
    fiber: 3.5,
    category: 'desayuno',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🫔'
  },
  {
    id: 'peru-tamalito-verde',
    name: 'Tamalito Verde Piurano de Culantro y Pollo',
    brand: 'Piurano Tradicional',
    servingDesc: '1 unidad (120g)',
    grams: 120,
    calories: 260,
    protein: 12.0,
    carbs: 28.0,
    fat: 11.0,
    fiber: 3.0,
    category: 'desayuno',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🫔'
  },
  {
    id: 'peru-papa-huancaina',
    name: 'Papa a la Huancaína con Huevo Duro y Aceituna',
    brand: 'Criollo',
    servingDesc: '1 plato (220g)',
    grams: 220,
    calories: 330,
    protein: 11.0,
    carbs: 38.0,
    fat: 14.0,
    fiber: 3.0,
    category: 'comida',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🥔'
  },
  {
    id: 'peru-pan-chicharron',
    name: 'Pan con Chicharrón, Camote Frito y Salsa Criolla',
    brand: 'Tradicional Limeño',
    servingDesc: '1 sandwich completo (210g)',
    grams: 210,
    calories: 520,
    protein: 26.0,
    carbs: 48.0,
    fat: 25.0,
    fiber: 3.2,
    category: 'desayuno',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🥪'
  },
  {
    id: 'peru-emoliente-andino',
    name: 'Emoliente Andino Caliente con Cebada, Linaza y Limón',
    brand: 'Natural Andino',
    servingDesc: '1 vaso (300ml)',
    grams: 300,
    calories: 65,
    protein: 1.0,
    carbs: 15.0,
    fat: 0.2,
    fiber: 2.5,
    category: 'bebida_saludable',
    isSnack: false,
    isUltraProcessed: false,
    icon: '🍵'
  }
];

const SPANISH_NUMBERS = {
  un: 1,
  uno: 1,
  una: 1,
  jna: 1, // typo habitual en teclado móvil
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  media: 0.5,
  medio: 0.5
};

function extractLeadingCount(subStr, defaultCount = 1) {
  const match = subStr.match(/(\d+(?:\.\d+)?|un|uno|una|jna|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|media|medio)/i);
  if (!match) return defaultCount;
  const token = match[1].toLowerCase();
  if (SPANISH_NUMBERS[token] !== undefined) return SPANISH_NUMBERS[token];
  const parsed = parseFloat(token);
  return isNaN(parsed) ? defaultCount : parsed;
}

/**
 * Natural Language Food Parser
 * Recognizes multi-ingredient sentences, unit counts, and typos:
 * - "3 huevos fritos con jna cucharada de mantequilla"
 * - "4 huevos"
 * - "6 huevos cocidos con 2 panes"
 * - "chifles con un kekito"
 */
export function parseNaturalLanguageFood(text = '') {
  if (!text || typeof text !== 'string') return [];

  const lower = text.toLowerCase().trim();
  const detectedItems = [];
  const processedKeys = new Set();

  // 1. Huevos Enteros
  if (lower.includes('huevo') && !lower.includes('claras de huevo') && !lower.includes('solo claras')) {
    const eggRegex = /(?:(\d+|un|uno|una|jna|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s*(?:de\s*)?)?huevos?/i;
    const match = lower.match(eggRegex);
    const count = match && match[1] ? extractLeadingCount(match[1], 2) : (extractLeadingCount(lower, 2) || 2);
    const isFried = lower.includes('frito') || lower.includes('fritos') || lower.includes('sarten');
    const isScrambled = lower.includes('revuelto') || lower.includes('revueltos');
    const prep = isFried ? 'Fritos' : isScrambled ? 'Revueltos' : 'Cocidos';

    detectedItems.push({
      id: `parsed-huevo-${Date.now()}`,
      name: `${count} Huevo${count > 1 ? 's' : ''} Entero${count > 1 ? 's' : ''} ${prep}`,
      brand: 'Natural / Casero',
      servingDesc: `${count} unidad${count > 1 ? 'es' : ''} (${Math.round(count * 50)}g)`,
      grams: Math.round(count * 50),
      calories: Math.round(count * 72.5),
      protein: parseFloat((count * 6.5).toFixed(1)),
      carbs: parseFloat((count * 0.55).toFixed(1)),
      fat: parseFloat((count * 5.0).toFixed(1)),
      fiber: 0,
      icon: isFried || isScrambled ? '🍳' : '🥚',
      category: 'proteina',
      isSnack: false,
      isUltraProcessed: false
    });
    processedKeys.add('huevo');
  }

  // 2. Claras de Huevo
  if (lower.includes('clara') || lower.includes('claras')) {
    const claraRegex = /(?:(\d+|un|uno|una|jna|dos|tres|cuatro|cinco|seis|siete|ocho)\s*(?:de\s*)?)?claras?/i;
    const match = lower.match(claraRegex);
    const count = match && match[1] ? extractLeadingCount(match[1], 4) : 4;

    detectedItems.push({
      id: `parsed-claras-${Date.now()}`,
      name: `${count} Claras de Huevo`,
      brand: 'Natural',
      servingDesc: `${count} claras (${Math.round(count * 33)}g)`,
      grams: Math.round(count * 33),
      calories: Math.round(count * 17),
      protein: parseFloat((count * 3.6).toFixed(1)),
      carbs: parseFloat((count * 0.2).toFixed(1)),
      fat: parseFloat((count * 0.05).toFixed(1)),
      fiber: 0,
      icon: '🍳',
      category: 'proteina',
      isSnack: false,
      isUltraProcessed: false
    });
    processedKeys.add('clara');
  }

  // 3. Mantequilla / Ghee
  if (lower.includes('mantequilla') || lower.includes('ghee')) {
    const butterRegex = /(?:(\d+|un|uno|una|jna|dos|tres|cuatro)\s*(?:cucharadas?|cdas?|porciones?|cucharaditas?|cditas?)?\s*(?:de\s*)?)?mantequilla/i;
    const match = lower.match(butterRegex);
    const isTeaspoon = lower.includes('cucharadita') || lower.includes('cdita');
    const spoons = match && match[1] ? extractLeadingCount(match[1], 1) : 1;
    const grams = isTeaspoon ? Math.round(spoons * 5) : Math.round(spoons * 14);

    detectedItems.push({
      id: `parsed-mantequilla-${Date.now()}`,
      name: `${spoons} ${isTeaspoon ? 'Cucharadita' : 'Cucharada'}${spoons > 1 ? 's' : ''} de Mantequilla`,
      brand: 'Laive / Gloria',
      servingDesc: `${grams}g`,
      grams: grams,
      calories: Math.round(spoons * (isTeaspoon ? 36 : 102)),
      protein: parseFloat((spoons * 0.1).toFixed(1)),
      carbs: parseFloat((spoons * 0.1).toFixed(1)),
      fat: parseFloat((spoons * (isTeaspoon ? 4.1 : 11.5)).toFixed(1)),
      fiber: 0,
      icon: '🧈',
      category: 'grasa',
      isSnack: false,
      isUltraProcessed: false
    });
    processedKeys.add('mantequilla');
  }

  // 4. Aceite / Aceite de Oliva
  if (lower.includes('aceite')) {
    const oilRegex = /(?:(\d+|un|uno|una|jna|dos|tres)\s*(?:cucharadas?|cdas?|chorrito)?\s*(?:de\s*)?)?aceite/i;
    const match = lower.match(oilRegex);
    const spoons = match && match[1] ? extractLeadingCount(match[1], 1) : 1;
    const isOlive = lower.includes('oliva');

    detectedItems.push({
      id: `parsed-aceite-${Date.now()}`,
      name: `${spoons} Cucharada${spoons > 1 ? 's' : ''} de Aceite ${isOlive ? 'de Oliva' : 'Vegetal'}`,
      brand: isOlive ? 'El Olivar' : 'Cocinero',
      servingDesc: `${spoons * 14}g`,
      grams: spoons * 14,
      calories: Math.round(spoons * 120),
      protein: 0,
      carbs: 0,
      fat: parseFloat((spoons * 13.5).toFixed(1)),
      fiber: 0,
      icon: isOlive ? '🫒' : '🧴',
      category: 'grasa',
      isSnack: false,
      isUltraProcessed: false
    });
    processedKeys.add('aceite');
  }

  // 5. Panes
  if (lower.includes('pan') && !lower.includes('pancake') && !lower.includes('panqueque')) {
    const breadRegex = /(?:(\d+|un|uno|una|jna|dos|tres|cuatro)\s*)?pan(?:es)?/i;
    const match = lower.match(breadRegex);
    const count = match && match[1] ? extractLeadingCount(match[1], 1) : 1;

    detectedItems.push({
      id: `parsed-pan-${Date.now()}`,
      name: `${count} Pan${count > 1 ? 'es' : ''} Francés / Integral`,
      brand: 'Panadería',
      servingDesc: `${count} unidad${count > 1 ? 'es' : ''} (${count * 40}g)`,
      grams: count * 40,
      calories: Math.round(count * 110),
      protein: parseFloat((count * 3.5).toFixed(1)),
      carbs: parseFloat((count * 22.0).toFixed(1)),
      fat: parseFloat((count * 1.0).toFixed(1)),
      fiber: parseFloat((count * 1.2).toFixed(1)),
      icon: '🥖',
      category: 'carbohidrato',
      isSnack: false,
      isUltraProcessed: false
    });
    processedKeys.add('pan');
  }

  // 6. Curated items matches (Chifles, Kekitos, Pechuga, Arroz, etc.)
  const additionalPatterns = [
    {
      key: 'chifle',
      keywords: ['chifle', 'chifles'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'snack-chifles-50g')
    },
    {
      key: 'keke',
      keywords: ['kekito', 'keke', 'quequito', 'queque'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'snack-kekito-naranja')
    },
    {
      key: 'pechuga',
      keywords: ['pechuga', 'pollo a la plancha', 'pechuga de pollo'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'fit-pechuga-pollo')
    },
    {
      key: 'atun',
      keywords: ['atun', 'atún'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'fit-atun-agua')
    },
    {
      key: 'avena',
      keywords: ['avena', 'quaker'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'fit-avena-hojuelas')
    },
    {
      key: 'arroz',
      keywords: ['arroz', 'arroz blanco'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'fit-arroz-blanco')
    },
    {
      key: 'yogur',
      keywords: ['yogur', 'yogurt'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'fit-yogur-griego')
    },
    {
      key: 'palta',
      keywords: ['palta', 'aguacate'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'fit-palta-fuerte')
    },
    {
      key: 'galleta',
      keywords: ['casino', 'morochas', 'galletas'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'snack-galletas-casino')
    },
    {
      key: 'chocolate',
      keywords: ['sublime', 'chocolate'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'snack-chocolate-sublime')
    },
    {
      key: 'canchita',
      keywords: ['canchita', 'popcorn'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'snack-canchita-popcorn')
    },
    {
      key: 'lomo',
      keywords: ['lomo saltado'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'plato-lomo-saltado')
    },
    {
      key: 'pollo-brasa',
      keywords: ['pollo a la brasa', 'pollo brasa'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'plato-pollo-brasa')
    },
    {
      key: 'ceviche',
      keywords: ['ceviche'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'plato-ceviche-mixto')
    },
    {
      key: 'jugo_verde',
      keywords: ['jugo verde', 'green juice', 'batido verde', 'smoothie verde'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'fit-jugo-verde-alcalinizante')
    },
    {
      key: 'humita',
      keywords: ['humita', 'humitas', 'humita dulce', 'humita salada'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'peru-humita-dulce')
    },
    {
      key: 'tamal',
      keywords: ['tamal', 'tamales', 'tamalito', 'tamal de pollo', 'tamal de chancho'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'peru-tamal-pollo')
    },
    {
      key: 'huancaina',
      keywords: ['papa a la huancaina', 'huancaina', 'huancaína'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'peru-papa-huancaina')
    }
  ];

  for (const p of additionalPatterns) {
    if (!processedKeys.has(p.key) && p.keywords.some((kw) => lower.includes(kw))) {
      if (p.item) detectedItems.push(p.item);
      processedKeys.add(p.key);
    }
  }

  return detectedItems;
}

/**
 * Smart Compensator Engine ("¿Qué comer después?")
 * Calculates exact macro and calorie shifts post-meal or post-snack,
 * detecting lipid overloads (e.g. 3 eggs + butter, or 6 eggs) and dynamically
 * prescribing clean protein pivots to achieve daily recomposition targets.
 */
export function calculateCompensatoryRebalance({ loggedFoods = [], targets }) {
  const targetKcal = targets?.targetCalories || 2004;
  const targetProtein = targets?.macros?.proteinGrams || 165;
  const targetCarbs = targets?.macros?.carbsGrams || 194;
  const targetFat = targets?.macros?.fatGrams || 62;

  // Calculate consumed totals
  const consumed = loggedFoods.reduce(
    (acc, item) => ({
      calories: acc.calories + (Number(item.calories) || 0),
      protein: acc.protein + (Number(item.protein) || 0),
      carbs: acc.carbs + (Number(item.carbs) || 0),
      fat: acc.fat + (Number(item.fat) || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Check if snacks/treats or high-fat meals were logged
  const snacksLogged = loggedFoods.filter(
    (f) =>
      f.isSnack ||
      f.isUltraProcessed ||
      f.id?.includes('snack') ||
      f.name?.toLowerCase().includes('chifle') ||
      f.name?.toLowerCase().includes('keke')
  );

  const remainingKcal = Math.max(0, targetKcal - consumed.calories);
  const remainingProtein = Math.max(0, targetProtein - consumed.protein);
  const remainingCarbs = Math.max(0, targetCarbs - consumed.carbs);
  const remainingFat = Math.max(0, targetFat - consumed.fat);

  // Diagnostic metrics
  const fatPercentConsumed = Math.round((consumed.fat / targetFat) * 100);
  const proteinPercentConsumed = Math.round((consumed.protein / targetProtein) * 100);
  const isFatHeavy = consumed.fat >= targetFat * 0.40; // 40%+ of fat used in one meal or early in the day
  const isImbalanced = snacksLogged.length > 0 || (isFatHeavy && proteinPercentConsumed < 40);

  // Specialized Diagnostic Message
  let diagnosticTitle = 'Balance Nutricional Óptimo';
  let diagnosticDetail = 'Tus macronutrientes van en rango perfecto para hipertrofia limpia.';

  if (consumed.fat >= 25 && proteinPercentConsumed < 25) {
    diagnosticTitle = '⚠️ Carga Lipídica Elevada en Desayuno';
    diagnosticDetail = `Has consumido ${consumed.fat.toFixed(1)}g de grasa (${fatPercentConsumed}% de tu tope diario de ${targetFat}g). Te quedan solo ${remainingFat.toFixed(1)}g de grasa para el resto del día. Tu Almuerzo y Cena deben ser estrictamente magros (0 grasa agregada).`;
  } else if (consumed.protein >= 35 && consumed.fat >= 25) {
    diagnosticTitle = '⚡ Pico Anabólico con Grasa Moderada';
    diagnosticDetail = `¡Gran aporte proteico de inicio (${consumed.protein.toFixed(1)}g)! Las yemas/mantequilla consumieron ${consumed.fat.toFixed(1)}g de lípidos. Tu siguiente comida debe basarse en carbohidratos limpios (arroz/papa) y proteína ultra-magra.`;
  } else if (snacksLogged.length > 0) {
    diagnosticTitle = '⚡ Protocolo de Compensación por Snack Activado';
    diagnosticDetail = 'Has registrado un antojo dulce/salado. El sistema ha ajustado las grasas y azúcares de tu siguiente plato sin tocar tus metas proteicas.';
  }

  // 3 Scientific Compensatory Options ("Pivote Proteico")
  const options = [
    {
      id: 'pivot-pollo-arroz-limpio',
      title: isFatHeavy
        ? 'Opción 1: Pechuga a la Plancha + Arroz Blanco al Vapor (Cero Grasa Añadida)'
        : 'Opción 1: Pechuga a la Plancha + Ensalada Verde Gigante (Pivote Proteico Máximo)',
      mealSlot: 'Almuerzo o Cena',
      prepTime: '12 min',
      icon: '🍗',
      description: isFatHeavy
        ? '200g de pechuga a la plancha dorada con limón y ajo (sin aceite) + 150g de arroz blanco al vapor con brócoli. Maximiza glucógeno y aminoácidos con solo 3g de grasa.'
        : '200g de pechuga a la plancha con gotas de limón, orégano y un tazón grande de espinacas, lechuga y pepino con vinagre de manzana.',
      macrosProvided: {
        calories: isFatHeavy ? 395 : 235,
        protein: isFatHeavy ? 49 : 48,
        carbs: isFatHeavy ? 43 : 4,
        fat: 3.5
      },
      scienceWhy:
        'Aporta casi 50g de proteína de máxima biodisponibilidad para asegurar la síntesis proteica de tu Lean Bulk protegiendo tu límite de grasas diario.',
      foodItemsToAdd: [
        {
          name: 'Pechuga de Pollo a la Plancha (200g)',
          calories: 215,
          protein: 46,
          carbs: 0,
          fat: 3.0,
          servingDesc: '200g pesados en crudo'
        },
        {
          name: isFatHeavy ? 'Arroz Blanco al Vapor (150g)' : 'Ensalada Verde Fibrosa con Limón',
          calories: isFatHeavy ? 180 : 20,
          protein: isFatHeavy ? 3 : 2,
          carbs: isFatHeavy ? 43 : 4,
          fat: 0.5,
          servingDesc: isFatHeavy ? '1 taza colmada' : '1 tazón grande'
        }
      ]
    },
    {
      id: 'pivot-claras-atun',
      title: 'Opción 2: Tortilla Anabólica de 5 Claras + 1 Lata de Atún al Agua',
      mealSlot: 'Cena Ligera',
      prepTime: '8 min',
      icon: '🍳',
      description:
        'Bate 5 claras de huevo con 1 lata de atún al agua escurrida, cebolla blanca picada y tomate. Cuaja en sartén antiadherente a fuego bajo.',
      macrosProvided: {
        calories: 210,
        protein: 44,
        carbs: 3,
        fat: 1.5
      },
      scienceWhy:
        'El atún al agua y las claras ofrecen el ratio Proteína/Caloría más eficiente del reino animal. Sacia por completo gracias al volumen de la albúmina sin alterar tu balance calórico.',
      foodItemsToAdd: [
        {
          name: 'Claras de Huevo (5 unidades)',
          calories: 85,
          protein: 18,
          carbs: 1,
          fat: 0.2,
          servingDesc: '5 claras'
        },
        {
          name: 'Atún al Agua en Lata (120g escurrido)',
          calories: 125,
          protein: 26,
          carbs: 2,
          fat: 1.3,
          servingDesc: '1 lata'
        }
      ]
    },
    {
      id: 'pivot-shake-yogur',
      title: 'Opción 3: Shake Concentrado de Whey Isolate + Yogur Griego 0%',
      mealSlot: 'Snack de Cierre o Post-Entreno',
      prepTime: '3 min',
      icon: '🥣',
      description:
        '150g de yogur griego 0% grasa batido con 1 scoop (30g) de proteína Whey Isolate sabor vainilla o chocolate y canela molida.',
      macrosProvided: {
        calories: 205,
        protein: 40,
        carbs: 6,
        fat: 1.0
      },
      scienceWhy:
        'Cero fricción de cocina. Combina caseína micelar de digestión lenta del yogur griego con la rápida absorción del suero de leche, protegiendo tus músculos durante la noche.',
      foodItemsToAdd: [
        {
          name: 'Proteína Whey Isolate (1 scoop 30g)',
          calories: 115,
          protein: 25,
          carbs: 1.5,
          fat: 0.8,
          servingDesc: '1 scoop'
        },
        {
          name: 'Yogur Griego 0% Grasa (150g)',
          calories: 90,
          protein: 15,
          carbs: 4.5,
          fat: 0.2,
          servingDesc: '150g'
        }
      ]
    }
  ];

  return {
    isImbalanced,
    isFatHeavy,
    fatPercentConsumed,
    proteinPercentConsumed,
    diagnosticTitle,
    diagnosticDetail,
    snacksLogged,
    consumed,
    remaining: {
      calories: remainingKcal,
      protein: remainingProtein,
      carbs: remainingCarbs,
      fat: remainingFat
    },
    options,
    damageControlActive: isImbalanced || isFatHeavy || snacksLogged.length > 0
  };
}
