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
    name: 'Huevo Entero de Gallina (Sancochado/Frito)',
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
  }
];

/**
 * Natural Language Food Parser
 * Recognizes terms like:
 * - "chifles"
 * - "kekito" o "keke"
 * - "2 huevos y avena"
 * - "pechuga de pollo y arroz"
 */
export function parseNaturalLanguageFood(text = '') {
  if (!text || typeof text !== 'string') return [];

  const lower = text.toLowerCase().trim();
  const detectedItems = [];

  // Patterns
  const patterns = [
    {
      keywords: ['chifle', 'chifles', 'chifles piuranos'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'snack-chifles-50g')
    },
    {
      keywords: ['kekito', 'keke', 'quequito', 'queque'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'snack-kekito-naranja')
    },
    {
      keywords: ['huevo', 'huevos', 'huevos revueltos', 'huevos pasados'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'fit-huevo-entero')
    },
    {
      keywords: ['clara', 'claras', 'claras de huevo'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'fit-claras-huevo')
    },
    {
      keywords: ['pechuga', 'pollo a la plancha', 'pechuga de pollo'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'fit-pechuga-pollo')
    },
    {
      keywords: ['atun', 'atún', 'lata de atun'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'fit-atun-agua')
    },
    {
      keywords: ['avena', 'avena con leche', 'quaker'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'fit-avena-hojuelas')
    },
    {
      keywords: ['arroz', 'arroz blanco'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'fit-arroz-blanco')
    },
    {
      keywords: ['yogur', 'yogurt', 'yogur griego'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'fit-yogur-griego')
    },
    {
      keywords: ['platano', 'plátano', 'banana'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'fit-platano-seda')
    },
    {
      keywords: ['palta', 'aguacate'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'fit-palta-fuerte')
    },
    {
      keywords: ['galleta', 'galletas', 'casino'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'snack-galletas-casino')
    },
    {
      keywords: ['sublime', 'chocolate'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'snack-chocolate-sublime')
    },
    {
      keywords: ['canchita', 'popcorn'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'snack-canchita-popcorn')
    },
    {
      keywords: ['empanada'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'snack-empanada-carne')
    },
    {
      keywords: ['lomo saltado'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'plato-lomo-saltado')
    },
    {
      keywords: ['pollo a la brasa', 'pollo brasa'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'plato-pollo-brasa')
    },
    {
      keywords: ['ceviche'],
      item: CURATED_PERUVIAN_FOODS.find((f) => f.id === 'plato-ceviche-mixto')
    }
  ];

  for (const p of patterns) {
    if (p.keywords.some((kw) => lower.includes(kw))) {
      detectedItems.push(p.item);
    }
  }

  return detectedItems;
}

/**
 * Smart Compensator Engine ("¿Qué comer después?")
 * Calculates exact macro and calorie shifts post-snack/treat,
 * and generates 3 targeted protein-forward, low-fat compensatory meal strategies.
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

  // Check if snacks/treats were logged
  const snacksLogged = loggedFoods.filter(
    (f) => f.isSnack || f.isUltraProcessed || f.id?.includes('snack') || f.name?.toLowerCase().includes('chifle') || f.name?.toLowerCase().includes('keke')
  );

  const remainingKcal = Math.max(0, targetKcal - consumed.calories);
  const remainingProtein = Math.max(0, targetProtein - consumed.protein);
  const remainingCarbs = Math.max(0, targetCarbs - consumed.carbs);
  const remainingFat = Math.max(0, targetFat - consumed.fat);

  // Detect imbalance: high carbs/fat consumed, but protein lagging behind
  const isImbalanced = snacksLogged.length > 0 || (consumed.fat > targetFat * 0.7 && consumed.protein < targetProtein * 0.5);

  // 3 Scientific Compensatory Options ("Pivote Proteico")
  const options = [
    {
      id: 'pivot-pollo-ensalada',
      title: 'Opción 1: Pechuga a la Plancha + Ensalada Verde Gigante (Pivote Proteico Máximo)',
      mealSlot: 'Cena o Almuerzo',
      prepTime: '12 min',
      icon: '🍗',
      description: '200g de pechuga a la plancha con gotas de limón, orégano y un tazón grande de espinacas, lechuga y pepino con vinagre de manzana (sin aceite).',
      macrosProvided: {
        calories: 235,
        protein: 48,
        carbs: 4,
        fat: 3.5
      },
      scienceWhy: 'Aporta casi 50g de proteína pura para asegurar la síntesis proteica de tu Lean Bulk sin agregar prácticamente nada de grasas ni carbohidratos.',
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
          name: 'Ensalada Verde Fibrosa con Limón y Vinagre',
          calories: 20,
          protein: 2,
          carbs: 4,
          fat: 0.5,
          servingDesc: '1 tazón grande'
        }
      ]
    },
    {
      id: 'pivot-claras-atun',
      title: 'Opción 2: Tortilla Anabólica de 5 Claras + 1 Lata de Atún al Agua',
      mealSlot: 'Cena Ligera',
      prepTime: '8 min',
      icon: '🍳',
      description: 'Bate 5 claras de huevo con 1 lata de atún al agua escurrida, cebolla blanca picada y tomate. Cuaja en sartén antiadherente a fuego bajo.',
      macrosProvided: {
        calories: 210,
        protein: 44,
        carbs: 3,
        fat: 1.5
      },
      scienceWhy: 'El atún al agua y las claras ofrecen el ratio Proteína/Caloría más eficiente del reino animal. Sacia por completo gracias al volumen de la clara sin alterar tu balance calórico.',
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
      description: '150g de yogur griego 0% grasa batido con 1 scoop (30g) de proteína Whey Isolate sabor vainilla o chocolate y canela molida.',
      macrosProvided: {
        calories: 205,
        protein: 40,
        carbs: 6,
        fat: 1.0
      },
      scienceWhy: 'Cero fricción de cocina. Combina caseína de digestión lenta del yogur griego con la rápida absorción del suero de leche, protegiendo tus músculos durante la noche.',
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
    snacksLogged,
    consumed,
    remaining: {
      calories: remainingKcal,
      protein: remainingProtein,
      carbs: remainingCarbs,
      fat: remainingFat
    },
    options,
    damageControlActive: snacksLogged.length > 0
  };
}
