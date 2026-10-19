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

// Dynamic Target Calculator per Goal
export function calculateProfileTargets({
  weightKg = 75,
  heightCm = 175,
  age = 26,
  gender = 'male',
  activityLevel = 'moderate',
  goal = 'recomposition'
}) {
  const bmr = calculateBMR({ weightKg, heightCm, age, gender });
  const tdee = calculateTDEE({ weightKg, heightCm, age, gender, activityLevel });

  let targetCalories = tdee;
  let proteinMultiplier = 2.0;
  let fatMultiplier = 0.8;
  let label = 'Mantenimiento';

  if (goal === 'recomposition') {
    // Déficit moderado (-450 to -500 kcal) con alta proteína (2.1g/kg)
    targetCalories = Math.max(1600, tdee - 500);
    proteinMultiplier = 2.1;
    fatMultiplier = 0.65;
    label = 'Recomposición (Quemar Grasa + Construir Músculo)';
  } else if (goal === 'lean_bulk') {
    // Superávit limpio (+250 to +300 kcal) con 2.0g/kg de proteína y altos carbos
    targetCalories = tdee + 300;
    proteinMultiplier = 2.0;
    fatMultiplier = 0.9;
    label = 'Hipertrofia Limpia (Superávit +300 kcal)';
  } else if (goal === 'insulin_sensitivity') {
    // Normocalórica o ligero déficit (-200 kcal), bajo índice glucémico y alta fibra
    targetCalories = Math.max(1500, tdee - 200);
    proteinMultiplier = 1.7;
    fatMultiplier = 0.85;
    label = 'Glucosa Estable & Sensibilidad a la Insulina';
  }

  const proteinGrams = Math.round(weightKg * proteinMultiplier);
  const fatGrams = Math.round(weightKg * fatMultiplier);
  const remainingCals = Math.max(0, targetCalories - (proteinGrams * 4) - (fatGrams * 9));
  const carbsGrams = Math.round(remainingCals / 4);

  return {
    bmr,
    tdee,
    targetCalories,
    label,
    macros: {
      proteinGrams,
      fatGrams,
      carbsGrams
    }
  };
}

