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

// Dynamic Nutritional Score Calculator
export function calculateNutritionalScore({
  loggedFoods = [],
  targets = {},
  waterMl = 0,
  waterTargetMl = 2500,
  profile = {}
}) {
  const totalCalories = loggedFoods.reduce((acc, curr) => acc + (Number(curr.calories) || 0), 0);
  const totalProtein = loggedFoods.reduce((acc, curr) => acc + (Number(curr.protein) || 0), 0);
  const totalCarbs = loggedFoods.reduce((acc, curr) => acc + (Number(curr.carbs) || 0), 0);
  const totalFat = loggedFoods.reduce((acc, curr) => acc + (Number(curr.fat) || 0), 0);

  const targetCals = targets.calories || 2000;
  const targetProt = targets.protein || 140;

  // Day starting state when no foods are logged yet
  if (loggedFoods.length === 0) {
    const defaultScore = 72;
    return {
      score: defaultScore,
      grade: 'Iniciando Día',
      color: '#3B82F6',
      dashOffset: Math.round(251 * (1 - defaultScore / 100)),
      breakdown: {
        calories: { current: 0, target: targetCals, pct: 0 },
        protein: { current: 0, target: targetProt, pct: 0 },
        water: { current: waterMl, target: waterTargetMl, pct: Math.round((waterMl / waterTargetMl) * 100) }
      },
      insights: [
        {
          icon: '🥣',
          title: 'Plan de Nutrición de Hoy',
          status: 'Listo',
          color: 'green',
          text: `Todo listo para registrar tus comidas de hoy para ${profile.name || 'tu perfil'}.`,
          tip: 'Comienza registrando tu desayuno o comida para ver tu avance en tiempo real.'
        },
        {
          icon: '💧',
          title: 'Hidratación',
          status: 'En progreso',
          color: 'blue',
          text: `${waterMl} / ${waterTargetMl} ml de agua consumidos.`,
          tip: 'Mantén un vaso o botella a mano para hidratar tus células de manera constante.'
        }
      ]
    };
  }

  // 1. Caloric Adherence (30 pts max)
  const calRatio = targetCals > 0 ? totalCalories / targetCals : 0;
  let calPoints = 0;
  if (calRatio >= 0.85 && calRatio <= 1.08) {
    calPoints = 30;
  } else if (calRatio >= 0.70 && calRatio <= 1.18) {
    calPoints = 24;
  } else if (calRatio >= 0.50 && calRatio <= 1.30) {
    calPoints = 17;
  } else {
    calPoints = Math.max(6, Math.min(14, Math.round(calRatio * 25)));
  }

  // 2. Protein Adherence (35 pts max)
  const protRatio = targetProt > 0 ? totalProtein / targetProt : 0;
  let protPoints = 0;
  if (protRatio >= 0.90) {
    protPoints = 35;
  } else if (protRatio >= 0.75) {
    protPoints = 28;
  } else if (protRatio >= 0.55) {
    protPoints = 20;
  } else if (protRatio >= 0.35) {
    protPoints = 14;
  } else {
    protPoints = Math.max(5, Math.min(10, Math.round(protRatio * 35)));
  }

  // 3. Hydration (15 pts max)
  const waterRatio = waterTargetMl > 0 ? waterMl / waterTargetMl : 0;
  let waterPoints = 0;
  if (waterRatio >= 0.85) {
    waterPoints = 15;
  } else if (waterRatio >= 0.60) {
    waterPoints = 11;
  } else if (waterRatio >= 0.35) {
    waterPoints = 7;
  } else {
    waterPoints = Math.max(2, Math.round(waterRatio * 15));
  }

  // 4. Meal Distribution & Food Quality (20 pts max)
  const distinctSlots = new Set(loggedFoods.map((f) => f.mealSlot || 'comida')).size;
  const slotPoints = distinctSlots >= 3 ? 10 : distinctSlots === 2 ? 7 : 4;
  const ultraProcessedCount = loggedFoods.filter((f) => f.isUltraProcessed).length;
  const naturalRatio = loggedFoods.length > 0 ? (loggedFoods.length - ultraProcessedCount) / loggedFoods.length : 1;
  const qualityPoints = Math.round(naturalRatio * 10);

  const totalScore = Math.min(100, Math.max(25, calPoints + protPoints + waterPoints + slotPoints + qualityPoints));

  let grade = 'En Progreso';
  let gradeColor = '#00C06D';
  if (totalScore >= 90) {
    grade = 'Excelente';
    gradeColor = '#00C06D';
  } else if (totalScore >= 75) {
    grade = 'Bueno';
    gradeColor = '#10B981';
  } else if (totalScore >= 60) {
    grade = 'En Progreso';
    gradeColor = '#3B82F6';
  } else {
    grade = 'Avanzando';
    gradeColor = '#64748B';
  }

  const dashOffset = Math.round(251 * (1 - totalScore / 100));

  const insights = [];

  // Protein Insight
  if (protRatio >= 0.85) {
    insights.push({
      icon: '🥩',
      title: 'Proteína Diaria',
      status: 'Óptima',
      color: 'green',
      text: `${Math.round(totalProtein)}g / ${targetProt}g · Excelente aporte para síntesis muscular.`,
      tip: 'Tus músculos disponen de los aminoácidos para recuperarse y adaptarse.'
    });
  } else {
    const pFalta = Math.max(0, Math.round(targetProt - totalProtein));
    insights.push({
      icon: '🥩',
      title: 'Proteína Diaria',
      status: 'Por completar',
      color: 'blue',
      text: `${Math.round(totalProtein)}g / ${targetProt}g · Te faltan ~${pFalta}g para tu requerimiento.`,
      tip: 'Puedes sumar huevos, pollo, atún o queso fresco en tu siguiente comida.'
    });
  }

  // Calorie Insight
  if (calRatio >= 0.85 && calRatio <= 1.10) {
    insights.push({
      icon: '⚡',
      title: 'Balance Calórico',
      status: 'En Rango',
      color: 'green',
      text: `${totalCalories} / ${targetCals} kcal · Balance óptimo para tus metas.`,
      tip: 'Mantienes tu energía estable sin picos ni déficits excesivos.'
    });
  } else if (calRatio < 0.85) {
    const cFalta = Math.max(0, targetCals - totalCalories);
    insights.push({
      icon: '⚡',
      title: 'Calorías del Día',
      status: 'En progreso',
      color: 'blue',
      text: `${totalCalories} / ${targetCals} kcal · Te faltan ~${cFalta} kcal.`,
      tip: 'Completa tus comidas para mantener tu rendimiento muscular y vitalidad.'
    });
  } else {
    insights.push({
      icon: '⚡',
      title: 'Calorías del Día',
      status: 'Superávit',
      color: 'blue',
      text: `${totalCalories} / ${targetCals} kcal registradas hoy.`,
      tip: 'Un paseo agradable post-comida apoya la digestión y transporte de glucosa.'
    });
  }

  return {
    score: totalScore,
    grade,
    color: gradeColor,
    dashOffset,
    breakdown: {
      calories: { current: totalCalories, target: targetCals, pct: Math.round(calRatio * 100) },
      protein: { current: Math.round(totalProtein), target: targetProt, pct: Math.round(protRatio * 100) },
      water: { current: waterMl, target: waterTargetMl, pct: Math.round(waterRatio * 100) }
    },
    insights
  };
}

/**
 * Intelligent Daily Lifestyle & Recovery Score Engine ("AuraScore del Día")
 * Combines 4 core health pillars:
 * 1. Nutrición (0-25 pts) - From dynamic nutritionalScore
 * 2. Ejercicio & Actividad Física (0-25 pts) - Workouts completed / duration
 * 3. Sueño & Recuperación (0-25 pts) - Hours and quality of rest
 * 4. Hábitos & Disciplina Diaria (0-25 pts) - Ratio of completed daily habits
 */
