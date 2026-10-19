'use client';

import { useState, useEffect, useMemo } from 'react';
import BottomNav from './BottomNav';
import {
  DEFAULT_HABITS,
  DEFAULT_USER_PROFILE,
  FAMILY_PROFILES,
  calculateProfileTargets,
  calculateLeanBulkTargets,
  generateMealsFromPantry,
  DAMAGE_CONTROL_PROTOCOL,
  WORKOUT_ROUTINES,
  calculateWeightAnalytics,
  calculateNutritionalScore,
  calculateDailyAuraScore
} from '@/lib/fitness-data';
import {
  CURATED_PERUVIAN_FOODS,
  parseNaturalLanguageFood,
  calculateCompensatoryRebalance
} from '@/lib/food-database';

export const PANTRY_CATEGORIES = [
  {
    id: 'proteinas',
    name: 'Proteínas',
    icon: '🥩',
    desc: 'Anabólicas y saciantes',
    items: [
      { id: 'huevos', name: 'Huevos de Granja', icon: '🥚', defaultG: '3 unidades' },
      { id: 'pollo', name: 'Pechuga de Pollo', icon: '🍗', defaultG: '180g filete' },
      { id: 'atun', name: 'Atún en Conserva', icon: '🐟', defaultG: '1 lata (140g)' },
      { id: 'carne', name: 'Carne Magra Molida', icon: '🥩', defaultG: '160g' },
      { id: 'queso', name: 'Queso Fresco Pasteurizado', icon: '🧀', defaultG: '70g en cubos' },
      { id: 'leche', name: 'Leche o Bebida Proteica', icon: '🥛', defaultG: '250ml' }
    ]
  },
  {
    id: 'carbohidratos',
    name: 'Carbohidratos',
    icon: '🥣',
    desc: 'Energía glucogénica limpia',
    items: [
      { id: 'avena', name: 'Hojuelas de Avena', icon: '🥣', defaultG: '60g en seco' },
      { id: 'arroz', name: 'Arroz Blanco / Integral', icon: '🍚', defaultG: '150g cocido' },
      { id: 'platano', name: 'Plátano de Seda', icon: '🍌', defaultG: '1 unidad mediana' },
      { id: 'papa', name: 'Papa Amarilla Andina', icon: '🥔', defaultG: '200g cocida' },
      { id: 'camote', name: 'Camote Horneado', icon: '🍠', defaultG: '180g' },
      { id: 'pan', name: 'Pan Integral Masa Madre', icon: '🍞', defaultG: '2 rebanadas' }
    ]
  },
  {
    id: 'grasas',
    name: 'Grasas Buenas',
    icon: '🥑',
    desc: 'Salud hormonal y absorción',
    items: [
      { id: 'palta', name: 'Palta Hass Madura', icon: '🥑', defaultG: '1/2 unidad (80g)' },
      { id: 'mantequilla', name: 'Mantequilla de Pastura', icon: '🧈', defaultG: '1 cucharada (14g)' },
      { id: 'aceite', name: 'Aceite de Oliva Extra Virgen', icon: '🫒', defaultG: '1 cucharada (10ml)' },
      { id: 'mani', name: 'Maní o Mantequilla Maní', icon: '🥜', defaultG: '25g o 1 cda' }
    ]
  },
  {
    id: 'verduras',
    name: 'Verduras & Frescos',
    icon: '🥦',
    desc: 'Micronutrientes y fibra',
    items: [
      { id: 'espinacas', name: 'Espinacas Frescas', icon: '🥬', defaultG: '1 taza colmada' },
      { id: 'brocoli', name: 'Brócoli al Vapor', icon: '🥦', defaultG: '120g floretes' },
      { id: 'tomate', name: 'Tomate Maduro', icon: '🍅', defaultG: '1 unidad en gajos' },
      { id: 'cebolla', name: 'Cebolla Roja Picada', icon: '🧅', defaultG: '1/2 unidad' },
      { id: 'limon', name: 'Limón Sutil Peruano', icon: '🍋', defaultG: '2 unidades exprimidas' }
    ]
  }
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('nutrition'); // Fitia default
  const [isDarkMode, setIsDarkMode] = useState(false); // Fitia Signature Light Mode as default
  const [selectedDay, setSelectedDay] = useState(12); // Wednesday (M)
  
  // Multi-Profile State (Andrés, Pareja, Hermana)
  const [activeProfileId, setActiveProfileId] = useState('andres');
  const [familyProfiles, setFamilyProfiles] = useState(FAMILY_PROFILES);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);

  // PIN Privacy & Biometric Security
  const [isLocked, setIsLocked] = useState(false);
  const [pinTargetProfileId, setPinTargetProfileId] = useState('andres');
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isShakingPin, setIsShakingPin] = useState(false);

  // Administrator PIN Management State (Master Control)
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPins, setAdminPins] = useState({ andres: '1234', pareja: '5678', hermana: '9012' });
  const [pinVisibility, setPinVisibility] = useState({ andres: false, pareja: false, hermana: false });

  // Wim Hof Interactive Breathwork State (Andrés Biohacking)
  const [showWimHofModal, setShowWimHofModal] = useState(false);
  const [wimHofRound, setWimHofRound] = useState(1);
  const [wimHofBreathCount, setWimHofBreathCount] = useState(0);
  const [wimHofPhase, setWimHofPhase] = useState('breathing'); // 'breathing', 'holding', 'recovery'
  const [wimHofHoldSeconds, setWimHofHoldSeconds] = useState(0);

  // Current active profile & dynamic targets
  const currentProfile = useMemo(() => {
    return familyProfiles[activeProfileId] || FAMILY_PROFILES.andres;
  }, [familyProfiles, activeProfileId]);

  const targets = useMemo(() => {
    return calculateProfileTargets(currentProfile);
  }, [currentProfile]);

  const [habits, setHabits] = useState(FAMILY_PROFILES.andres.habits);
  // Daily Water Tracker: Starts at 0 every single day!
  const [waterMl, setWaterMl] = useState(0);
  const [streakDays, setStreakDays] = useState(213);
  const [showDamageControl, setShowDamageControl] = useState(false);
  const [showTextLogModal, setShowTextLogModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Sleep & Recovery State (Interactive Sleep Logger)
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState('deep'); // 'deep', 'normal', 'light'

  // Daily Workout Completion Tracking (Intelligent Activity Pillar)
  const [todayWorkoutDone, setTodayWorkoutDone] = useState(false);
  const [workoutDurationMins, setWorkoutDurationMins] = useState(45);

  // Daily Logged Foods State (persistent per profile)
  const [loggedFoods, setLoggedFoods] = useState([]);

  // Dynamic Nutritional Score Engine (0-100 Scientific Fitia Algorithm)
  const nutritionalScore = useMemo(() => {
    return calculateNutritionalScore({
      loggedFoods,
      targets,
      waterMl,
      waterTargetMl: currentProfile.waterDailyMl || 2500,
      profile: currentProfile
    });
  }, [loggedFoods, targets, waterMl, currentProfile]);

  // Unified Intelligent Daily Score: AuraScore del Día (0-100)
  const dailyAuraScore = useMemo(() => {
    const completedHabitsCount = habits.filter((h) => h.completed).length;
    return calculateDailyAuraScore({
      nutritionScore: nutritionalScore.score,
      workoutDone: todayWorkoutDone,
      workoutMinutes: workoutDurationMins,
      sleepHours,
      sleepQuality,
      completedHabits: completedHabitsCount,
      totalHabits: habits.length,
      profile: currentProfile
    });
  }, [nutritionalScore.score, todayWorkoutDone, workoutDurationMins, sleepHours, sleepQuality, habits, currentProfile]);

  // Food Search Modal (+2M Database)
  const [showFoodSearchModal, setShowFoodSearchModal] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [foodFilterCategory, setFoodFilterCategory] = useState('all');
  const [foodSearchResults, setFoodSearchResults] = useState(CURATED_PERUVIAN_FOODS);
  const [isSearchingFood, setIsSearchingFood] = useState(false);
  const [targetMealSlot, setTargetMealSlot] = useState('snack');
  const [selectedFoodToLog, setSelectedFoodToLog] = useState(null);
  const [customGrams, setCustomGrams] = useState(50);
  
  // Nutrition & Pantry state (Fitia Coach)
  const [selectedIngredients, setSelectedIngredients] = useState(['huevos', 'avena', 'platano', 'pollo', 'arroz']);
  const [pantryCategoryTab, setPantryCategoryTab] = useState('proteinas');
  const [pantryMealSlotFilter, setPantryMealSlotFilter] = useState('all');
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');
  const [meals, setMeals] = useState([]);
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState(null);
  const [recipeSlotToLog, setRecipeSlotToLog] = useState('comida');
  const [quickTextEntry, setQuickTextEntry] = useState('3 huevos fritos con jna cucharada de mantequilla');

  // Interactive Recipe Portion Scaling State (Fitia Scaler)
  const [recipePortionMultipliers, setRecipePortionMultipliers] = useState({});
  const getRecipeMultiplier = (mealId) => recipePortionMultipliers[mealId] || 1.0;
  const handleAdjustRecipeMultiplier = (mealId, delta) => {
    setRecipePortionMultipliers((prev) => {
      const current = prev[mealId] || 1.0;
      const next = Math.min(2.5, Math.max(0.5, Math.round((current + delta) * 100) / 100));
      return { ...prev, [mealId]: next };
    });
  };
  const handleSetRecipeMultiplier = (mealId, val) => {
    setRecipePortionMultipliers((prev) => ({ ...prev, [mealId]: val }));
  };
  
  // Workout state
  const [workoutMode, setWorkoutMode] = useState('gym');
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Weight tracking state
  const [weightLogs, setWeightLogs] = useState([
    { log_date: '10 Oct', weight_kg: 92.4 },
    { log_date: '11 Oct', weight_kg: 92.2 },
    { log_date: '12 Oct', weight_kg: 92.0 },
    { log_date: '13 Oct', weight_kg: 91.8 },
    { log_date: '14 Oct', weight_kg: 92.1 },
    { log_date: '15 Oct', weight_kg: 91.7 },
    { log_date: '16 Oct', weight_kg: 91.9 },
    { log_date: '17 Oct', weight_kg: 91.6 }
  ]);
  const [newWeightInput, setNewWeightInput] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);

  const weightAnalytics = calculateWeightAnalytics(weightLogs);

  // Load local storage if available on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('aurafit_theme');
      if (savedTheme === 'dark') setIsDarkMode(true);

      const savedProfiles = localStorage.getItem('aurafit_family_profiles');
      if (savedProfiles) {
        const parsed = JSON.parse(savedProfiles);
        const merged = { ...FAMILY_PROFILES };
        Object.keys(parsed).forEach((k) => {
          merged[k] = {
            ...FAMILY_PROFILES[k],
            ...parsed[k],
            pin: (parsed[k].pin || FAMILY_PROFILES[k]?.pin || '1234').toString()
          };
        });
        setFamilyProfiles(merged);
      }

      const savedActiveProfile = localStorage.getItem('aurafit_active_profile');
      const activeKey = savedActiveProfile && FAMILY_PROFILES[savedActiveProfile] ? savedActiveProfile : 'andres';
      setActiveProfileId(activeKey);
      loadProfileData(activeKey);

      const savedIngredients = localStorage.getItem('aurafit_ingredients');
      if (savedIngredients) setSelectedIngredients(JSON.parse(savedIngredients));
    } catch (err) {
      console.warn('Storage sync err:', err);
    }
  }, []);

  const loadProfileData = (profileKey) => {
    try {
      const prof = FAMILY_PROFILES[profileKey];
      if (!prof) return;

      // 1. Check profile-specific storage key
      let savedFoods = null;
      const rawProfileFoods = localStorage.getItem(`aurafit_foods_${profileKey}`);
      if (rawProfileFoods) {
        try {
          const parsed = JSON.parse(rawProfileFoods);
          if (Array.isArray(parsed) && parsed.length > 0) {
            savedFoods = parsed;
          }
        } catch (e) {}
      }

      // 2. Migration fallback: check legacy storage keys where user's phone might have logged foods
      if (!savedFoods || savedFoods.length === 0) {
        const legacyRaw = localStorage.getItem('aurafit_logged_foods') || localStorage.getItem('aurafit_backup_last_logged');
        if (legacyRaw) {
          try {
            const legacyParsed = JSON.parse(legacyRaw);
            if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
              savedFoods = legacyParsed;
              // Migrate and persist to this profile immediately so it is never lost
              localStorage.setItem(`aurafit_foods_${profileKey}`, JSON.stringify(legacyParsed));
            }
          } catch (e) {}
        }
      }

      // 3. Set logged foods - NEVER overwrite user's actual food with mock data!
      if (savedFoods && Array.isArray(savedFoods)) {
        setLoggedFoods(savedFoods);
      } else {
        // If profile has no previous entries, keep existing state if any, or empty array
        setLoggedFoods((prev) => (prev && prev.length > 0 ? prev : []));
      }

      const savedHabits = localStorage.getItem(`aurafit_habits_${profileKey}`);
      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      } else {
        setHabits(prof.habits || []);
      }

      // Daily Water Tracker: Starts at 0 every single day!
      const todayKey = new Date().toISOString().split('T')[0];
      const savedWaterDaily = localStorage.getItem(`aurafit_water_daily_${profileKey}`);
      if (savedWaterDaily) {
        try {
          const parsed = JSON.parse(savedWaterDaily);
          if (parsed.date === todayKey && typeof parsed.ml === 'number') {
            setWaterMl(parsed.ml);
          } else {
            setWaterMl(0);
          }
        } catch (e) {
          setWaterMl(0);
        }
      } else {
        setWaterMl(0);
      }

      // Sleep & Recovery State for current profile
      const savedSleep = localStorage.getItem(`aurafit_sleep_${profileKey}`);
      if (savedSleep) {
        try {
          const parsed = JSON.parse(savedSleep);
          if (parsed.hours) setSleepHours(parsed.hours);
          if (parsed.quality) setSleepQuality(parsed.quality);
        } catch (e) {}
      } else {
        setSleepHours(7.5);
        setSleepQuality('deep');
      }

      // Daily Workout Completion Tracking for current profile
      const savedWorkout = localStorage.getItem(`aurafit_workout_${profileKey}`);
      if (savedWorkout) {
        try {
          const parsed = JSON.parse(savedWorkout);
          if (parsed.date === todayKey) {
            setTodayWorkoutDone(!!parsed.done);
            if (parsed.minutes) setWorkoutDurationMins(parsed.minutes);
          } else {
            setTodayWorkoutDone(false);
          }
        } catch (e) {}
      } else {
        setTodayWorkoutDone(false);
      }

      const savedWeights = localStorage.getItem(`aurafit_weights_${profileKey}`);
      if (savedWeights) {
        setWeightLogs(JSON.parse(savedWeights));
      } else {
        setWeightLogs([
          { log_date: '10 Oct', weight_kg: prof.weightKg + 0.6 },
          { log_date: '12 Oct', weight_kg: prof.weightKg + 0.3 },
          { log_date: '15 Oct', weight_kg: prof.weightKg + 0.1 },
          { log_date: '17 Oct', weight_kg: prof.weightKg }
        ]);
      }
    } catch (e) {
      console.warn('Error loading profile data:', e);
    }
  };

  const executeProfileSwitch = (newId) => {
    if (!familyProfiles[newId]) return;
    // CRITICAL: Persist current profile's logged foods before switching!
    try {
      if (loggedFoods && loggedFoods.length > 0) {
        localStorage.setItem(`aurafit_foods_${activeProfileId}`, JSON.stringify(loggedFoods));
      }
    } catch (e) {}

    setActiveProfileId(newId);
    try {
      localStorage.setItem('aurafit_active_profile', newId);
    } catch (e) {}
    loadProfileData(newId);
    setIsLocked(false);
    setEnteredPin('');
    setPinError('');
    const prof = familyProfiles[newId];
    showToast(`🔓 ¡Perfil cambiado a ${prof.name}! (${prof.role})`);
  };

  const handleSwitchProfile = (newId) => {
    if (!familyProfiles[newId]) return;
    if (newId === activeProfileId && !isLocked) {
      setEditingProfile({ ...currentProfile });
      setShowProfileModal(true);
      return;
    }
    // Demand PIN to switch profile
    setPinTargetProfileId(newId);
    setEnteredPin('');
    setPinError('');
    setIsLocked(true);
  };

  const handlePinDigit = (digit) => {
    if (enteredPin.length >= 4) return;
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);
    setPinError('');

    if (nextPin.length === 4) {
      const targetProf = familyProfiles[pinTargetProfileId] || FAMILY_PROFILES[pinTargetProfileId] || familyProfiles.andres;
      const expectedPin = (targetProf.pin || '1234').toString();
      const adminPin = (familyProfiles.andres?.pin || FAMILY_PROFILES.andres.pin || '1234').toString();

      // Either profile PIN OR Admin (Andrés) Master PIN unlocks!
      if (nextPin === expectedPin || nextPin === adminPin) {
        const isAdminBypass = nextPin === adminPin && nextPin !== expectedPin;
        setTimeout(() => {
          executeProfileSwitch(pinTargetProfileId);
          if (isAdminBypass) {
            showToast(`🛡️ Acceso concedido con PIN Maestro de Administrador (Andrés).`);
          }
        }, 150);
      } else {
        setIsShakingPin(true);
        setPinError('PIN incorrecto. Intenta de nuevo.');
        setTimeout(() => {
          setEnteredPin('');
          setIsShakingPin(false);
        }, 450);
      }
    }
  };

  const handlePinBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinError('');
  };

  const handleLockApp = () => {
    setPinTargetProfileId(activeProfileId);
    setEnteredPin('');
    setPinError('');
    setIsLocked(true);
    showToast('🔒 Perfil bloqueado. Se requiere PIN para ingresar.');
  };

  const handleOpenAdminPinModal = () => {
    setAdminPins({
      andres: (familyProfiles.andres?.pin || FAMILY_PROFILES.andres.pin || '1234').toString(),
      pareja: (familyProfiles.pareja?.pin || FAMILY_PROFILES.pareja.pin || '5678').toString(),
      hermana: (familyProfiles.hermana?.pin || FAMILY_PROFILES.hermana.pin || '9012').toString()
    });
    setShowAdminPinModal(true);
  };

  const handleSaveAdminPins = (newPins) => {
    const pinsToSave = newPins || adminPins;
    setFamilyProfiles((prev) => {
      const next = {
        ...prev,
        andres: { ...prev.andres, pin: (pinsToSave.andres || '1234').toString().replace(/\D/g, '').slice(0, 4) },
        pareja: { ...prev.pareja, pin: (pinsToSave.pareja || '5678').toString().replace(/\D/g, '').slice(0, 4) },
        hermana: { ...prev.hermana, pin: (pinsToSave.hermana || '9012').toString().replace(/\D/g, '').slice(0, 4) }
      };
      try {
        localStorage.setItem('aurafit_family_profiles', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setShowAdminPinModal(false);
    showToast('🛡️ ¡PINs de los 3 perfiles actualizados y sincronizados!');
  };

  const handleSaveProfileChanges = (updatedProfile) => {
    setFamilyProfiles((prev) => {
      const next = { ...prev, [updatedProfile.id]: updatedProfile };
      try {
        localStorage.setItem('aurafit_family_profiles', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    // CRITICAL: Ensure current foods remain safely saved and NOT replaced
    try {
      localStorage.setItem(`aurafit_foods_${activeProfileId}`, JSON.stringify(loggedFoods));
      localStorage.setItem('aurafit_logged_foods', JSON.stringify(loggedFoods));
    } catch (e) {}
    setShowProfileModal(false);
    showToast(`✅ Perfil de ${updatedProfile.name} actualizado. Tus comidas y registros se mantienen intactos.`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  const persistLoggedFoods = (updater) => {
    setLoggedFoods((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(`aurafit_foods_${activeProfileId}`, JSON.stringify(next));
        localStorage.setItem('aurafit_logged_foods', JSON.stringify(next));
        localStorage.setItem('aurafit_backup_last_logged', JSON.stringify(next));
      } catch (e) {
        console.warn('Storage save err:', e);
      }
      return next;
    });
  };

  // Mathematical Totals & Rebalance Engine
  const consumedTotals = useMemo(() => {
    return loggedFoods.reduce(
      (acc, item) => ({
        calories: acc.calories + (Number(item.calories) || 0),
        protein: acc.protein + (Number(item.protein) || 0),
        carbs: acc.carbs + (Number(item.carbs) || 0),
        fat: acc.fat + (Number(item.fat) || 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [loggedFoods]);

  const compensator = useMemo(() => {
    return calculateCompensatoryRebalance({ loggedFoods, targets });
  }, [loggedFoods, targets]);

  const detectedInText = useMemo(() => {
    return parseNaturalLanguageFood(quickTextEntry);
  }, [quickTextEntry]);

  // Macro Gap for didactic food recommendation
  const macroGap = useMemo(() => {
    const targetP = targets.protein || 150;
    const targetC = targets.calories || 2000;
    const pDiff = Math.max(0, targetP - (consumedTotals.protein || 0));
    const calDiff = Math.max(0, targetC - (consumedTotals.calories || 0));
    return {
      protein: Math.round(pDiff),
      calories: Math.round(calDiff),
      isMet: pDiff <= 5 && calDiff <= 100
    };
  }, [targets, consumedTotals]);

  // Food Search API Debounce
  useEffect(() => {
    let active = true;
    if (!foodSearchQuery.trim()) {
      setFoodSearchResults(CURATED_PERUVIAN_FOODS);
      setIsSearchingFood(false);
      return;
    }

    setIsSearchingFood(true);
    const timer = setTimeout(() => {
      fetch(`/api/food-search?q=${encodeURIComponent(foodSearchQuery.trim())}`)
        .then((r) => r.json())
        .then((data) => {
          if (active && data.results) {
            setFoodSearchResults(data.results);
          }
        })
        .catch(() => {
          if (active) {
            const q = foodSearchQuery.toLowerCase();
            setFoodSearchResults(
              CURATED_PERUVIAN_FOODS.filter(
                (f) => f.name.toLowerCase().includes(q) || f.brand.toLowerCase().includes(q)
              )
            );
          }
        })
        .finally(() => {
          if (active) setIsSearchingFood(false);
        });
    }, 280);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [foodSearchQuery]);

  const handleRegisterFoodFromSearch = (food, slot = 'snack', grams = 50) => {
    const scale = grams / (food.grams || 100);
    const newEntry = {
      id: `food-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: food.name,
      brand: food.brand,
      mealSlot: slot,
      servingDesc: `${grams}g`,
      grams: grams,
      calories: Math.round((food.calories || 0) * scale),
      protein: parseFloat(((food.protein || 0) * scale).toFixed(1)),
      carbs: parseFloat(((food.carbs || 0) * scale).toFixed(1)),
      fat: parseFloat(((food.fat || 0) * scale).toFixed(1)),
      icon: food.icon || '🥗',
      isSnack: food.isSnack || false,
      isUltraProcessed: food.isUltraProcessed || false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    persistLoggedFoods((prev) => [newEntry, ...prev]);
    setShowFoodSearchModal(false);
    setSelectedFoodToLog(null);
    setFoodSearchQuery('');

    if (newEntry.isSnack || newEntry.name.toLowerCase().includes('chifle') || newEntry.name.toLowerCase().includes('keke')) {
      showToast(`¡${newEntry.name} registrado! ⚡ El Compensador Inteligente ha calculado tu pivote proteico.`);
    } else {
      showToast(`¡${newEntry.name} registrado en ${slot.toUpperCase()}!`);
    }
  };

  const handleRegisterCustomTypedFood = (typedName, slot = 'snack', customWeight = 100) => {
    if (!typedName || !typedName.trim()) return;
    const nameClean = typedName.trim();
    const parsedList = parseNaturalLanguageFood(nameClean);

    if (parsedList && parsedList.length > 0) {
      const first = parsedList[0];
      const newEntry = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: first.name,
        brand: 'Compendio Nutricional Fitia',
        mealSlot: slot,
        servingDesc: first.servingDesc || `${first.grams || customWeight}g`,
        grams: first.grams || customWeight,
        calories: first.calories || 220,
        protein: first.protein || 12,
        carbs: first.carbs || 25,
        fat: first.fat || 8,
        icon: first.icon || '🍽️',
        isSnack: first.isSnack || slot === 'snack',
        isUltraProcessed: first.isUltraProcessed || false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      persistLoggedFoods((prev) => [newEntry, ...prev]);
    } else {
      const isSnackLike = /dulce|postre|snack|chocolate|torta|fritura|galleta|queque|keke|chifle|chifles/i.test(nameClean);
      const estCals = isSnackLike ? 280 : 210;
      const estP = isSnackLike ? 3.5 : 15.0;
      const estC = isSnackLike ? 36.0 : 22.0;
      const estF = isSnackLike ? 12.0 : 6.0;

      const newEntry = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: nameClean,
        brand: 'Alimento Personalizado',
        mealSlot: slot,
        servingDesc: `1 porción (${customWeight}g)`,
        grams: customWeight,
        calories: estCals,
        protein: estP,
        carbs: estC,
        fat: estF,
        icon: isSnackLike ? '🍌' : '🍽️',
        isSnack: isSnackLike || slot === 'snack',
        isUltraProcessed: isSnackLike,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      persistLoggedFoods((prev) => [newEntry, ...prev]);
    }

    setShowFoodSearchModal(false);
    setFoodSearchQuery('');
    showToast(`✨ ¡"${nameClean}" registrado en ${slot.toUpperCase()}!`);
  };

  const handleConfirmTextLog = (detectedList, slot = 'snack') => {
    if (!detectedList || detectedList.length === 0) {
      // Create fallback item from raw text
      const rawEntry = {
        id: `raw-${Date.now()}`,
        name: quickTextEntry.slice(0, 40),
        brand: 'Registro Manual',
        mealSlot: slot,
        servingDesc: 'Porción estimada',
        grams: 100,
        calories: 380,
        protein: 15,
        carbs: 45,
        fat: 12,
        icon: '✍️',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      persistLoggedFoods((prev) => [rawEntry, ...prev]);
      setShowTextLogModal(false);
      showToast('¡Alimentos registrados con éxito!');
      return;
    }

    const newEntries = detectedList.map((item) => ({
      id: `text-${Date.now()}-${item.id}`,
      name: item.name,
      brand: item.brand,
      mealSlot: slot,
      servingDesc: item.servingDesc,
      grams: item.grams,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      icon: item.icon,
      isSnack: item.isSnack,
      isUltraProcessed: item.isUltraProcessed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    persistLoggedFoods((prev) => [...newEntries, ...prev]);
    setShowTextLogModal(false);

    const hasSnack = newEntries.some((e) => e.isSnack || e.name.toLowerCase().includes('chifle') || e.name.toLowerCase().includes('keke'));
    if (hasSnack) {
      showToast(`¡${newEntries.map((e) => e.name).join(' + ')} registrados! ⚡ Compensador Inteligente activado.`);
    } else {
      showToast(`¡${newEntries.length} alimentos registrados en ${slot.toUpperCase()}!`);
    }
  };

  const handleDeleteLoggedFood = (id) => {
    persistLoggedFoods((prev) => prev.filter((item) => item.id !== id));
    showToast('Alimento eliminado del plan diario.');
  };

  const handleAddCompensatoryMeal = (option) => {
    const slot = option.mealSlot.toLowerCase().includes('cena') ? 'cena' : option.mealSlot.toLowerCase().includes('comida') ? 'comida' : 'snack';
    const newItems = option.foodItemsToAdd.map((food, idx) => ({
      id: `comp-${Date.now()}-${idx}`,
      name: food.name,
      brand: 'Pivote Proteico Fitia',
      mealSlot: slot,
      servingDesc: food.servingDesc,
      grams: 150,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      icon: option.icon,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    persistLoggedFoods((prev) => [...newItems, ...prev]);
    showToast(`¡${option.title.split(':')[0]} añadida a tu ${slot.toUpperCase()}! Balance de Lean Bulk asegurado.`);
  };

  const handleStartWalkTimer = (minutes = 15) => {
    setActiveTimerSeconds(minutes * 60);
    setTimerRunning(true);
    showToast(`🚶‍♂️ ¡Temporizador de caminata de ${minutes} min activado! Reduciendo pico glucémico.`);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aurafit_theme', next ? 'dark' : 'light');
      } catch (e) {}
      return next;
    });
  };

  const handleRegisterRecipe = (meal, slot = null, customMultiplier = null) => {
    const targetSlot = slot || meal.suggestedSlot || recipeSlotToLog || 'comida';
    const mult = customMultiplier !== null ? customMultiplier : (recipePortionMultipliers[meal.id] || 1.0);
    const mealTitle = meal.title || meal.name || 'Receta Casera Fitia';
    const baseP = Number(meal.protein || meal.proteinG || 0);
    const baseC = Number(meal.carbs || meal.carbsG || 0);
    const baseF = Number(meal.fat || meal.fatG || 0);
    const baseCal = Number(meal.calories || 0);
    const baseG = Number(meal.grams || 350);

    const scaledP = Math.round(baseP * mult * 10) / 10;
    const scaledC = Math.round(baseC * mult * 10) / 10;
    const scaledF = Math.round(baseF * mult * 10) / 10;
    const scaledCal = Math.round(baseCal * mult);
    const scaledG = Math.round(baseG * mult);

    const newEntry = {
      id: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: mult !== 1.0 ? `${mealTitle} (${Math.round(mult * 100)}% porción)` : mealTitle,
      brand: 'Chef AuraFit Despensa',
      mealSlot: targetSlot,
      servingDesc: `${scaledG}g (${Math.round(mult * 100)}% de receta)`,
      grams: scaledG,
      calories: scaledCal,
      protein: scaledP,
      carbs: scaledC,
      fat: scaledF,
      icon: meal.icon || '🍲',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    persistLoggedFoods((prev) => [newEntry, ...prev]);
    setSelectedRecipeDetail(null);
    showToast(`🍲 ¡${newEntry.name} agregado a ${targetSlot.toUpperCase()}! 🔥 +${scaledCal} kcal (+${scaledP}g Proteína)`);
  };

  // Update meals whenever ingredients change, active profile changes, or meal slot filter changes
  useEffect(() => {
    setMeals(generateMealsFromPantry(selectedIngredients, currentProfile.goal, pantryMealSlotFilter));
  }, [selectedIngredients, currentProfile.goal, pantryMealSlotFilter]);

  const handleGenerateDidacticRecipes = (filterSlot = null) => {
    setIsGeneratingRecipes(true);
    const targetFilter = filterSlot !== null ? filterSlot : pantryMealSlotFilter;
    if (filterSlot !== null) {
      setPantryMealSlotFilter(filterSlot);
    }
    setTimeout(() => {
      setMeals(generateMealsFromPantry(selectedIngredients, currentProfile.goal, targetFilter));
      setIsGeneratingRecipes(false);
      showToast(`✨ Sugerencias didácticas generadas para ${currentProfile.name} según los alimentos de tu cocina.`);
    }, 280);
  };

  // Timer effect for walk or EMOM
  useEffect(() => {
    let interval = null;
    if (timerRunning && activeTimerSeconds > 0) {
      interval = setInterval(() => {
        setActiveTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (activeTimerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, activeTimerSeconds]);

  // Wim Hof Breathwork hold timer
  useEffect(() => {
    let interval = null;
    if (showWimHofModal && wimHofPhase === 'holding') {
      interval = setInterval(() => {
        setWimHofHoldSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showWimHofModal, wimHofPhase]);

  const toggleHabit = (id) => {
    setHabits((prev) => {
      const next = prev.map((h) => {
        if (h.id === id) {
          const updatedDone = !h.completed;
          return {
            ...h,
            completed: updatedDone,
            time: updatedDone ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null
          };
        }
        return h;
      });
      try {
        localStorage.setItem(`aurafit_habits_${activeProfileId}`, JSON.stringify(next));
        localStorage.setItem('aurafit_habits', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const addWater = (ml) => {
    setWaterMl((prev) => {
      const maxWater = (currentProfile.waterDailyMl || 3000) + 1500;
      const updated = Math.min(prev + ml, maxWater);
      try {
        const todayKey = new Date().toISOString().split('T')[0];
        localStorage.setItem(`aurafit_water_daily_${activeProfileId}`, JSON.stringify({ date: todayKey, ml: updated }));
        localStorage.setItem(`aurafit_water_${activeProfileId}`, updated.toString());
      } catch (e) {}
      return updated;
    });
    showToast(`💧 +${ml} ml de agua registrados.`);
  };

  const handleResetWater = () => {
    setWaterMl(0);
    try {
      const todayKey = new Date().toISOString().split('T')[0];
      localStorage.setItem(`aurafit_water_daily_${activeProfileId}`, JSON.stringify({ date: todayKey, ml: 0 }));
      localStorage.setItem(`aurafit_water_${activeProfileId}`, '0');
    } catch (e) {}
    showToast('💧 Contador de agua reiniciado a 0 ml.');
  };

  const handleUpdateSleepHours = (delta) => {
    setSleepHours((prev) => {
      const next = Math.min(12, Math.max(4, Math.round((prev + delta) * 10) / 10));
      try {
        const todayKey = new Date().toISOString().split('T')[0];
        localStorage.setItem(`aurafit_sleep_${activeProfileId}`, JSON.stringify({ date: todayKey, hours: next, quality: sleepQuality }));
      } catch (e) {}
      return next;
    });
  };

  const handleSetSleepQuality = (qual) => {
    setSleepQuality(qual);
    try {
      const todayKey = new Date().toISOString().split('T')[0];
      localStorage.setItem(`aurafit_sleep_${activeProfileId}`, JSON.stringify({ date: todayKey, hours: sleepHours, quality: qual }));
    } catch (e) {}
    showToast(`💤 Calidad de descanso registrada como ${qual === 'deep' ? 'Profunda & Reparadora' : qual === 'normal' ? 'Normal' : 'Ligera'}.`);
  };

  const handleToggleTodayWorkout = () => {
    setTodayWorkoutDone((prev) => {
      const next = !prev;
      try {
        const todayKey = new Date().toISOString().split('T')[0];
        localStorage.setItem(`aurafit_workout_${activeProfileId}`, JSON.stringify({ date: todayKey, done: next, minutes: workoutDurationMins }));
      } catch (e) {}
      showToast(next ? '🏋️‍♂️ ¡Entrenamiento del día completado con éxito!' : '🏋️‍♂️ Registro de entrenamiento actualizado.');
      return next;
    });
  };

  const handleAdjustWorkoutDuration = (delta) => {
    setWorkoutDurationMins((prev) => {
      const next = Math.min(120, Math.max(15, prev + delta));
      try {
        const todayKey = new Date().toISOString().split('T')[0];
        localStorage.setItem(`aurafit_workout_${activeProfileId}`, JSON.stringify({ date: todayKey, done: todayWorkoutDone, minutes: next }));
      } catch (e) {}
      return next;
    });
  };

  const toggleIngredient = (ing) => {
    const lower = ing.toLowerCase().trim();
    setSelectedIngredients((prev) => {
      const exists = prev.includes(lower);
      const updated = exists ? prev.filter((i) => i !== lower) : [...prev, lower];
      try {
        localStorage.setItem('aurafit_ingredients', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleAddIngredient = (e) => {
    e.preventDefault();
    if (!newIngredient.trim()) return;
    toggleIngredient(newIngredient);
    setNewIngredient('');
  };

  const handleAddWeightLog = (e) => {
    e.preventDefault();
    const val = parseFloat(newWeightInput);
    if (!val || val < 40 || val > 160) return;
    const now = new Date();
    const label = `${now.getDate()} ${now.toLocaleString('es-PE', { month: 'short' })}`;
    const updated = [...weightLogs, { log_date: label, weight_kg: val }];
    setWeightLogs(updated);
    try {
      localStorage.setItem('aurafit_weights', JSON.stringify(updated));
    } catch (e) {}
    setNewWeightInput('');
    setShowWeightModal(false);
  };

  const weekDays = [
    { day: 'L', num: 10, done: true },
    { day: 'M', num: 11, done: true },
    { day: 'M', num: 12, done: true },
    { day: 'J', num: 13, done: false },
    { day: 'V', num: 14, done: false },
    { day: 'S', num: 15, done: false },
    { day: 'D', num: 16, done: false }
  ];

  const completedHabitsCount = habits.filter((h) => h.completed).length;

  return (
    <div className={`mobile-shell ${isDarkMode ? 'dark-theme' : ''}`}>
      {/* 1. Fitia Top Header */}
      <header className="fitia-header">
        <div className="fitia-header-left" onClick={() => {
          setEditingProfile({ ...currentProfile });
          setShowProfileModal(true);
        }}>
          <span className="fitia-header-title">{currentProfile.name}</span>
          <span className="fitia-header-arrow">▾</span>
        </div>
        <div className="fitia-header-right">
          <div className="fitia-streak-pill">
            <span>🔥</span>
            <span>{streakDays}</span>
          </div>
          <button
            type="button"
            className="header-lock-btn"
            onClick={handleLockApp}
            title="Bloquear sesión con PIN"
          >
            🔒
          </button>
          <button
            type="button"
            className="header-admin-pin-btn"
            onClick={handleOpenAdminPinModal}
            title="Administración de PINs Familiares (Andrés)"
          >
            🛡️
          </button>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <div
            className="fitia-avatar"
            onClick={() => {
              setEditingProfile({ ...currentProfile });
              setShowProfileModal(true);
            }}
            title={`Perfil de ${currentProfile.name}`}
          >
            <span>{currentProfile.avatar}</span>
          </div>
        </div>
      </header>

      {/* Multi-Profile Selector Dock */}
      <div className="profile-switcher-dock">
        {Object.values(familyProfiles).map((prof) => {
          const isActive = prof.id === activeProfileId;
          return (
            <button
              key={prof.id}
              type="button"
              className={`profile-chip ${isActive ? 'active' : ''}`}
              onClick={() => handleSwitchProfile(prof.id)}
            >
              <span className="profile-chip-avatar">{prof.avatar}</span>
              <div className="profile-chip-info">
                <span className="profile-chip-name">{prof.name}</span>
                <span className="profile-chip-role">{prof.role.split('&')[0]}</span>
              </div>
              {isActive && <span className="profile-active-dot">●</span>}
            </button>
          );
        })}
        <button
          type="button"
          className="profile-config-btn"
          onClick={() => {
            setEditingProfile({ ...currentProfile });
            setShowProfileModal(true);
          }}
          title="Calibrar perfil activo"
        >
          ⚙️
        </button>
        <button
          type="button"
          className="profile-config-btn"
          onClick={handleOpenAdminPinModal}
          title="Administrar PINs Familiares (Admin Andrés)"
          style={{ background: 'var(--fitia-green-soft)', borderColor: 'var(--fitia-green)' }}
        >
          🛡️
        </button>
      </div>

      {/* Profile Context Banner */}
      <div className="profile-context-banner">
        <span className="profile-context-pill">
          {currentProfile.badgeText}
        </span>
        <button
          type="button"
          onClick={() => {
            setEditingProfile({ ...currentProfile });
            setShowProfileModal(true);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--fitia-green)',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          Calibrar ✎
        </button>
      </div>

      {/* Wellness & Personal Focus Banner */}
      {(currentProfile.gentleNotes || currentProfile.medicalAlert) && (
        <div className="medical-alert-banner">
          <span style={{ fontSize: '18px' }}>🌿</span>
          <div>
            <strong>Enfoque de Bienestar:</strong> {currentProfile.gentleNotes || currentProfile.medicalAlert}
          </div>
        </div>
      )}

      {/* 2. Fitia Week Calendar Strip (Screenshot 6) */}
      <section className="fitia-week-strip">
        {weekDays.map((item) => {
          const isSelected = selectedDay === item.num;
          return (
            <div
              key={item.num}
              className={`fitia-day-col ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedDay(item.num)}
            >
              <span className="fitia-day-name">{item.day}</span>
              <div className="fitia-day-number">{item.num}</div>
              <div className={`fitia-day-dot ${item.done ? '' : 'empty'}`} />
            </div>
          );
        })}
      </section>

      {/* MAIN TAB VIEWPORT */}
      <main className="fitia-content">
        {/* ===================================================================
            TAB 1: NUTRICIÓN ESTILO FITIA (Screenshots 1 a 6)
            =================================================================== */}
        {activeTab === 'nutrition' && (
          <>
            {/* Fitia Hero Calorie Tracker Card (Screenshot 6) */}
            <section className="fitia-hero-card">
              <span className="fitia-cal-label">kcal</span>
              <div className="fitia-cal-val">
                {consumedTotals.calories.toLocaleString()} <span>/ {targets.targetCalories}</span>
              </div>

              {/* Fitia Sweet-Spot Calorie Gauge */}
              <div className="fitia-gauge-wrap">
                <div className="fitia-gauge-track">
                  <div
                    className="fitia-gauge-fill"
                    style={{
                      width: `${Math.min(100, Math.round((consumedTotals.calories / targets.targetCalories) * 100))}%`,
                      background:
                        consumedTotals.calories > targets.targetCalories + 350
                          ? '#EF4444'
                          : 'var(--fitia-green)'
                    }}
                  />
                  <div
                    className="fitia-gauge-pin"
                    style={{
                      left: `${Math.min(96, Math.max(4, Math.round((consumedTotals.calories / targets.targetCalories) * 100)))}%`
                    }}
                  >
                    {consumedTotals.calories >= targets.targetCalories - 250 &&
                    consumedTotals.calories <= targets.targetCalories + 250
                      ? '✓'
                      : '●'}
                  </div>
                </div>
                <div className="fitia-gauge-labels">
                  <span>{Math.max(0, targets.targetCalories - 250)}</span>
                  <span>{targets.label}</span>
                  <span>{targets.targetCalories + 250}</span>
                </div>
              </div>

              {/* 3 Fitia Macro Progress Bars */}
              <div className="fitia-macros-row">
                <div className="fitia-macro-item">
                  <span className="fitia-macro-name">Proteínas</span>
                  <span className="fitia-macro-numbers">
                    {Math.round(consumedTotals.protein)} <span>/ {targets.macros.proteinGrams} g</span>
                  </span>
                  <div className="fitia-macro-bar-wrap">
                    <div
                      className="fitia-macro-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.round((consumedTotals.protein / targets.macros.proteinGrams) * 100))}%`
                      }}
                    />
                  </div>
                </div>
                <div className="fitia-macro-item">
                  <span className="fitia-macro-name">Carb.</span>
                  <span className="fitia-macro-numbers">
                    {Math.round(consumedTotals.carbs)} <span>/ {targets.macros.carbsGrams} g</span>
                  </span>
                  <div className="fitia-macro-bar-wrap">
                    <div
                      className="fitia-macro-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.round((consumedTotals.carbs / targets.macros.carbsGrams) * 100))}%`
                      }}
                    />
                  </div>
                </div>
                <div className="fitia-macro-item">
                  <span className="fitia-macro-name">Grasas</span>
                  <span className="fitia-macro-numbers">
                    {Math.round(consumedTotals.fat)} <span>/ {targets.macros.fatGrams} g</span>
                  </span>
                  <div className="fitia-macro-bar-wrap">
                    <div
                      className="fitia-macro-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.round((consumedTotals.fat / targets.macros.fatGrams) * 100))}%`,
                        background:
                          consumedTotals.fat > targets.macros.fatGrams
                            ? '#F59E0B'
                            : 'var(--fitia-orange)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Si es Hermana: Protocolo Clínico Glucosa Estable */}
            {activeProfileId === 'hermana' && (
              <section className="glucose-order-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '20px' }}>🥗</span>
                  <h3 style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)' }}>
                    Regla de Oro: Orden de Ingesta para Glucosa Estable
                  </h3>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
                  Reduce el pico de insulina hasta en un <strong>40%</strong> comiendo tus platos en este orden secuencial:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card-subtle)', padding: '10px 12px', borderRadius: '12px' }}>
                    <span style={{ background: '#10B981', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900 }}>1</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800 }}>Fibra Primero (Ensalada / Verduras con limón)</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Crea una malla gelatinosa en el intestino que retrasa la absorción de azúcares.</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card-subtle)', padding: '10px 12px', borderRadius: '12px' }}>
                    <span style={{ background: '#3B82F6', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900 }}>2</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800 }}>Proteínas & Grasas Saludables</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pollo, pescado, claras, huevos, palta o queso fresco. Disparan GLP-1 y saciedad.</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card-subtle)', padding: '10px 12px', borderRadius: '12px' }}>
                    <span style={{ background: '#F59E0B', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900 }}>3</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800 }}>Carbohidratos Complejos al Final</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Arroz, papa sancochada, quinua o camote. El impacto glucémico se reduce a la mitad.</div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Quick Actions Row: Fitia Text Log / Search Foods (Screenshot 3 & 4) */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
                  boxShadow: 'var(--card-shadow)',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
                onClick={() => setShowTextLogModal(true)}
              >
                <span>✍️</span>
                <span>Registro por Texto</span>
              </button>

              <button
                type="button"
                style={{
                  flex: 1,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
                  boxShadow: 'var(--card-shadow)',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setTargetMealSlot('snack');
                  setShowFoodSearchModal(true);
                }}
              >
                <span>🔍</span>
                <span>Buscar Alimento (+2M)</span>
              </button>
            </div>

            {/* COMPENSADOR INTELIGENTE POST-SNACK (Chifles / Kekito Damage Control) */}
            {compensator.isImbalanced && (
              <section className="compensator-card">
                <div className="compensator-badge">
                  <span>⚡</span> {compensator.diagnosticTitle || 'Compensador Inteligente Activo'}
                </div>

                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)' }}>
                    ¿Qué comer después para llegar a tus requerimientos?
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                    {compensator.diagnosticDetail ? (
                      compensator.diagnosticDetail
                    ) : compensator.snacksLogged.length > 0 ? (
                      <>
                        Detectamos el registro de <strong>{compensator.snacksLogged.map((s) => s.name).join(' y ')}</strong>. Aportaron carbohidratos y grasas rápidas con baja densidad proteica.
                      </>
                    ) : (
                      <>
                        Tus macros actuales muestran un consumo elevado de grasas/carbohidratos en relación a tu proteína diaria.
                      </>
                    )}
                  </p>
                </div>

                {/* Macro Rebalance Metrics */}
                <div className="compensator-stats-grid">
                  <div className="compensator-stat-item">
                    <span className="compensator-stat-label">Kcal Restantes</span>
                    <span className="compensator-stat-val highlight">
                      {compensator.remaining.calories} kcal
                    </span>
                  </div>
                  <div className="compensator-stat-item">
                    <span className="compensator-stat-label">Proteína Requerida</span>
                    <span className="compensator-stat-val highlight">
                      +{Math.round(compensator.remaining.protein)} g
                    </span>
                  </div>
                  <div className="compensator-stat-item">
                    <span className="compensator-stat-label">Margen Grasa</span>
                    <span className="compensator-stat-val warning">
                      {Math.round(compensator.remaining.fat)} g máx
                    </span>
                  </div>
                </div>

                {/* 3 Strategic Compensatory Meals */}
                <div className="compensator-options-list">
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Selecciona tu Pivote Proteico Recomendado:
                  </span>
                  {compensator.options.map((opt) => (
                    <div key={opt.id} className="compensator-option-item">
                      <div className="compensator-opt-header">
                        <span className="compensator-opt-title">
                          <span>{opt.icon}</span> {opt.title.split(':')[0]}
                        </span>
                        <span className="compensator-opt-macros">
                          +{opt.macrosProvided.protein}g Proteína
                        </span>
                      </div>
                      <div className="compensator-opt-desc">
                        {opt.description}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          🔥 {opt.macrosProvided.calories} kcal · {opt.macrosProvided.carbs}C · {opt.macrosProvided.fat}G
                        </span>
                        <button
                          type="button"
                          className="btn-add-compensatory"
                          onClick={() => handleAddCompensatoryMeal(opt)}
                        >
                          + Agregar a {opt.mealSlot}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Damage Control Fast Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#3B82F6',
                      borderRadius: '12px',
                      padding: '10px 8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleStartWalkTimer(15)}
                  >
                    <span>🚶‍♂️</span> Caminata 15m (GLUT-4)
                  </button>
                  <button
                    type="button"
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: 'var(--fitia-green)',
                      borderRadius: '12px',
                      padding: '10px 8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      addWater(500);
                      showToast('💧 +500ml registrados. Amortiguando sodio del snack.');
                    }}
                  >
                    <span>💧</span> +500ml Agua & Sal
                  </button>
                </div>
              </section>
            )}

            {/* Meal Slots List (Desayuno, Comida, Cena, Snacks) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'desayuno', label: 'Desayuno', icon: '🍳', defaultTime: '08:30 AM' },
                { key: 'comida', label: 'Comida / Almuerzo', icon: '🍗', defaultTime: '01:30 PM' },
                { key: 'cena', label: 'Cena', icon: '🐟', defaultTime: '08:00 PM' },
                { key: 'snack', label: 'Snacks & Colaciones', icon: '🍌', defaultTime: '05:00 PM' }
              ].map((slot) => {
                const slotFoods = loggedFoods.filter((f) => f.mealSlot === slot.key);
                const slotKcal = slotFoods.reduce((acc, curr) => acc + (Number(curr.calories) || 0), 0);
                const slotP = slotFoods.reduce((acc, curr) => acc + (Number(curr.protein) || 0), 0);
                const slotC = slotFoods.reduce((acc, curr) => acc + (Number(curr.carbs) || 0), 0);
                const slotG = slotFoods.reduce((acc, curr) => acc + (Number(curr.fat) || 0), 0);

                return (
                  <div key={slot.key} className="fitia-meal-card">
                    <div className="fitia-meal-header">
                      <span className="fitia-meal-title">{slot.label}</span>
                      <span className="fitia-meal-macro-pill">
                        🔥 {slotKcal} kcal · {Math.round(slotP)}P · {Math.round(slotC)}C · {Math.round(slotG)}G
                      </span>
                    </div>

                    {slotFoods.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {slotFoods.map((item) => (
                          <div key={item.id} className="fitia-dish-item">
                            <div className="fitia-dish-thumb">{item.icon || slot.icon}</div>
                            <div className="fitia-dish-info">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className="fitia-dish-name">{item.name}</div>
                                <button
                                  type="button"
                                  className="dish-delete-btn"
                                  onClick={() => handleDeleteLoggedFood(item.id)}
                                  title="Eliminar alimento"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="fitia-dish-meta">
                                {item.servingDesc || `${item.grams}g`} · 🔥 {item.calories} kcal · {item.protein}P · {item.carbs}C · {item.fat}G
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '8px 0', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Ningún alimento registrado aún en este tiempo.
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn-add-meal-slot"
                      onClick={() => {
                        setTargetMealSlot(slot.key);
                        setShowFoodSearchModal(true);
                      }}
                    >
                      <span>+</span> Agregar alimento a {slot.label}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Fitia Coach / Asesoría Nutricional & Despensa Didáctica */}
            <section className="fitia-coach-card">
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    flexShrink: 0
                  }}>
                    👨‍🍳
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.3px' }}>
                      Chef Fitia · ¿Qué comer hoy?
                    </h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0', lineHeight: 1.3 }}>
                      Sugerencias didácticas y porciones exactas según lo que tienes en tu cocina.
                    </p>
                  </div>
                </div>

                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  background: 'var(--fitia-green-soft)',
                  color: 'var(--fitia-green)',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  whiteSpace: 'nowrap'
                }}>
                  {meals.length} Recetas
                </span>
              </div>

              {/* Macro Gap Banner (Screenshot / Didactic Guidance) */}
              <div style={{
                background: macroGap.isMet 
                  ? 'rgba(16, 185, 129, 0.08)' 
                  : 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                border: macroGap.isMet ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '14px',
                padding: '12px 14px',
                marginTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{macroGap.isMet ? '🎉' : '🎯'}</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {macroGap.isMet ? (
                        '¡Metas del día completadas!'
                      ) : (
                        <>Te faltan <strong style={{ color: 'var(--fitia-orange)' }}>{macroGap.protein}g Proteína</strong> y <strong style={{ color: 'var(--fitia-green)' }}>{macroGap.calories} kcal</strong></>
                      )}
                    </span>
                  </div>
                  {!macroGap.isMet && (
                    <button
                      type="button"
                      onClick={() => handleGenerateDidacticRecipes('comida')}
                      style={{
                        background: 'var(--fitia-orange)',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '10px',
                        fontWeight: 900,
                        padding: '4px 8px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      Ajustar Menú
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                  {currentProfile.goal === 'lean_bulk'
                    ? '💡 Modo Ganancia Muscular: Prioriza carbohidratos complejos y proteína de alto valor biológico para el estímulo anabólico.'
                    : currentProfile.goal === 'recomposition'
                    ? '💡 Modo Recomposición: Mantén la proteína alta para preservar masa magra mientras oxidas grasa en déficit moderado.'
                    : '💡 Modo Vitalidad & Glucosa: Alimentos con fibra y proteína para evitar picos reactivos de insulina.'}
                </div>
              </div>

              {/* Paso 1: Selección Didáctica de Ingredientes por Categoría */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    1. ¿Qué tienes disponible en tu cocina?
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fitia-green)' }}>
                    ✓ {selectedIngredients.length} activos
                  </span>
                </div>

                {/* Category Navigation Tabs */}
                <div className="pantry-category-bar">
                  {PANTRY_CATEGORIES.map((cat) => {
                    const isTabActive = pantryCategoryTab === cat.id;
                    const itemsInCat = cat.items.map((i) => i.id);
                    const selectedCount = itemsInCat.filter((id) => selectedIngredients.includes(id)).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`pantry-cat-tab ${isTabActive ? 'active' : ''}`}
                        onClick={() => setPantryCategoryTab(cat.id)}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                        {selectedCount > 0 && (
                          <span className="pantry-cat-badge">{selectedCount}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Active Category Items Grid */}
                {(() => {
                  const activeCatObj = PANTRY_CATEGORIES.find((c) => c.id === pantryCategoryTab) || PANTRY_CATEGORIES[0];
                  return (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        {activeCatObj.desc} · <em>Toca para marcar lo que tienes en tu despensa o refri:</em>
                      </div>
                      <div className="pantry-items-grid">
                        {activeCatObj.items.map((item) => {
                          const isSel = selectedIngredients.includes(item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              className={`pantry-item-card ${isSel ? 'selected' : ''}`}
                              onClick={() => toggleIngredient(item.id)}
                            >
                              <div className="pantry-item-check">{isSel ? '✓' : '+'}</div>
                              <div className="pantry-item-icon">{item.icon}</div>
                              <div className="pantry-item-info">
                                <div className="pantry-item-name">{item.name}</div>
                                <div className="pantry-item-qty">{item.defaultG}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Custom Ingredient Input */}
                <form onSubmit={handleAddIngredient} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Otro ingrediente de tu cocina (ej. almendras, espinacas, chia)..."
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border-subtle)',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      color: 'var(--text-main)',
                      fontSize: '13px'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: 'var(--fitia-green)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      border: 'none',
                      padding: '0 14px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    + Sumar
                  </button>
                </form>
              </div>

              {/* Paso 2: Filtros por Momento del Día & Generación Didáctica */}
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    2. Momento del Día & Opciones
                  </span>
                  <button
                    type="button"
                    onClick={() => handleGenerateDidacticRecipes()}
                    disabled={isGeneratingRecipes}
                    style={{
                      background: 'var(--fitia-green)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    {isGeneratingRecipes ? '🔄 Creando...' : '✨ Generar Ahora'}
                  </button>
                </div>

                <div className="didactic-filter-row">
                  {[
                    { id: 'all', label: '🍽️ Todas', icon: '🍽️' },
                    { id: 'desayuno', label: '🍳 Desayunos', icon: '🍳' },
                    { id: 'comida', label: '🍗 Almuerzos', icon: '🍗' },
                    { id: 'cena', label: '🥗 Cenas', icon: '🥗' },
                    { id: 'snack', label: '🍌 Snacks', icon: '🍌' }
                  ].map((filter) => {
                    const isActive = pantryMealSlotFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        className={`didactic-filter-pill ${isActive ? 'active' : ''}`}
                        onClick={() => handleGenerateDidacticRecipes(filter.id)}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Paso 3: Sugerencias de Comida Didácticas */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {currentProfile.goal === 'recomposition'
                    ? `👨‍🍳 Sugerencias calculadas para ${currentProfile.name}: Alta densidad proteica para quemar grasa preservando músculo:`
                    : currentProfile.goal === 'lean_bulk'
                    ? `👨‍🍳 Sugerencias anabólicas para ${currentProfile.name}: Superávit limpio, digestión rápida y fuerza:`
                    : `👨‍🍳 Sugerencias anti-fatiga para ${currentProfile.name}: Curva de glucosa plana y energía sostenida:`}
                </div>

                {meals.length === 0 ? (
                  <div style={{
                    background: 'var(--bg-card-subtle)',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '24px 16px',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontSize: '30px' }}>🥣</span>
                    <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '8px' }}>
                      No hay recetas para este filtro específico
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 12px' }}>
                      Prueba seleccionando "🍽️ Todas" o sumando ingredientes como huevos, pollo o avena.
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '12px', width: 'auto' }}
                      onClick={() => handleGenerateDidacticRecipes('all')}
                    >
                      Ver todas las sugerencias
                    </button>
                  </div>
                ) : (
                  <div className="fitia-recipes-scroll">
                    {meals.map((meal) => {
                      const title = meal.title || meal.name;
                      const prot = Number(meal.protein || meal.proteinG || 0);
                      const carb = Number(meal.carbs || meal.carbsG || 0);
                      const fat = Number(meal.fat || meal.fatG || 0);
                      const slot = meal.suggestedSlot || 'comida';
                      const cal = Number(meal.calories || 0);

                      // Calculate Macro Bar Percentages
                      const totalMacros = (prot * 4) + (carb * 4) + (fat * 9) || 1;
                      const pPct = Math.round(((prot * 4) / totalMacros) * 100);
                      const cPct = Math.round(((carb * 4) / totalMacros) * 100);
                      const fPct = Math.max(0, 100 - pPct - cPct);

                      return (
                        <div key={meal.id} className="fitia-recipe-card">
                          {/* Card Header & Badges */}
                          <div className="fitia-recipe-thumb">
                            <span style={{ fontSize: '36px' }}>{meal.icon || '🍲'}</span>
                            <div className="fitia-recipe-badge">
                              ⏱️ {meal.prepMinutes} min · {slot.toUpperCase()}
                            </div>
                            {meal.matchRate === 1 ? (
                              <span className="fitia-recipe-match-pill full-match">
                                ✅ 100% en tu cocina
                              </span>
                            ) : meal.matchCount > 0 ? (
                              <span className="fitia-recipe-match-pill">
                                ✓ {meal.matchCount} disponibles
                              </span>
                            ) : null}
                          </div>

                          <div className="fitia-recipe-body">
                            <div className="fitia-recipe-title">{title}</div>

                            {/* Didactic Portion Box (Poner qué comer de forma didáctica) */}
                            {meal.portionDidactic && (
                              <div className="fitia-recipe-portion-box">
                                <span style={{ fontSize: '14px' }}>📦</span>
                                <div>
                                  <strong style={{ color: 'var(--text-main)', fontSize: '11px', display: 'block' }}>
                                    Qué comer (Porción exacta):
                                  </strong>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                                    {meal.portionDidactic}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Visual 3-Color Macro Ratio Distribution Bar */}
                            <div className="recipe-macro-bar-wrap">
                              <div className="recipe-macro-bar-label">
                                <span>Distribución calórica:</span>
                                <span>{prot}g P · {carb}g C · {fat}g G</span>
                              </div>
                              <div className="recipe-macro-bar">
                                <div
                                  className="macro-bar-seg protein"
                                  style={{ width: `${pPct}%` }}
                                  title={`Proteína: ${pPct}%`}
                                />
                                <div
                                  className="macro-bar-seg carbs"
                                  style={{ width: `${cPct}%` }}
                                  title={`Carbohidratos: ${cPct}%`}
                                />
                                <div
                                  className="macro-bar-seg fat"
                                  style={{ width: `${fPct}%` }}
                                  title={`Grasas: ${fPct}%`}
                                />
                              </div>
                            </div>

                            {/* Interactive Portion Scaler (Solución al peso predefinido) */}
                            {(() => {
                              const mult = getRecipeMultiplier(meal.id);
                              const displayCal = Math.round(Number(meal.calories || 0) * mult);
                              const displayProt = Math.round(Number(meal.protein || meal.proteinG || 0) * mult * 10) / 10;
                              const displayCarb = Math.round(Number(meal.carbs || meal.carbsG || 0) * mult * 10) / 10;
                              const displayFat = Math.round(Number(meal.fat || meal.fatG || 0) * mult * 10) / 10;

                              return (
                                <>
                                  <div className="recipe-portion-scaler-row">
                                    <div className="portion-scaler-label">
                                      <span>⚖️ Porción: <strong>{Math.round(mult * 100)}%</strong></span>
                                      {mult !== 1.0 && <span className="portion-scaler-tag">Escala x{mult}</span>}
                                    </div>
                                    <div className="portion-scaler-controls">
                                      <button
                                        type="button"
                                        className="btn-portion-step"
                                        onClick={() => handleAdjustRecipeMultiplier(meal.id, -0.25)}
                                        disabled={mult <= 0.5}
                                        title="Menos cantidad"
                                      >
                                        −
                                      </button>
                                      <div className="portion-pills">
                                        {[0.75, 1.0, 1.25, 1.5].map((val) => (
                                          <button
                                            key={val}
                                            type="button"
                                            className={`btn-portion-pill ${mult === val ? 'active' : ''}`}
                                            onClick={() => handleSetRecipeMultiplier(meal.id, val)}
                                          >
                                            {val}x
                                          </button>
                                        ))}
                                      </div>
                                      <button
                                        type="button"
                                        className="btn-portion-step"
                                        onClick={() => handleAdjustRecipeMultiplier(meal.id, 0.25)}
                                        disabled={mult >= 2.5}
                                        title="Más cantidad"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>

                                  {/* Macros Numbers Row */}
                                  <div className="fitia-recipe-macros">
                                    <span style={{ color: 'var(--fitia-orange)' }}><strong>{displayProt}g</strong> Prot</span> ·{' '}
                                    <span style={{ color: 'var(--fitia-blue)' }}><strong>{displayCarb}g</strong> Carb</span> ·{' '}
                                    <span style={{ color: 'var(--fitia-purple)' }}><strong>{displayFat}g</strong> Gras</span> ·{' '}
                                    <span style={{ color: 'var(--fitia-green)' }}>🔥 <strong>{displayCal}</strong> kcal</span>
                                  </div>
                                </>
                              );
                            })()}

                            {/* Didactic Physiological Rationale Box */}
                            {meal.didacticWhy && (
                              <div className="recipe-didactic-box">
                                <div className="recipe-didactic-title">💡 ¿Por qué comer esto hoy?</div>
                                <div className="recipe-didactic-text">{meal.didacticWhy}</div>
                              </div>
                            )}

                            {/* Chef Practical Tip Box */}
                            {meal.chefTip && (
                              <div className="recipe-chef-tip-box">
                                <strong>👨‍🍳 Tip Fitia:</strong> {meal.chefTip}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="fitia-recipe-btn-row">
                              <button
                                type="button"
                                style={{
                                  flex: 1,
                                  background: 'var(--bg-card-subtle)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-main)',
                                  padding: '9px 6px',
                                  borderRadius: '10px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                                onClick={() => {
                                  setSelectedRecipeDetail(meal);
                                  setRecipeSlotToLog(slot);
                                }}
                              >
                                📖 Ver Pasos
                              </button>
                              <button
                                type="button"
                                style={{
                                  flex: 1.4,
                                  background: 'var(--fitia-green)',
                                  border: 'none',
                                  color: '#FFFFFF',
                                  padding: '9px 8px',
                                  borderRadius: '10px',
                                  fontSize: '11px',
                                  fontWeight: 900,
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                                }}
                                onClick={() => handleRegisterRecipe(meal, slot, getRecipeMultiplier(meal.id))}
                              >
                                + Agregar ({Math.round(Number(meal.calories || 0) * getRecipeMultiplier(meal.id))} kcal)
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Puntaje Nutricional Dinámico & Didáctico */}
            <section className="fitia-score-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span className="fitia-cal-label">Tu puntaje nutricional</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: nutritionalScore.color,
                    background: 'var(--bg-card-subtle)',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {nutritionalScore.grade}
                </span>
              </div>

              <div className="fitia-gauge-circle-wrap">
                <svg width="200" height="105" viewBox="0 0 200 105">
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="var(--bg-card-subtle)"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke={nutritionalScore.color}
                    strokeWidth="16"
                    strokeDasharray="251"
                    strokeDashoffset={nutritionalScore.dashOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease' }}
                  />
                </svg>
                <div className="fitia-gauge-inner-val">
                  <div className="fitia-score-big" style={{ color: nutritionalScore.color }}>{nutritionalScore.score}</div>
                  <div className="fitia-score-grade" style={{ color: 'var(--text-muted)' }}>{nutritionalScore.grade}</div>
                </div>
              </div>

              {/* Dynamic Insights from the Algorithm */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '6px' }}>
                {nutritionalScore.insights.map((ins, idx) => (
                  <div key={idx} className="fitia-insight-card">
                    <div className="fitia-insight-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{ins.icon}</span>
                        <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{ins.title}</strong>
                      </div>
                      <span className={`fitia-insight-badge ${ins.color === 'green' ? 'fitia-badge-green' : 'fitia-badge-blue'}`}>
                        {ins.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ins.text}</div>
                    {ins.tip && (
                      <div style={{ fontSize: '11px', color: 'var(--text-sub)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', lineHeight: 1.35 }}>
                        💡 {ins.tip}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Didactic Box: How is this calculated? */}
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'var(--bg-card-subtle)',
                  borderRadius: '14px',
                  border: '1px solid var(--border-subtle)',
                  width: '100%',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.45
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--text-main)', fontWeight: 800 }}>
                  <span>📐</span>
                  <span>¿Cómo se calcula tu puntaje nutricional (0 a 100)?</span>
                </div>
                <div>Algoritmo adaptativo en 4 pilares científicos:</div>
                <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  <li><strong>Adherencia Calórica (30 pts):</strong> Cercanía a tus calorías meta según tu objetivo actual.</li>
                  <li><strong>Aporte Proteico (35 pts):</strong> Ratio de aminoácidos para síntesis muscular o recuperación.</li>
                  <li><strong>Hidratación Diaria (15 pts):</strong> Ingesta de agua vs tu requerimiento metabólico.</li>
                  <li><strong>Calidad & Variedad (20 pts):</strong> Frecuencia de alimentos naturales y distribución en tus comidas.</li>
                </ul>
              </div>
            </section>

            {/* Damage Control SOS Trigger */}
            <button
              type="button"
              className="btn-sos"
              onClick={() => setShowDamageControl(true)}
            >
              <span>🚨 Protocolo Damage Control (Comida Trampa)</span>
            </button>
          </>
        )}

        {/* ===================================================================
            TAB 2: HÁBITOS SALUDABLES (Screenshot 11)
            =================================================================== */}
        {activeTab === 'habits' && (
          <>
            {/* ===================================================================
                HERO: AURASCORE DEL DÍA (Puntaje Holístico de Rendimiento & Salud)
                =================================================================== */}
            <section className="aurascore-hero-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="fitia-cal-label">AuraScore del Día</span>
                <span
                  className="aurascore-badge"
                  style={{
                    background: `${dailyAuraScore.gradeColor}18`,
                    color: dailyAuraScore.gradeColor,
                    border: `1px solid ${dailyAuraScore.gradeColor}40`
                  }}
                >
                  <span>{dailyAuraScore.statusEmoji}</span>
                  <span>{dailyAuraScore.grade}</span>
                </span>
              </div>

              {/* Gauge Row with Circular SVG + Coach Rationale */}
              <div className="aurascore-gauge-row">
                <div className="aurascore-circle-wrap">
                  <svg width="96" height="96" viewBox="0 0 96 96">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke="var(--bg-card-subtle)"
                      strokeWidth="9"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke={dailyAuraScore.gradeColor}
                      strokeWidth="9"
                      strokeDasharray="251"
                      strokeDashoffset={Math.round(251 * (1 - dailyAuraScore.score / 100))}
                      strokeLinecap="round"
                      transform="rotate(-90 48 48)"
                      style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
                    />
                  </svg>
                  <div className="aurascore-circle-inner">
                    <span className="aurascore-big-number" style={{ color: dailyAuraScore.gradeColor }}>
                      {dailyAuraScore.score}
                    </span>
                    <span className="aurascore-max-label">/ 100 PTS</span>
                  </div>
                </div>

                <div className="aurascore-hero-info">
                  <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-main)', marginBottom: '4px' }}>
                    Sincronización Inteligente
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                    Integra tu alimentación, entrenamiento muscular, descanso reparador y hábitos biohacking.
                  </div>
                </div>
              </div>

              {/* Personalized AI Coach Summary */}
              <div className="aurascore-coach-box">
                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '3px' }}>
                  💡 Diagnóstico AuraFit ({currentProfile.name}):
                </strong>
                {dailyAuraScore.didacticSummary}
              </div>

              {/* The 4 Lifestyle Pillars (2x2 Grid) */}
              <div className="aurascore-pillars-grid">
                {/* 1. Nutrición */}
                <div className="aurascore-pillar-card">
                  <div>
                    <div className="pillar-card-header">
                      <span className="pillar-title">🥗 Nutrición</span>
                      <span className="pillar-pts-badge" style={{ color: '#10B981' }}>
                        {dailyAuraScore.pillars.nutrition.points}/25
                      </span>
                    </div>
                    <div className="pillar-progress-track">
                      <div
                        className="pillar-progress-fill"
                        style={{ width: `${dailyAuraScore.pillars.nutrition.pct}%`, background: '#10B981' }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {nutritionalScore.breakdown.calories.current} / {nutritionalScore.breakdown.calories.target} kcal · {nutritionalScore.breakdown.protein.current}g P
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('diario')}
                    style={{
                      marginTop: '8px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--fitia-green)',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      textAlign: 'left',
                      padding: 0,
                      cursor: 'pointer'
                    }}
                  >
                    Ver comidas registradas →
                  </button>
                </div>

                {/* 2. Ejercicio & Movilidad */}
                <div className="aurascore-pillar-card">
                  <div>
                    <div className="pillar-card-header">
                      <span className="pillar-title">🏋️‍♂️ Ejercicio</span>
                      <span className="pillar-pts-badge" style={{ color: '#F97316' }}>
                        {dailyAuraScore.pillars.workout.points}/25
                      </span>
                    </div>
                    <div className="pillar-progress-track">
                      <div
                        className="pillar-progress-fill"
                        style={{ width: `${dailyAuraScore.pillars.workout.pct}%`, background: '#F97316' }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {todayWorkoutDone ? `✅ ${workoutDurationMins}m completado` : '⏳ Sesión pendiente'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={handleToggleTodayWorkout}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 800,
                        border: todayWorkoutDone ? '1px solid #F97316' : '1px solid var(--border-subtle)',
                        background: todayWorkoutDone ? 'rgba(249, 115, 22, 0.15)' : 'var(--bg-card-subtle)',
                        color: todayWorkoutDone ? '#F97316' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {todayWorkoutDone ? '✓ Hecho' : '+ Marcar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustWorkoutDuration(-10)}
                      style={{ padding: '2px 5px', fontSize: '9px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      −
                    </button>
                    <span style={{ fontSize: '10px', fontWeight: 800 }}>{workoutDurationMins}m</span>
                    <button
                      type="button"
                      onClick={() => handleAdjustWorkoutDuration(10)}
                      style={{ padding: '2px 5px', fontSize: '9px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 3. Descanso & Sueño */}
                <div className="aurascore-pillar-card">
                  <div>
                    <div className="pillar-card-header">
                      <span className="pillar-title">💤 Sueño</span>
                      <span className="pillar-pts-badge" style={{ color: '#6366F1' }}>
                        {dailyAuraScore.pillars.sleep.points}/25
                      </span>
                    </div>
                    <div className="pillar-progress-track">
                      <div
                        className="pillar-progress-fill"
                        style={{ width: `${dailyAuraScore.pillars.sleep.pct}%`, background: '#6366F1' }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {sleepHours}h ({sleepQuality === 'deep' ? 'Profundo' : sleepQuality === 'normal' ? 'Normal' : 'Inquieto'})
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    <button
                      type="button"
                      className="btn-portion-step"
                      style={{ width: '22px', height: '22px', fontSize: '12px' }}
                      onClick={() => handleUpdateSleepHours(-0.5)}
                    >
                      −
                    </button>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-main)' }}>{sleepHours} hrs</span>
                    <button
                      type="button"
                      className="btn-portion-step"
                      style={{ width: '22px', height: '22px', fontSize: '12px' }}
                      onClick={() => handleUpdateSleepHours(0.5)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 4. Hábitos & Biohacking */}
                <div className="aurascore-pillar-card">
                  <div>
                    <div className="pillar-card-header">
                      <span className="pillar-title">🧘 Hábitos</span>
                      <span className="pillar-pts-badge" style={{ color: '#3B82F6' }}>
                        {dailyAuraScore.pillars.habits.points}/25
                      </span>
                    </div>
                    <div className="pillar-progress-track">
                      <div
                        className="pillar-progress-fill"
                        style={{ width: `${dailyAuraScore.pillars.habits.pct}%`, background: '#3B82F6' }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {completedHabitsCount} de {habits.length} completados
                    </div>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--fitia-green)', fontWeight: 800, marginTop: '8px' }}>
                    🔥 {streakDays} días de racha
                  </div>
                </div>
              </div>
            </section>

            {/* ===================================================================
                LOGGER INTERACTIVO DE SUEÑO & DESCANSO
                =================================================================== */}
            <div className="sleep-logger-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🌙</span>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Registro de Sueño & Descanso</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Horas dormidas anoche y calidad de recuperación</div>
                  </div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#6366F1' }}>
                  {sleepHours} Horas
                </span>
              </div>

              {/* Stepper Row */}
              <div className="sleep-stepper-row">
                <button
                  type="button"
                  className="btn-sleep-step"
                  onClick={() => handleUpdateSleepHours(-0.5)}
                  disabled={sleepHours <= 4}
                >
                  −
                </button>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[6, 7, 7.5, 8, 8.5, 9].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`btn-portion-pill ${sleepHours === val ? 'active' : ''}`}
                      onClick={() => {
                        setSleepHours(val);
                        try {
                          const todayKey = new Date().toISOString().split('T')[0];
                          localStorage.setItem(`aurafit_sleep_${activeProfileId}`, JSON.stringify({ date: todayKey, hours: val, quality: sleepQuality }));
                        } catch (e) {}
                      }}
                    >
                      {val}h
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn-sleep-step"
                  onClick={() => handleUpdateSleepHours(0.5)}
                  disabled={sleepHours >= 12}
                >
                  +
                </button>
              </div>

              {/* Quality Selector Chips */}
              <div className="sleep-quality-chips">
                {[
                  { key: 'deep', label: '😴 Profundo & Reparador' },
                  { key: 'normal', label: '😌 Normal / Estable' },
                  { key: 'light', label: '🥱 Ligero / Inquieto' }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`btn-sleep-quality ${sleepQuality === item.key ? 'active' : ''}`}
                    onClick={() => handleSetSleepQuality(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ===================================================================
                CHECKLIST DE HÁBITOS DIARIOS ADAPTATIVOS
                =================================================================== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Hábitos Diarios ({currentProfile.name})
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--fitia-green)' }}>
                  {completedHabitsCount} / {habits.length}
                </span>
              </div>
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    padding: '16px 18px',
                    borderRadius: '18px',
                    boxShadow: 'var(--card-shadow)'
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }}
                    onClick={() => {
                      if (habit.id === 'wimhof') {
                        setShowWimHofModal(true);
                      } else {
                        toggleHabit(habit.id);
                      }
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-card-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      {habit.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>{habit.name}</span>
                        {habit.id === 'wimhof' && (
                          <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>
                            ▶ Asistente Guiado
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {habit.target} {habit.completed && `· Completado a las ${habit.time || 'hoy'}`}
                      </div>
                      {habit.note && (
                        <div style={{ fontSize: '11px', color: 'var(--text-sub)', marginTop: '3px', fontStyle: 'italic', lineHeight: 1.3 }}>
                          {habit.note}
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      border: habit.completed ? 'none' : '2px solid var(--border-subtle)',
                      background: habit.completed ? 'var(--fitia-green)' : 'transparent',
                      color: habit.completed ? '#FFFFFF' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHabit(habit.id);
                    }}
                  >
                    ✓
                  </div>
                </div>
              ))}
            </div>

            {/* ===================================================================
                HIDRATACIÓN DIARIA (SE INICIA EN 0 CADA DÍA)
                =================================================================== */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '18px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>💧</span>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Hidratación Diaria</strong>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Inicia en 0 ml todos los días</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', color: 'var(--fitia-blue)', fontWeight: 900 }}>
                    {waterMl} / {currentProfile.waterDailyMl || 2500} ml
                  </span>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {Math.round((waterMl / (currentProfile.waterDailyMl || 2500)) * 100)}% alcanzado
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-card-subtle)', borderRadius: '999px', overflow: 'hidden', marginBottom: '14px' }}>
                <div
                  style={{
                    height: '100%',
                    background: 'var(--fitia-blue)',
                    width: `${Math.min(100, Math.round((waterMl / (currentProfile.waterDailyMl || 2500)) * 100))}%`,
                    borderRadius: '999px',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>

              {/* Quick Action Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: 'var(--fitia-blue-soft)',
                    border: '1px solid rgba(2, 132, 199, 0.25)',
                    color: 'var(--fitia-blue)',
                    padding: '10px 6px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => addWater(250)}
                >
                  +250 ml (Vaso)
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: 'var(--fitia-blue-soft)',
                    border: '1px solid rgba(2, 132, 199, 0.25)',
                    color: 'var(--fitia-blue)',
                    padding: '10px 6px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => addWater(500)}
                >
                  +500 ml (Botella)
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: 'var(--fitia-blue-soft)',
                    border: '1px solid rgba(2, 132, 199, 0.25)',
                    color: 'var(--fitia-blue)',
                    padding: '10px 6px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => addWater(1000)}
                >
                  +1.0 L (Litro)
                </button>
                <button
                  type="button"
                  title="Reiniciar a 0 ml"
                  style={{
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                  onClick={handleResetWater}
                >
                  ↺ 0
                </button>
              </div>
            </div>
          </>
        )}

        {/* ===================================================================
            TAB 3: WORKOUT ADAPTATIVO & PESO
            =================================================================== */}
        {activeTab === 'workout' && (
          <>
            {/* Mode Switcher per Profile */}
            {(() => {
              const profileWorkouts = currentProfile.workouts || WORKOUT_ROUTINES;
              const workoutKeys = Object.keys(profileWorkouts);
              const currentKey = workoutKeys.includes(workoutMode) ? workoutMode : workoutKeys[0];
              const routine = profileWorkouts[currentKey];

              return (
                <>
                  <div style={{ display: 'flex', background: 'var(--bg-card-subtle)', padding: '4px', borderRadius: '14px', gap: '4px', marginBottom: '14px' }}>
                    {workoutKeys.map((key) => {
                      const isSel = currentKey === key;
                      const icon = key === 'gym' ? '🏋️' : key === 'dance' ? '💃' : key === 'gentle_yoga' ? '🧘‍♀️' : '🏔️';
                      const label = key === 'gym' ? 'Gimnasio' : key === 'dance' ? 'Baile Suave (GLUT-4)' : key === 'gentle_yoga' ? 'Movilidad de Pie' : 'Cajabamba / Viaje';
                      return (
                        <button
                          key={key}
                          type="button"
                          style={{
                            flex: 1,
                            background: isSel ? 'var(--bg-card)' : 'transparent',
                            color: isSel ? 'var(--text-main)' : 'var(--text-muted)',
                            border: 'none',
                            padding: '10px 8px',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '12px',
                            boxShadow: isSel ? 'var(--card-shadow)' : 'none',
                            cursor: 'pointer'
                          }}
                          onClick={() => setWorkoutMode(key)}
                        >
                          {icon} {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Routine Details */}
                  {routine && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: 'var(--card-shadow)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <h3 style={{ fontSize: '17px', fontWeight: 900 }}>{routine.title}</h3>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{routine.focus}</p>
                        </div>
                        <span style={{ background: 'var(--fitia-green-soft)', color: 'var(--fitia-green)', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                          ⏱️ {routine.durationMinutes || 30} min
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(routine.exercises || []).map((ex, idx) => (
                          <div key={idx} style={{ background: 'var(--bg-card-subtle)', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '14px', fontWeight: 800 }}>
                                {ex.icon ? `${ex.icon} ` : ''}{ex.name}
                              </span>
                              <span style={{ fontSize: '13px', color: 'var(--fitia-orange)', fontWeight: 800 }}>
                                {ex.sets && ex.reps ? `${ex.sets} sets × ${ex.reps}` : ex.target || ex.duration || 'Completar'}
                              </span>
                            </div>
                            {(ex.note || ex.restSeconds || ex.notes) && (
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {ex.restSeconds ? `Descanso: ${ex.restSeconds}s · ` : ''}{ex.note || ex.notes || ''}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Timer for EMOM or Dance */}
                      <div style={{ background: 'var(--bg-card-subtle)', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border-subtle)', marginTop: '6px' }}>
                        <div style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'monospace', color: 'var(--text-main)' }}>
                          {activeTimerSeconds ? `${Math.floor(activeTimerSeconds / 60).toString().padStart(2, '0')}:${(activeTimerSeconds % 60).toString().padStart(2, '0')}` : `${routine.durationMinutes || 20}:00`}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
                          <button
                            type="button"
                            style={{
                              background: timerRunning ? '#EF4444' : 'var(--fitia-green)',
                              color: '#FFFFFF',
                              fontWeight: 900,
                              border: 'none',
                              padding: '10px 22px',
                              borderRadius: '12px',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              if (!activeTimerSeconds) setActiveTimerSeconds((routine.durationMinutes || 20) * 60);
                              setTimerRunning(!timerRunning);
                            }}
                          >
                            {timerRunning ? 'Pausar' : 'Iniciar Sesión'}
                          </button>
                          <button
                            type="button"
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-muted)',
                              fontWeight: 800,
                              padding: '10px 16px',
                              borderRadius: '12px',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setTimerRunning(false);
                              setActiveTimerSeconds((routine.durationMinutes || 20) * 60);
                            }}
                          >
                            Reiniciar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}


            {/* Weight Progression Card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 900 }}>Evolución de Peso Magro</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Actual: <strong>{weightAnalytics.currentWeight} kg</strong> · Ritmo: <strong>{weightAnalytics.ratePerWeekKg} kg/sem</strong>
                  </p>
                </div>
                <button
                  type="button"
                  style={{
                    background: 'var(--fitia-green-soft)',
                    border: '1px solid var(--fitia-green)',
                    color: 'var(--fitia-green)',
                    padding: '7px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 800
                  }}
                  onClick={() => setShowWeightModal(true)}
                >
                  + Pesarme
                </button>
              </div>

              {/* Weight Sparkline */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '60px', paddingTop: '10px' }}>
                {weightLogs.slice(-7).map((log, i) => {
                  const min = 71.5;
                  const max = 73.5;
                  const pct = Math.max(10, Math.min(100, ((log.weight_kg - min) / (max - min)) * 100));
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%' }}>
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                        <div
                          style={{
                            width: '100%',
                            height: `${pct}%`,
                            background: i === weightLogs.slice(-7).length - 1 ? 'var(--fitia-green)' : 'var(--bg-card-subtle)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{log.log_date.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 14px) + 16px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.94)',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '999px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
            zIndex: 200,
            fontSize: '13px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            maxWidth: '90%',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <span>🥑</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal: Registro Inteligente por Texto (Lenguaje Natural) */}
      {showTextLogModal && (
        <div className="food-modal-backdrop" onClick={() => setShowTextLogModal(false)}>
          <div
            className="food-modal-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '85dvh', padding: '24px 20px calc(24px + var(--safe-bottom))' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>✍️</span>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)' }}>
                  Registro por Lenguaje Natural
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTextLogModal(false)}
                style={{ fontSize: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
              Escribe lo que comiste (ej. <em>"chifles y un kekito"</em>, <em>"2 huevos revueltos con avena"</em>). El motor detecta los macros y calcula el rebalanceo automático:
            </p>

            <textarea
              rows={3}
              value={quickTextEntry}
              onChange={(e) => setQuickTextEntry(e.target.value)}
              placeholder="Ej. comí una bolsa de chifles y un kekito en la tarde..."
              style={{
                width: '100%',
                background: 'var(--bg-card-subtle)',
                border: '1.5px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '12px 14px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-main)',
                marginBottom: '12px',
                outline: 'none'
              }}
            />

            {/* Real-time Detection Preview */}
            <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Alimentos Identificados ({detectedInText.length}):
              </div>

              {detectedInText.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {detectedInText.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        background: 'var(--bg-card)',
                        padding: '8px 10px',
                        borderRadius: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--fitia-green)', fontWeight: 800 }}>
                        🔥 {item.calories} kcal · {item.protein}P · {item.carbs}C · {item.fat}G
                      </span>
                    </div>
                  ))}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                    Total: ~
                    {detectedInText.reduce((acc, i) => acc + i.calories, 0)} kcal ·{' '}
                    {detectedInText.reduce((acc, i) => acc + i.protein, 0).toFixed(1)}g Proteína ·{' '}
                    {detectedInText.reduce((acc, i) => acc + i.carbs, 0).toFixed(1)}g Carbos ·{' '}
                    {detectedInText.reduce((acc, i) => acc + i.fat, 0).toFixed(1)}g Grasas
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Escribe palabras como "chifles", "kekito", "huevo", "pechuga", "avena" para calcular.
                </div>
              )}
            </div>

            {/* Destination Slot Picker */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {['desayuno', 'comida', 'cena', 'snack'].map((s) => (
                <button
                  key={s}
                  type="button"
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 800,
                    border: targetMealSlot === s ? '1.5px solid var(--fitia-green)' : '1px solid var(--border-subtle)',
                    background: targetMealSlot === s ? 'var(--fitia-green-soft)' : 'var(--bg-card-subtle)',
                    color: targetMealSlot === s ? 'var(--fitia-green)' : 'var(--text-muted)',
                    textTransform: 'capitalize',
                    cursor: 'pointer'
                  }}
                  onClick={() => setTargetMealSlot(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => handleConfirmTextLog(detectedInText, targetMealSlot)}
            >
              + Confirmar & Registrar Alimentos
            </button>
          </div>
        </div>
      )}

      {/* Modal: Buscador de Alimentos (+2 Millones de Alimentos - Base Global & Perú) */}
      {showFoodSearchModal && (
        <div className="food-modal-backdrop" onClick={() => setShowFoodSearchModal(false)}>
          <div className="food-modal-sheet" onClick={(e) => e.stopPropagation()}>
            {/* Header con Buscador */}
            <div className="food-modal-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-main)' }}>
                    Buscar en +2M Alimentos
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--fitia-green)', fontWeight: 700 }}>
                    Base Oficial Fitia / Open Food Facts · Verificada
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFoodSearchModal(false)}
                  style={{ fontSize: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Input de Búsqueda */}
              <div className="food-search-input-wrap">
                <span className="food-search-icon">🔍</span>
                <input
                  type="text"
                  className="food-search-input"
                  placeholder="Buscar alimentos (ej. chifles, kekito, pollo, avena...)"
                  value={foodSearchQuery}
                  onChange={(e) => setFoodSearchQuery(e.target.value)}
                  autoFocus
                />
                {isSearchingFood && (
                  <span style={{ position: 'absolute', right: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    ⌛
                  </span>
                )}
              </div>

              {/* Selector de Comida Destino */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                {['desayuno', 'comida', 'cena', 'snack'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      border: targetMealSlot === s ? '1.5px solid var(--fitia-green)' : '1px solid var(--border-subtle)',
                      background: targetMealSlot === s ? 'var(--fitia-green-soft)' : 'var(--bg-card-subtle)',
                      color: targetMealSlot === s ? 'var(--fitia-green)' : 'var(--text-muted)',
                      textTransform: 'capitalize',
                      cursor: 'pointer'
                    }}
                    onClick={() => setTargetMealSlot(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Chips del Compendio Nutricional */}
              <div className="food-filter-chips" style={{ marginTop: '10px' }}>
                {[
                  { key: 'all', label: '🌟 Todos' },
                  { key: 'proteina', label: '🥩 Proteínas' },
                  { key: 'carbohidrato', label: '🍚 Carbohidratos' },
                  { key: 'grasa_saludable', label: '🥑 Grasas Buenas' },
                  { key: 'snack', label: '🍌 Snacks & Chifles' },
                  { key: 'plato_fuerte', label: '🍲 Criollos' },
                  { key: 'fruta', label: '🍎 Frutas' },
                  { key: 'vegetal', label: '🥦 Vegetales' }
                ].map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    className={`food-chip ${foodFilterCategory === chip.key ? 'active' : ''}`}
                    onClick={() => {
                      setFoodFilterCategory(chip.key);
                      setFoodSearchQuery('');
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Registration Card for ANY typed text */}
            {foodSearchQuery.trim().length > 0 && (
              <div className="food-direct-add-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '22px' }}>✨</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-main)' }}>
                        Registrar &quot;{foodSearchQuery.trim()}&quot; directamente
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Agregar a {targetMealSlot.toUpperCase()} con cálculo inteligente
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-quick-add-custom"
                    onClick={() => handleRegisterCustomTypedFood(foodSearchQuery, targetMealSlot)}
                  >
                    + Registrar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de Resultados del Compendio */}
            <div className="food-results-scroll">
              {(() => {
                const listToDisplay = foodSearchQuery.trim().length > 0
                  ? foodSearchResults
                  : (foodFilterCategory === 'all'
                      ? CURATED_PERUVIAN_FOODS
                      : CURATED_PERUVIAN_FOODS.filter((f) => f.category === foodFilterCategory));

                if (listToDisplay.length > 0) {
                  return listToDisplay.map((food) => {
                    const isSelected = selectedFoodToLog?.id === food.id;

                    return (
                      <div
                        key={food.id}
                        className={`food-result-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedFoodToLog(food);
                          setCustomGrams(food.grams || 50);
                        }}
                      >
                        <div className="food-card-left">
                          <span className="food-card-icon">{food.icon || '🥗'}</span>
                          <div>
                            <div className="food-card-name">{food.name}</div>
                            <div className="food-card-brand">
                              {food.brand} · {food.servingDesc || `${food.grams}g`}
                            </div>
                            <div className="food-card-macros">
                              <strong>{food.protein}g</strong> P · <strong>{food.carbs}g</strong> C · <strong>{food.fat}g</strong> G
                            </div>
                          </div>
                        </div>

                        <div className="food-card-right">
                          <div className="food-kcal-badge">🔥 {food.calories} kcal</div>
                          <span className="food-source-pill">
                            {food.source || (food.isSnack ? 'Snack' : 'Fitia Verified')}
                          </span>
                        </div>
                      </div>
                    );
                  });
                }

                return (
                  <div style={{ textAlign: 'center', padding: '30px 14px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>✍️</div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-main)' }}>
                      Registrar &quot;{foodSearchQuery}&quot; en tu diario
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '6px', marginBottom: '14px', lineHeight: 1.4 }}>
                      No está en la búsqueda rápida pero puedes agregarlo de inmediato con estimación inteligente de macros.
                    </div>
                    <button
                      type="button"
                      className="btn-quick-add-custom"
                      style={{ padding: '10px 18px', fontSize: '13px' }}
                      onClick={() => handleRegisterCustomTypedFood(foodSearchQuery, targetMealSlot)}
                    >
                      + Registrar &quot;{foodSearchQuery}&quot; en {targetMealSlot.toUpperCase()}
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Bottom Panel when food is selected */}
            {selectedFoodToLog && (
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderTop: '1px solid var(--border-subtle)',
                  padding: '14px 18px calc(14px + var(--safe-bottom))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {selectedFoodToLog.name}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--fitia-green)' }}>
                    🔥 {Math.round((selectedFoodToLog.calories * customGrams) / (selectedFoodToLog.grams || 100))} kcal
                  </span>
                </div>

                {/* Dynamic Unit & Grams Selector */}
                {(() => {
                  const nameLower = (selectedFoodToLog.name || '').toLowerCase();
                  let portionButtons = [
                    { label: '30g', g: 30 },
                    { label: '50g', g: 50 },
                    { label: '100g', g: 100 },
                    { label: '150g', g: 150 }
                  ];

                  if (nameLower.includes('huevo') && !nameLower.includes('clara')) {
                    portionButtons = [
                      { label: '1 huevo', g: 50 },
                      { label: '2 huevos', g: 100 },
                      { label: '3 huevos', g: 150 },
                      { label: '4 huevos', g: 200 },
                      { label: '6 huevos', g: 300 }
                    ];
                  } else if (nameLower.includes('clara')) {
                    portionButtons = [
                      { label: '2 claras', g: 65 },
                      { label: '3 claras', g: 100 },
                      { label: '4 claras', g: 130 },
                      { label: '5 claras', g: 165 },
                      { label: '6 claras', g: 200 }
                    ];
                  } else if (nameLower.includes('mantequilla') || nameLower.includes('aceite')) {
                    portionButtons = [
                      { label: '1 cdita (5g)', g: 5 },
                      { label: '1 cda (14g)', g: 14 },
                      { label: '2 cdas (28g)', g: 28 },
                      { label: '3 cdas (42g)', g: 42 }
                    ];
                  } else if (nameLower.includes('pan')) {
                    portionButtons = [
                      { label: '1 pan (40g)', g: 40 },
                      { label: '2 panes (80g)', g: 80 },
                      { label: '3 panes (120g)', g: 120 }
                    ];
                  }

                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>Porción:</span>
                      {portionButtons.map((btn) => (
                        <button
                          key={btn.g}
                          type="button"
                          style={{
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 800,
                            border: customGrams === btn.g ? '1.5px solid var(--fitia-green)' : '1px solid var(--border-subtle)',
                            background: customGrams === btn.g ? 'var(--fitia-green-soft)' : 'var(--bg-card-subtle)',
                            color: customGrams === btn.g ? 'var(--fitia-green)' : 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                          onClick={() => setCustomGrams(btn.g)}
                        >
                          {btn.label}
                        </button>
                      ))}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                        <input
                          type="number"
                          value={customGrams}
                          onChange={(e) => setCustomGrams(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          style={{
                            width: '50px',
                            padding: '4px 4px !important',
                            fontSize: '12px !important',
                            textAlign: 'center',
                            borderRadius: '8px'
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800 }}>g</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Meal Slot Selector */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['desayuno', 'comida', 'cena', 'snack'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      style={{
                        flex: 1,
                        padding: '7px 4px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 800,
                        border: targetMealSlot === s ? '1.5px solid var(--fitia-green)' : '1px solid var(--border-subtle)',
                        background: targetMealSlot === s ? 'var(--fitia-green-soft)' : 'var(--bg-card-subtle)',
                        color: targetMealSlot === s ? 'var(--fitia-green)' : 'var(--text-muted)',
                        textTransform: 'capitalize',
                        cursor: 'pointer'
                      }}
                      onClick={() => setTargetMealSlot(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '12px' }}
                  onClick={() => handleRegisterFoodFromSearch(selectedFoodToLog, targetMealSlot, customGrams)}
                >
                  + Registrar en {targetMealSlot.toUpperCase()}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weight Modal */}
      {showWeightModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '340px', boxShadow: 'var(--card-shadow)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '6px' }}>Registrar Peso Diario</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Pésate en ayunas al despertar para el cálculo de Lean Bulk.
            </p>
            <form onSubmit={handleAddWeightLog}>
              <input
                type="number"
                step="0.1"
                placeholder="Ej. 72.8"
                value={newWeightInput}
                onChange={(e) => setNewWeightInput(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  padding: '14px',
                  borderRadius: '14px',
                  color: 'var(--text-main)',
                  fontSize: '22px',
                  textAlign: 'center',
                  fontWeight: 900,
                  marginBottom: '16px'
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  style={{ flex: 1, background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '12px', borderRadius: '12px', fontWeight: 700 }}
                  onClick={() => setShowWeightModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, background: 'var(--fitia-green)', color: '#FFFFFF', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 900 }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Damage Control Modal */}
      {showDamageControl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', padding: '24px 20px calc(24px + var(--safe-bottom))', width: '100%', maxWidth: '430px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '26px' }}>🛡️</span>
                <h3 style={{ fontSize: '18px', fontWeight: 900 }}>Protocolo Damage Control</h3>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px' }}
                onClick={() => setShowDamageControl(false)}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
              {DAMAGE_CONTROL_PROTOCOL.subtitle}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {DAMAGE_CONTROL_PROTOCOL.steps.map((st) => (
                <div key={st.step} style={{ background: 'var(--bg-card-subtle)', padding: '14px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--fitia-orange)', textTransform: 'uppercase' }}>
                    PASO {st.step} · {st.timing}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, margin: '4px 0' }}>{st.action}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{st.rationale}</div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: '20px' }}
              onClick={() => setShowDamageControl(false)}
            >
              Comprendido, activar protocolo
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: CALIBRACIÓN & ONBOARDING DE PERFILES
          =================================================================== */}
      {showProfileModal && editingProfile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 110, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', padding: '24px 20px calc(24px + var(--safe-bottom))', width: '100%', maxWidth: '440px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900 }}>Calibración de Perfil</h3>
                <span style={{ fontSize: '11px', color: 'var(--fitia-green)', fontWeight: 700 }}>
                  Adaptación Biométrica & Estilo de Vida
                </span>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}
                onClick={() => setShowProfileModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Profile Switcher Tabs inside Modal */}
            <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-card-subtle)', padding: '4px', borderRadius: '14px', marginBottom: '16px' }}>
              {Object.values(familyProfiles).map((prof) => (
                <button
                  key={prof.id}
                  type="button"
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '10px',
                    border: 'none',
                    background: editingProfile.id === prof.id ? 'var(--bg-card)' : 'transparent',
                    color: editingProfile.id === prof.id ? 'var(--fitia-green)' : 'var(--text-muted)',
                    fontWeight: 800,
                    fontSize: '11px',
                    cursor: 'pointer',
                    boxShadow: editingProfile.id === prof.id ? 'var(--card-shadow)' : 'none'
                  }}
                  onClick={() => setEditingProfile({ ...prof })}
                >
                  {prof.avatar} {prof.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Admin PIN Quick Action Banner */}
            <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--fitia-green)', borderRadius: '14px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🛡️</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800 }}>Control Central de PINs (Admin)</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Gestiona los PINs de Andrés, Pareja y Hermana</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenAdminPinModal}
                style={{ background: 'var(--fitia-green)', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
              >
                Editar PINs
              </button>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nombre</label>
                <input
                  type="text"
                  value={editingProfile.name || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-subtle)', color: 'var(--text-main)', fontWeight: 700, fontSize: '14px', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Meta Biológica Principal</label>
                <select
                  value={editingProfile.goal || 'recomposition'}
                  onChange={(e) => setEditingProfile({ ...editingProfile, goal: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-subtle)', color: 'var(--text-main)', fontWeight: 700, fontSize: '13px', marginTop: '4px' }}
                >
                  <option value="recomposition">Recomposición (Bajar Grasa + Mantener Músculo)</option>
                  <option value="lean_bulk">Superávit Limpio (Ganancia Muscular Magra)</option>
                  <option value="insulin_sensitivity">Sensibilidad a la Insulina & Glucosa Estable</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Peso Actual (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingProfile.weightKg || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, weightKg: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-subtle)', color: 'var(--text-main)', fontWeight: 800, fontSize: '14px', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Peso Objetivo (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingProfile.targetWeightKg || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, targetWeightKg: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-subtle)', color: 'var(--text-main)', fontWeight: 800, fontSize: '14px', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estatura (cm)</label>
                  <input
                    type="number"
                    value={editingProfile.heightCm || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, heightCm: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-subtle)', color: 'var(--text-main)', fontWeight: 800, fontSize: '14px', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Edad</label>
                  <input
                    type="number"
                    value={editingProfile.age || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, age: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-subtle)', color: 'var(--text-main)', fontWeight: 800, fontSize: '14px', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nivel de Actividad & Contexto</label>
                <select
                  value={editingProfile.activityLevel || 'moderate'}
                  onChange={(e) => setEditingProfile({ ...editingProfile, activityLevel: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-subtle)', color: 'var(--text-main)', fontWeight: 700, fontSize: '13px', marginTop: '4px' }}
                >
                  <option value="sedentary">Sedentario / Recuperación Médica</option>
                  <option value="light">Ligero (1-2 días caminatas o baile suave)</option>
                  <option value="moderate">Moderado (3-4 días gym / yoga / biohacking)</option>
                  <option value="high">Alto (5-6 días fuerza intensa / altitud Cajabamba)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ruta / Ubicación Frecuente</label>
                <input
                  type="text"
                  value={editingProfile.location || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, location: e.target.value })}
                  placeholder="Ej. Cajabamba / Trujillo"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-subtle)', color: 'var(--text-main)', fontWeight: 700, fontSize: '13px', marginTop: '4px' }}
                />
              </div>

              {(editingProfile.medicalAlert !== undefined || editingProfile.gentleNotes !== undefined) && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--fitia-green)', textTransform: 'uppercase' }}>🌿 Enfoque de Bienestar y Recomendaciones Personales</label>
                  <textarea
                    rows={2}
                    value={editingProfile.gentleNotes || editingProfile.medicalAlert || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, gentleNotes: e.target.value, medicalAlert: e.target.value })}
                    placeholder="Ej. Caminatas suaves, ritmo amable, sin presiones..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.35)', background: 'rgba(16, 185, 129, 0.04)', color: 'var(--text-main)', fontWeight: 600, fontSize: '12px', marginTop: '4px' }}
                  />
                </div>
              )}

              {/* Custom PIN Security Setting */}
              <div style={{ background: 'var(--bg-card-subtle)', border: '1.5px solid var(--fitia-green)', borderRadius: '14px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 900, color: 'var(--fitia-green)', textTransform: 'uppercase' }}>
                    🔒 PIN de Privacidad (4 dígitos)
                  </label>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Solo números</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={editingProfile.pin || ''}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setEditingProfile({ ...editingProfile, pin: clean });
                    }}
                    placeholder="1234"
                    style={{
                      width: '100px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      fontWeight: 900,
                      fontSize: '18px',
                      letterSpacing: '4px',
                      textAlign: 'center'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    Se solicitará este PIN para acceder a tus registros de peso, comidas y datos médicos en los celulares.
                  </div>
                </div>
              </div>

              {/* Dynamic Target Preview */}
              {(() => {
                const preview = calculateProfileTargets(editingProfile);
                return (
                  <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '14px', marginTop: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--fitia-green)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      ⚡ Recálculo Metabólico en Vivo (Mifflin-St Jeor)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                      <div style={{ background: 'var(--bg-card)', padding: '8px 4px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--fitia-green)' }}>{preview.calories}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>KCAL</div>
                      </div>
                      <div style={{ background: 'var(--bg-card)', padding: '8px 4px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--fitia-orange)' }}>{preview.protein}g</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>PROT</div>
                      </div>
                      <div style={{ background: 'var(--bg-card)', padding: '8px 4px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--fitia-blue)' }}>{preview.carbs}g</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>CARB</div>
                      </div>
                      <div style={{ background: 'var(--bg-card)', padding: '8px 4px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--fitia-purple)' }}>{preview.fat}g</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>GRASA</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                      💧 Hidratación sugerida: <strong>{preview.waterDailyMl || 2500} ml</strong> ({preview.waterNote})
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  style={{ flex: 1, background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '12px', borderRadius: '12px', fontWeight: 700 }}
                  onClick={() => setShowProfileModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  style={{ flex: 2, background: 'var(--fitia-green)', color: '#FFFFFF', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}
                  onClick={() => {
                    handleSaveProfileChanges(editingProfile);
                    if (editingProfile.id !== activeProfileId) {
                      handleSwitchProfile(editingProfile.id);
                    }
                  }}
                >
                  Guardar y Activar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: ASISTENTE INTERACTIVO DE RESPIRACIÓN WIM HOF
          =================================================================== */}
      {showWimHofModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '28px', padding: '26px 22px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', position: 'relative' }}>
            <button
              type="button"
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              onClick={() => {
                setShowWimHofModal(false);
                setWimHofPhase('breathing');
                setWimHofBreathCount(0);
                setWimHofHoldSeconds(0);
              }}
            >
              ✕
            </button>

            <span style={{ fontSize: '10px', fontWeight: 900, background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ❄️ Biohacking · Ronda {wimHofRound} de 3
            </span>

            {/* Phase 1: Breathing */}
            {wimHofPhase === 'breathing' && (
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '19px', fontWeight: 900, marginBottom: '6px' }}>Hiperoxigenación Celular</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.4 }}>
                  Inhala profundo al abdomen y pecho. Suelta relajado sin forzar.
                </p>

                {/* Breathing Bubble */}
                <div
                  style={{
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(16, 185, 129, 0.15) 70%)',
                    border: '3px solid #3B82F6',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    cursor: 'pointer',
                    transition: 'transform 0.25s ease'
                  }}
                  onClick={() => {
                    const next = wimHofBreathCount + 1;
                    setWimHofBreathCount(next);
                    if (next >= 30) {
                      setWimHofPhase('holding');
                      setWimHofHoldSeconds(0);
                    }
                  }}
                >
                  <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-main)' }}>{wimHofBreathCount}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>de 30 respiraciones</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button
                    type="button"
                    style={{ flex: 1, background: '#3B82F6', color: '#FFFFFF', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                    onClick={() => {
                      const next = wimHofBreathCount + 1;
                      setWimHofBreathCount(next);
                      if (next >= 30) {
                        setWimHofPhase('holding');
                        setWimHofHoldSeconds(0);
                      }
                    }}
                  >
                    +1 Respiración
                  </button>
                  <button
                    type="button"
                    style={{ flex: 1, background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer' }}
                    onClick={() => {
                      const next = Math.min(30, wimHofBreathCount + 10);
                      setWimHofBreathCount(next);
                      if (next >= 30) {
                        setWimHofPhase('holding');
                        setWimHofHoldSeconds(0);
                      }
                    }}
                  >
                    +10 Rápido
                  </button>
                </div>

                <button
                  type="button"
                  style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: '8px' }}
                  onClick={() => {
                    setWimHofPhase('holding');
                    setWimHofHoldSeconds(0);
                  }}
                >
                  Exhalar y comenzar retención ahora ➔
                </button>
              </div>
            )}

            {/* Phase 2: Retention / Hold */}
            {wimHofPhase === 'holding' && (
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '19px', fontWeight: 900, marginBottom: '6px', color: '#3B82F6' }}>Retención en Vacío</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
                  Pulmones sin aire. Relaja hombros, cuello y mandíbula. Siente la calma alcalina.
                </p>

                <div style={{ background: 'var(--bg-card-subtle)', border: '2px solid rgba(59, 130, 246, 0.4)', borderRadius: '20px', padding: '24px 10px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '48px', fontWeight: 900, fontFamily: 'monospace', color: 'var(--text-main)' }}>
                    {Math.floor(wimHofHoldSeconds / 60)}:{(wimHofHoldSeconds % 60).toString().padStart(2, '0')}
                  </div>
                  <span style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 800 }}>TIEMPO DE APNEA</span>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '14px', background: 'var(--fitia-green)' }}
                  onClick={() => setWimHofPhase('recovery')}
                >
                  🌬️ Tomar Inhalación de Recuperación
                </button>
              </div>
            )}

            {/* Phase 3: Recovery Breath */}
            {wimHofPhase === 'recovery' && (
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '19px', fontWeight: 900, marginBottom: '6px', color: 'var(--fitia-green)' }}>Inhalación de Recuperación</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
                  Inhala al 100% llenando el pecho. Retén durante 15 segundos llevando la energía a tu cabeza.
                </p>

                <div style={{ background: 'var(--bg-card-subtle)', border: '2px solid rgba(16, 185, 129, 0.4)', borderRadius: '20px', padding: '20px 10px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--fitia-green)' }}>15 Segundos</div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Retención con pulmones llenos</span>
                </div>

                {wimHofRound < 3 ? (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '14px', background: '#3B82F6' }}
                    onClick={() => {
                      setWimHofRound(wimHofRound + 1);
                      setWimHofPhase('breathing');
                      setWimHofBreathCount(0);
                      setWimHofHoldSeconds(0);
                    }}
                  >
                    Pasar a Ronda {wimHofRound + 1} ➔
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '14px', background: 'var(--fitia-green)' }}
                    onClick={() => {
                      toggleHabit('wimhof');
                      setShowWimHofModal(false);
                      setWimHofRound(1);
                      setWimHofPhase('breathing');
                      setWimHofBreathCount(0);
                      setWimHofHoldSeconds(0);
                      showToast('🔥 ¡3 Rondas de Wim Hof completadas! Biohacking activado.');
                    }}
                  >
                    ✨ Finalizar Sesión & Registrar Hábito
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL / OVERLAY: BLOQUEO POR PIN & PRIVACIDAD FAMILIAR
          =================================================================== */}
      {isLocked && (
        <div className="pin-lock-overlay">
          <div className="pin-lock-card">
            {(() => {
              const targetProf = familyProfiles[pinTargetProfileId] || FAMILY_PROFILES[pinTargetProfileId] || familyProfiles.andres;

              return (
                <>
                  <div className="pin-profile-avatar">
                    {targetProf.avatar}
                  </div>
                  <div className="pin-profile-name">{targetProf.name}</div>
                  <div className="pin-profile-role">{targetProf.role}</div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Ingresa tu PIN de seguridad (4 dígitos)
                  </div>

                  {/* Visual PIN Dots */}
                  <div className={`pin-dots-wrap ${isShakingPin ? 'pin-shake' : ''}`}>
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`pin-dot ${idx < enteredPin.length ? 'filled' : ''}`}
                      />
                    ))}
                  </div>

                  <div className="pin-error-msg">
                    {pinError || ''}
                  </div>

                  {/* Numeric Keypad */}
                  <div className="pin-keypad">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        className="pin-key-btn"
                        onClick={() => handlePinDigit(digit)}
                      >
                        {digit}
                        <span className="pin-key-sub">
                          {digit === '2' ? 'ABC' : digit === '3' ? 'DEF' : digit === '4' ? 'GHI' : digit === '5' ? 'JKL' : digit === '6' ? 'MNO' : digit === '7' ? 'PQRS' : digit === '8' ? 'TUV' : digit === '9' ? 'WXYZ' : '·'}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="pin-action-btn"
                      onClick={() => setEnteredPin('')}
                      title="Limpiar"
                    >
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>BORRAR</span>
                    </button>
                    <button
                      type="button"
                      className="pin-key-btn"
                      onClick={() => handlePinDigit('0')}
                    >
                      0
                      <span className="pin-key-sub">+</span>
                    </button>
                    <button
                      type="button"
                      className="pin-action-btn"
                      onClick={handlePinBackspace}
                      title="Retroceso"
                    >
                      ⌫
                    </button>
                  </div>

                  {/* Switch Profile Chips on Lock Screen */}
                  <div className="pin-switch-row">
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Persona:</span>
                    {Object.values(familyProfiles).map((prof) => (
                      <button
                        key={prof.id}
                        type="button"
                        className="pin-switch-chip"
                        style={{
                          borderColor: prof.id === pinTargetProfileId ? 'var(--fitia-green)' : 'var(--border-subtle)',
                          color: prof.id === pinTargetProfileId ? 'var(--fitia-green)' : 'var(--text-main)',
                          background: prof.id === pinTargetProfileId ? 'var(--fitia-green-soft)' : 'var(--bg-card-subtle)'
                        }}
                        onClick={() => {
                          setPinTargetProfileId(prof.id);
                          setEnteredPin('');
                          setPinError('');
                        }}
                      >
                        <span>{prof.avatar}</span>
                        <span>{prof.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPinTargetProfileId('andres');
                        setEnteredPin('');
                        setPinError('');
                        showToast('🛡️ Modo Administrador: Ingresa el PIN maestro de Andrés.');
                      }}
                      style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid var(--fitia-green)',
                        color: 'var(--fitia-green)',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>🛡️</span> Desbloquear con PIN de Admin (Andrés)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAdminPinModal()}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: 700,
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                    >
                      Editar PINs de la Familia
                    </button>
                  </div>

                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.35, textAlign: 'center' }}>
                    🔒 <em>Acceso protegido por PIN individual (4 dígitos). Para gestionar o resetear claves de la familia, usa el modo Administrador 🛡️.</em>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: DETALLES DE RECETA & PREPARACIÓN (CHEF FITIA)
          =================================================================== */}
      {selectedRecipeDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 110, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', padding: '24px 20px calc(24px + var(--safe-bottom))', width: '100%', maxWidth: '440px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '32px' }}>{selectedRecipeDetail.icon || '🍲'}</span>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900 }}>{selectedRecipeDetail.title || selectedRecipeDetail.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--fitia-green)', fontWeight: 800 }}>
                    ⏱️ Listo en {selectedRecipeDetail.prepMinutes} minutos · Receta Casera
                  </span>
                </div>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}
                onClick={() => setSelectedRecipeDetail(null)}
              >
                ✕
              </button>
            </div>

            {/* Interactive Portion Scaler & Scaled Macros Breakdown */}
            {(() => {
              const mult = getRecipeMultiplier(selectedRecipeDetail.id);
              const mCal = Math.round(Number(selectedRecipeDetail.calories || 0) * mult);
              const mP = Math.round(Number(selectedRecipeDetail.protein || selectedRecipeDetail.proteinG || 0) * mult * 10) / 10;
              const mC = Math.round(Number(selectedRecipeDetail.carbs || selectedRecipeDetail.carbsG || 0) * mult * 10) / 10;
              const mF = Math.round(Number(selectedRecipeDetail.fat || selectedRecipeDetail.fatG || 0) * mult * 10) / 10;

              return (
                <>
                  <div className="recipe-portion-scaler-row" style={{ marginBottom: '14px' }}>
                    <div className="portion-scaler-label">
                      <span>⚖️ Ajustar tamaño de porción: <strong>{Math.round(mult * 100)}% ({Math.round(350 * mult)}g)</strong></span>
                      {mult !== 1.0 && <span className="portion-scaler-tag">Escala x{mult}</span>}
                    </div>
                    <div className="portion-scaler-controls">
                      <button
                        type="button"
                        className="btn-portion-step"
                        onClick={() => handleAdjustRecipeMultiplier(selectedRecipeDetail.id, -0.25)}
                        disabled={mult <= 0.5}
                      >
                        −
                      </button>
                      <div className="portion-pills">
                        {[0.75, 1.0, 1.25, 1.5, 2.0].map((val) => (
                          <button
                            key={val}
                            type="button"
                            className={`btn-portion-pill ${mult === val ? 'active' : ''}`}
                            onClick={() => handleSetRecipeMultiplier(selectedRecipeDetail.id, val)}
                          >
                            {val}x
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="btn-portion-step"
                        onClick={() => handleAdjustRecipeMultiplier(selectedRecipeDetail.id, 0.25)}
                        disabled={mult >= 2.5}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Macros Breakdown Card with scaled values */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center', background: 'var(--bg-card-subtle)', padding: '12px 6px', borderRadius: '14px', marginBottom: '16px', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--fitia-green)' }}>{mCal}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>KCAL</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--fitia-orange)' }}>{mP}g</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>PROTEÍNA</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--fitia-blue)' }}>{mC}g</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>CARBOS</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--fitia-purple)' }}>{mF}g</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>GRASAS</div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Description */}
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
              {selectedRecipeDetail.description}
            </div>

            {/* Didactic Portion */}
            {selectedRecipeDetail.portionDidactic && (
              <div className="fitia-recipe-portion-box" style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '16px' }}>📦</span>
                <div>
                  <strong style={{ color: 'var(--text-main)', fontSize: '12px', display: 'block' }}>
                    Porción Didáctica Recomendada:
                  </strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {selectedRecipeDetail.portionDidactic}
                  </span>
                </div>
              </div>
            )}

            {/* Didactic Why Box */}
            {selectedRecipeDetail.didacticWhy && (
              <div className="recipe-didactic-box" style={{ marginBottom: '12px' }}>
                <div className="recipe-didactic-title">💡 ¿Por qué comer esto hoy?</div>
                <div className="recipe-didactic-text">{selectedRecipeDetail.didacticWhy}</div>
              </div>
            )}

            {/* Chef Tip */}
            {selectedRecipeDetail.chefTip && (
              <div className="recipe-chef-tip-box" style={{ marginBottom: '14px' }}>
                <strong>👨‍🍳 Tip del Chef Fitia:</strong> {selectedRecipeDetail.chefTip}
              </div>
            )}

            {/* Required Ingredients */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                🛒 Ingredientes Requeridos
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(selectedRecipeDetail.requiredIngredients || []).map((ing, i) => {
                  const hasIt = selectedIngredients.includes(ing);
                  return (
                    <span
                      key={i}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: hasIt ? 'var(--fitia-green-soft)' : 'var(--bg-card-subtle)',
                        color: hasIt ? 'var(--fitia-green)' : 'var(--text-muted)',
                        border: hasIt ? '1px solid var(--fitia-green)' : '1px solid var(--border-subtle)'
                      }}
                    >
                      {hasIt ? '✓ ' : '○ '}
                      {ing.charAt(0).toUpperCase() + ing.slice(1)}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Step-by-Step Cooking Steps */}
            {selectedRecipeDetail.instructions && selectedRecipeDetail.instructions.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  👨‍🍳 Preparación Paso a Paso
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedRecipeDetail.instructions.map((step, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        background: 'var(--bg-card-subtle)',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <span
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: 'var(--fitia-green)',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 900,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.4 }}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meal Slot Selector & Log Button */}
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Registrar comida en:
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                {['desayuno', 'comida', 'cena', 'snack'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 800,
                      border: (recipeSlotToLog || selectedRecipeDetail.suggestedSlot || 'comida') === s ? '1.5px solid var(--fitia-green)' : '1px solid var(--border-subtle)',
                      background: (recipeSlotToLog || selectedRecipeDetail.suggestedSlot || 'comida') === s ? 'var(--fitia-green-soft)' : 'var(--bg-card-subtle)',
                      color: (recipeSlotToLog || selectedRecipeDetail.suggestedSlot || 'comida') === s ? 'var(--fitia-green)' : 'var(--text-muted)',
                      textTransform: 'capitalize',
                      cursor: 'pointer'
                    }}
                    onClick={() => setRecipeSlotToLog(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '14px', background: 'var(--fitia-green)' }}
                onClick={() => handleRegisterRecipe(selectedRecipeDetail, recipeSlotToLog || selectedRecipeDetail.suggestedSlot || 'comida', getRecipeMultiplier(selectedRecipeDetail.id))}
              >
                + Registrar {Math.round(Number(selectedRecipeDetail.calories || 0) * getRecipeMultiplier(selectedRecipeDetail.id))} kcal en {(recipeSlotToLog || selectedRecipeDetail.suggestedSlot || 'comida').toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: ADMINISTRADOR MAESTRO DE PINS FAMILIARES (ANDRÉS)
          =================================================================== */}
      {showAdminPinModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '24px 20px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🛡️</span>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0 }}>Administrador de PINs</h3>
                  <span style={{ fontSize: '11px', color: 'var(--fitia-green)', fontWeight: 700 }}>Control Central Familia Andrés</span>
                </div>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
                onClick={() => setShowAdminPinModal(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.4 }}>
              Como administrador de la cuenta familiar, puedes ver y editar los códigos PIN de 4 dígitos para cada miembro de la familia.
            </p>

            {/* 3 Profile PIN rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.values(familyProfiles).map((prof) => {
                const isVisible = pinVisibility[prof.id];
                const val = adminPins[prof.id] ?? prof.pin ?? '1234';

                return (
                  <div
                    key={prof.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--bg-card-subtle)',
                      borderRadius: '16px',
                      border: prof.id === 'andres' ? '1.5px solid var(--fitia-green)' : '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px' }}>{prof.avatar}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '14px' }}>{prof.name}</span>
                          {prof.id === 'andres' && (
                            <span style={{ fontSize: '9px', background: 'var(--fitia-green)', color: '#fff', padding: '2px 6px', borderRadius: '6px', fontWeight: 900 }}>ADMIN</span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{prof.role.split('&')[0]}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type={isVisible ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={4}
                        value={val}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setAdminPins((prev) => ({ ...prev, [prof.id]: clean }));
                        }}
                        style={{
                          width: '76px',
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          fontWeight: 900,
                          fontSize: '18px',
                          letterSpacing: isVisible ? '2px' : '3px',
                          textAlign: 'center'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setPinVisibility((prev) => ({ ...prev, [prof.id]: !prev[prof.id] }))}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '8px 9px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                        title={isVisible ? 'Ocultar PIN' : 'Ver PIN'}
                      >
                        {isVisible ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-subtle)', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => setShowAdminPinModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--fitia-green)', color: '#FFFFFF', fontWeight: 900, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                onClick={() => handleSaveAdminPins()}
              >
                💾 Guardar PINs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