// 2. The 3 Distinct Family Profiles (Andrés, Pareja, Hermana)
export const FAMILY_PROFILES = {
  andres: {
    id: 'andres',
    name: 'Andrés',
    role: 'Recomposición & Biohacking',
    avatar: '🦁',
    pin: '1234',
    gender: 'male',
    age: 28,
    heightCm: 177,
    weightKg: 92.0,
    targetWeightKg: 82.0,
    goal: 'recomposition',
    activityLevel: 'moderate',
    targetCalories: 2150,
    macros: {
      proteinGrams: 195,
      fatGrams: 60,
      carbsGrams: 205
    },
    travelMode: true,
    location: 'Cajabamba / Trujillo',
    altitudeMeters: 2654,
    waterDailyMl: 3400,
    badgeText: '🏔️ Cajabamba Mode (2,654m) · Gimnasio / EMOM',
    habits: [
      {
        id: 'wimhof',
        name: 'Respiración Wim Hof (3 Rondas)',
        target: '15 min matutino',
        completed: false,
        icon: '🫁',
        category: 'biohacking',
        note: 'Oxigenación celular profunda, reset de cortisol y sistema nervioso'
      },
      {
        id: 'creatine',
        name: 'Creatina Monohidrato',
        target: '5g diarios',
        completed: false,
        icon: '⚡',
        category: 'suplementacion',
        note: 'Saturación constante de fosfocreatina para fuerza e hipertrofia'
      },
      {
        id: 'water_electrolytes',
        name: 'Hidratación de Altitud + Electrolitos',
        target: '3,400 ml',
        completed: false,
        icon: '💧',
        category: 'biohacking',
        note: 'Agua + pizca de sal marina para compensar la altitud en Cajabamba'
      },
      {
        id: 'yoga_mobility',
        name: 'Yoga / Movilidad & Estiramientos',
        target: '15 min diarios',
        completed: false,
        icon: '🧘‍♂️',
        category: 'recuperacion',
        note: 'Descompresión espinal, postura y flexibilidad activa'
      },
      {
        id: 'sleep_cold',
        name: 'Ducha Fría & Descanso Reparador',
        target: '2 min fría + 8h sueño',
        completed: false,
        icon: '❄️',
        category: 'biohacking',
        note: 'Termogénesis para grasa parda y regeneración de testosterona'
      }
    ],
    workouts: {
      gym: {
        title: 'Fuerza & Recomposición: Sobrecarga Progresiva',
        focus: 'Preservar músculo en déficit y oxidar grasa',
        durationMinutes: 50,
        exercises: [
          { name: 'Sentadilla con Barra / Prensa Pesada', sets: 4, reps: '6-8 pesadas', restSeconds: 120, rir: 2 },
          { name: 'Press Banca con Mancuernas', sets: 4, reps: '8-10', restSeconds: 90, rir: 1 },
          { name: 'Peso Muerto Rumano (Isquios/Glúteo)', sets: 3, reps: '8-10', restSeconds: 90, rir: 2 },
          { name: 'Remo con Barra o Polea Baja', sets: 4, reps: '10-12', restSeconds: 75, rir: 1 },
          { name: 'Elevaciones Laterales + Face Pulls', sets: 4, reps: '12-15', restSeconds: 60, rir: 0 },
          { name: 'Finisher: 12 min Caminata Inclinada (Zona 2)', sets: 1, reps: '12 min', restSeconds: 0, rir: 0 }
        ]
      },
      travel: {
        title: 'Calistenia de Viaje / Cajabamba (EMOM 30m)',
        focus: 'Gasto calórico alto y estímulo muscular sin pesas',
        durationMinutes: 30,
        exercises: [
          { minute: 1, name: '15 Flexiones Diamante / Declinadas', target: '15 reps en < 40s', restSeconds: 20 },
          { minute: 2, name: '20 Sentadillas Profundas con Salto', target: '20 reps explosivas', restSeconds: 15 },
          { minute: 3, name: '16 Zancadas Búlgaras en cama/silla', target: '8 por pierna', restSeconds: 20 },
          { minute: 4, name: '15 Fondos en banco/silla', target: '15 reps controladas', restSeconds: 20 },
          { minute: 5, name: '45s Plancha con Toque de Hombros', target: '45s continuo', restSeconds: 15 },
          { minute: 6, name: 'Descanso e Hidratación', target: 'Recuperar aire', restSeconds: 60 }
        ]
      }
    }
  },

  pareja: {
    id: 'pareja',
    name: 'Mi Pareja',
    role: 'Hipertrofia Limpia (Lean Bulk)',
    avatar: '🌸',
    pin: '5678',
    gender: 'female',
    age: 26,
    heightCm: 162,
    weightKg: 52.0,
    targetWeightKg: 56.0,
    goal: 'lean_bulk',
    activityLevel: 'moderate',
    targetCalories: 1950,
    macros: {
      proteinGrams: 105,
      fatGrams: 52,
      carbsGrams: 265
    },
    travelMode: true,
    location: 'Cajabamba / Trujillo',
    altitudeMeters: 2654,
    waterDailyMl: 2200,
    badgeText: '✨ Superávit Limpio (+300 kcal) · Enfoque Glúteos & Espalda',
    habits: [
      {
        id: 'creatine',
        name: 'Creatina Monohidrato',
        target: '3g a 5g diarios',
        completed: false,
        icon: '⚡',
        category: 'suplementacion',
        note: 'Volumen muscular magro sin acumular grasa corporal'
      },
      {
        id: 'dense_snack',
        name: 'Snack Nutritivo Denso (Frutos Secos / Batido)',
        target: '1 al día',
        completed: false,
        icon: '🥜',
        category: 'nutricion',
        note: 'Asegurar calorías limpias para el superávit anabólico'
      },
      {
        id: 'water_electrolytes',
        name: 'Hidratación con Electrolitos en Cajabamba',
        target: '2,200 ml',
        completed: false,
        icon: '💧',
        category: 'biohacking',
        note: 'Balance osmótico en altura de viaje'
      },
      {
        id: 'sleep_growth',
        name: 'Sueño Reparador 8 Horas',
        target: '8h de descanso',
        completed: false,
        icon: '🌙',
        category: 'recuperacion',
        note: 'Fase de síntesis proteica donde el músculo se recupera y crece'
      }
    ],
    workouts: {
      gym: {
        title: 'Hipertrofia Glúteos, Pierna & Espalda Estética',
        focus: 'Tensión mecánica para ganar volumen magro',
        durationMinutes: 45,
        exercises: [
          { name: 'Hip Thrust con Barra en Banco', sets: 4, reps: '8-10 pesadas', restSeconds: 120, rir: 1 },
          { name: 'Sentadilla Búlgara con Mancuernas', sets: 3, reps: '10-12 por pierna', restSeconds: 90, rir: 1 },
          { name: 'Peso Muerto Rumano Mancuernas', sets: 4, reps: '10-12', restSeconds: 90, rir: 2 },
          { name: 'Jalón al Pecho Polea (Espalda Estética)', sets: 3, reps: '10-12', restSeconds: 75, rir: 1 },
          { name: 'Elevaciones Laterales Mancuernas', sets: 4, reps: '12-15', restSeconds: 60, rir: 0 },
          { name: 'Curl Femoral Tumbada o Sentada', sets: 3, reps: '12-15', restSeconds: 60, rir: 1 }
        ]
      },
      travel: {
        title: 'Tonificación & Hipertrofia con Bandas / Silla',
        focus: 'Glúteos y core sin fatiga excesiva',
        durationMinutes: 30,
        exercises: [
          { name: 'Hip Thrust Unilateral en Sofá / Cama', sets: 4, reps: '15 por pierna', restSeconds: 60 },
          { name: 'Sentadilla Goblet con Mochila', sets: 4, reps: '15 lentas', restSeconds: 60 },
          { name: 'Patada de Glúteo en Cuadrupedia', sets: 3, reps: '20 por lado', restSeconds: 45 },
          { name: 'Puente de Glúteos Isométrico (Pausa 3s)', sets: 3, reps: '15 reps', restSeconds: 45 },
          { name: 'Plancha Lateral con Elevación de Pierna', sets: 3, reps: '30s por lado', restSeconds: 45 }
        ]
      }
    }
  },

  hermana: {
    id: 'hermana',
    name: 'Mi Hermana',
    role: 'Glucosa Estable & Post-Cirugía Oído',
    avatar: '🌿',
    pin: '9012',
    gender: 'female',
    age: 22,
    heightCm: 160,
    weightKg: 64.0,
    targetWeightKg: 58.0,
    goal: 'insulin_sensitivity',
    activityLevel: 'light',
    targetCalories: 1650,
    macros: {
      proteinGrams: 105,
      fatGrams: 55,
      carbsGrams: 180
    },
    travelMode: false,
    location: 'Casa (Recuperación)',
    waterDailyMl: 2300,
    badgeText: '🩺 Protocolo Glucosa Estable · Cero Presión Cefálica',
    medicalAlert: 'Post-Cirugía de Oído: PROHIBIDO cargar peso pesado, agacharse de golpe o hacer maniobra de Valsalva.',
    habits: [
      {
        id: 'glucose_order',
        name: 'Regla del Plato: 1.Fibra -> 2.Proteína -> 3.Carbos',
        target: 'En almuerzo y cena',
        completed: false,
        icon: '🥗',
        category: 'salud_clinica',
        note: 'La fibra crea una malla que reduce el pico de glucosa e insulina hasta un 40%'
      },
      {
        id: 'dance_therapy',
        name: 'Baile Suave / Terapia de Movimiento',
        target: '15 min post-comida',
        completed: false,
        icon: '💃',
        category: 'movimiento',
        note: 'Activa transportadores GLUT-4 sin presión en el oído ni impacto'
      },
      {
        id: 'vinegar_hack',
        name: 'Shot de Vinagre de Manzana en Agua',
        target: 'Antes de carbohidratos',
        completed: false,
        icon: '🍏',
        category: 'salud_clinica',
        note: '1 cda en 1 vaso de agua 10 min antes de comer (inhibe alfa-amilasa)'
      },
      {
        id: 'meditation_healing',
        name: 'Meditación Guiada 432Hz & Alivio',
        target: '15 min tarde/noche',
        completed: false,
        icon: '🎧',
        category: 'mente',
        note: 'Disminuye el cortisol (el cortisol alto empeora la resistencia a la insulina)'
      },
      {
        id: 'post_meal_walk',
        name: 'Caminata Suave en Casa o Jardín',
        target: '10 min post-comida',
        completed: false,
        icon: '🚶‍♀️',
        category: 'movimiento',
        note: 'Las contracciones del sóleo absorben glucosa directamente de la sangre'
      }
    ],
    workouts: {
      dance: {
        title: 'Terapia de Baile Suave & GLUT-4 Reset',
        focus: 'Sensibilidad a la insulina, estado de ánimo y cero impacto timpánico',
        durationMinutes: 20,
        exercises: [
          { name: 'Paso Básico de Salsa / Cumbia (Sin giros bruscos)', duration: '5 minutos', icon: '🎶', note: 'Movimiento fluido de cadera manteniendo la cabeza erguida.' },
          { name: 'Paso Lateral con Brazos en Ritmo Suave', duration: '5 minutos', icon: '💃', note: 'Activación muscular de piernas para retirar glucosa de sangre.' },
          { name: 'Merengue Marchando en el Lugar', duration: '5 minutos', icon: '✨', note: 'Ritmo constante sin saltos; respiración nasal profunda y relajada.' },
          { name: 'Enfriamiento con Respiración Diafragmática Suave', duration: '5 minutos', icon: '🌸', note: 'Inhalar paz, cabeza nivelada, postura abierta y relajada.' }
        ]
      },
      gentle_yoga: {
        title: 'Movilidad de Pie (Cero Presión en Cabeza)',
        focus: 'Circulación linfática y relajación sin agacharse',
        durationMinutes: 15,
        exercises: [
          { name: 'Estiramiento Lateral de Tronco de Pie', duration: '3 min', icon: '🧘‍♀️', note: 'Mantener la cabeza recta; no colgarla hacia abajo.' },
          { name: 'Círculos de Hombros y Apertura de Pecho', duration: '3 min', icon: '🕊️', note: 'Libera tensión cervical acumulada por el reposo.' },
          { name: 'Elevación de Talones Suave (Activación del Sóleo)', sets: 3, reps: '15 reps', icon: '🦵', note: 'El músculo sóleo es el motor metabólico más potente para captar glucosa.' }
        ]
      }
    }
  }
};