export function calculateDailyAuraScore({
  nutritionScore = 70,
  workoutDone = false,
  workoutMinutes = 0,
  sleepHours = 7.5,
  sleepQuality = 'deep',
  completedHabits = 0,
  totalHabits = 5,
  profile = null
}) {
  // Pillar 1: Nutrición (25 pts max)
  const nutritionPoints = Math.min(25, Math.max(0, Math.round((nutritionScore / 100) * 25)));

  // Pillar 2: Ejercicio & Actividad Física (25 pts max)
  let workoutPoints = 0;
  if (workoutDone || workoutMinutes >= 30) {
    workoutPoints = 25;
  } else if (workoutMinutes > 0) {
    workoutPoints = Math.min(25, Math.round((workoutMinutes / 30) * 25));
  } else {
    workoutPoints = 8; // Baseline for active recovery
  }

  // Pillar 3: Sueño & Recuperación (25 pts max)
  let sleepPoints = 0;
  if (sleepHours >= 7 && sleepHours <= 9) {
    sleepPoints = 22;
  } else if (sleepHours >= 6 && sleepHours < 7) {
    sleepPoints = 17;
  } else if (sleepHours > 9) {
    sleepPoints = 18;
  } else {
    sleepPoints = Math.max(5, Math.round(sleepHours * 2.5));
  }

  if (sleepQuality === 'deep') sleepPoints = Math.min(25, sleepPoints + 3);
  else if (sleepQuality === 'light') sleepPoints = Math.max(5, sleepPoints - 3);

  // Pillar 4: Hábitos & Biohacking (25 pts max)
  const habitRatio = totalHabits > 0 ? completedHabits / totalHabits : 0;
  const habitPoints = Math.min(25, Math.max(0, Math.round(habitRatio * 25)));

  const totalScore = Math.min(100, Math.max(15, nutritionPoints + workoutPoints + sleepPoints + habitPoints));

  let grade = 'En Progreso';
  let gradeColor = '#3B82F6';
  let statusEmoji = '🌱';
  if (totalScore >= 90) {
    grade = 'Día Extraordinario';
    gradeColor = '#00C06D';
    statusEmoji = '🌟';
  } else if (totalScore >= 75) {
    grade = 'Excelente Rendimiento';
    gradeColor = '#10B981';
    statusEmoji = '🚀';
  } else if (totalScore >= 60) {
    grade = 'Buen Balance';
    gradeColor = '#3B82F6';
    statusEmoji = '⚡';
  } else {
    grade = 'Construyendo Hábitos';
    gradeColor = '#8B5CF6';
    statusEmoji = '🌱';
  }

  // Personalized Didactic Executive Feedback
  let didacticSummary = '';
  const name = profile?.name ? profile.name.split(' ')[0] : 'Atleta';
  const profileId = profile?.id || 'andres';

  if (profileId === 'andres') {
    if (totalScore >= 80) {
      didacticSummary = `¡Gran sinergia, ${name}! La combinación de nutrición anabólica, estímulo de fuerza y oxigenación celular Wim Hof está acelerando tu recomposición corporal en altura.`;
    } else {
      didacticSummary = `Buen avance, ${name}. Asegura tus 5g de creatina y descanso nocturno para optimizar la síntesis proteica de tu superávit limpio.`;
    }
  } else if (profileId === 'pareja') {
    if (totalScore >= 80) {
      didacticSummary = `Día impecable para tus metas, ${name}. Lograste el estímulo muscular sin comprometer tu columna, facilitando la descompresión intervertebral durante el sueño.`;
    } else {
      didacticSummary = `Vamos a tu ritmo, ${name}. Prioriza el estiramiento de psoas y una cena rica en aminoácidos para recuperar masa muscular sin dolor lumbar.`;
    }
  } else {
    if (totalScore >= 75) {
      didacticSummary = `¡Hermoso día de autocuidado, ${name}! Tu hidratación y movimiento amable le dan a tu cuerpo energía limpia y bienestar sin fatiga ni estrés.`;
    } else {
      didacticSummary = `Día amable y constante, ${name}. Cada vaso de agua y paseo suave cuenta para tu salud metabólica y vitalidad diaria.`;
    }
  }

  return {
    score: totalScore,
    grade,
    gradeColor,
    statusEmoji,
    pillars: {
      nutrition: { points: nutritionPoints, max: 25, pct: Math.round((nutritionPoints / 25) * 100) },
      workout: { points: workoutPoints, max: 25, pct: Math.round((workoutPoints / 25) * 100) },
      sleep: { points: sleepPoints, max: 25, pct: Math.round((sleepPoints / 25) * 100) },
      habits: { points: habitPoints, max: 25, pct: Math.round((habitPoints / 25) * 100) }
    },
    didacticSummary
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
    role: 'Hipertrofia Limpia & Protección Lumbar',
    avatar: '🌸',
    pin: '5678',
    gender: 'female',
    age: 21,
    heightCm: 162,
    weightKg: 58.0,
    targetWeightKg: 60.0,
    goal: 'lean_bulk',
    activityLevel: 'moderate',
    targetCalories: 1850,
    macros: {
      proteinGrams: 120,
      fatGrams: 50,
      carbsGrams: 230
    },
    travelMode: true,
    location: 'Cajabamba / Trujillo',
    altitudeMeters: 2654,
    waterDailyMl: 2400,
    badgeText: '🌸 Hipertrofia & Salud Lumbar · Cero Compresión Axial',
    habits: [
      {
        id: 'creatine',
        name: 'Creatina Monohidrato',
        target: '3g a 5g diarios',
        completed: false,
        icon: '⚡',
        category: 'suplementacion',
        note: 'Síntesis proteica y recuperación de masa muscular magra'
      },
      {
        id: 'lumbar_relief',
        name: 'Descompresión Lumbar & Estiramiento Psoas',
        target: '10 min diarios',
        completed: false,
        icon: '🧘‍♀️',
        category: 'recuperacion',
        note: 'Liberar tensión en la zona lumbar y estirar flexores de cadera'
      },
      {
        id: 'water_electrolytes',
        name: 'Hidratación Intervertebral en Cajabamba',
        target: '2,400 ml',
        completed: false,
        icon: '💧',
        category: 'biohacking',
        note: 'Mantener hidratados los discos intervertebrales y balance en altura'
      },
      {
        id: 'sleep_growth',
        name: 'Sueño Reparador 8 Horas',
        target: '8h de descanso',
        completed: false,
        icon: '🌙',
        category: 'recuperacion',
        note: 'Fase de síntesis proteica donde el músculo se repara y crece'
      }
    ],
    workouts: {
      gym: {
        title: 'Hipertrofia Glúteos & Espalda (Protección Lumbar / McGill Core)',
        focus: 'Sobrecarga progresiva en máquinas y poleas sin compresión en columna',
        durationMinutes: 45,
        exercises: [
          { name: 'Hip Thrust en Banco Acolchado (Retroversión Pélvica)', sets: 4, reps: '10-12', restSeconds: 90, rir: 1 },
          { name: 'Prensa Inclinada de Piernas (Espalda 100% pegada al respaldo)', sets: 4, reps: '10-12', restSeconds: 90, rir: 1 },
          { name: 'Remo con Pecho Apoyado en Banco Inclinado (Chest-Supported Row)', sets: 4, reps: '10-12', restSeconds: 75, rir: 1 },
          { name: 'Curl Femoral Acostada o Sentada en Máquina', sets: 3, reps: '12-15', restSeconds: 60, rir: 1 },
          { name: 'Extensiones de Cuádriceps Controladas', sets: 3, reps: '12-15', restSeconds: 60, rir: 1 },
          { name: 'Blindaje Lumbar: Bird-Dog + Plancha Lateral', sets: 3, reps: '30s por lado', restSeconds: 45, rir: 0 }
        ]
      },
      travel: {
        title: 'Movilidad Lumbar & Glúteos Cajabamba',
        focus: 'Descompresión espinal, glúteo medio y alivio lumbar',
        durationMinutes: 25,
        exercises: [
          { name: 'Puente de Glúteos en Suelo con Pausa Isométrica', sets: 4, reps: '15 reps', restSeconds: 45 },
          { name: 'Bird-Dog (Perro de Caza) con Respiración Diafragmática', sets: 3, reps: '10 por lado', restSeconds: 45 },
          { name: 'Clamshells (Almeja) con Banda para Glúteo Medio', sets: 3, reps: '15 por lado', restSeconds: 45 },
          { name: 'Estiramiento Profundo de Psoas / Cadera en Colchoneta', sets: 3, reps: '30s por lado', restSeconds: 30 },
          { name: 'Descompresión en Postura del Niño (Child Pose)', sets: 1, reps: '5 minutos', restSeconds: 0 }
        ]
      }
    }
  },

  hermana: {
    id: 'hermana',
    name: 'Mi Hermana',
    role: 'Bienestar, Movilidad & Vitalidad',
    avatar: '🌿',
    pin: '9012',
    gender: 'female',
    age: 19,
    heightCm: 155,
    weightKg: 65.0,
    targetWeightKg: 60.0,
    goal: 'insulin_sensitivity',
    activityLevel: 'light',
    targetCalories: 1650,
    macros: {
      proteinGrams: 105,
      fatGrams: 50,
      carbsGrams: 195
    },
    travelMode: false,
    location: 'Casa (Bienestar)',
    waterDailyMl: 2100,
    badgeText: '🌿 Bienestar & Movilidad Amable a tu Ritmo',
    habits: [
      {
        id: 'post_meal_walk',
        name: 'Paseo Suave o Movimiento a tu Ritmo',
        target: '10-15 min',
        completed: false,
        icon: '🚶‍♀️',
        category: 'bienestar',
        note: 'Un paseo tranquilo para activar el cuerpo con calma y alegría.'
      },
      {
        id: 'water_fresh',
        name: 'Hidratación Refrescante',
        target: '2,100 ml',
        completed: false,
        icon: '💧',
        category: 'vitalidad',
        note: 'Agua fresca o infusión relajante para sentirte ligera y con energía.'
      },
      {
        id: 'glucose_order',
        name: 'Regla del Plato Amable',
        target: 'Almuerzo y cena',
        completed: false,
        icon: '🥗',
        category: 'nutricion',
        note: 'Empezar por ensalada o verduritas ricas para una digestión suave y liviana.'
      },
      {
        id: 'relaxation_rest',
        name: 'Momento de Calma & Música Relajante',
        target: '15 min tarde',
        completed: false,
        icon: '🎧',
        category: 'descanso',
        note: 'Desconectar la mente, respirar suave y recargar vitalidad.'
      }
    ],
    workouts: {
      dance: {
        title: 'Paseo & Movilidad Suave en Casa',
        focus: 'Mover el cuerpo con música agradable, sin exigencias',
        durationMinutes: 15,
        exercises: [
          { name: 'Paseo Agradable y Relajado a tu Ritmo', duration: '8 minutos', icon: '🚶‍♀️', note: 'Paso cómodo y suave en casa o jardín.' },
          { name: 'Movilidad Suave de Hombros y Brazos', duration: '4 minutos', icon: '🌸', note: 'Círculos lentos y agradables para soltar tensión.' },
          { name: 'Respiración Profunda y Calma', duration: '3 minutos', icon: '🕊️', note: 'Inhalar tranquilidad y exhalar liviana.' }
        ]
      },
      gentle_yoga: {
        title: 'Descanso, Estiramientos & Calma',
        focus: 'Soltar tensiones en sillón o cama con total comodidad',
        durationMinutes: 15,
        exercises: [
          { name: 'Estiramiento Suave de Espalda en Sillón', duration: '5 min', icon: '🧘‍♀️', note: 'Postura cómoda y respiración relajada.' },
          { name: 'Movilidad de Tobillos y Piernas', duration: '5 min', icon: '✨', note: 'Movimientos circulares suaves sin esfuerzo.' },
          { name: 'Relajación y Música de Paz', duration: '5 min', icon: '🎶', note: 'Descanso reparador y bienestar.' }
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

// 5. Pantry Ingredients & Meal Generator (Fitia Didactic Chef)
export const PANTRY_DATABASE = [
  // 1. Desayunos de Rendimiento
  {
    id: 'meal-1',
    name: 'Pancakes Proteicos de Avena y Plátano',
    title: 'Pancakes Proteicos de Avena y Plátano',
    icon: '🥞',
    requiredIngredients: ['huevos', 'avena', 'platano'],
    prepMinutes: 10,
    difficulty: 'Fácil',
    calories: 520,
    protein: 28,
    proteinG: 28,
    carbs: 68,
    carbsG: 68,
    fat: 14,
    fatG: 14,
    suggestedSlot: 'desayuno',
    portionDidactic: '3 huevos enteros + 60g avena en hojuelas + 1 plátano seda maduro',
    didacticWhy: '🔥 Leucina de alto valor biológico + carbohidratos de absorción media para recargar glucógeno sin pico glucémico excesivo.',
    description: '3 huevos enteros, 60g de avena en hojuelas y 1 plátano maduro.',
    chefTip: 'Cocina a fuego medio-bajo con sartén tapada para que el vapor esponje el centro sin quemar la base.',
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
    difficulty: 'Fácil',
    calories: 560,
    protein: 42,
    proteinG: 42,
    carbs: 62,
    carbsG: 62,
    fat: 15,
    fatG: 15,
    suggestedSlot: 'comida',
    portionDidactic: '1 lata de atún en agua (170g) + 180g arroz cocido + 2 tazas de espinaca salteada',
    didacticWhy: '⚡ Densidad proteica magra y ácidos grasos Omega-3 para desinflamación celular y digestión ligera en altura Cajabamba.',
    description: '1 lata de atún escurrido, 180g de arroz cocido y espinacas salteadas.',
    chefTip: 'Agrega zumo de limón fresco y pimienta negra sobre el atún caliente para potenciar la absorción de hierro.',
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
    difficulty: 'Medio',
    calories: 580,
    protein: 48,
    proteinG: 48,
    carbs: 52,
    carbsG: 52,
    fat: 16,
    fatG: 16,
    suggestedSlot: 'cena',
    portionDidactic: '150g pechuga de pollo picada + 1 papa amarilla cocida en rodajas + 3 huevos batidos',
    didacticWhy: '🥔 Papa amarilla peruana de fácil digestión con colina y albúmina de huevo para reparación muscular nocturna.',
    description: '150g de pechuga de pollo picada, 1 papa cocida en rodajas doradas y 3 huevos.',
    chefTip: 'Usa una tapa plana o plato húmedo para voltear la tortilla de un solo movimiento firme sin derramar.',
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
    difficulty: 'Fácil',
    calories: 490,
    protein: 22,
    proteinG: 22,
    carbs: 75,
    carbsG: 75,
    fat: 10,
    fatG: 10,
    suggestedSlot: 'snack',
    portionDidactic: '350ml leche fresca + 50g avena en hojuelas + 1 plátano seda + canela',
    didacticWhy: '⚡ Ventana anabólica inmediata: Carbohidratos rápidos para elevar insulina controlada y transportar aminoácidos.',
    description: '300ml de leche fresca, 50g de avena en hojuelas y 1 plátano.',
    chefTip: 'Agrega un cubo de hielo y licúa 60 segundos completos para triturar la avena en una malteada sedosa.',
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
    difficulty: 'Fácil',
    calories: 410,
    protein: 34,
    proteinG: 34,
    carbs: 6,
    carbsG: 6,
    fat: 26,
    fatG: 26,
    suggestedSlot: 'desayuno',
    portionDidactic: '3 huevos enteros camperos + 50g queso fresco serrano + 1 taza de espinacas tiernas',
    didacticWhy: '🥑 Bajo índice glucémico y alto contenido de magnesio y calcio para activar el sistema parasimpático sin letargo.',
    description: '3 huevos enteros, 40g de queso fresco y espinacas tiernas.',
    chefTip: 'Coloca el queso sobre la mitad del omelette cuando esté al 80% de cocción para que gratine con el calor residual.',
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
    difficulty: 'Fácil',
    calories: 530,
    protein: 52,
    proteinG: 52,
    carbs: 58,
    carbsG: 58,
    fat: 9,
    fatG: 9,
    suggestedSlot: 'comida',
    portionDidactic: '200g pechuga de pollo magra + 1 taza de arroz blanco cocido + 1 taza colmada de brócoli al vapor',
    didacticWhy: '🥦 Sulforafano del brócoli para desintoxicación hepática y pechuga pura para síntesis proteica de máxima biodisponibilidad.',
    description: '180g de pechuga magra a la plancha, 1 taza de arroz y floretes de brócoli.',
    chefTip: 'Cocina el brócoli exactamente 4 minutos al vapor: debe quedar verde esmeralda y crocante, nunca pastoso.',
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
    difficulty: 'Fácil',
    calories: 390,
    protein: 38,
    proteinG: 38,
    carbs: 7,
    carbsG: 7,
    fat: 22,
    fatG: 22,
    suggestedSlot: 'cena',
    portionDidactic: '1 lata de atún en agua (170g) + 1/2 palta hass madura + 2 tazas de espinaca baby + limón y vinagre de manzana',
    didacticWhy: '🌿 Ácido acético del vinagre + grasa monoinsaturada de la palta: aplanan picos glucémicos y garantizan descanso profundo.',
    description: '1 lata de atún, espinacas baby, 1/2 palta hass y chorrito de vinagre de manzana.',
    chefTip: 'El vinagre de manzana con la palta crea una emulsión cremosa natural sin necesidad de mayonesas industriales.',
    instructions: [
      'Coloca una base abundante de espinacas en un plato hondo.',
      'Agrega el atún desmenuzado y media palta en láminas.',
      'Aliña con 1 cucharada de vinagre de manzana y limón para aplanar la curva glucémica.'
    ],
    tags: ['cena', 'insulin_sensitivity', 'recomposition']
  },
  {
    id: 'meal-8',
    name: 'Pollo Saltado Fit con Papa Dorada y Cebolla',
    title: 'Pollo Saltado Fit con Papa Dorada y Cebolla',
    icon: '🥘',
    requiredIngredients: ['pollo', 'papa', 'tomate'],
    prepMinutes: 14,
    difficulty: 'Medio',
    calories: 540,
    protein: 46,
    proteinG: 46,
    carbs: 55,
    carbsG: 55,
    fat: 12,
    fatG: 12,
    suggestedSlot: 'comida',
    portionDidactic: '180g tiras de pechuga + 1 papa cocida en bastones dorados en sartén + 1 tomate y 1/2 cebolla en juliana',
    didacticWhy: '🇵🇪 Sabor criollo tradicional peruano adaptado con salteado al wok a alta temperatura con mínimo aceite.',
    description: 'Tiras de pollo selladas con tomate, cebolla roja en juliana, sillao bajo en sodio y papas doradas.',
    chefTip: 'Mantén la sartén humeante antes de agregar el pollo para sellar los jugos y lograr el ahumado característico.',
    instructions: [
      'Sella el pollo a fuego vivo durante 3 minutos en sartén muy caliente.',
      'Agrega la cebolla y tomate en gajos gruesos con chorrito de vinagre y sillao.',
      'Incorpora las papas cocidas doradas, saltea 1 minuto y sirve caliente.'
    ],
    tags: ['comida', 'recomposition', 'lean_bulk']
  },
  {
    id: 'meal-9',
    name: 'Tostadas Francesas Anabólicas con Canela',
    title: 'Tostadas Francesas Anabólicas con Canela',
    icon: '🍞',
    requiredIngredients: ['huevos', 'pan', 'leche'],
    prepMinutes: 8,
    difficulty: 'Fácil',
    calories: 460,
    protein: 30,
    proteinG: 30,
    carbs: 56,
    carbsG: 56,
    fat: 11,
    fatG: 11,
    suggestedSlot: 'desayuno',
    portionDidactic: '2 rebanadas de pan integral de molde + 3 huevos batidos con 50ml de leche y canela generosa',
    didacticWhy: '🌾 Canela ceilán para sensibilizar receptores GLUT-4 y albúmina completa para arrancar el día con saciedad.',
    description: 'Pan integral remojado en mezcla de huevos, leche y canela, dorado en sartén.',
    chefTip: 'Deja que el pan absorba todo el líquido durante 30 segundos por lado antes de llevar a la sartén.',
    instructions: [
      'Bate los 3 huevos con la leche, una cucharadita de canela y gotas de vainilla.',
      'Sumerge las rebanadas de pan integral hasta que absorban la mezcla.',
      'Dora en sartén a fuego medio durante 3 minutos por lado hasta que estén doradas y firmes.'
    ],
    tags: ['desayuno', 'lean_bulk', 'recomposition']
  },
  {
    id: 'meal-10',
    name: 'Revuelto de 3 Huevos con Palta y Pan Integral',
    title: 'Revuelto de 3 Huevos con Palta y Pan Integral',
    icon: '🥑',
    requiredIngredients: ['huevos', 'palta', 'pan'],
    prepMinutes: 6,
    difficulty: 'Fácil',
    calories: 470,
    protein: 26,
    proteinG: 26,
    carbs: 32,
    carbsG: 32,
    fat: 26,
    fatG: 26,
    suggestedSlot: 'desayuno',
    portionDidactic: '3 huevos enteros revueltos en mantequilla + 1/2 palta hass en rodajas + 1 rebanada de pan tostado',
    didacticWhy: '🍳 Grasa monoinsaturada + fosfolípidos de la yema para soporte hormonal de testosterona matutina.',
    description: 'Huevos revueltos cremosos acompañados de media palta y pan integral crujiente.',
    chefTip: 'Cocina los huevos a fuego muy bajo retirando la sartén del calor de a pocos para lograr textura aterciopelada.',
    instructions: [
      'Bate los huevos con sal y vierte en sartén a fuego mínimo con media cucharadita de mantequilla.',
      'Revuelve constantemente con espátula de goma durante 2-3 minutos hasta que queden sedosos.',
      'Sirve sobre el pan tostado con las láminas de palta y sal marina.'
    ],
    tags: ['desayuno', 'recomposition', 'insulin_sensitivity']
  },
  {
    id: 'meal-11',
    name: 'Chaufa Fit de Pollo y Tortilla en Tiras',
    title: 'Chaufa Fit de Pollo y Tortilla en Tiras',
    icon: '🍚',
    requiredIngredients: ['pollo', 'arroz', 'huevos'],
    prepMinutes: 12,
    difficulty: 'Fácil',
    calories: 590,
    protein: 48,
    proteinG: 48,
    carbs: 65,
    carbsG: 65,
    fat: 13,
    fatG: 13,
    suggestedSlot: 'comida',
    portionDidactic: '160g de pechuga picada + 1 huevo batido en tortilla fina + 1 taza colmada de arroz blanco frío',
    didacticWhy: '⚡ Arroz enfriado previamente (almidón resistente): alimenta la microbiota y reduce la respuesta glucémica.',
    description: 'Arroz salteado al wok con dados de pechuga dorada, tortilla en tiras y gotas de sillao.',
    chefTip: 'El secreto del chaufa es usar arroz del día anterior bien frío; granos separados que absorben el sabor sin apelmazarse.',
    instructions: [
      'Haz una tortilla fina con el huevo batido, retira y córtala en tiritas.',
      'En la misma sartén bien caliente dora el pollo picado con ajo y kion.',
      'Añade el arroz frío, saltea a fuego alto 3 minutos con sillao y mezcla con la tortilla.'
    ],
    tags: ['comida', 'lean_bulk', 'recomposition']
  },
  {
    id: 'meal-12',
    name: 'Mugcake Proteico de Avena y Plátano en Taza',
    title: 'Mugcake Proteico de Avena y Plátano en Taza',
    icon: '🧁',
    requiredIngredients: ['avena', 'huevos', 'platano'],
    prepMinutes: 4,
    difficulty: 'Fácil',
    calories: 380,
    protein: 21,
    proteinG: 21,
    carbs: 52,
    carbsG: 52,
    fat: 9,
    fatG: 9,
    suggestedSlot: 'snack',
    portionDidactic: '1 taza: 40g de avena molida + 1 huevo entero + 1/2 plátano machacado + canela',
    didacticWhy: '🍰 Solución anti-ansiedad: calma antojos dulces en 2 minutos con fibra saciante sin azúcar refinada.',
    description: 'Bizcochuelo húmedo saludable hecho en microondas en solo 90 segundos.',
    chefTip: 'Añade una pizca de polvo de hornear o bicarbonato para que crezca esponjoso como un muffin de pastelería.',
    instructions: [
      'Machaca medio plátano en una taza grande con un tenedor.',
      'Añade el huevo, 40g de avena y canela; mezcla enérgicamente hasta integrar.',
      'Lleva al microondas a potencia máxima durante 90 a 110 segundos. Deja enfriar 1 min.'
    ],
    tags: ['snack', 'recomposition', 'lean_bulk']
  },
  {
    id: 'meal-13',
    name: 'Carne Magra Saltada con Camote Dorado',
    title: 'Carne Magra Saltada con Camote Dorado',
    icon: '🥩',
    requiredIngredients: ['carne', 'camote', 'tomate'],
    prepMinutes: 14,
    difficulty: 'Medio',
    calories: 560,
    protein: 44,
    proteinG: 44,
    carbs: 58,
    carbsG: 58,
    fat: 14,
    fatG: 14,
    suggestedSlot: 'comida',
    portionDidactic: '160g de lomo o bistec magro en tiras + 1 camote mediano cocido y dorado + tomate y cebolla',
    didacticWhy: '🍠 Camote con betacarotenos y hierro hemínico de la carne: máxima oxigenación celular en altura Cajabamba.',
    description: 'Tiras de carne magra salteadas al fuego con camote dorado en rodajas y verduras criollas.',
    chefTip: 'Sella la carne en tandas pequeñas para que no suelte agua y quede dorada y suave.',
    instructions: [
      'Corta el camote cocido en rodajas y dóralo 3 minutos en sartén con gotas de aceite.',
      'Saltea la carne en sartén muy caliente 2 minutos por lado con sal marina y comino.',
      'Agrega el tomate y cebolla, desglasa con vinagre y sirve con el camote.'
    ],
    tags: ['comida', 'alta_proteina', 'lean_bulk']
  },
  {
    id: 'meal-14',
    name: 'Crema Ligera de Brócoli con Dados de Queso y Pollo',
    title: 'Crema Ligera de Brócoli con Dados de Queso y Pollo',
    icon: '🥦',
    requiredIngredients: ['brocoli', 'queso', 'pollo'],
    prepMinutes: 12,
    difficulty: 'Fácil',
    calories: 420,
    protein: 46,
    proteinG: 46,
    carbs: 14,
    carbsG: 14,
    fat: 18,
    fatG: 18,
    suggestedSlot: 'cena',
    portionDidactic: '1 bowl: 250g brócoli cocido licuado con caldo + 140g pechuga en dados + 40g queso fresco',
    didacticWhy: '🌙 Cero pesadez gástrica: vegetal alcalinizante y proteína magra que no altera el ritmo cardíaco nocturno.',
    description: 'Sopa crema reconfortante de brócoli con pechuga deshilachada y dados de queso.',
    chefTip: 'Usa el agua de cocción del brócoli para licuar; así retienes todas las vitaminas hidrosolubles y minerales.',
    instructions: [
      'Hierve el brócoli 5 minutos en agua con sal; licúalo con un poco de caldo hasta consistencia de crema.',
      'Regresa a la olla, añade la pechuga cocida en cubos o deshilachada.',
      'Sirve caliente con los dados de queso fresco flotando encima.'
    ],
    tags: ['cena', 'insulin_sensitivity', 'recomposition']
  },
  {
    id: 'meal-15',
    name: 'Porridge Tibio de Avena con Manzana y Claras',
    title: 'Porridge Tibio de Avena con Manzana y Claras',
    icon: '🥣',
    requiredIngredients: ['avena', 'huevos', 'leche'],
    prepMinutes: 7,
    difficulty: 'Fácil',
    calories: 430,
    protein: 26,
    proteinG: 26,
    carbs: 58,
    carbsG: 58,
    fat: 8,
    fatG: 8,
    suggestedSlot: 'desayuno',
    portionDidactic: '50g avena cocida en 200ml de leche + 3 claras de huevo batidas adentro + canela',
    didacticWhy: '🍎 Betaglucanos de avena: fibra soluble que atrapa colesterol y nutre las bacterias protectoras del colon.',
    description: 'Avena cremosa caliente enriquecida con claras de huevo para duplicar su contenido proteico.',
    chefTip: 'Bate las claras e incorpóralas a la avena caliente apagando el fuego; quedará con textura de pudín sin sabor a huevo.',
    instructions: [
      'Cocina la avena con la leche y una rama de canela durante 4 minutos a fuego medio.',
      'Baja el fuego al mínimo, añade las claras batiendo vigorosamente con tenedor durante 1 minuto.',
      'Sirve en bowl y espolvorea canela en polvo.'
    ],
    tags: ['desayuno', 'recomposition', 'lean_bulk']
  },
  {
    id: 'meal-16',
    name: 'Revuelto de Atún con Huevo y Tomate al Orégano',
    title: 'Revuelto de Atún con Huevo y Tomate al Orégano',
    icon: '🍳',
    requiredIngredients: ['atun', 'huevos', 'tomate'],
    prepMinutes: 6,
    difficulty: 'Fácil',
    calories: 420,
    protein: 44,
    proteinG: 44,
    carbs: 8,
    carbsG: 8,
    fat: 22,
    fatG: 22,
    suggestedSlot: 'cena',
    portionDidactic: '1 lata de atún escurrido + 2 huevos enteros camperos + 1 tomate picado en cubitos + orégano',
    didacticWhy: '🐟 Doble fuente proteica sin carbohidratos refinados: saciedad total para evitar asaltar la refrigeradora de noche.',
    description: 'Huevos revueltos con atún jugoso, dados de tomate fresco y orégano aromático.',
    chefTip: 'Saltea el tomate primero 1 minuto para concentrar su dulzor antes de agregar el atún y los huevos.',
    instructions: [
      'Saltea el tomate picado en sartén durante 1 minuto con una gota de aceite.',
      'Agrega el atún desmenuzado y saltea 30 segundos.',
      'Vierte los 2 huevos batidos, revuelve suavemente 2 minutos y retira jugoso.'
    ],
    tags: ['cena', 'alta_proteina', 'insulin_sensitivity']
  }
];

export function generateMealsFromPantry(availableIngredients = [], goal = 'recomposition', filterSlot = 'all') {
  if (!availableIngredients || availableIngredients.length === 0) {
    const defaultList = (filterSlot && filterSlot !== 'all')
      ? PANTRY_DATABASE.filter((m) => m.suggestedSlot === filterSlot)
      : PANTRY_DATABASE;

    return (defaultList.length > 0 ? defaultList : PANTRY_DATABASE).slice(0, 3).map((m) => ({
      ...m,
      title: m.title || m.name,
      protein: m.proteinG || m.protein,
      carbs: m.carbsG || m.carbs,
      fat: m.fatG || m.fat,
      matchCount: 0,
      missingIngredients: m.requiredIngredients || [],
      matchRate: 0
    }));
  }

  const normalized = availableIngredients.map((i) => i.toLowerCase().trim());

  // Score meals based on matching ingredients
  const scored = PANTRY_DATABASE.map((meal) => {
    let matches = 0;
    const missing = [];
    (meal.requiredIngredients || []).forEach((req) => {
      if (normalized.some((ing) => ing.includes(req) || req.includes(ing))) {
        matches++;
      } else {
        missing.push(req);
      }
    });

    const isGoalFit = meal.tags ? meal.tags.some((t) => t.includes(goal) || goal.includes(t)) : true;
    const isSlotFit = !filterSlot || filterSlot === 'all' || meal.suggestedSlot === filterSlot;

    return {
      ...meal,
      title: meal.title || meal.name,
      protein: meal.proteinG || meal.protein,
      carbs: meal.carbsG || meal.carbs,
      fat: meal.fatG || meal.fat,
      matchCount: matches,
      missingIngredients: missing,
      matchRate: matches / (meal.requiredIngredients?.length || 1),
      isGoalFit,
      isSlotFit
    };
  });

  const filtered = (filterSlot && filterSlot !== 'all')
    ? scored.filter((m) => m.isSlotFit)
    : scored;

  // Sort by highest match rate first, then goal fit
  filtered.sort((a, b) => (b.matchRate - a.matchRate) || (b.matchCount - a.matchCount));
  return filtered;
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

/**
 * 8. Shared Kitchen & Couple Meal Synchronization Engine
 * Aligns meals between Andrés (92kg Recomposición) and Pareja (58kg Hipertrofia Limpia)
 * using the SAME ingredients and single-pan batch cooking with scaled portions.
 */
export function calculateCouplePortions(meal) {
  if (!meal) return null;

  const baseCal = Number(meal.calories || 450);
  const baseProt = Number(meal.protein || meal.proteinG || 30);
  const baseCarb = Number(meal.carbs || meal.carbsG || 40);
  const baseFat = Number(meal.fat || meal.fatG || 12);

  // Andrés: 92kg, target 2150 kcal, 195g protein -> Higher protein density & ~1.25x volume
  const andresMult = 1.25;
  const andresCal = Math.round(baseCal * andresMult);
  const andresProt = Math.round(baseProt * 1.3);
  const andresCarb = Math.round(baseCarb * 1.2);
  const andresFat = Math.round(baseFat * 1.15);

  // Pareja: 58kg, target 1850 kcal, 120g protein -> Gentle portion, high nutrient density, ~0.85x volume
  const parejaMult = 0.85;
  const parejaCal = Math.round(baseCal * parejaMult);
  const parejaProt = Math.round(baseProt * 0.85);
  const parejaCarb = Math.round(baseCarb * 0.9);
  const parejaFat = Math.round(baseFat * 0.85);

  return {
    mealId: meal.id,
    mealTitle: meal.title || meal.name,
    icon: meal.icon || '🍲',
    batchCookingTip: '🍳 Tip 1 Sola Sartén: Cocinen la preparación combinada en 1 sola olla/sartén. Al servir, divide ~60% al plato de Andrés y ~40% al de tu pareja. ¡Mismo tiempo, macros exactos!',
    andres: {
      profileName: 'Andrés',
      avatar: '🦁',
      role: 'Recomposición (92kg)',
      multiplier: andresMult,
      calories: andresCal,
      protein: andresProt,
      carbs: andresCarb,
      fat: andresFat,
      servingRatio: '60%',
      portionDidactic: `Porción Generosa (~125%): ${Math.round(andresProt)}g proteína, más saciedad y volumen.`
    },
    pareja: {
      profileName: 'Mi Pareja',
      avatar: '🌸',
      role: 'Hipertrofia Limpia (58kg)',
      multiplier: parejaMult,
      calories: parejaCal,
      protein: parejaProt,
      carbs: parejaCarb,
      fat: parejaFat,
      servingRatio: '40%',
      portionDidactic: `Porción Compacta (~85%): ${Math.round(parejaProt)}g proteína, fácil asimilación digestiva.`
    }
  };
}

/**
 * 9. Unified Couple Grocery List Generator (Andrés + Pareja)
 * Computes consolidated shopping list for 7 days or Cajabamba travel
 */
export function generateCoupleGroceryList(days = 7) {
  return [
    {
      category: 'Proteínas Magras (Avícola & Pescadería)',
      icon: '🍗',
      items: [
        { id: 'eggs', name: 'Huevos de Granja / Camperos', qty: `${days * 6} unidades (aprox. 3–4 docenas)`, purpose: 'Andrés (4/día) + Pareja (2/día). Proteína de alto valor biológico y colina.' },
        { id: 'chicken', name: 'Pechuga de Pollo Fresca', qty: `${(days * 0.38).toFixed(1)} kg`, purpose: 'Andrés (~220g/día) + Pareja (~140g/día). Base anabólica sin grasa saturada.' },
        { id: 'tuna', name: 'Latas de Atún en Agua', qty: '8–10 latas', purpose: 'Cenas express y comidas de viaje a Cajabamba con alto Omega-3.' },
        { id: 'cheese', name: 'Queso Fresco Pasteurizado', qty: '500g', purpose: 'Acompañamiento rápido en omelettes y ensaladas.' }
      ]
    },
    {
      category: 'Carbohidratos Complejos & Tubérculos de Altura',
      icon: '🥔',
      items: [
        { id: 'oats', name: 'Avena en Hojuelas Tradicional', qty: '1.5 kg', purpose: 'Desayunos de rendimiento y pancakes proteicos para ambos.' },
        { id: 'rice', name: 'Arroz Integral o Blanco Superior', qty: '2.0 kg', purpose: 'Glucógeno limpio para energía y entrenamientos de fuerza.' },
        { id: 'potato', name: 'Papa Amarilla / Camote Peruano', qty: '2.5 kg', purpose: 'Tubérculo de fácil asimilación gástrica en altura Cajabamba.' },
        { id: 'banana', name: 'Plátanos Seda Maduros', qty: '14–16 unidades (2 manos)', purpose: 'Snack pre/post entreno y endulzante natural en batidos.' }
      ]
    },
    {
      category: 'Grasas Saludables & Vegetales Digestivos',
      icon: '🥑',
      items: [
        { id: 'avocado', name: 'Paltas Fuertes o Hass', qty: '6–8 unidades', purpose: 'Ácidos grasos monoinsaturados para síntesis hormonal y saciedad.' },
        { id: 'spinach', name: 'Espinacas Baby / Hojas Verdes', qty: '3 atados frescos', purpose: 'Magnesio, nitratos naturales y volumen digestivo sin calorías.' },
        { id: 'tomato_onion', name: 'Tomates, Cebollas y Limón', qty: '1.5 kg surtido', purpose: 'Fibra soluble previa a las comidas y condimento natural.' },
        { id: 'olive_oil', name: 'Aceite de Oliva Virgen Extra', qty: '1 botella (500ml)', purpose: 'Cocina a fuego medio y aderezo antiinflamatorio.' }
      ]
    },
    {
      category: 'Biohacking & Hidratación en Altitud (Cajabamba)',
      icon: '🏔️',
      items: [
        { id: 'creatine', name: 'Creatina Monohidrato Creapure', qty: '1 bote (Andrés 5g/día)', purpose: 'Saturación de fosfocreatina para fuerza e hipertrofia.' },
        { id: 'sea_salt', name: 'Sal Marina Integral / Electrolitos', qty: '1 frasco', purpose: 'Osmolaridad celular y retención hídrica óptima a 2,654 msnm.' }
      ]
    }
  ];
}

/**
 * 10. Hybrid Athlete System (Dejan Stipke Style)
 * Combines heavy progressive overload, calisthenics static/dynamic skills,
 * explosive power, and metabolic conditioning / Zone 2 caloric burn.
 * Auto-regulates based on sleep, fatigue, travel, and location.
 */
export const HYBRID_ATHLETE_SYSTEM = {
  skillTree: {
    handstand: {
      id: 'handstand',
      name: 'Parada de Manos (Handstand)',
      icon: '🤸‍♂️',
      targetMuscle: 'Hombros, trapecio, muñecas y core anterior',
      description: 'Habilidad reina de empuje vertical y equilibrio neurológico.',
      levels: [
        {
          level: 1,
          title: 'Nivel 1: Wall Walk & Pecho a la Pared',
          target: '4 series × 30–45s hold',
          restSeconds: 90,
          difficulty: 'Novato',
          cues: 'Sube los pies por la pared hasta que el pecho casi la toque. Empuja el piso con fuerza (protracción escapular), mete la pelvis y aprieta glúteos.',
          commonMistake: 'Quebrar la espalda baja formando una curva de plátano.'
        },
        {
          level: 2,
          title: 'Nivel 2: Despegue de Talones (Heel Taps)',
          target: '4 series × 8–10 despegues controlados',
          restSeconds: 90,
          difficulty: 'Intermedio',
          cues: 'Desde la pared, usa las yemas de los dedos como frenos para despegar un talón unos centímetros y buscar el punto de equilibrio.',
          commonMistake: 'Patear con violencia en lugar de empujar con las manos.'
        },
        {
          level: 3,
          title: 'Nivel 3: Handstand Libre (Freestanding)',
          target: '5 intentos × 10–25s hold',
          restSeconds: 120,
          difficulty: 'Avanzado',
          cues: 'Entrada controlada con tijera suave. Dedos como garras en el suelo. Mirada fija entre los pulgares.',
          commonMistake: 'Contener la respiración durante el equilibrio.'
        }
      ]
    },
    front_lever: {
      id: 'front_lever',
      name: 'Front Lever (Palanca Frontal)',
      icon: '⚡',
      targetMuscle: 'Dorsal ancho, redondo mayor, tríceps largo y core',
      description: 'Palanca estática de tracción con brazos rectos más estética de la calistenia.',
      levels: [
        {
          level: 1,
          title: 'Nivel 1: Tuck Front Lever Hold',
          target: '4 series × 15–20s',
          restSeconds: 90,
          difficulty: 'Novato',
          cues: 'Colgado de la barra con codos 100% bloqueados, pega las rodillas al pecho y deprime las escápulas hacia tus bolsillos traseros.',
          commonMistake: 'Flexionar los codos; esto convierte el ejercicio en una dominada en vez de palanca estática.'
        },
        {
          level: 2,
          title: 'Nivel 2: Advanced Tuck Front Lever',
          target: '4 series × 10–15s',
          restSeconds: 120,
          difficulty: 'Intermedio',
          cues: 'Abre las rodillas a 90 grados respecto al torso. La espalda debe quedar 100% horizontal paralela al suelo.',
          commonMistake: 'Dejar que la cadera caiga por debajo de la línea de los hombros.'
        },
        {
          level: 3,
          title: 'Nivel 3: Straddle / Negativas Lentas',
          target: '4 series × 8–12s o 5 negativas de 5s',
          restSeconds: 120,
          difficulty: 'Avanzado',
          cues: 'Abre las piernas en V amplia (straddle) para acortar el brazo de palanca o baja desde posición invertida en 5 segundos lentos.',
          commonMistake: 'Pérdida de la retracción escapular al descender.'
        },
        {
          level: 4,
          title: 'Nivel 4: Full Front Lever',
          target: '3–4 series × 5–8s estricto',
          restSeconds: 150,
          difficulty: 'Master',
          cues: 'Cuerpo como una barra de hierro. Glúteos y cuádriceps en máxima contracción.',
          commonMistake: 'Rotar la pelvis hacia arriba.'
        }
      ]
    },
    muscle_up: {
      id: 'muscle_up',
      name: 'Muscle-Up & Fondos Lastrados',
      icon: '🚀',
      targetMuscle: 'Dorsales explosivos, pectoral, tríceps y agarre',
      description: 'La transición definitiva entre tracción y empuje de alta potencia.',
      levels: [
        {
          level: 1,
          title: 'Nivel 1: Dominadas Explosivas al Esternón',
          target: '4 series × 5 reps explosivas + 4 × 10 fondos profundos',
          restSeconds: 90,
          difficulty: 'Novato',
          cues: 'Jala con máxima aceleración intentando tocar la barra con el pecho o esternón, no con la barbilla.',
          commonMistake: 'Jalar lento buscando volumen en vez de potencia.'
        },
        {
          level: 2,
          title: 'Nivel 2: Muscle-Up con Banda / Negativas Lentas',
          target: '4 series × 3–4 reps asistidas',
          restSeconds: 120,
          difficulty: 'Intermedio',
          cues: 'Usa una banda elástica para entender el giro de muñecas y llevar el pecho rápidamente sobre la barra.',
          commonMistake: 'Subir un brazo primero ("hacer el ala de pollo"). Los dos brazos deben subir simultáneos.'
        },
        {
          level: 3,
          title: 'Nivel 3: Strict Bar Muscle-Up',
          target: '3–5 series × 2–5 reps sin balanceo',
          restSeconds: 150,
          difficulty: 'Avanzado',
          cues: 'Cero kipping de piernas. Dominada explosiva, inclinación de torso y fondo firme.',
          commonMistake: 'Patear con las rodillas para impulsarse.'
        }
      ]
    },
    planche: {
      id: 'planche',
      name: 'Planche (Plancha Calisténica)',
      icon: '🏆',
      targetMuscle: 'Deltoides anterior, bíceps, muñecas y serrato anterior',
      description: 'La máxima expresión de fuerza de empuje con brazos rectos.',
      levels: [
        {
          level: 1,
          title: 'Nivel 1: Planche Lean en Suelo / Paralelas',
          target: '4 series × 20–30s hold con inclinación máxima',
          restSeconds: 90,
          difficulty: 'Novato',
          cues: 'En plancha alta, empuja el suelo hacia abajo (protracción fuerte) e inclina los hombros más allá de las muñecas.',
          commonMistake: 'Doblar los codos o dejar caer la pelvis.'
        },
        {
          level: 2,
          title: 'Nivel 2: Tuck Planche en Paralelas Cortas',
          target: '4 series × 10–15s suspendido',
          restSeconds: 120,
          difficulty: 'Intermedio',
          cues: 'Eleva las rodillas hacia el pecho manteniendo los pies en el aire sin tocar el suelo.',
          commonMistake: 'Hombros por detrás de las muñecas; esto hace imposible la suspensión.'
        },
        {
          level: 3,
          title: 'Nivel 3: Advanced Tuck / Straddle Planche',
          target: '3–4 series × 6–10s estricto',
          restSeconds: 150,
          difficulty: 'Avanzado',
          cues: 'Abre el ángulo cadera-torso a 90 grados o abre las piernas en V. Escápulas totalmente separadas y codos de acero.',
          commonMistake: 'Flexión micro de codo por fatiga de tendones.'
        }
      ]
    }
  },

  routines: {
    andres: {
      gym: {
        title: 'Sesión Híbrida Completa: Fuerza Pesada + Calistenia + Zona 2',
        durationMinutes: 90,
        focus: 'Sobrecarga miofibrilar pesada, habilidades estáticas y quema oxidativa de grasa',
        blocks: [
          {
            name: 'Bloque 1: Fuerza Pesada & Sobrecarga Progresiva (40 min)',
            icon: '🏋️‍♂️',
            exercises: [
              {
                name: 'Press Banca Plano con Barra',
                sets: 4,
                reps: '6 - 8 pesadas',
                restSeconds: 120,
                substitute: 'Press Inclinado con Mancuernas Pesadas o Fondos Lastrados',
                note: 'Carga pesada con RIR 1-2. Barra controlada en 2s bajando.'
              },
              {
                name: 'Remo Pendlay Libre con Barra',
                sets: 4,
                reps: '8 reps estrictas',
                restSeconds: 90,
                substitute: 'Remo Unilateral con Mancuerna Pesada en Banco',
                note: 'Espalda 100% horizontal. Tirón explosivo hacia el ombligo.'
              },
              {
                name: 'Sentadilla Trasera / Prensa de Piernas Pesada',
                sets: 4,
                reps: '6 - 8 reps',
                restSeconds: 120,
                substitute: 'Sentadilla Hack o Goblet Squat Pesada',
                note: 'Estímulo sistémico de fuerza y testosterona.'
              }
            ]
          },
          {
            name: 'Bloque 2: Calistenia de Alto Nivel & Trucos (30 min)',
            icon: '🤸‍♂️',
            exercises: [
              {
                name: 'Progresión de Front Lever (Tuck o Adv Tuck)',
                sets: 4,
                reps: '12 - 18s estáticos',
                restSeconds: 90,
                substitute: 'Dominadas Estrictas con Pausa de 2s en el Pecho',
                note: 'Brazos 100% rectos. Retracción escapular activa.'
              },
              {
                name: 'Fondos en Paralelas con Lastre / Excéntrica Lenta',
                sets: 4,
                reps: '8 - 10 reps',
                restSeconds: 90,
                substitute: 'Flexiones Declinadas o Press Francés Pesado',
                note: 'Baja profundo hasta 90 grados y sube con bloqueo firme.'
              },
              {
                name: 'Práctica de Handstand en Pared o Suelo',
                sets: 5,
                reps: '20 - 30s equilibrio',
                restSeconds: 60,
                substitute: 'Pike Pushups en Cajón para Deltoides',
                note: 'Enfoque en la presión de las yemas de los dedos.'
              }
            ]
          },
          {
            name: 'Bloque 3: Motor Híbrido & Quema Calórica Zona 2 (20 min)',
            icon: '🔥',
            exercises: [
              {
                name: 'Caminata en Cinta Inclinada (12% inclinación, 4.8 - 5.2 km/h)',
                sets: 1,
                reps: '20 minutos continuos',
                restSeconds: 0,
                substitute: 'Remo Concept2 o Bicicleta Estática a ritmo constante',
                note: 'Mantén frecuencia cardíaca en Zona 2 (120-135 bpm) para oxidar grasa pura sin degradar masa muscular.'
              }
            ]
          }
        ]
      },
      home_bars: {
        title: 'Calistenia de Fuerza & Habilidades en Casa (Barras y Paralelas)',
        durationMinutes: 65,
        focus: 'Tensión mecánica en peso corporal, habilidades y volumen de densidad',
        blocks: [
          {
            name: 'Bloque 1: Trucos y Fuerza Estática (25 min)',
            icon: '⚡',
            exercises: [
              {
                name: 'Práctica de Handstand Kick-ups en Pared',
                sets: 5,
                reps: '30s de intentos activos',
                restSeconds: 75,
                substitute: 'Wall Walk sostenido 35s',
                note: 'Hombros bloqueados en protracción.'
              },
              {
                name: 'Front Lever Tuck Holds en Barra',
                sets: 4,
                reps: '15s hold',
                restSeconds: 90,
                substitute: 'Dragon Flags en suelo o cama',
                note: 'Codos extendidos sin doblar.'
              }
            ]
          },
          {
            name: 'Bloque 2: Carga Mecánica & Masa Muscular (25 min)',
            icon: '💪',
            exercises: [
              {
                name: 'Dominadas Pronas Estrictas en Barra',
                sets: 4,
                reps: '8 - 10 reps (opcional mochila con peso)',
                restSeconds: 90,
                substitute: 'Dominadas Neutras o Supinas',
                note: 'Rango completo de movimiento, pecho a la barra.'
              },
              {
                name: 'Fondos Profundos en Barras Paralelas',
                sets: 4,
                reps: '12 - 15 reps',
                restSeconds: 75,
                substitute: 'Flexiones Diamante en suelo',
                note: 'Pausa de 1s en la parte baja para estiramiento pectoral.'
              },
              {
                name: 'Sentadillas Búlgaras en Silla / Sofá',
                sets: 4,
                reps: '12 por pierna',
                restSeconds: 60,
                substitute: 'Pistol Squats asistidas a 1 pierna',
                note: 'Torso ligeramente inclinado para enfatizar glúteo.'
              }
            ]
          },
          {
            name: 'Bloque 3: Core Estático & Circuito Metabólico (15 min)',
            icon: '🔥',
            exercises: [
              {
                name: 'L-Sit en Paralelas / Hollow Body Hold',
                sets: 4,
                reps: '25s continuos',
                restSeconds: 45,
                substitute: 'Elevaciones de piernas colgado en barra',
                note: 'Compresión abdominal y flexores de cadera.'
              },
              {
                name: 'Finisher: 100 Flexiones en el menor tiempo posible',
                sets: 1,
                reps: '100 reps en micro-series',
                restSeconds: 0,
                substitute: 'Tabata de saltos y flexiones',
                note: 'Congestión máxima de pecho y tríceps.'
              }
            ]
          }
        ]
      },
      travel: {
        title: 'Calistenia de Altitud Cajabamba & EMOM Explosivo (Cero Equipo)',
        durationMinutes: 45,
        focus: 'Potencia explosiva, acondicionamiento y gasto calórico en altura',
        blocks: [
          {
            name: 'Circuito EMOM Pliométrico (30 min)',
            icon: '🏔️',
            exercises: [
              { name: 'Minuto 1: 15 Flexiones Explosivas / Declinadas', sets: 5, reps: '15 reps', restSeconds: 20, substitute: 'Flexiones clásicas', note: 'Potencia de torso sin pesas.' },
              { name: 'Minuto 2: 20 Sentadillas Profundas con Salto', sets: 5, reps: '20 reps explosivas', restSeconds: 15, substitute: 'Sentadillas profundas sin salto', note: 'Acondicionamiento de piernas en altitud.' },
              { name: 'Minuto 3: 16 Zancadas Alternadas en Salto', sets: 5, reps: '16 reps', restSeconds: 20, substitute: 'Zancadas estáticas controladas', note: 'Gasto calórico acelerado.' },
              { name: 'Minuto 4: 15 Pike Pushups (Hombros)', sets: 5, reps: '15 reps', restSeconds: 20, substitute: 'Flexiones diamante', note: 'Simulación de empuje vertical handstand.' },
              { name: 'Minuto 5: 45s Plancha Dinámica con Toque de Hombros', sets: 5, reps: '45s', restSeconds: 15, substitute: 'Plancha frontal estática', note: 'Estabilidad de core anti-rotación.' },
              { name: 'Minuto 6: Descanso Activo / Respiración Wim Hof', sets: 5, reps: '60s', restSeconds: 60, substitute: 'Caminata lenta', note: 'Recuperación de oxígeno a 2,654m.' }
            ]
          }
        ]
      }
    },

    pareja: {
      gym: {
        title: 'Hipertrofia Funcional Atlética: Cero Compresión Axial Lumbar',
        durationMinutes: 50,
        focus: 'Glúteos, femoral y espalda con columna 100% protegida y descompresión',
        blocks: [
          {
            name: 'Bloque 1: Cadena Posterior sin Carga Axial (25 min)',
            icon: '🌸',
            exercises: [
              {
                name: 'Prensa Inclinada de Piernas (Pies altos y separados)',
                sets: 4,
                reps: '10 - 12 reps',
                restSeconds: 90,
                substitute: 'Hip Thrust en Máquina o Mancuerna Pesada',
                note: 'Espalda 100% apoyada en el respaldo. Cero presión sobre la columna lumbar.'
              },
              {
                name: 'Sentadilla Búlgara con Mancuernas a los Lados',
                sets: 3,
                reps: '10 por pierna',
                restSeconds: 75,
                substitute: 'Zancadas Estáticas en Máquina Smith guiada',
                note: 'Mancuernas colgando a los costados para no cargar la columna vertebral.'
              },
              {
                name: 'Hip Thrust con Barra Acolchada / Banda Elástica',
                sets: 4,
                reps: '12 reps (pausa 2s arriba)',
                restSeconds: 90,
                substitute: 'Puentes de Glúteo a 1 Pierna en Banco',
                note: 'Máxima activación de glúteo mayor sin hiperextender la espalda baja.'
              }
            ]
          },
          {
            name: 'Bloque 2: Tracción Atlética & Core Protector McGill (25 min)',
            icon: '🧘‍♀️',
            exercises: [
              {
                name: 'Jalón al Pecho Polea Alta (Agarre Neutro)',
                sets: 4,
                reps: '10 - 12 reps',
                restSeconds: 75,
                substitute: 'Remo en Banco Inclinado con Pecho Apoyado',
                note: 'Agarre neutro para cuidar hombros y alinear la columna.'
              },
              {
                name: 'Remo con Mancuerna en Banco Inclinado (Pecho Apoyado)',
                sets: 3,
                reps: '12 reps',
                restSeconds: 60,
                substitute: 'Remo en Polea Baja sentado',
                note: 'El banco soporta todo el peso corporal; la lumbar queda libre de tensión.'
              },
              {
                name: 'McGill Big 3 (Bird-Dog + Plancha Lateral)',
                sets: 3,
                reps: '8 por lado / 30s plancha',
                restSeconds: 45,
                substitute: 'Deadbug con respiración diafragmática',
                note: 'El protocolo clínico de oro para estabilidad lumbar permanente.'
              }
            ]
          }
        ]
      },
      home_bars: {
        title: 'Calistenia Femenina & Fuerza Funcional en Casa',
        durationMinutes: 40,
        focus: 'Glúteos, movilidad articular y tono muscular sin equipamiento pesado',
        blocks: [
          {
            name: 'Rutina Funcional sin Compresión',
            icon: '🌸',
            exercises: [
              { name: 'Puentes de Glúteo a 1 Pierna en Suelo', sets: 4, reps: '15 por lado', restSeconds: 60, substitute: 'Puente bilateral con banda', note: 'Aprieta 2s arriba.' },
              { name: 'Sentadilla Búlgara en Sofá / Silla', sets: 3, reps: '12 por lado', restSeconds: 60, substitute: 'Sentadilla isométrica contra pared', note: 'Paso largo para enfocar glúteo.' },
              { name: 'Remo Invertido en Mesa / Banda Elástica', sets: 4, reps: '10 - 12 reps', restSeconds: 60, substitute: 'Jalón con toalla en puerta', note: 'Fortalece espalda media para postura erguida.' },
              { name: 'Flexiones Inclinadas en Mesa / Barra', sets: 3, reps: '10 reps', restSeconds: 60, substitute: 'Flexiones de rodillas en suelo', note: 'Tono de pecho y tríceps sin sobrecarga.' },
              { name: 'Estiramiento Profundo de Psoas y Descompresión Lumbar', sets: 3, reps: '45s por lado', restSeconds: 30, substitute: 'Postura del niño (Child pose)', note: 'Alivia dolor lumbar post-viaje.' }
            ]
          }
        ]
      },
      travel: {
        title: 'Movilidad de Viaje & Glúteos Cajabamba (Cero Impacto Lumbar)',
        durationMinutes: 30,
        focus: 'Circulación en altitud y activación muscular suave',
        blocks: [
          {
            name: 'Activación & Descompresión de Viaje',
            icon: '🏔️',
            exercises: [
              { name: 'Puentes de Glúteo en Suelo con Pausa', sets: 4, reps: '20 reps', restSeconds: 45, substitute: 'Puente isométrico 40s', note: 'Activa glúteos dormidos por el viaje.' },
              { name: 'Clamshells (Ostras) para Glúteo Medio', sets: 3, reps: '15 por lado', restSeconds: 30, substitute: 'Abducciones de pie', note: 'Estabiliza la pelvis y previene dolor de ciática.' },
              { name: 'Bird-Dog de Control Cruzado', sets: 3, reps: '10 por lado lentos', restSeconds: 45, substitute: 'Cat-Cow suave', note: 'Reeducación neuromuscular del core.' },
              { name: 'Caminata Suave al Aire Libre (Zona 2)', sets: 1, reps: '15 minutos', restSeconds: 0, substitute: 'Movilidad de cadera en colchoneta', note: 'Oxigenación en altura sin fatiga.' }
            ]
          }
        ]
      }
    },

    hermana: {
      gym: {
        title: 'Movilidad & Tono Suave en Gimnasio (Cero Estrés)',
        durationMinutes: 35,
        focus: 'Caminata en inclinación suave y máquinas guiadas de bajo impacto',
        blocks: [
          {
            name: 'Bloque 1: Activación Cardiovascular Amable (15 min)',
            icon: '🚶‍♀️',
            exercises: [
              {
                name: 'Caminata en Cinta Plana o Ligera Inclinación',
                sets: 1,
                reps: '15 minutos continuos',
                restSeconds: 0,
                substitute: 'Bicicleta estática con respaldo bajo impacto',
                note: 'Ritmo suave para activar circulación y sensibilidad a la insulina sin agobio.'
              }
            ]
          },
          {
            name: 'Bloque 2: Máquinas Guiadas de Cero Fatiga Articular (20 min)',
            icon: '🌿',
            exercises: [
              {
                name: 'Prensa Guiada con Carga Muy Ligera',
                sets: 3,
                reps: '12 repeticiones cómodas',
                restSeconds: 60,
                substitute: 'Sentadillas al aire sobre un banco',
                note: 'Mantén una respiración tranquila y rango agradable.'
              },
              {
                name: 'Jalón en Polea con Agarre Abierto y Peso Cómodo',
                sets: 3,
                reps: '10 repeticiones fluidas',
                restSeconds: 60,
                substitute: 'Remo suave con elásticos',
                note: 'Ayuda a la postura y a abrir el pecho de forma relajada.'
              }
            ]
          }
        ]
      },
      home_bars: {
        title: 'Movilidad de Bienestar en Casa',
        durationMinutes: 25,
        focus: 'Movilidad articular suave, respiración y estiramientos relajantes',
        blocks: [
          {
            name: 'Secuencia Calmante de Movilidad',
            icon: '🧘‍♀️',
            exercises: [
              { name: 'Círculos Suaves de Brazos y Hombros', sets: 3, reps: '10 hacia adelante y atrás', restSeconds: 30, substitute: 'Rotaciones de cuello suaves', note: 'Libera tensión en trapecios.' },
              { name: 'Estiramiento Suave de Espalda en Silla', sets: 3, reps: '30s por postura', restSeconds: 30, substitute: 'Inclinaciones laterales cómodas', note: 'Flexibilidad sin esfuerzo.' },
              { name: 'Paseo Suave en Casa o Patio', sets: 1, reps: '10 minutos', restSeconds: 0, substitute: 'Pasos en el sitio con música agradable', note: 'Movimiento gentil y vitalizante.' }
            ]
          }
        ]
      },
      travel: {
        title: 'Paseo Suave & Respiración Reconfortante',
        durationMinutes: 20,
        focus: 'Oxigenación y calma corporal',
        blocks: [
          {
            name: 'Bienestar al Aire Libre',
            icon: '🌿',
            exercises: [
              { name: 'Paseo Suave al Aire Libre', sets: 1, reps: '15 minutos', restSeconds: 0, substitute: 'Movilidad en colchoneta suave', note: 'Disfrutar del aire libre a tu propio ritmo.' },
              { name: 'Respiraciones Profundas Conscientes', sets: 3, reps: '5 ciclos lentos', restSeconds: 30, substitute: 'Estiramiento de brazos al cielo', note: 'Bajar pulsaciones y recargar energía.' }
            ]
          }
        ]
      }
    }
  },

  splits: {
    andres: {
      legs: {
        id: 'legs',
        name: 'Piernas Pesado (Sentadilla, Prensa & Búlgaras)',
        shortName: 'Piernas Pesado',
        icon: '🦵',
        dayRecommendation: 'Lunes / Inicio de Semana',
        durationMinutes: 85,
        focus: 'Fuerza máxima en tren inferior, liberación hormonal y estabilidad articular',
        blocks: [
          {
            name: 'Bloque 1: Fuerza Pesada en Piernas (Sobrecarga Progresiva)',
            icon: '🏋️‍♂️',
            exercises: [
              {
                name: 'Sentadilla Trasera con Barra / Prensa Pesada',
                sets: 4,
                reps: '6 - 8 reps pesadas',
                restSeconds: 120,
                substitute: 'Prensa Inclinada a 45° con pies a la anchura de hombros',
                note: 'RIR 1-2. Céntrate en bajar profundo y empujar con los talones.'
              },
              {
                name: 'Sentadilla Búlgara con Mancuernas Pesadas',
                sets: 4,
                reps: '8 - 10 por pierna',
                restSeconds: 90,
                substitute: 'Zancadas caminando con mancuernas',
                note: 'Torso ligeramente inclinado para reclutar glúteo mayor y cuádriceps.'
              },
              {
                name: 'Peso Muerto Rumano con Barra / Mancuernas',
                sets: 4,
                reps: '8 - 10 reps',
                restSeconds: 90,
                substitute: 'Curl Femoral en Máquina Acostado',
                note: 'Empuja la cadera hacia atrás hasta sentir estiramiento en isquiotibiales.'
              },
              {
                name: 'Elevación de Talones en Escalón / Máquina',
                sets: 4,
                reps: '15 reps con pausa 2s',
                restSeconds: 60,
                substitute: 'Gemelos a una pierna sobre disco con mancuerna',
                note: 'Rango completo de dorsiflexión para tobillos a prueba de lesiones.'
              }
            ]
          },
          {
            name: 'Bloque 2: Calistenia de Tren Inferior & Core (20 min)',
            icon: '🤸‍♂️',
            exercises: [
              {
                name: 'Pistol Squats (Sentadilla a 1 Pierna) Asistidas',
                sets: 3,
                reps: '6 por pierna',
                restSeconds: 75,
                substitute: 'Sentadillas Cosacas de movilidad lateral',
                note: 'Control excéntrico puro de equilibrio neuromuscular.'
              },
              {
                name: 'L-Sit Tuck en Paralelas / Silla',
                sets: 4,
                reps: '20s continuos',
                restSeconds: 60,
                substitute: 'Elevaciones de rodillas al pecho en barra',
                note: 'Compresión activa de psoas y abdominales inferiores.'
              }
            ]
          },
          {
            name: 'Bloque 3: Motor Híbrido & Quema Calórica Zona 2 (15 min)',
            icon: '🔥',
            exercises: [
              {
                name: 'Caminata Inclinada (12% inclinación, 4.8 km/h)',
                sets: 1,
                reps: '15 minutos continuos',
                restSeconds: 0,
                substitute: 'Bicicleta suave con resistencia media',
                note: 'Zona 2 (120-135 bpm) para bombeo circulatorio y lavado de lactato sin agotar glucógeno.'
              }
            ]
          }
        ]
      },
      push: {
        id: 'push',
        name: 'Pecho, Hombros & Tríceps (Empuje Pesado)',
        shortName: 'Pecho & Empuje',
        icon: '🛡️',
        dayRecommendation: 'Martes o Jueves',
        durationMinutes: 80,
        focus: 'Sobrecarga miofibrilar en empuje horizontal y vertical con transferencias a Handstand',
        blocks: [
          {
            name: 'Bloque 1: Fuerza Pesada de Empuje (40 min)',
            icon: '🏋️‍♂️',
            exercises: [
              {
                name: 'Press Banca Plano con Barra Pesada',
                sets: 4,
                reps: '6 - 8 reps pesadas',
                restSeconds: 120,
                substitute: 'Press Inclinado con Mancuernas Pesadas',
                note: 'Retracción escapular firme. Barra toca el pecho medio con control.'
              },
              {
                name: 'Press Inclinado con Mancuernas (30 grados)',
                sets: 3,
                reps: '8 - 10 reps',
                restSeconds: 90,
                substitute: 'Press en Máquina Inclinada guiada',
                note: 'Foco en la clavícula y haz clavicular del pectoral.'
              },
              {
                name: 'Fondos en Paralelas con Lastre / Control',
                sets: 4,
                reps: '8 - 10 reps',
                restSeconds: 90,
                substitute: 'Flexiones declinadas con pies en banco',
                note: 'Baja a 90° y empuja con pectoral y tríceps.'
              },
              {
                name: 'Elevaciones Laterales con Mancuernas',
                sets: 4,
                reps: '12 - 15 reps',
                restSeconds: 60,
                substitute: 'Elevaciones laterales en polea baja',
                note: 'Construcción de hombros redondos en 3D.'
              }
            ]
          },
          {
            name: 'Bloque 2: Calistenia Vertical & Habilidades Handstand (25 min)',
            icon: '🤸‍♂️',
            exercises: [
              {
                name: 'Práctica de Handstand Kick-Ups / Wall Hold',
                sets: 5,
                reps: '30s de intentos activos',
                restSeconds: 75,
                substitute: 'Pike Pushups en cajón o suelo',
                note: 'Equilibrio sobre las yemas de los dedos y hombros elevados.'
              },
              {
                name: 'Extensiones de Tríceps en Polea / Francesas',
                sets: 3,
                reps: '12 reps',
                restSeconds: 60,
                substitute: 'Flexiones Diamante en suelo',
                note: 'Bloqueo firme al final de la extensión.'
              }
            ]
          },
          {
            name: 'Bloque 3: Motor Híbrido Zona 2 (15 min)',
            icon: '🔥',
            exercises: [
              {
                name: 'Caminata Inclinada en Cinta (10-12%)',
                sets: 1,
                reps: '15 minutos',
                restSeconds: 0,
                substitute: 'Remo suave a ritmo constante',
                note: 'Zona 2 para oxidar grasa y acelerar recuperación del torso.'
              }
            ]
          }
        ]
      },
      pull: {
        id: 'pull',
        name: 'Espalda & Tracción Pesada (Lats & Front Lever)',
        shortName: 'Espalda & Tracción',
        icon: '🦅',
        dayRecommendation: 'Miércoles o Viernes',
        durationMinutes: 85,
        focus: 'Espalda densa, dorsal ancho y palancas estáticas de Front Lever',
        blocks: [
          {
            name: 'Bloque 1: Fuerza Pesada de Tracción (40 min)',
            icon: '🏋️‍♂️',
            exercises: [
              {
                name: 'Remo con Barra Libre / Remo Pendlay',
                sets: 4,
                reps: '6 - 8 reps estrictas',
                restSeconds: 120,
                substitute: 'Remo Unilateral Pesado con Mancuerna en Banco',
                note: 'Espalda 100% plana. Tirón explosivo hacia el ombligo.'
              },
              {
                name: 'Dominadas Pronas Estrictas con Lastre',
                sets: 4,
                reps: '6 - 8 reps',
                restSeconds: 120,
                substitute: 'Jalón al Pecho en Polea Alta agarre neutro',
                note: 'Pecho a la barra, codos hacia los bolsillos traseros.'
              },
              {
                name: 'Remo Unilateral en Banco con Mancuerna Pesada',
                sets: 3,
                reps: '10 por brazo',
                restSeconds: 75,
                substitute: 'Remo sentado en polea baja con agarre V',
                note: 'Máximo estiramiento abajo sin rotar el torso.'
              },
              {
                name: 'Face Pulls en Polea con Cuerda / Pájaros',
                sets: 4,
                reps: '15 reps controladas',
                restSeconds: 60,
                substitute: 'Remo al cuello con agarre ancho',
                note: 'Salud de hombro, deltoides posterior y trapecio medio.'
              }
            ]
          },
          {
            name: 'Bloque 2: Palanca Frontal Front Lever & Core (25 min)',
            icon: '⚡',
            exercises: [
              {
                name: 'Progresión de Front Lever (Tuck / Adv Tuck Holds)',
                sets: 4,
                reps: '12 - 15s estáticos',
                restSeconds: 90,
                substitute: 'Dragon Flags en suelo o banco plano',
                note: 'Codos bloqueados al 100%. Retracción y depresión escapular.'
              },
              {
                name: 'Curl de Bíceps con Barra Z / Mancuernas Inclinadas',
                sets: 3,
                reps: '10 - 12 reps',
                restSeconds: 60,
                substitute: 'Curl martillo con mancuernas para braquiorradial',
                note: 'Tensión constante sin balanceo lumbar.'
              }
            ]
          },
          {
            name: 'Bloque 3: Motor Híbrido Zona 2 (15 min)',
            icon: '🔥',
            exercises: [
              {
                name: 'Caminata Inclinada o Remo Concept2',
                sets: 1,
                reps: '15 minutos continuos',
                restSeconds: 0,
                substitute: 'Bicicleta estática ritmo conversación',
                note: 'Oxidación de ácidos grasos post-tracción.'
              }
            ]
          }
        ]
      },
      full_upper: {
        id: 'full_upper',
        name: 'Torso Híbrido Completo (Dejan Stipke Balance)',
        shortName: 'Torso Híbrido',
        icon: '⚡',
        dayRecommendation: 'Balance General',
        durationMinutes: 90,
        focus: 'Sobrecarga miofibrilar pesada, habilidades estáticas y quema oxidativa de grasa',
        blocks: [
          {
            name: 'Bloque 1: Fuerza Pesada & Sobrecarga Progresiva (40 min)',
            icon: '🏋️‍♂️',
            exercises: [
              {
                name: 'Press Banca Plano con Barra',
                sets: 4,
                reps: '6 - 8 pesadas',
                restSeconds: 120,
                substitute: 'Press Inclinado con Mancuernas Pesadas o Fondos Lastrados',
                note: 'Carga pesada con RIR 1-2. Barra controlada en 2s bajando.'
              },
              {
                name: 'Remo Pendlay Libre con Barra',
                sets: 4,
                reps: '8 reps estrictas',
                restSeconds: 90,
                substitute: 'Remo Unilateral con Mancuerna Pesada en Banco',
                note: 'Espalda 100% horizontal. Tirón explosivo hacia el ombligo.'
              },
              {
                name: 'Sentadilla Trasera / Prensa de Piernas Pesada',
                sets: 4,
                reps: '6 - 8 reps',
                restSeconds: 120,
                substitute: 'Sentadilla Hack o Goblet Squat Pesada',
                note: 'Estímulo sistémico de fuerza y testosterona.'
              }
            ]
          },
          {
            name: 'Bloque 2: Calistenia de Alto Nivel & Trucos (30 min)',
            icon: '🤸‍♂️',
            exercises: [
              {
                name: 'Progresión de Front Lever (Tuck o Adv Tuck)',
                sets: 4,
                reps: '12 - 18s estáticos',
                restSeconds: 90,
                substitute: 'Dominadas Estrictas con Pausa de 2s en el Pecho',
                note: 'Brazos 100% rectos. Retracción escapular activa.'
              },
              {
                name: 'Fondos en Paralelas con Lastre / Excéntrica Lenta',
                sets: 4,
                reps: '8 - 10 reps',
                restSeconds: 90,
                substitute: 'Flexiones Declinadas o Press Francés Pesado',
                note: 'Baja profundo hasta 90 grados y sube con bloqueo firme.'
              },
              {
                name: 'Práctica de Handstand en Pared o Suelo',
                sets: 5,
                reps: '20 - 30s equilibrio',
                restSeconds: 60,
                substitute: 'Pike Pushups en Cajón para Deltoides',
                note: 'Enfoque en la presión de las yemas de los dedos.'
              }
            ]
          },
          {
            name: 'Bloque 3: Motor Híbrido & Quema Calórica Zona 2 (20 min)',
            icon: '🔥',
            exercises: [
              {
                name: 'Caminata en Cinta Inclinada (12% inclinación, 4.8 - 5.2 km/h)',
                sets: 1,
                reps: '20 minutos continuos',
                restSeconds: 0,
                substitute: 'Remo Concept2 o Bicicleta Estática a ritmo constante',
                note: 'Mantén frecuencia cardíaca en Zona 2 (120-135 bpm) para oxidar grasa pura sin degradar masa muscular.'
              }
            ]
          }
        ]
      },
      home_core: {
        id: 'home_core',
        name: 'Micro-Rutina Express: Planchas & Abdominales en Casa (12 min)',
        shortName: 'Planchas en Casa',
        icon: '🔥',
        dayRecommendation: 'Días Ocupados / Viaje / Descarga',
        durationMinutes: 12,
        focus: 'Activación de core, tensión isométrica y quema metabólica en 12 minutos sin equipo',
        blocks: [
          {
            name: 'Circuito Isométrico de Planchas & Core (2 Rondas)',
            icon: '🔥',
            exercises: [
              { name: 'Plancha Frontal Dinámica con Toque de Hombros', sets: 2, reps: '45s continuo', restSeconds: 15, substitute: 'Plancha estática sobre codos', note: 'Anti-rotación y estabilidad escapular.' },
              { name: 'Hollow Body Hold en Suelo / Alfombra', sets: 2, reps: '40s estricto', restSeconds: 20, substitute: 'Hollow body con rodillas flexionadas', note: 'Presiona la espalda baja contra el piso sin dejar luz.' },
              { name: 'McGill Bird-Dog Cruzado con Respiración Diafragmática', sets: 2, reps: '10 por lado lentos', restSeconds: 15, substitute: 'Cat-Cow suave', note: 'Blindaje lumbar y glúteo mayor.' },
              { name: 'Plancha Lateral con Elevación de Cadera', sets: 2, reps: '30s por lado', restSeconds: 15, substitute: 'Plancha lateral apoyando rodillas', note: 'Oblicuos y estabilizadores laterales de pelvis.' },
              { name: 'L-Sit Tuck en Suelo o Cojín', sets: 2, reps: '25s sostenido', restSeconds: 20, substitute: 'Elevación de piernas acostado', note: 'Compresión abdominal pura y flexores de cadera.' },
              { name: 'Descanso Activo / Respiración Diafragmática', sets: 2, reps: '60s', restSeconds: 0, substitute: 'Estiramiento suave de abdomen', note: 'Oxigenación y bajada de pulsaciones.' }
            ]
          }
        ]
      }
    },

    pareja: {
      glutes_legs: {
        id: 'glutes_legs',
        name: 'Glúteos & Femoral (Cero Compresión Axial)',
        shortName: 'Glúteos & Piernas',
        icon: '🍑',
        dayRecommendation: 'Inicio de Semana',
        durationMinutes: 50,
        focus: 'Glúteos, femoral y cadera con columna 100% protegida y descompresión',
        blocks: [
          {
            name: 'Bloque 1: Cadena Posterior sin Carga Axial (25 min)',
            icon: '🌸',
            exercises: [
              {
                name: 'Prensa Inclinada de Piernas (Pies altos y separados)',
                sets: 4,
                reps: '10 - 12 reps',
                restSeconds: 90,
                substitute: 'Hip Thrust en Máquina o Mancuerna Pesada',
                note: 'Espalda 100% apoyada en el respaldo. Cero presión sobre la columna lumbar.'
              },
              {
                name: 'Sentadilla Búlgara con Mancuernas a los Lados',
                sets: 3,
                reps: '10 por pierna',
                restSeconds: 75,
                substitute: 'Zancadas Estáticas en Máquina Smith guiada',
                note: 'Mancuernas colgando a los costados para no cargar la columna vertebral.'
              },
              {
                name: 'Hip Thrust con Barra Acolchada / Banda Elástica',
                sets: 4,
                reps: '12 reps (pausa 2s arriba)',
                restSeconds: 90,
                substitute: 'Puentes de Glúteo a 1 Pierna en Banco',
                note: 'Máxima activación de glúteo mayor sin hiperextender la espalda baja.'
              }
            ]
          },
          {
            name: 'Bloque 2: Tracción Atlética & Core Protector McGill (25 min)',
            icon: '🧘‍♀️',
            exercises: [
              {
                name: 'Jalón al Pecho Polea Alta (Agarre Neutro)',
                sets: 4,
                reps: '10 - 12 reps',
                restSeconds: 75,
                substitute: 'Remo en Banco Inclinado con Pecho Apoyado',
                note: 'Agarre neutro para cuidar hombros y alinear la columna.'
              },
              {
                name: 'Remo con Mancuerna en Banco Inclinado (Pecho Apoyado)',
                sets: 3,
                reps: '12 reps',
                restSeconds: 60,
                substitute: 'Remo en Polea Baja sentado',
                note: 'El banco soporta todo el peso corporal; la lumbar queda libre de tensión.'
              },
              {
                name: 'McGill Big 3 (Bird-Dog + Plancha Lateral)',
                sets: 3,
                reps: '8 por lado / 30s plancha',
                restSeconds: 45,
                substitute: 'Deadbug con respiración diafragmática',
                note: 'El protocolo clínico de oro para estabilidad lumbar permanente.'
              }
            ]
          }
        ]
      },
      back_posture: {
        id: 'back_posture',
        name: 'Espalda, Postura & McGill Core (Protección Lumbar)',
        shortName: 'Espalda & Core',
        icon: '🧘‍♀️',
        dayRecommendation: 'Mediados de Semana',
        durationMinutes: 45,
        focus: 'Tracción estética y estabilidad lumbar profunda sin carga axial',
        blocks: [
          {
            name: 'Bloque 1: Tracción con Soporte de Banco Completo (25 min)',
            icon: '🧘‍♀️',
            exercises: [
              {
                name: 'Remo en Banco Inclinado con Pecho Apoyado',
                sets: 4,
                reps: '10 - 12 reps',
                restSeconds: 75,
                substitute: 'Remo en Polea Baja Sentada con Agarre Neutro',
                note: 'Cero tensión en la espalda baja; la fuerza se transmite a los dorsales.'
              },
              {
                name: 'Jalón al Pecho con Agarre Neutro Cerrado',
                sets: 4,
                reps: '10 - 12 reps',
                restSeconds: 75,
                substitute: 'Remo invertido en multipower',
                note: 'Apertura de caja torácica y postura erguida.'
              },
              {
                name: 'Face Pulls en Polea con Cuerda',
                sets: 3,
                reps: '15 reps',
                restSeconds: 60,
                substitute: 'Pájaros con mancuernas ligeras apoyada en banco',
                note: 'Corrige hombros adelantados y alivia trapecios tensos.'
              }
            ]
          },
          {
            name: 'Bloque 2: Protocolo Clínico McGill Big 3 (20 min)',
            icon: '🛡️',
            exercises: [
              { name: 'Bird-Dog de Control Cruzado', sets: 3, reps: '8 por lado con pausa 3s', restSeconds: 45, substitute: 'Deadbug diafragmático', note: 'Estabilidad neuromuscular de la columna.' },
              { name: 'Plancha Lateral Apoyando Rodillas', sets: 3, reps: '30s por lado', restSeconds: 45, substitute: 'Puente lateral suave', note: 'Fortalecimiento de cuadrado lumbar.' },
              { name: 'Descompresión en Postura del Niño (Child Pose)', sets: 1, reps: '4 minutos', restSeconds: 0, substitute: 'Respiración diafragmática boca arriba', note: 'Alivio instantáneo de compresión.' }
            ]
          }
        ]
      },
      home_core: {
        id: 'home_core',
        name: 'Micro-Rutina Descompresión Lumbar & Core en Casa (10 min)',
        shortName: 'Core en Casa',
        icon: '🌸',
        dayRecommendation: 'Días Ocupados / Viaje / Descarga',
        durationMinutes: 10,
        focus: 'Alivio lumbar, glúteos dormidos y estabilidad intervertebral en casa',
        blocks: [
          {
            name: 'Secuencia de Descompresión & Glúteos',
            icon: '🌸',
            exercises: [
              { name: 'Puentes de Glúteo en Suelo con Pausa de 2s', sets: 3, reps: '15 reps', restSeconds: 30, substitute: 'Puente bilateral con banda', note: 'Activación máxima de glúteo sin arquear la lumbar.' },
              { name: 'Bird-Dog de Control Cruzado', sets: 3, reps: '10 por lado lentos', restSeconds: 30, substitute: 'Deadbug suave', note: 'Protocolo clínico McGill para blindar la columna.' },
              { name: 'Plancha Lateral Apoyando Rodillas', sets: 3, reps: '25s por lado', restSeconds: 30, substitute: 'Puente lateral suave', note: 'Fortalece cuadrado lumbar sin compresión.' },
              { name: 'Clamshells (Almejas) para Glúteo Medio', sets: 3, reps: '15 por lado', restSeconds: 20, substitute: 'Abducciones acostada', note: 'Estabilidad de cadera y alivio del nervio ciático.' },
              { name: 'Descompresión en Postura del Niño (Child Pose)', sets: 1, reps: '3 minutos', restSeconds: 0, substitute: 'Respiración diafragmática acostada boca arriba', note: 'Liberación de tensión muscular post-viaje o post-trabajo.' }
            ]
          }
        ]
      }
    },

    hermana: {
      mobility_gentle: {
        id: 'mobility_gentle',
        name: 'Movilidad Amable & Tono Relajado',
        shortName: 'Movilidad Suave',
        icon: '🌿',
        dayRecommendation: 'Cualquier Día',
        durationMinutes: 30,
        focus: 'Movilidad articular suave, respiración y bienestar sin fatiga',
        blocks: [
          {
            name: 'Secuencia de Movilidad Relajada',
            icon: '🌿',
            exercises: [
              { name: 'Círculos Suaves de Brazos y Hombros', sets: 3, reps: '10 hacia adelante y atrás', restSeconds: 30, substitute: 'Rotaciones de cuello suaves', note: 'Libera tensión en trapecios.' },
              { name: 'Estiramiento Suave de Espalda en Silla', sets: 3, reps: '30s por postura', restSeconds: 30, substitute: 'Inclinaciones laterales cómodas', note: 'Flexibilidad sin esfuerzo.' },
              { name: 'Paseo Suave en Casa o Patio', sets: 1, reps: '10 minutos', restSeconds: 0, substitute: 'Pasos en el sitio con música agradable', note: 'Movimiento gentil y vitalizante.' }
            ]
          }
        ]
      },
      walk_energy: {
        id: 'walk_energy',
        name: 'Paseo de Bienestar & Respiración Calmante',
        shortName: 'Paseo Vital',
        icon: '🚶‍♀️',
        dayRecommendation: 'Mañana o Tarde',
        durationMinutes: 20,
        focus: 'Oxigenación y calma corporal',
        blocks: [
          {
            name: 'Bienestar al Aire Libre',
            icon: '🌿',
            exercises: [
              { name: 'Paseo Suave al Aire Libre', sets: 1, reps: '15 minutos', restSeconds: 0, substitute: 'Movilidad en colchoneta suave', note: 'Disfrutar del aire libre a tu propio ritmo.' },
              { name: 'Respiraciones Profundas Conscientes', sets: 3, reps: '5 ciclos lentos', restSeconds: 30, substitute: 'Estiramiento de brazos al cielo', note: 'Bajar pulsaciones y recargar energía.' }
            ]
          }
        ]
      }
    }
  }
};

/**
 * 11. Intelligent Hybrid Workout Auto-Regulation & Split Engine
 * Dynamically computes readiness based on sleep, fatigue, location, past volume, and selected split.
 */
export function getHybridWorkoutPrescription({
  profile = null,
  selectedSplit = null,
  isMissedDay = false,
  sleepHours = 7.5,
  sleepQuality = 'deep',
  recentHeavyDays = 0,
  context = 'gym',
  durationMode = 'full'
}) {
  const profileId = profile?.id || 'andres';
  const profileSplits = HYBRID_ATHLETE_SYSTEM.splits[profileId] || HYBRID_ATHLETE_SYSTEM.splits.andres;
  const profileRoutines = HYBRID_ATHLETE_SYSTEM.routines[profileId] || HYBRID_ATHLETE_SYSTEM.routines.andres;

  // Determine effective split
  let activeSplitKey = selectedSplit;
  if (isMissedDay) {
    activeSplitKey = 'home_core';
  } else if (!activeSplitKey || !profileSplits[activeSplitKey]) {
    activeSplitKey = profileId === 'pareja' ? 'glutes_legs' : profileId === 'hermana' ? 'mobility_gentle' : (context === 'home_bars' || context === 'travel') ? 'full_upper' : 'legs';
  }

  // Get routine from split or context routine
  const splitRoutine = profileSplits[activeSplitKey];
  const contextRoutine = profileRoutines[context] || profileRoutines.gym;
  const routine = splitRoutine || contextRoutine;

  // CNS Readiness Assessment (0 to 100)
  let readiness = 90;
  const warnings = [];
  const recommendations = [];

  if (sleepHours < 6.5) {
    readiness -= 25;
    warnings.push(`⚠️ Sueño Corto (${sleepHours}h): Tu sistema nervioso central (SNC) tiene menor velocidad de reclutamiento neuromuscular.`);
  }
  if (sleepQuality === 'light') {
    readiness -= 15;
    warnings.push('⚠️ Recuperación Inquieta: Menor secreción de hormona de crecimiento en fase de ondas lentas.');
  }

  if (recentHeavyDays >= 2) {
    readiness -= 15;
    recommendations.push('⚡ Tejido Conectivo: Llevas 2 días pesados consecutivos. El sistema híbrido recomienda priorizar Habilidades de Calistenia (Handstand / Front Lever) y Quema Zona 2 para proteger tendones.');
  }

  let intensityMode = 'Máxima Sobrecarga & Habilidades';
  let badgeColor = '#10B981';

  if (readiness < 60) {
    intensityMode = 'Técnica & Descarga Activa';
    badgeColor = '#F59E0B';
    recommendations.push('🛡️ Auto-Regulación Activada: Reduce 15% las cargas o enfócate en el Bloque de Habilidades y Movilidad.');
  } else if (readiness < 75) {
    intensityMode = 'Hipertrofia Moderada & Habilidades';
    badgeColor = '#3B82F6';
  }

  const isExpress = durationMode === 'express' || isMissedDay;
  const effectiveMinutes = isExpress ? Math.min(45, routine.durationMinutes) : routine.durationMinutes;

  return {
    profileId,
    selectedSplit: activeSplitKey,
    isMissedDay,
    context,
    routineTitle: routine.name || routine.title,
    durationMinutes: effectiveMinutes,
    focus: routine.focus,
    readinessScore: readiness,
    intensityMode,
    badgeColor,
    warnings,
    recommendations,
    blocks: routine.blocks || [],
    skillTree: HYBRID_ATHLETE_SYSTEM.skillTree
  };
}

/**
 * 12. Dynamic Weekly Workout History & Balance Analyzer
 * Inspects what was actually trained this week and recommends missing muscle groups
 */
export function analyzeWeeklyWorkoutBalance({ weeklyLogs = {}, profileId = 'andres' }) {
  const logEntries = Object.values(weeklyLogs || {});
  const completed = logEntries.filter((l) => l && (l.done || l.status === 'completed'));
  const missed = logEntries.filter((l) => l && (l.status === 'missed' || l.isMissedDay));

  const legsCount = completed.filter((l) => l.split === 'legs' || l.split === 'glutes_legs' || l.title?.toLowerCase().includes('piernas') || l.title?.toLowerCase().includes('glúteo')).length;
  const pushCount = completed.filter((l) => l.split === 'push' || l.title?.toLowerCase().includes('pecho') || l.title?.toLowerCase().includes('empuje')).length;
  const pullCount = completed.filter((l) => l.split === 'pull' || l.split === 'back_posture' || l.title?.toLowerCase().includes('espalda') || l.title?.toLowerCase().includes('tracción')).length;
  const coreCount = completed.filter((l) => l.split === 'home_core' || l.title?.toLowerCase().includes('planchas') || l.title?.toLowerCase().includes('core')).length;

  let recommendedSplit = 'legs';
  let weeklySummaryText = '';

  if (profileId === 'pareja') {
    if (legsCount === 0) {
      recommendedSplit = 'glutes_legs';
      weeklySummaryText = '💡 Sugerencia Semanal: Inicia tu semana activando Glúteos & Femoral con cero compresión axial.';
    } else if (pullCount === 0) {
      recommendedSplit = 'back_posture';
      weeklySummaryText = '💡 Sugerencia Semanal: Ya trabajaste Glúteos. Hoy es ideal para Tracción, Postura y McGill Big 3.';
    } else {
      recommendedSplit = 'glutes_legs';
      weeklySummaryText = '💡 Sugerencia Semanal: Excelente balance semanal. Continúa esculpiendo glúteos de forma segura.';
    }
  } else if (profileId === 'hermana') {
    recommendedSplit = 'mobility_gentle';
    weeklySummaryText = '💡 Sugerencia Amable: Mantén tu vitalidad con un paseo suave o estiramientos relajantes a tu ritmo.';
  } else {
    // Andrés Hybrid logic
    if (legsCount === 0) {
      recommendedSplit = 'legs';
      weeklySummaryText = '💡 Sugerencia Semanal: Empieza la semana con Piernas Pesado para disparar la producción hormonal y fuerza base.';
    } else if (pullCount === 0 && pushCount === 0) {
      recommendedSplit = 'pull';
      weeklySummaryText = '💡 Sugerencia Semanal: Ya completaste Piernas el lunes. Para balancear tu torso y compensar lo que faltó la semana anterior, hoy se recomienda: 🦅 Espalda & Tracción Pesada + Front Lever.';
    } else if (pullCount === 0) {
      recommendedSplit = 'pull';
      weeklySummaryText = '💡 Sugerencia Semanal: Tu espalda necesita tracción pesada y palanca de Front Lever para compensar el empuje.';
    } else if (pushCount === 0) {
      recommendedSplit = 'push';
      weeklySummaryText = '💡 Sugerencia Semanal: Ya hiciste Piernas y Espalda. Hoy toca: 🛡️ Pecho & Empuje Pesado + Handstand.';
    } else {
      recommendedSplit = 'full_upper';
      weeklySummaryText = '💡 Sugerencia Semanal: Has cubierto los grandes pilares de fuerza. Hoy puedes hacer Torso Híbrido o practicar trucos de Calistenia.';
    }
  }

  return {
    completedCount: completed.length,
    missedCount: missed.length,
    legsCount,
    pushCount,
    pullCount,
    coreCount,
    recommendedSplit,
    weeklySummaryText
  };
}

/**
 * 13. Systemic 4 Pillars Engine (Bioconexión 360°)
 * Evaluates Nutrition, Workout, Sleep, and Habits into an interconnected AuraScore
 * with dynamic cross-pillar synergies.
 */
export function calculateSystemicPillars({
  profile = null,
  loggedFoods = [],
  targets = {},
  waterMl = 0,
  sleepHours = 7.5,
  sleepQuality = 'deep',
  selectedSplit = 'legs',
  isMissedDay = false,
  todayWorkoutDone = false,
  habits = [],
  weeklyLogs = {}
}) {
  const profileId = profile?.id || 'andres';
  const targetCals = targets.calories || 2150;
  const targetProt = targets.protein || 195;
  const targetWater = profile?.waterDailyMl || 3000;

  // 1. Pillar 1: Nutrition & Cellular Fuel (0 to 25 pts)
  const totalCals = loggedFoods.reduce((a, c) => a + (Number(c.calories) || 0), 0);
  const totalProt = loggedFoods.reduce((a, c) => a + (Number(c.protein) || 0), 0);
  const protRatio = targetProt > 0 ? Math.min(1.2, totalProt / targetProt) : 0;
  const waterRatio = targetWater > 0 ? Math.min(1.2, waterMl / targetWater) : 0;
  
  let p1_nutrition = 18;
  if (loggedFoods.length > 0) {
    p1_nutrition = Math.round(15 * Math.min(1, protRatio) + 10 * Math.min(1, waterRatio));
  } else {
    p1_nutrition = Math.round(12 + 8 * Math.min(1, waterRatio));
  }
  p1_nutrition = Math.max(10, Math.min(25, p1_nutrition));

  // 2. Pillar 2: Workout & Hybrid Overload (0 to 25 pts)
  let p2_workout = todayWorkoutDone ? 25 : (isMissedDay ? 16 : 18);
  if (sleepHours < 6.5) p2_workout -= 4;
  p2_workout = Math.max(10, Math.min(25, p2_workout));

  // 3. Pillar 3: Sleep, CNS & Circadian Rhythm (0 to 25 pts)
  let p3_sleep = 20;
  if (sleepHours >= 7.5 && sleepQuality === 'deep') p3_sleep = 25;
  else if (sleepHours >= 6.5 && sleepQuality !== 'light') p3_sleep = 21;
  else if (sleepHours < 6.5) p3_sleep = 14;
  if (sleepQuality === 'light') p3_sleep -= 3;
  p3_sleep = Math.max(10, Math.min(25, p3_sleep));

  // 4. Pillar 4: Biohacking & Daily Habits (0 to 25 pts)
  const totalHabits = habits.length || 1;
  const doneHabits = habits.filter((h) => h.completed).length;
  const habitRatio = doneHabits / totalHabits;
  let p4_habits = Math.round(15 + 10 * habitRatio);
  p4_habits = Math.max(10, Math.min(25, p4_habits));

  const totalAuraScore = Math.min(100, p1_nutrition + p2_workout + p3_sleep + p4_habits);

  let statusGrade = 'Cuerpo Activo';
  if (totalAuraScore >= 90) statusGrade = '✨ Cuerpo Óptimo / Estado de Flujo';
  else if (totalAuraScore >= 80) statusGrade = '🔥 Rendimiento Elevado';
  else if (totalAuraScore >= 70) statusGrade = '⚡ Vitalidad Estable';

  // Cross-Pillar Synergies Generation (Dynamic)
  const synergies = [];

  // Synergy A: Nutrition ⟷ Workout Split
  if (isMissedDay || selectedSplit === 'home_core') {
    synergies.push({
      id: 'syn_missed_nutrition',
      category: 'nutrition_workout',
      icon: '🥗',
      title: 'Sinergia Nutrición: Día de Descanso / Core',
      text: 'Al no haber sobrecarga pesada hoy, modera los carbohidratos peri-entreno. Prioriza 40g de proteína magra en cada comida y vegetales saciantes para maximizar la sensibilidad a la insulina sin ganar grasa.'
    });
  } else if (selectedSplit === 'legs' || selectedSplit === 'glutes_legs') {
    synergies.push({
      id: 'syn_legs_fuel',
      category: 'nutrition_workout',
      icon: '🥔',
      title: profileId === 'pareja' ? 'Sinergia Glúteos: Síntesis Proteica' : 'Sinergia Piernas Pesado: Combustible Anabólico',
      text: profileId === 'pareja' 
        ? 'Día de Glúteos sin compresión axial: Consume 30g de proteína limpia post-entreno y alimentos antiinflamatorios (aceite de oliva, cúrcuma) para cuidar discos lumbares.'
        : 'Día de Piernas Pesado: Necesitas glucógeno denso. Añade +40g de carbohidratos limpios (arroz o papa andina) en tu comida previa y satura 5g de creatina para máxima potencia en sentadilla y prensa.'
    });
  } else if (selectedSplit === 'pull' || selectedSplit === 'back_posture') {
    synergies.push({
      id: 'syn_pull_fuel',
      category: 'nutrition_workout',
      icon: '🦅',
      title: 'Sinergia Tracción & Espalda: Fuerza de Agarre',
      text: 'Para transferir potencia a dominadas y Front Lever, consume tu comida 90 min antes para evitar pesadez estomacal y tener la máxima conexión neuromuscular en dorsales.'
    });
  } else {
    synergies.push({
      id: 'syn_push_fuel',
      category: 'nutrition_workout',
      icon: '🛡️',
      title: 'Sinergia Empuje & Handstand: Presión & Estabilidad',
      text: 'Carga moderada de carbohidratos y buena hidratación celular para empuje vertical estable sin congestión gástrica.'
    });
  }

  // Synergy B: Hydration ⟷ Muscle Performance
  const waterPct = Math.round((waterMl / targetWater) * 100);
  synergies.push({
    id: 'syn_hydration',
    category: 'hydration_muscle',
    icon: '💧',
    title: 'Hidratación Muscular & Tejido Conectivo',
    text: waterPct < 50
      ? `Llevas ${waterMl}ml (${waterPct}% de tu meta). Tus fibras musculares están al ${waterPct}% de hidratación. Toma 500ml con una pizca de sal marina antes de iniciar tu sesión pesada para prevenir calambres.`
      : `¡Excelente nivel de hidratación (${waterMl}ml, ${waterPct}%)! Tus discos intervertebrales y articulaciones tienen amortiguación osmótica óptima para sobrecarga.`
  });

  // Synergy C: Sleep & CNS ⟷ Metabolism
  if (sleepHours < 6.5) {
    synergies.push({
      id: 'syn_sleep_cns',
      category: 'sleep_metabolism',
      icon: '🛌',
      title: 'Sinergia Sueño Corto: Control de Grelina',
      text: `Dormiste ${sleepHours}h: Tu leptina (saciedad) cae y sube la grelina (hambre). Inicia el día con desayuno de huevos y fibra para evitar picos de ansiedad por comida procesada.`
    });
  }

  return {
    totalAuraScore,
    statusGrade,
    breakdown: {
      nutrition: p1_nutrition,
      workout: p2_workout,
      sleep: p3_sleep,
      habits: p4_habits
    },
    synergies
  };
}



