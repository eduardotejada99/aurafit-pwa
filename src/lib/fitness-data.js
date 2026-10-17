/**
 * AuraFit Core Fitness & Biohacking Engine
 * Mathematical models, nutritional algorithms, damage control, and workout generators.
 */

// 1. Biometric & Metabolic Formulas (Mifflin-St Jeor)
export function calculateBMR({ weightKg, heightCm, age = 26, gender = 'male' }) {
  if (!weightKg || !heightCm) return 0;
  if (gender === 'female') {
    return Math.round((10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161);
  }
  return Math.round((10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5);
}

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,      // Poco o ningún ejercicio
  light: 1.375,       // Ejercicio ligero 1-3 días/semana
  moderate: 1.55,     // Ejercicio moderado 3-5 días/semana
  intense: 1.725      // Ejercicio fuerte 6-7 días/semana
};

export function calculateTDEE({ weightKg, heightCm, age = 26, gender = 'male', activityLevel = 'moderate' }) {
  const bmr = calculateBMR({ weightKg, heightCm, age, gender });
  const mult = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
  return Math.round(bmr * mult);
}

export function calculateLeanBulkTargets({ weightKg, heightCm, age = 26, gender = 'male', activityLevel = 'moderate', surplus = 300 }) {
  const bmr = calculateBMR({ weightKg, heightCm, age, gender });
  const tdee = calculateTDEE({ weightKg, heightCm, age, gender, activityLevel });
  const targetCalories = tdee + surplus;

  // Protein: 2.0g per kg of bodyweight
  const proteinGrams = Math.round(weightKg * 2.0);
  const proteinCalories = proteinGrams * 4;

  // Fats: 0.9g per kg of bodyweight
  const fatGrams = Math.round(weightKg * 0.9);
  const fatCalories = fatGrams * 9;

  // Carbs: Remaining calories
  const remainingCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
  const carbsGrams = Math.round(remainingCalories / 4);

  return {
    bmr,
    tdee,
    surplus,
    targetCalories,
    macros: {
      proteinGrams,
      fatGrams,
      carbsGrams
    }
  };
}

// 2. Default User Profile
export const DEFAULT_USER_PROFILE = {
  fullName: 'Eduardo Andrés Tejada Reyes',
  heightCm: 175,
  weightKg: 72.5,
  targetWeightKg: 76.0,
  age: 26,
  gender: 'male',
  activityLevel: 'moderate',
  creatineDailyGrams: 5.0,
  waterDailyMl: 2800,
  sleepDailyHours: 8.0
};

// 3. Daily Habits Initial State
export const DEFAULT_HABITS = [
  {
    id: 'creatine',
    name: 'Creatina Monohidrato',
    target: '5g diarios',
    completed: false,
    grams: 5.0,
    time: null,
    category: 'suplementacion',
    icon: '⚡',
    note: 'Saturación celular constante de fosfocreatina'
  },
  {
    id: 'mindvalley',
    name: 'Sesión Mindvalley / Crecimiento',
    target: '20 min diarios',
    completed: false,
    topic: '',
    category: 'mente',
    icon: '🧠',
    note: 'Foco mental, reprogramación de hábitos y claridad'
  },
  {
    id: 'water',
    name: 'Hidratación con Electrolitos',
    target: '2,800 ml',
    completed: false,
    currentMl: 1500,
    category: 'biohacking',
    icon: '💧',
    note: 'Agua + pizca de sal mineral para equilibrio osmótico'
  },
  {
    id: 'sleep',
    name: 'Descanso Reparador',
    target: '8 horas (sueño profundo)',
    completed: true,
    hours: 7.5,
    category: 'recuperacion',
    icon: '🌙',
    note: 'Síntesis proteica y secreción de hormona del crecimiento'
  }
];

// 4. Damage Control Protocols
export const DAMAGE_CONTROL_PROTOCOL = {
  title: 'Protocolo de Mitigación Post-Comida Chatarra (GLUT-4 Reset)',
  objective: 'Aplanar el pico de glucosa posprandial, activar captación muscular y reequilibrar electrolitos.',
  steps: [
    {
      id: 'step1',
      title: 'Caminata Post-Prandial Activa',
      duration: '15 - 20 minutos',
      icon: '🚶‍♂️',
      action: 'Caminar a paso constante inmediatamente después de comer.',
      science: 'La contracción muscular transloca transportadores GLUT-4 a la membrana celular sin depender de insulina, reduciendo el pico glucémico hasta en un 35%.'
    },
    {
      id: 'step2',
      title: 'Shot de Hidratación Osmótica',
      duration: 'Inmediato',
      icon: '🧂',
      action: 'Beber 500 - 700 ml de agua templada con zumo de limón y una pizca de sal mineral.',
      science: 'Contrarresta la retención excesiva de agua intravascular causada por el exceso de sodio procesado y diluye la osmolaridad sérica.'
    },
    {
      id: 'step3',
      title: 'Pivote Proteico en la Siguiente Comida',
      duration: 'Próxima comida',
      icon: '🥗',
      action: 'NO ayunes de castigo. Come una porción alta en proteína magra (pechuga, atún, claras) con abundantes vegetales verdes altos en fibra soluble.',
      science: 'La fibra ralentiza el tránsito gastrointestinal y la proteína estimula péptidos de saciedad (PYY y GLP-1), evitando atracones nocturnos de rebote.'
    },
    {
      id: 'step4',
      title: 'Higiene Digestiva Nocturna',
      duration: 'Noche',
      icon: '🍵',
      action: 'Toma una infusión de jengibre o manzanilla, eleva 5cm la cabecera y deja al menos 3 horas de distancia antes de acostarte.',
      science: 'Previene el reflujo gastroesofágico y mantiene intacta la fase REM y sueño de ondas lentas.'
    }
  ]
};

// 5. Pantry Ingredients & Meal Generator
export const PANTRY_DATABASE = [
  {
    id: 'meal-1',
    name: 'Pancake Proteico Hipercalórico con Avena y Plátano',
    requiredIngredients: ['huevos', 'avena', 'platano'],
    prepMinutes: 10,
    calories: 520,
    proteinG: 28,
    carbsG: 68,
    fatG: 14,
    description: 'Licúa 3 huevos, 60g de avena en hojuelas y 1 plátano maduro. Cocina a la sartén con fuego medio 3 min por lado.',
    tags: ['desayuno', 'lean bulk', 'rapido']
  },
  {
    id: 'meal-2',
    name: 'Bowl Atún Power con Arroz y Espinacas',
    requiredIngredients: ['atun', 'arroz', 'espinaca', 'aceite de oliva'],
    prepMinutes: 8,
    calories: 560,
    proteinG: 42,
    carbsG: 62,
    fatG: 15,
    description: '1 lata de atún escurrido, 200g de arroz cocido y un puñado generoso de espinacas salteadas con 1 cda de aceite de oliva.',
    tags: ['almuerzo', 'alta proteina', 'rapido']
  },
  {
    id: 'meal-3',
    name: 'Tortilla Española Fitness de Pollo y Papa',
    requiredIngredients: ['pollo', 'papa', 'huevos'],
    prepMinutes: 15,
    calories: 580,
    proteinG: 48,
    carbsG: 52,
    fatG: 16,
    description: '150g de pechuga de pollo picada, 1 papa cocida en rodajas doradas y 2 huevos batidos a fuego lento.',
    tags: ['cena', 'volumen limpio']
  },
  {
    id: 'meal-4',
    name: 'Batido Anabólico Express de Avena y Leche',
    requiredIngredients: ['leche', 'avena', 'platano'],
    prepMinutes: 3,
    calories: 490,
    proteinG: 22,
    carbsG: 75,
    fatG: 10,
    description: '300ml de leche fresca, 50g de avena y 1 plátano. Licuar por 45 segundos con cubos de hielo.',
    tags: ['snack', 'pre-workout']
  },
  {
    id: 'meal-5',
    name: 'Omelette Campestre con Huevos, Queso y Espinaca',
    requiredIngredients: ['huevos', 'queso', 'espinaca'],
    prepMinutes: 7,
    calories: 410,
    proteinG: 32,
    carbsG: 6,
    fatG: 28,
    description: '3 huevos enteros, 40g de queso fresco y espinacas tiernas dobladas en sartén antiadherente.',
    tags: ['desayuno', 'keto-friendly', 'alta proteina']
  }
];

export function generateMealsFromPantry(availableIngredients = []) {
  if (!availableIngredients || availableIngredients.length === 0) {
    return PANTRY_DATABASE.slice(0, 3);
  }

  const normalized = availableIngredients.map(i => i.toLowerCase().trim());
  
  // Score meals based on matching ingredients
  const scored = PANTRY_DATABASE.map(meal => {
    let matches = 0;
    meal.requiredIngredients.forEach(req => {
      if (normalized.some(ing => ing.includes(req) || req.includes(ing))) {
        matches++;
      }
    });
    return {
      ...meal,
      matchCount: matches,
      matchRate: matches / meal.requiredIngredients.length
    };
  });

  // Sort by highest match rate
  scored.sort((a, b) => b.matchRate - a.matchRate || b.matchCount - a.matchCount);
  return scored;
}

// 6. Adaptive Workouts: Gym vs Home EMOM
export const WORKOUT_ROUTINES = {
  gym: {
    title: 'Rutina de Gimnasio: Sobrecarga Progresiva (Torso / Push)',
    durationMinutes: 50,
    focus: 'Hipertrofia Miofibrilar & Densidad Muscular',
    equipment: 'Pesas libres, poleas y banco',
    exercises: [
      { name: 'Press Banca Plano con Barra', sets: 4, reps: '8 - 10', restSeconds: 120, rir: 2 },
      { name: 'Press Inclinado con Mancuernas', sets: 3, reps: '10 - 12', restSeconds: 90, rir: 1 },
      { name: 'Jalón al Pecho Polea Alta', sets: 4, reps: '10 - 12', restSeconds: 90, rir: 2 },
      { name: 'Remo con Mancuerna en Banco', sets: 3, reps: '12 por lado', restSeconds: 75, rir: 1 },
      { name: 'Elevaciones Laterales Pesadas', sets: 4, reps: '15', restSeconds: 60, rir: 0 },
      { name: 'Extensiones de Tríceps en Polea', sets: 3, reps: '12 - 15', restSeconds: 60, rir: 1 }
    ]
  },
  home_emom: {
    title: 'Rutina En Casa / Viaje: EMOM 30 Minutos (Alta Intensidad)',
    durationMinutes: 30,
    focus: 'Acondicionamiento Metabólico & Resistencia Anaeróbica',
    equipment: 'Cero equipamiento (Solo peso corporal)',
    exercises: [
      { minute: 1, name: '15 Flexiones Declinadas (Pies en silla)', target: '15 reps en < 40s', restSeconds: 20 },
      { minute: 2, name: '20 Sentadillas Profundas con Salto Explosivo', target: '20 reps en < 45s', restSeconds: 15 },
      { minute: 3, name: '16 Zancadas Búlgaras Alternadas', target: '8 por pierna', restSeconds: 20 },
      { minute: 4, name: '15 Fondos de Tríceps en Sofá / Silla', target: '15 reps controladas', restSeconds: 20 },
      { minute: 5, name: '45s Plancha Frontal Dinámica con Toque de Hombro', target: '45s continuo', restSeconds: 15 },
      { minute: 6, name: 'Descanso Activo / Hidratación', target: 'Recuperación respiratoria', restSeconds: 60 }
    ],
    note: 'Repetir la secuencia 5 rondas consecutivas para completar 30 minutos sin descanso pasivo prolongado.'
  }
};

// 7. Weight Moving Average Analytics
export function calculateWeightAnalytics(weightLogs = []) {
  if (!weightLogs || weightLogs.length === 0) {
    return {
      currentWeight: 72.5,
      targetWeight: 76.0,
      movingAverage: 72.5,
      weeklyChangeKg: 0.35,
      isOnTrack: true,
      logsCount: 0
    };
  }

  // Sort by date ascending
  const sorted = [...weightLogs].sort((a, b) => new Date(a.log_date || a.date) - new Date(b.log_date || b.date));
  const latestWeight = parseFloat(sorted[sorted.length - 1].weight_kg || sorted[sorted.length - 1].weight || 72.5);

  // Take up to last 7 days for moving average
  const last7 = sorted.slice(-7);
  const sum = last7.reduce((acc, curr) => acc + parseFloat(curr.weight_kg || curr.weight || 0), 0);
  const movingAverage = parseFloat((sum / last7.length).toFixed(2));

  // Calculate rate if more than 7 logs
  let weeklyChangeKg = 0.35; // Default healthy clean bulk gain
  if (sorted.length >= 7) {
    const olderAvg = sorted.slice(0, Math.min(7, sorted.length - 3)).reduce((acc, c) => acc + parseFloat(c.weight_kg || c.weight || 0), 0) / Math.min(7, sorted.length - 3);
    weeklyChangeKg = parseFloat((movingAverage - olderAvg).toFixed(2));
  }

  // Clean bulk optimal rate: +0.20 to +0.50 kg per week
  const isOnTrack = weeklyChangeKg >= 0.15 && weeklyChangeKg <= 0.60;

  return {
    currentWeight: latestWeight,
    targetWeight: 76.0,
    movingAverage,
    weeklyChangeKg,
    isOnTrack,
    logsCount: sorted.length
  };
}