export const DEFAULT_USER_PROFILE = FAMILY_PROFILES.andres;
export const DEFAULT_HABITS = FAMILY_PROFILES.andres.habits;

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
    name: 'Pancakes Proteicos de Avena y Plátano',
    title: 'Pancakes Proteicos de Avena y Plátano',
    icon: '🥞',
    requiredIngredients: ['huevos', 'avena', 'platano'],
    prepMinutes: 10,
    calories: 520,
    protein: 28,
    proteinG: 28,
    carbs: 68,
    carbsG: 68,
    fat: 14,
    fatG: 14,
    suggestedSlot: 'desayuno',
    description: '3 huevos enteros, 60g de avena en hojuelas y 1 plátano maduro.',
    instructions: [
      'Licúa los 3 huevos con 60g de avena, el plátano y una pizca de canela.',
      'Calienta una sartén antiadherente a fuego medio con unas gotas de aceite de oliva.',
      'Vierte la mezcla y cocina 3 minutos por lado hasta dorar.'
    ],
    tags: ['desayuno', 'lean_bulk', 'recomposition']
  },
  {
    id: 'meal-2',
    name: 'Bowl Atún Power con Arroz y Espinacas',
    title: 'Bowl Atún Power con Arroz y Espinacas',
    icon: '🥣',
    requiredIngredients: ['atun', 'arroz', 'espinaca'],
    prepMinutes: 8,
    calories: 560,
    protein: 42,
    proteinG: 42,
    carbs: 62,
    carbsG: 62,
    fat: 15,
    fatG: 15,
    suggestedSlot: 'comida',
    description: '1 lata de atún escurrido, 180g de arroz cocido y espinacas salteadas.',
    instructions: [
      'Saltea las espinacas en sartén durante 2 minutos con sal y limón.',
      'Sirve el arroz caliente en un bowl como base.',
      'Añade el atún escurrido encima junto a las espinacas y rocía 1 cda de aceite de oliva.'
    ],
    tags: ['comida', 'alta_proteina', 'recomposition']
  },
  {
    id: 'meal-3',
    name: 'Tortilla Española Fitness de Pollo y Papa',
    title: 'Tortilla Española Fitness de Pollo y Papa',
    icon: '🍳',
    requiredIngredients: ['pollo', 'papa', 'huevos'],
    prepMinutes: 15,
    calories: 580,
    protein: 48,
    proteinG: 48,
    carbs: 52,
    carbsG: 52,
    fat: 16,
    fatG: 16,
    suggestedSlot: 'cena',
    description: '150g de pechuga de pollo picada, 1 papa cocida en rodajas doradas y 3 huevos.',
    instructions: [
      'Dora los cubitos de pollo y las rodajas de papa cocida en sartén con gotas de aceite.',
      'Bate los 3 huevos con sal marina y orégano.',
      'Vierte los huevos sobre el pollo y la papa, tapa y cocina 4 minutos a fuego lento. Voltea y dora 2 min.'
    ],
    tags: ['cena', 'volumen_limpio', 'recomposition']
  },
  {
    id: 'meal-4',
    name: 'Batido Anabólico de Avena, Leche y Plátano',
    title: 'Batido Anabólico de Avena, Leche y Plátano',
    icon: '🥛',
    requiredIngredients: ['leche', 'avena', 'platano'],
    prepMinutes: 3,
    calories: 490,
    protein: 22,
    proteinG: 22,
    carbs: 75,
    carbsG: 75,
    fat: 10,
    fatG: 10,
    suggestedSlot: 'snack',
    description: '300ml de leche fresca, 50g de avena en hojuelas y 1 plátano.',
    instructions: [
      'Agrega la leche, la avena en hojuelas y el plátano a la licuadora.',
      'Añade cubos de hielo y licúa durante 45 segundos hasta obtener textura cremosa.'
    ],
    tags: ['snack', 'pre_workout', 'lean_bulk']
  },
  {
    id: 'meal-5',
    name: 'Omelette Campestre de Espinaca, Queso y Huevos',
    title: 'Omelette Campestre de Espinaca, Queso y Huevos',
    icon: '🍳',
    requiredIngredients: ['huevos', 'queso', 'espinaca'],
    prepMinutes: 7,
    calories: 410,
    protein: 34,
    proteinG: 34,
    carbs: 6,
    carbsG: 6,
    fat: 26,
    fatG: 26,
    suggestedSlot: 'desayuno',
    description: '3 huevos enteros, 40g de queso fresco y espinacas tiernas.',
    instructions: [
      'Bate los huevos con una pizca de sal marina.',
      'Vierte en la sartén caliente, añade las espinacas frescas y los dados de queso.',
      'Dobla por la mitad cuando la base esté cuajada y deja fundir el queso 1 minuto.'
    ],
    tags: ['desayuno', 'keto_friendly', 'insulin_sensitivity', 'recomposition']
  },
  {
    id: 'meal-6',
    name: 'Pechuga a la Plancha con Arroz y Brócoli al Vapor',
    title: 'Pechuga a la Plancha con Arroz y Brócoli al Vapor',
    icon: '🍗',
    requiredIngredients: ['pollo', 'arroz', 'brocoli'],
    prepMinutes: 12,
    calories: 530,
    protein: 52,
    proteinG: 52,
    carbs: 58,
    carbsG: 58,
    fat: 9,
    fatG: 9,
    suggestedSlot: 'comida',
    description: '180g de pechuga magra a la plancha, 1 taza de arroz y floretes de brócoli.',
    instructions: [
      'Sazona la pechuga con sal, ajo y pimienta; dórala 4 min por lado a fuego medio-alto.',
      'Hierve o cuece al vapor el brócoli por 4 minutos para mantener sus nutrientes crujientes.',
      'Sirve con el arroz blanco o integral caliente.'
    ],
    tags: ['comida', 'recomposition', 'alta_proteina']
  },
  {
    id: 'meal-7',
    name: 'Ensalada Glucosa Estable de Atún, Palta y Espinaca',
    title: 'Ensalada Glucosa Estable de Atún, Palta y Espinaca',
    icon: '🥗',
    requiredIngredients: ['atun', 'espinaca', 'palta'],
    prepMinutes: 5,
    calories: 390,
    protein: 38,
    proteinG: 38,
    carbs: 7,
    carbsG: 7,
    fat: 22,
    fatG: 22,
    suggestedSlot: 'cena',
    description: '1 lata de atún, espinacas baby, 1/2 palta hass y chorrito de vinagre de manzana.',
    instructions: [
      'Coloca una base abundante de espinacas en un plato hondo.',
      'Agrega el atún desmenuzado y media palta en láminas.',
      'Aliña con 1 cucharada de vinagre de manzana y limón para aplanar la curva glucémica.'
    ],
    tags: ['cena', 'insulin_sensitivity', 'recomposition']
  }
];

export function generateMealsFromPantry(availableIngredients = [], goal = 'recomposition') {
  if (!availableIngredients || availableIngredients.length === 0) {
    return PANTRY_DATABASE.slice(0, 3).map((m) => ({
      ...m,
      title: m.title || m.name,
      protein: m.proteinG || m.protein,
      carbs: m.carbsG || m.carbs,
      fat: m.fatG || m.fat,
      matchCount: 0,
      matchRate: 0
    }));
  }

  const normalized = availableIngredients.map((i) => i.toLowerCase().trim());

  // Score meals based on matching ingredients
  const scored = PANTRY_DATABASE.map((meal) => {
    let matches = 0;
    (meal.requiredIngredients || []).forEach((req) => {
      if (normalized.some((ing) => ing.includes(req) || req.includes(ing))) {
        matches++;
      }
    });

    const isGoalFit = meal.tags ? meal.tags.some((t) => t.includes(goal) || goal.includes(t)) : true;

    return {
      ...meal,
      title: meal.title || meal.name,
      protein: meal.proteinG || meal.protein,
      carbs: meal.carbsG || meal.carbs,
      fat: meal.fatG || meal.fat,
      matchCount: matches,
      matchRate: matches / (meal.requiredIngredients?.length || 1),
      isGoalFit
    };
  });

  // Sort by highest match rate first, then goal fit
  scored.sort((a, b) => (b.matchRate - a.matchRate) || (b.matchCount - a.matchCount));
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
