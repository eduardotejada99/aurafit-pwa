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
  calculateDailyAuraScore,
  calculateCouplePortions,
  generateCoupleGroceryList,
  HYBRID_ATHLETE_SYSTEM,
  getHybridWorkoutPrescription,
  analyzeWeeklyWorkoutBalance,
  calculateSystemicPillars,
  getLocalDateKey,
  calculateMenstrualCyclePhase,
  DEFAULT_CYCLE_CONFIGS,
  MENSTRUAL_PHASES_METADATA
} from '@/lib/fitness-data';
import {
  CURATED_PERUVIAN_FOODS,
  PERUVIAN_MENU_OPTIONS,
  PERUVIAN_ENTRADAS_DATABASE,
  PERUVIAN_SEGUNDOS_DATABASE,
  PERUVIAN_CARBOS_DATABASE,
  calculatePeruvianCustomMenu,
  parseNaturalLanguageFood,
  calculateCompensatoryRebalance
} from '@/lib/food-database';
import {
  SYNC_KEYS,
  queueCloudSync,
  flushCloudSync,
  pullCloudData,
  getLocalSyncBundle,
  mergeCloudIntoLocalStorage
} from '@/lib/cloud-sync';
import {
  DEFAULT_NOTIFICATION_CONFIG,
  checkNotificationSupport,
  requestNotificationPermission,
  sendCreatineNotification,
  sendWaterNotification,
  evaluateReminders
} from '@/lib/notifications';

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
  const [selectedDay, setSelectedDay] = useState(new Date().getDate()); // Dynamic today's day of month
  
  // Multi-Profile State (Andrés, Pareja, Hermana)
  const [activeProfileId, setActiveProfileId] = useState('andres');
  const [familyProfiles, setFamilyProfiles] = useState(FAMILY_PROFILES);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [coupleModeEnabled, setCoupleModeEnabled] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    role: 'Bienestar & Nutrición',
    avatar: '🌸',
    pin: '1234',
    weightKg: 60,
    goal: 'recomposition',
    isPartnerOfAndres: false
  });

  const partnerName = useMemo(() => {
    const raw = familyProfiles.pareja?.name || 'Tania';
    return raw.replace(/\s*\(Pareja\)/i, '').trim() || 'Tania';
  }, [familyProfiles.pareja?.name]);

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
  const [streakDays, setStreakDays] = useState(1);
  const [showDamageControl, setShowDamageControl] = useState(false);
  const [showTextLogModal, setShowTextLogModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // User Workout Split & Missed Day State (100% Dynamic & User Controlled)
  const [selectedSplit, setSelectedSplit] = useState(null); // 'legs' | 'push' | 'pull' | 'full_upper' | 'home_core'
  const [isMissedDay, setIsMissedDay] = useState(false);
  const [weeklyWorkoutLogs, setWeeklyWorkoutLogs] = useState({}); // { 'YYYY-MM-DD': { split, title, done, isMissedDay, minutes } }

  // Sleep & Recovery State (Interactive Sleep Logger)
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState('deep'); // 'deep', 'normal', 'light'

  // Daily Workout Completion Tracking (Intelligent Activity Pillar)
  const [todayWorkoutDone, setTodayWorkoutDone] = useState(false);
  const [workoutDurationMins, setWorkoutDurationMins] = useState(45);

  // Active Date Key for 100% Dynamic Day Tracking (Local Timezone safe for Peru / UTC-5)
  const [selectedDateKey, setSelectedDateKey] = useState(() => getLocalDateKey());
  const [waterByDate, setWaterByDate] = useState({});

  // Menstrual Cycle & Female Hormonal Adaptive Training State
  const [cycleConfigs, setCycleConfigs] = useState(() => ({ ...DEFAULT_CYCLE_CONFIGS }));
  const [showCycleConfigModal, setShowCycleConfigModal] = useState(false);
  const [isCycleExpanded, setIsCycleExpanded] = useState(false);
  const [cycleForm, setCycleForm] = useState({
    enabled: true,
    lastPeriodStartDate: '2026-10-06',
    cycleLengthDays: 28,
    periodDurationDays: 5
  });

  const activeDateKey = selectedDateKey || getLocalDateKey();
  const todayDateKey = getLocalDateKey();
  const activeWaterMl = activeDateKey === todayDateKey
    ? Math.max(waterMl, waterByDate[todayDateKey] || 0)
    : (waterByDate[activeDateKey] || 0);

  // Daily Logged Foods State (persistent per profile)
  const [loggedFoods, setLoggedFoods] = useState([]);

  // Dynamically filtered foods for the active selected day and active profile
  const activeDayFoods = useMemo(() => {
    const todayKey = getLocalDateKey();
    const targetKey = selectedDateKey || todayKey;
    return loggedFoods.filter((item) => {
      // Strict multi-user profile isolation: items must match activeProfileId
      if (item.profileId) {
        if (item.profileId !== activeProfileId) return false;
      } else {
        // Legacy untagged items only belong to 'andres'
        if (activeProfileId !== 'andres') return false;
      }
      if (item.date) {
        return item.date === targetKey;
      }
      return targetKey === todayKey;
    });
  }, [loggedFoods, selectedDateKey, activeProfileId]);

  // Dynamic Nutritional Score Engine (0-100 Scientific Fitia Algorithm)
  const nutritionalScore = useMemo(() => {
    return calculateNutritionalScore({
      loggedFoods: activeDayFoods,
      targets,
      waterMl: activeWaterMl,
      waterTargetMl: currentProfile.waterDailyMl || 2500,
      profile: currentProfile
    });
  }, [activeDayFoods, targets, activeWaterMl, currentProfile]);

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
  
  // Peruvian Menu Modal State (Menú del Día Rápido)
  const [showPeruvianMenuModal, setShowPeruvianMenuModal] = useState(false);
  const [peruvianMenuTab, setPeruvianMenuTab] = useState('presets'); // 'presets' | 'builder'
  const [builderEntradaId, setBuilderEntradaId] = useState('none');
  const [builderSegundoId, setBuilderSegundoId] = useState('pollo_plancha');
  const [builderCarboIds, setBuilderCarboIds] = useState(['arroz', 'lentejas']);
  // Nutrition & Pantry state (Fitia Coach)
  const [selectedIngredients, setSelectedIngredients] = useState(['huevos', 'avena', 'platano', 'pollo', 'arroz']);
  const [pantryCategoryTab, setPantryCategoryTab] = useState('proteinas');
  const [pantryMealSlotFilter, setPantryMealSlotFilter] = useState('all');
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');
  const [meals, setMeals] = useState([]);
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState(null);
  const [recipeSlotToLog, setRecipeSlotToLog] = useState('comida');
  const [quickTextEntry, setQuickTextEntry] = useState('');

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

  // Couple Kitchen & Batch Cooking State (Andrés & Pareja)
  const [showCoupleGroceryModal, setShowCoupleGroceryModal] = useState(false);
  const [checkedGroceryItems, setCheckedGroceryItems] = useState({});
  const [couplePortionsExpanded, setCouplePortionsExpanded] = useState({});
  const coupleGroceryList = useMemo(() => generateCoupleGroceryList(7, partnerName), [partnerName]);

  const handleToggleGroceryItem = (id) => {
    setCheckedGroceryItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyGroceryList = () => {
    let text = `🛒 *LISTA DE COMPRAS COMPARTIDA: ${(familyProfiles.andres?.name || 'ANDRÉS').toUpperCase()} & ${partnerName.toUpperCase()}*\n(Sincronizada para la semana / Viaje a Cajabamba)\n\n`;
    coupleGroceryList.forEach((cat) => {
      text += `*${cat.icon} ${cat.category.toUpperCase()}*\n`;
      cat.items.forEach((item) => {
        const mark = checkedGroceryItems[item.id] ? '✅' : '▫️';
        text += `${mark} *${item.name}*: ${item.qty}\n   └ ${item.purpose}\n`;
      });
      text += '\n';
    });
    text += `💡 *Tip de Cocina en 1 Sola Sartén:*\nCocinan los mismos ingredientes juntos. Al servir: 60% para ${familyProfiles.andres?.name || 'Andrés'} (recomposición) y 40% para ${partnerName} (hipertrofia sin sobrecarga).`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert('¡Lista de compras copiada al portapapeles para enviar por WhatsApp!');
    }
  };
  
  // Workout state & Hybrid Athlete System (Dejan Stipke style)
  const [workoutMode, setWorkoutMode] = useState('gym');
  const [workoutContext, setWorkoutContext] = useState('gym'); // 'gym' | 'home_bars' | 'travel'
  const [workoutDurationMode, setWorkoutDurationMode] = useState('full'); // 'full' (2h) | 'express' (45m)
  const [recentHeavyDays, setRecentHeavyDays] = useState(0); // 0, 1, 2+ consecutive heavy days
  const [selectedSkillTab, setSelectedSkillTab] = useState('handstand'); // 'handstand', 'front_lever', 'muscle_up', 'planche'
  const [activeSkillLevels, setActiveSkillLevels] = useState({
    handstand: 1,
    front_lever: 1,
    muscle_up: 1,
    planche: 1,
    weighted_calisthenics: 2, // Andrés tiene nivel intermedio en calistenia con lastre
    hip_thrust: 1,
    mcgill_core: 1,
    supported_row: 1
  });
  const [selectedLastreKg, setSelectedLastreKg] = useState(10); // Lastre activo recomendado para intermedio
  const [showSubstitutesFor, setShowSubstitutesFor] = useState(null); // exercise name or null
  const [completedExercises, setCompletedExercises] = useState([]); // array of exercise identifiers
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const hybridPrescription = useMemo(() => {
    return getHybridWorkoutPrescription({
      profile: currentProfile,
      selectedSplit,
      isMissedDay,
      sleepHours: Number(sleepHours || 7.5),
      sleepQuality: sleepQuality || 'deep',
      recentHeavyDays: Number(recentHeavyDays || 0),
      context: workoutContext,
      durationMode: workoutDurationMode
    });
  }, [currentProfile, selectedSplit, isMissedDay, sleepHours, sleepQuality, recentHeavyDays, workoutContext, workoutDurationMode]);

  // Dynamic Weekly Workout Balance Analytics (e.g., Legs Monday -> suggests Pull/Back or Push)
  const weeklyWorkoutBalance = useMemo(() => {
    return analyzeWeeklyWorkoutBalance({
      weeklyLogs: weeklyWorkoutLogs,
      profileId: activeProfileId
    });
  }, [weeklyWorkoutLogs, activeProfileId]);

  // The 4 Interconnected Systemic Pillars (0-100 AuraScore + Cross-Pillar Synergies)
  const systemicPillars = useMemo(() => {
    return calculateSystemicPillars({
      profile: currentProfile,
      loggedFoods: activeDayFoods,
      targets,
      waterMl: activeWaterMl,
      sleepHours,
      sleepQuality,
      selectedSplit,
      isMissedDay,
      todayWorkoutDone,
      habits,
      weeklyLogs: weeklyWorkoutLogs
    });
  }, [currentProfile, activeDayFoods, targets, activeWaterMl, sleepHours, sleepQuality, selectedSplit, isMissedDay, todayWorkoutDone, habits, weeklyWorkoutLogs]);

  // Weight tracking state (dynamically initialized relative to current date and base profile weight)
  const [weightLogs, setWeightLogs] = useState(() => {
    const profWeight = FAMILY_PROFILES.andres?.weightKg || 92;
    const now = new Date();
    const makeDate = (offsetDays) => {
      const d = new Date(now);
      d.setDate(now.getDate() - offsetDays);
      return `${d.getDate()} ${d.toLocaleString('es-PE', { month: 'short' })}`;
    };
    return [
      { log_date: makeDate(6), weight_kg: Math.round((profWeight + 0.6) * 10) / 10 },
      { log_date: makeDate(4), weight_kg: Math.round((profWeight + 0.3) * 10) / 10 },
      { log_date: makeDate(2), weight_kg: Math.round((profWeight + 0.1) * 10) / 10 },
      { log_date: makeDate(0), weight_kg: Math.round(profWeight * 10) / 10 }
    ];
  });
  const [newWeightInput, setNewWeightInput] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);

  // Custom Habits Modal State
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [newHabitForm, setNewHabitForm] = useState({
    name: '',
    target: '',
    icon: '🧘',
    category: 'bienestar',
    note: ''
  });

  const weightAnalytics = calculateWeightAnalytics(weightLogs);

  // Multi-Device Cloud Synchronization State
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState('syncing'); // 'synced' | 'syncing' | 'local'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Smart Notifications State (Creatine & Water Reminders)
  const [notificationConfig, setNotificationConfig] = useState(DEFAULT_NOTIFICATION_CONFIG);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Reader Modal State for Deep Text / Technique Guides / Step-by-Step Protocols
  const [detailReaderModal, setDetailReaderModal] = useState(null);

  // Unified Mobile-Native Body Scroll Lock when ANY Modal or Sheet is Open
  const isAnyModalOpen = Boolean(
    showProfileModal ||
    showAddMemberModal ||
    showAdminPinModal ||
    showWimHofModal ||
    showTextLogModal ||
    showFoodSearchModal ||
    showCoupleGroceryModal ||
    showWeightModal ||
    showAddHabitModal ||
    Boolean(editingHabit) ||
    showDamageControl ||
    showNotificationModal ||
    showCycleConfigModal ||
    selectedRecipeDetail ||
    detailReaderModal ||
    isLocked
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    if (isAnyModalOpen) {
      body.classList.add('modal-open');
      root.classList.add('modal-open');
    } else {
      body.classList.remove('modal-open');
      root.classList.remove('modal-open');
    }

    return () => {
      body.classList.remove('modal-open');
      root.classList.remove('modal-open');
    };
  }, [isAnyModalOpen]);

  // Load local storage if available on mount & initiate bidirectional cloud sync
  useEffect(() => {
    let activeKey = 'andres';
    try {
      const savedTheme = localStorage.getItem('aurafit_theme');
      if (savedTheme === 'dark') setIsDarkMode(true);

      const savedProfiles = localStorage.getItem('aurafit_family_profiles');
      if (savedProfiles) {
        const parsed = JSON.parse(savedProfiles);
        const merged = { ...FAMILY_PROFILES };
        Object.keys(parsed).forEach((k) => {
          let name = parsed[k].name;
          if (k === 'pareja' && (!name || name === 'Mi Pareja')) {
            name = 'Tania';
          }
          merged[k] = {
            ...(FAMILY_PROFILES[k] || {}),
            ...parsed[k],
            name: name || parsed[k].name || FAMILY_PROFILES[k]?.name || k,
            pin: (parsed[k].pin || FAMILY_PROFILES[k]?.pin || '1234').toString()
          };
        });
        setFamilyProfiles(merged);
      }

      const savedActiveProfile = localStorage.getItem('aurafit_active_profile');
      activeKey = savedActiveProfile && (FAMILY_PROFILES[savedActiveProfile] || localStorage.getItem(`aurafit_family_profiles`)) ? savedActiveProfile : 'andres';
      setActiveProfileId(activeKey);
      loadProfileData(activeKey);

      const savedIngredients = localStorage.getItem('aurafit_ingredients');
      if (savedIngredients) setSelectedIngredients(JSON.parse(savedIngredients));

      const savedCouple = localStorage.getItem('aurafit_couple_mode_enabled');
      if (savedCouple !== null) {
        setCoupleModeEnabled(savedCouple === 'true');
      }

      const savedNotifs = localStorage.getItem('aurafit_notifications_config');
      if (savedNotifs) {
        try { setNotificationConfig(JSON.parse(savedNotifs)); } catch (e) {}
      }
      const notifStatus = checkNotificationSupport();
      setNotificationPermission(notifStatus.permission);

      // Load Menstrual Cycle Configs from LocalStorage
      const loadedCycles = { ...DEFAULT_CYCLE_CONFIGS };
      ['pareja', 'hermana', 'andres'].forEach((pk) => {
        const raw = localStorage.getItem(`aurafit_cycle_${pk}`);
        if (raw) {
          try {
            loadedCycles[pk] = { ...loadedCycles[pk], ...JSON.parse(raw) };
          } catch (e) {}
        }
      });
      setCycleConfigs(loadedCycles);
    } catch (err) {
      console.warn('Storage sync err:', err);
    }

    // PWA Service Worker Update Listeners
    const onUpdateReady = () => setUpdateAvailable(true);
    const onUpdated = () => {
      setUpdateAvailable(false);
      showToast('✨ ¡App actualizada a la última versión!');
    };
    window.addEventListener('aurafit_update_ready', onUpdateReady);
    window.addEventListener('aurafit_updated', onUpdated);

    // Initial Cloud Pull & Sync from Neon PostgreSQL
    const doInitialCloudSync = async () => {
      setIsSyncing(true);
      setCloudStatus('syncing');
      try {
        const currentActiveProfile = localStorage.getItem('aurafit_active_profile') || activeKey;

        // 1. Push any local changes to cloud first so local entries are safely stored
        const localBundle = getLocalSyncBundle(Object.keys(FAMILY_PROFILES));
        if (Object.keys(localBundle).length > 0) {
          try {
            await fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bundle: localBundle, updatedBy: `${currentActiveProfile}-seed` })
            });
          } catch (e) {}
        }

        // 2. Pull latest state from cloud and merge monotonically
        const res = await pullCloudData(currentActiveProfile);
        if (res && res.ok && res.items && Object.keys(res.items).length > 0) {
          // Merge cloud data into localStorage safely
          mergeCloudIntoLocalStorage(res.items);

          if (res.items[SYNC_KEYS.FAMILY_PROFILES]) {
            const parsedProfiles = res.items[SYNC_KEYS.FAMILY_PROFILES];
            const merged = { ...FAMILY_PROFILES };
            Object.keys(parsedProfiles).forEach((k) => {
              let name = parsedProfiles[k].name;
              if (k === 'pareja' && (!name || name === 'Mi Pareja')) {
                name = 'Tania';
              }
              merged[k] = {
                ...(FAMILY_PROFILES[k] || {}),
                ...parsedProfiles[k],
                name: name || parsedProfiles[k].name || FAMILY_PROFILES[k]?.name || k,
                pin: (parsedProfiles[k].pin || FAMILY_PROFILES[k]?.pin || '1234').toString()
              };
            });
            setFamilyProfiles(merged);
          }

          if (res.items[SYNC_KEYS.COUPLE_MODE] !== undefined) {
            setCoupleModeEnabled(Boolean(res.items[SYNC_KEYS.COUPLE_MODE]));
          }

          if (res.items[SYNC_KEYS.INGREDIENTS] && Array.isArray(res.items[SYNC_KEYS.INGREDIENTS])) {
            setSelectedIngredients(res.items[SYNC_KEYS.INGREDIENTS]);
          }

          if (res.items.aurafit_notifications_config) {
            setNotificationConfig(res.items.aurafit_notifications_config);
          }

          // Reload active profile data with merged cloud items
          loadProfileData(currentActiveProfile);
          setCloudStatus('synced');
          setLastSyncTime(new Date());
        } else if (res && res.ok) {
          setCloudStatus('synced');
          setLastSyncTime(new Date());
        } else {
          setCloudStatus('local');
        }
      } catch (err) {
        console.warn('Initial cloud sync error:', err);
        setCloudStatus('local');
      } finally {
        setIsSyncing(false);
      }
    };

    doInitialCloudSync();

    // Auto-pull when user returns to app (strictly targeting current active profile)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const currentActiveProfile = localStorage.getItem('aurafit_active_profile') || 'andres';
        pullCloudData(currentActiveProfile).then((res) => {
          if (res && res.ok && res.items && Object.keys(res.items).length > 0) {
            mergeCloudIntoLocalStorage(res.items);
            loadProfileData(currentActiveProfile);
            setCloudStatus('synced');
            setLastSyncTime(new Date());
          }
        }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('aurafit_update_ready', onUpdateReady);
      window.removeEventListener('aurafit_updated', onUpdated);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setCloudStatus('syncing');
    showToast('🔄 Conectando con la nube Neon PostgreSQL...');
    try {
      // 1. Push any local state to cloud
      const localBundle = getLocalSyncBundle(Object.keys(familyProfiles));
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundle: localBundle, updatedBy: activeProfileId })
      });

      // 2. Pull latest state from cloud
      const pullRes = await pullCloudData(activeProfileId);
      if (pullRes && pullRes.ok && pullRes.items) {
        mergeCloudIntoLocalStorage(pullRes.items);
        if (pullRes.items[SYNC_KEYS.FAMILY_PROFILES]) {
          const merged = { ...FAMILY_PROFILES };
          Object.keys(pullRes.items[SYNC_KEYS.FAMILY_PROFILES]).forEach((k) => {
            const p = pullRes.items[SYNC_KEYS.FAMILY_PROFILES][k];
            let name = p.name;
            if (k === 'pareja' && (!name || name === 'Mi Pareja')) {
              name = 'Tania';
            }
            merged[k] = {
              ...(FAMILY_PROFILES[k] || {}),
              ...p,
              name: name || p.name || FAMILY_PROFILES[k]?.name || k,
              pin: (p.pin || FAMILY_PROFILES[k]?.pin || '1234').toString()
            };
          });
          setFamilyProfiles(merged);
        }
        if (pullRes.items[SYNC_KEYS.COUPLE_MODE] !== undefined) {
          setCoupleModeEnabled(Boolean(pullRes.items[SYNC_KEYS.COUPLE_MODE]));
        }
        if (pullRes.items[SYNC_KEYS.INGREDIENTS]) {
          setSelectedIngredients(pullRes.items[SYNC_KEYS.INGREDIENTS]);
        }
        loadProfileData(activeProfileId);
        setCloudStatus('synced');
        setLastSyncTime(new Date());
        showToast('☁️ ¡Sincronizado! Todos los celulares tienen los mismos datos.');
      }
    } catch (err) {
      console.warn('Manual sync err:', err);
      setCloudStatus('local');
      showToast('⚠️ No se pudo conectar a la nube. Operando en modo local.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleForceUpdateApp = () => {
    showToast('🚀 Actualizando versión y limpiando caché...');
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'PURGE_AND_UPDATE' });
    }
    setTimeout(() => {
      if (typeof caches !== 'undefined') {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      window.location.reload(true);
    }, 600);
  };

  const handleToggleCoupleMode = () => {
    setCoupleModeEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('aurafit_couple_mode_enabled', next ? 'true' : 'false');
        queueCloudSync('aurafit_couple_mode_enabled', next, activeProfileId);
      }
      return next;
    });
  };

  // Auto-Evaluation Loop for Creatine and Water Reminders
  useEffect(() => {
    if (!notificationConfig || !notificationConfig.enabled) return;

    const checkReminders = async () => {
      const isCreatineDone = Boolean(habits.find((h) => h.id === 'creatine')?.completed);
      const waterTarget = currentProfile.waterDailyMl || 3000;

      const { triggerWater, triggerCreatine } = evaluateReminders(notificationConfig, {
        creatineDone: isCreatineDone,
        waterMl,
        waterTargetMl: waterTarget
      });

      if (triggerWater) {
        await sendWaterNotification(waterMl, waterTarget);
        setNotificationConfig((prev) => {
          const updated = { ...prev, lastWaterNotified: Date.now() };
          try {
            localStorage.setItem('aurafit_notifications_config', JSON.stringify(updated));
            queueCloudSync('aurafit_notifications_config', updated, activeProfileId);
          } catch (e) {}
          return updated;
        });
      }

      if (triggerCreatine) {
        await sendCreatineNotification();
        const todayKey = getLocalDateKey();
        setNotificationConfig((prev) => {
          const updated = { ...prev, lastCreatineNotifiedDate: todayKey };
          try {
            localStorage.setItem('aurafit_notifications_config', JSON.stringify(updated));
            queueCloudSync('aurafit_notifications_config', updated, activeProfileId);
          } catch (e) {}
          return updated;
        });
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 45 * 1000);
    return () => clearInterval(interval);
  }, [notificationConfig, habits, waterMl, currentProfile.waterDailyMl, activeProfileId]);

  const handleRequestNotificationPermission = async () => {
    const res = await requestNotificationPermission();
    setNotificationPermission(res);
    if (res === 'granted') {
      const updated = { ...notificationConfig, enabled: true };
      setNotificationConfig(updated);
      try {
        localStorage.setItem('aurafit_notifications_config', JSON.stringify(updated));
        queueCloudSync('aurafit_notifications_config', updated, activeProfileId);
      } catch (e) {}
      showToast('🔔 ¡Notificaciones activadas en este dispositivo!');
      await sendWaterNotification(waterMl, currentProfile.waterDailyMl || 3000);
    } else if (res === 'denied') {
      showToast('⚠️ Permiso denegado. Habilita las notificaciones en ajustes del navegador o celular.');
    } else {
      showToast('⚠️ Este dispositivo o navegador no soporta Notificaciones Web.');
    }
  };

  const handleToggleNotificationEnabled = async () => {
    if (!notificationConfig.enabled) {
      if (notificationPermission !== 'granted') {
        await handleRequestNotificationPermission();
        return;
      }
      const updated = { ...notificationConfig, enabled: true };
      setNotificationConfig(updated);
      try {
        localStorage.setItem('aurafit_notifications_config', JSON.stringify(updated));
        queueCloudSync('aurafit_notifications_config', updated, activeProfileId);
      } catch (e) {}
      showToast('🔔 Recordatorios de Creatina y Agua activados.');
    } else {
      const updated = { ...notificationConfig, enabled: false };
      setNotificationConfig(updated);
      try {
        localStorage.setItem('aurafit_notifications_config', JSON.stringify(updated));
        queueCloudSync('aurafit_notifications_config', updated, activeProfileId);
      } catch (e) {}
      showToast('🔕 Recordatorios desactivados temporalmente.');
    }
  };

  const handleSetWaterInterval = (mins) => {
    setNotificationConfig((prev) => {
      const updated = { ...prev, waterIntervalMinutes: mins, enabled: mins > 0 ? true : prev.enabled };
      try {
        localStorage.setItem('aurafit_notifications_config', JSON.stringify(updated));
        queueCloudSync('aurafit_notifications_config', updated, activeProfileId);
      } catch (e) {}
      return updated;
    });
    showToast(mins > 0 ? `💧 Recordatorio de agua configurado cada ${mins} min.` : '💧 Recordatorio de agua desactivado.');
  };

  const handleSetCreatineTime = (timeStr) => {
    setNotificationConfig((prev) => {
      const updated = { ...prev, creatineReminderTime: timeStr, enabled: true };
      try {
        localStorage.setItem('aurafit_notifications_config', JSON.stringify(updated));
        queueCloudSync('aurafit_notifications_config', updated, activeProfileId);
      } catch (e) {}
      return updated;
    });
    showToast(`⚡ Recordatorio de Creatina fijado a las ${timeStr}.`);
  };

  const handleTestWaterNotification = async () => {
    if (notificationPermission !== 'granted') {
      await handleRequestNotificationPermission();
      return;
    }
    const res = await sendWaterNotification(waterMl, currentProfile.waterDailyMl || 3000);
    if (res.sent) {
      showToast('💧 Notificación de Agua enviada a tu pantalla.');
    } else {
      showToast('⚠️ No se pudo enviar. Verifica los permisos de notificaciones del celular.');
    }
  };

  const handleTestCreatineNotification = async () => {
    if (notificationPermission !== 'granted') {
      await handleRequestNotificationPermission();
      return;
    }
    const res = await sendCreatineNotification();
    if (res.sent) {
      showToast('⚡ Notificación de Creatina enviada a tu pantalla.');
    } else {
      showToast('⚠️ No se pudo enviar. Verifica los permisos de notificaciones del celular.');
    }
  };

  const loadProfileData = (profileKey) => {
    try {
      const prof = familyProfiles[profileKey] || FAMILY_PROFILES[profileKey];
      if (!prof) return;

      // 1. Check profile-specific storage key
      let savedFoods = [];
      const rawProfileFoods = localStorage.getItem(`aurafit_foods_${profileKey}`);
      if (rawProfileFoods) {
        try {
          const parsed = JSON.parse(rawProfileFoods);
          if (Array.isArray(parsed)) {
            // Strictly filter out any items belonging to other profiles
            savedFoods = parsed.filter((item) => {
              if (item.profileId) return item.profileId === profileKey;
              // Legacy untagged items only belong to 'andres'
              return profileKey === 'andres';
            });
          }
        } catch (e) {}
      }

      // 2. Legacy fallback ONLY for 'andres' (NEVER copy andres' foods to pareja or hermana!)
      if (profileKey === 'andres' && savedFoods.length === 0) {
        const legacyRaw = localStorage.getItem('aurafit_logged_foods') || localStorage.getItem('aurafit_backup_last_logged');
        if (legacyRaw) {
          try {
            const legacyParsed = JSON.parse(legacyRaw);
            if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
              savedFoods = legacyParsed.map((item) => ({ ...item, profileId: 'andres' }));
              localStorage.setItem(`aurafit_foods_andres`, JSON.stringify(savedFoods));
            }
          } catch (e) {}
        }
      }

      // 3. Clean up contaminated profile storage in localStorage & cloud if foreign items were purged
      if (rawProfileFoods) {
        try {
          const parsed = JSON.parse(rawProfileFoods);
          if (Array.isArray(parsed) && parsed.length !== savedFoods.length) {
            localStorage.setItem(`aurafit_foods_${profileKey}`, JSON.stringify(savedFoods));
            queueCloudSync(`aurafit_foods_${profileKey}`, savedFoods, profileKey);
          }
        } catch (e) {}
      }

      // 4. Set logged foods - strictly to this profile's foods (empty array if no foods logged yet)
      setLoggedFoods(savedFoods);

      const todayKey = getLocalDateKey();

      // 4. Habits daily reset check (Preserve custom habits, reset daily completion checks!)
      const savedHabits = localStorage.getItem(`aurafit_habits_${profileKey}`);
      const savedHabitsDate = localStorage.getItem(`aurafit_habits_date_${profileKey}`);
      if (savedHabits) {
        try {
          const parsed = JSON.parse(savedHabits);
          if (savedHabitsDate === todayKey) {
            setHabits(parsed);
          } else {
            // New calendar day! Reset completion checkboxes to false, preserve all habit definitions!
            const freshHabits = parsed.map((h) => ({ ...h, completed: false, time: null }));
            setHabits(freshHabits);
            localStorage.setItem(`aurafit_habits_${profileKey}`, JSON.stringify(freshHabits));
            localStorage.setItem(`aurafit_habits_date_${profileKey}`, todayKey);
          }
        } catch (e) {
          setHabits(prof.habits || []);
        }
      } else {
        setHabits(prof.habits || []);
      }

      // 5. Water by date tracker: Starts at 0 on a brand new day, but strictly preserves any recorded water
      const savedWaterByDate = localStorage.getItem(`aurafit_water_by_date_${profileKey}`);
      let parsedWaterByDate = {};
      if (savedWaterByDate) {
        try { parsedWaterByDate = JSON.parse(savedWaterByDate); } catch (e) {}
      }
      setWaterByDate(parsedWaterByDate);

      const savedWaterDaily = localStorage.getItem(`aurafit_water_daily_${profileKey}`);
      let dailyWater = 0;
      if (savedWaterDaily) {
        try {
          const parsed = JSON.parse(savedWaterDaily);
          if (parsed.date === todayKey && (typeof parsed.ml === 'number' || typeof parsed.amount === 'number')) {
            dailyWater = parsed.ml ?? parsed.amount ?? 0;
          }
        } catch (e) {}
      }
      const finalTodayWater = Math.max(dailyWater, parsedWaterByDate[todayKey] || 0);
      setWaterMl(finalTodayWater);

      // 6. Sleep & Recovery State for current profile (checked by date)
      const savedSleep = localStorage.getItem(`aurafit_sleep_${profileKey}`);
      if (savedSleep) {
        try {
          const parsed = JSON.parse(savedSleep);
          if (parsed.date === todayKey) {
            if (parsed.hours) setSleepHours(parsed.hours);
            if (parsed.quality) setSleepQuality(parsed.quality);
          } else {
            setSleepHours(7.5);
            setSleepQuality('deep');
          }
        } catch (e) {
          setSleepHours(7.5);
          setSleepQuality('deep');
        }
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

      // Weekly Workout Logs & Split for current profile
      const savedWeek = localStorage.getItem(`aurafit_workout_week_${profileKey}`);
      if (savedWeek) {
        try {
          setWeeklyWorkoutLogs(JSON.parse(savedWeek));
        } catch (e) {
          setWeeklyWorkoutLogs({});
        }
      } else {
        setWeeklyWorkoutLogs({});
      }

      const savedSplit = localStorage.getItem(`aurafit_selected_split_${profileKey}`);
      setSelectedSplit(savedSplit || null);

      const savedMissed = localStorage.getItem(`aurafit_missed_day_${profileKey}`);
      setIsMissedDay(savedMissed === todayKey);

      // Dynamic Streak from activity history
      const savedActivity = localStorage.getItem(`aurafit_activity_days_${profileKey}`);
      if (savedActivity) {
        try {
          const days = JSON.parse(savedActivity);
          let streak = 0;
          let checkDate = new Date();
          while (true) {
            const k = getLocalDateKey(checkDate);
            if (days.includes(k)) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
          setStreakDays(Math.max(1, streak));
        } catch (e) {
          setStreakDays(1);
        }
      } else {
        const savedStreak = localStorage.getItem(`aurafit_streak_${profileKey}`);
        setStreakDays(savedStreak ? parseInt(savedStreak, 10) || 1 : 1);
      }

      const savedWeights = localStorage.getItem(`aurafit_weights_${profileKey}`);
      if (savedWeights) {
        setWeightLogs(JSON.parse(savedWeights));
      } else {
        const now = new Date();
        const makeDate = (offsetDays) => {
          const d = new Date(now);
          d.setDate(now.getDate() - offsetDays);
          return `${d.getDate()} ${d.toLocaleString('es-PE', { month: 'short' })}`;
        };
        setWeightLogs([
          { log_date: makeDate(6), weight_kg: Math.round((prof.weightKg + 0.6) * 10) / 10 },
          { log_date: makeDate(4), weight_kg: Math.round((prof.weightKg + 0.3) * 10) / 10 },
          { log_date: makeDate(2), weight_kg: Math.round((prof.weightKg + 0.1) * 10) / 10 },
          { log_date: makeDate(0), weight_kg: Math.round((prof.weightKg) * 10) / 10 }
        ]);
      }
    } catch (e) {
      console.warn('Error loading profile data:', e);
    }
  };

  const executeProfileSwitch = (newId) => {
    if (!familyProfiles[newId]) return;
    // CRITICAL: Persist current profile's logged foods and water before switching!
    try {
      localStorage.setItem(`aurafit_foods_${activeProfileId}`, JSON.stringify(loggedFoods || []));
      const todayKey = getLocalDateKey();
      if (waterMl > 0) {
        localStorage.setItem(`aurafit_water_daily_${activeProfileId}`, JSON.stringify({ date: todayKey, ml: waterMl }));
        localStorage.setItem(`aurafit_water_${activeProfileId}`, waterMl.toString());
        const mergedWater = { ...waterByDate, [todayKey]: waterMl };
        localStorage.setItem(`aurafit_water_by_date_${activeProfileId}`, JSON.stringify(mergedWater));
        queueCloudSync(`aurafit_water_by_date_${activeProfileId}`, mergedWater, activeProfileId);
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
        queueCloudSync('aurafit_family_profiles', next, 'andres');
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
        queueCloudSync('aurafit_family_profiles', next, activeProfileId);
      } catch (e) {}
      return next;
    });
    // CRITICAL: Ensure current foods remain safely saved and NOT replaced
    try {
      localStorage.setItem(`aurafit_foods_${activeProfileId}`, JSON.stringify(loggedFoods));
      if (activeProfileId === 'andres') {
        localStorage.setItem('aurafit_logged_foods', JSON.stringify(loggedFoods));
      }
      queueCloudSync(`aurafit_foods_${activeProfileId}`, loggedFoods, activeProfileId);
    } catch (e) {}
    setShowProfileModal(false);
    showToast(`✅ Perfil de ${updatedProfile.name} actualizado y sincronizado en la nube.`);
  };

  const handleAddFamilyMember = (e) => {
    if (e) e.preventDefault();
    if (!newMemberForm.name.trim()) {
      showToast('⚠️ Ingresa un nombre para el nuevo miembro.');
      return;
    }
    const cleanName = newMemberForm.name.trim();
    const isPartner = Boolean(newMemberForm.isPartnerOfAndres);
    const memberId = isPartner ? 'pareja' : 'member_' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);

    const newProfile = {
      id: memberId,
      name: cleanName,
      role: newMemberForm.role || (isPartner ? 'Hipertrofia Limpia & Protección Lumbar' : 'Bienestar & Nutrición'),
      avatar: newMemberForm.avatar || (isPartner ? '🌸' : '👤'),
      pin: (newMemberForm.pin || '1234').replace(/\D/g, '').slice(0, 4) || '1234',
      gender: 'female',
      age: 24,
      heightCm: 160,
      weightKg: Number(newMemberForm.weightKg) || 60,
      targetWeightKg: Number(newMemberForm.weightKg) || 60,
      goal: newMemberForm.goal || 'recomposition',
      activityLevel: 'moderate',
      targetCalories: 1900,
      macros: { proteinGrams: 125, fatGrams: 55, carbsGrams: 215 },
      waterDailyMl: 2500,
      badgeText: isPartner ? `🌸 ${cleanName} (Pareja) · Modo 1 Sartén Enlazado` : `🌸 ${cleanName} · Bienestar & Nutrición`,
      habits: [
        { id: 'water', name: 'Hidratación Diaria', target: '2,500 ml', completed: false, icon: '💧', category: 'biohacking' },
        { id: 'sleep', name: 'Descanso Reparador', target: '7-8h', completed: false, icon: '🌙', category: 'recuperacion' }
      ]
    };

    setFamilyProfiles((prev) => {
      const next = { ...prev, [memberId]: newProfile };
      try {
        localStorage.setItem('aurafit_family_profiles', JSON.stringify(next));
        queueCloudSync('aurafit_family_profiles', next, activeProfileId);
      } catch (err) {}
      return next;
    });

    setAdminPins((prev) => ({ ...prev, [memberId]: newProfile.pin }));
    setShowAddMemberModal(false);
    setNewMemberForm({
      name: '',
      role: 'Bienestar & Nutrición',
      avatar: '🌸',
      pin: '1234',
      weightKg: 60,
      goal: 'recomposition',
      isPartnerOfAndres: false
    });
    showToast(`✨ ¡${cleanName} agregado con éxito a la familia!`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  const persistLoggedFoods = (updater, targetProfileId = null) => {
    const profileKey = targetProfileId || activeProfileId;
    setLoggedFoods((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const cleanList = Array.isArray(next)
        ? next.map((item) => ({
            ...item,
            profileId: item.profileId || profileKey
          }))
        : [];

      try {
        localStorage.setItem(`aurafit_foods_${profileKey}`, JSON.stringify(cleanList));
        if (profileKey === 'andres') {
          localStorage.setItem('aurafit_foods_andres', JSON.stringify(cleanList));
          localStorage.setItem('aurafit_logged_foods', JSON.stringify(cleanList));
        }
        queueCloudSync(`aurafit_foods_${profileKey}`, cleanList, profileKey);
      } catch (e) {
        console.warn('Storage save err:', e);
      }
      return cleanList;
    });
  };

  // Mathematical Totals & Rebalance Engine (100% Dynamic for active day)
  const consumedTotals = useMemo(() => {
    return activeDayFoods.reduce(
      (acc, item) => ({
        calories: acc.calories + (Number(item.calories) || 0),
        protein: acc.protein + (Number(item.protein) || 0),
        carbs: acc.carbs + (Number(item.carbs) || 0),
        fat: acc.fat + (Number(item.fat) || 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [activeDayFoods]);

  const compensator = useMemo(() => {
    return calculateCompensatoryRebalance({ loggedFoods: activeDayFoods, targets });
  }, [activeDayFoods, targets]);

  const detectedInText = useMemo(() => {
    return parseNaturalLanguageFood(quickTextEntry);
  }, [quickTextEntry]);

  // Macro Gap for didactic food recommendation
  const macroGap = useMemo(() => {
    const targetP = targets.macros?.proteinGrams || targets.protein || currentProfile.macros?.proteinGrams || 150;
    const targetC = targets.targetCalories || targets.calories || currentProfile.targetCalories || 2000;
    const pDiff = Math.max(0, targetP - (consumedTotals.protein || 0));
    const calDiff = Math.max(0, targetC - (consumedTotals.calories || 0));
    return {
      protein: Math.round(pDiff),
      calories: Math.round(calDiff),
      isMet: pDiff <= 5 && calDiff <= 100
    };
  }, [targets, consumedTotals, currentProfile]);

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
    const targetDate = selectedDateKey || getLocalDateKey();
    const newEntry = {
      id: `food-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      profileId: activeProfileId,
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
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: targetDate
    };

    persistLoggedFoods((prev) => [newEntry, ...prev]);
    recordActivityToday();
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
    const targetDate = selectedDateKey || getLocalDateKey();

    if (parsedList && parsedList.length > 0) {
      const newEntries = parsedList.map((first, idx) => ({
        id: `custom-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        profileId: activeProfileId,
        name: first.name,
        brand: first.brand || 'Compendio Nutricional Fitia',
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
        breakdown: first.breakdown,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: targetDate
      }));
      persistLoggedFoods((prev) => [...newEntries, ...prev]);
      recordActivityToday();
    } else {
      const isSnackLike = /dulce|postre|snack|chocolate|torta|fritura|galleta|queque|keke|chifle|chifles/i.test(nameClean);
      const estCals = isSnackLike ? 280 : 210;
      const estP = isSnackLike ? 3.5 : 15.0;
      const estC = isSnackLike ? 36.0 : 22.0;
      const estF = isSnackLike ? 12.0 : 6.0;

      const newEntry = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        profileId: activeProfileId,
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
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: targetDate
      };
      persistLoggedFoods((prev) => [newEntry, ...prev]);
      recordActivityToday();
    }

    setShowFoodSearchModal(false);
    setFoodSearchQuery('');
    showToast(`✨ ¡"${nameClean}" registrado en ${slot.toUpperCase()}!`);
  };

  const handleQuickLogPeruvianMenu = (menuItem, slot = 'comida') => {
    if (!menuItem) return;
    const targetDate = selectedDateKey || getLocalDateKey();
    const newEntry = {
      id: `menu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      profileId: activeProfileId,
      name: menuItem.name,
      brand: menuItem.brand || 'Menú del Día Peruano',
      mealSlot: slot,
      servingDesc: menuItem.servingDesc || `${menuItem.grams}g`,
      grams: menuItem.grams || 450,
      calories: menuItem.calories,
      protein: menuItem.protein,
      carbs: menuItem.carbs,
      fat: menuItem.fat,
      fiber: menuItem.fiber || 5,
      icon: menuItem.icon || '🍲',
      isSnack: false,
      isUltraProcessed: false,
      breakdown: menuItem.breakdown,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: targetDate
    };
    persistLoggedFoods((prev) => [newEntry, ...prev]);
    recordActivityToday();
    setShowPeruvianMenuModal(false);
    showToast(`🇵🇪 ¡${menuItem.shortName || menuItem.name} registrado en ${slot.toUpperCase()}! 🔥 ${menuItem.calories} kcal · ${menuItem.protein}g P`);
  };

  const handleConfirmCustomMenuBuild = (slot = 'comida') => {
    const customMenu = calculatePeruvianCustomMenu({
      entradaId: builderEntradaId,
      segundoId: builderSegundoId,
      carboIds: builderCarboIds
    });
    handleQuickLogPeruvianMenu(customMenu, slot);
  };

  const handleConfirmTextLog = (detectedList, slot = 'snack') => {
    const targetDate = selectedDateKey || getLocalDateKey();
    if (!detectedList || detectedList.length === 0) {
      // Create fallback item from raw text
      const rawEntry = {
        id: `raw-${Date.now()}`,
        profileId: activeProfileId,
        name: quickTextEntry.slice(0, 40) || 'Registro Manual',
        brand: 'Registro Manual',
        mealSlot: slot,
        servingDesc: 'Porción estimada',
        grams: 100,
        calories: 380,
        protein: 15,
        carbs: 45,
        fat: 12,
        icon: '✍️',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: targetDate
      };
      persistLoggedFoods((prev) => [rawEntry, ...prev]);
      recordActivityToday();
      setShowTextLogModal(false);
      showToast('¡Alimentos registrados con éxito!');
      return;
    }

    const newEntries = detectedList.map((item) => ({
      id: `text-${Date.now()}-${item.id}`,
      profileId: activeProfileId,
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
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: targetDate
    }));

    persistLoggedFoods((prev) => [...newEntries, ...prev]);
    recordActivityToday();
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
    const targetDate = selectedDateKey || getLocalDateKey();
    const newItems = option.foodItemsToAdd.map((food, idx) => ({
      id: `comp-${Date.now()}-${idx}`,
      profileId: activeProfileId,
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
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: targetDate
    }));

    persistLoggedFoods((prev) => [...newItems, ...prev]);
    recordActivityToday();
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
    const targetDate = selectedDateKey || getLocalDateKey();

    const newEntry = {
      id: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      profileId: activeProfileId,
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
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: targetDate
    };

    persistLoggedFoods((prev) => [newEntry, ...prev]);
    recordActivityToday();
    setSelectedRecipeDetail(null);
    showToast(`🍲 ¡${newEntry.name} agregado a ${targetSlot.toUpperCase()}! 🔥 +${scaledCal} kcal (+${scaledP}g Proteína)`);
  };

  // Safe Multi-User Couple Serving Handler (1 Sartén, 2 Porciones Independientes)
  const handleServeCouplePortion = (targetProfileKey, portionData) => {
    const targetDate = selectedDateKey || getLocalDateKey();
    const newEntry = {
      id: `couple-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      profileId: targetProfileKey,
      name: portionData.name,
      brand: 'Cocina en Pareja AuraFit (1 Sartén)',
      mealSlot: portionData.mealSlot || 'comida',
      servingDesc: portionData.servingDesc || 'Porción 1 Sartén',
      grams: portionData.grams || 250,
      calories: Math.round(Number(portionData.calories) || 0),
      protein: parseFloat((Number(portionData.protein) || 0).toFixed(1)),
      carbs: parseFloat((Number(portionData.carbs) || 0).toFixed(1)),
      fat: parseFloat((Number(portionData.fat) || 0).toFixed(1)),
      icon: portionData.icon || '🍲',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: targetDate
    };

    if (targetProfileKey === activeProfileId) {
      persistLoggedFoods((prev) => [newEntry, ...prev]);
      recordActivityToday();
      showToast(`🍽️ ¡Porción servida a tu diario (${familyProfiles[targetProfileKey]?.name || targetProfileKey})!`);
    } else {
      try {
        const raw = localStorage.getItem(`aurafit_foods_${targetProfileKey}`);
        let targetFoods = [];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              targetFoods = parsed.filter(item => !item.profileId || item.profileId === targetProfileKey);
            }
          } catch (e) {}
        }
        const updatedTargetFoods = [newEntry, ...targetFoods];
        localStorage.setItem(`aurafit_foods_${targetProfileKey}`, JSON.stringify(updatedTargetFoods));
        if (targetProfileKey === 'andres') {
          localStorage.setItem('aurafit_logged_foods', JSON.stringify(updatedTargetFoods));
        }
        queueCloudSync(`aurafit_foods_${targetProfileKey}`, updatedTargetFoods, targetProfileKey);
      } catch (e) {
        console.warn('Error serving to another profile:', e);
      }
      showToast(`🍽️ ¡Porción servida con éxito al diario de ${familyProfiles[targetProfileKey]?.name || targetProfileKey}!`);
    }
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
        const todayKey = getLocalDateKey();
        localStorage.setItem(`aurafit_habits_${activeProfileId}`, JSON.stringify(next));
        localStorage.setItem(`aurafit_habits_date_${activeProfileId}`, todayKey);
        localStorage.setItem('aurafit_habits', JSON.stringify(next));
        queueCloudSync(`aurafit_habits_${activeProfileId}`, next, activeProfileId);
      } catch (e) {}
      recordActivityToday();
      return next;
    });
  };

  const handleAddCustomHabit = (form) => {
    if (!form.name || !form.name.trim()) return;
    const habitToAdd = {
      id: `custom_${Date.now()}`,
      name: form.name.trim(),
      target: form.target.trim() || '1 vez al día',
      completed: false,
      icon: form.icon.trim() || '⭐',
      category: form.category || 'personal',
      note: form.note ? form.note.trim() : 'Hábito personalizado diario',
      isCustom: true
    };

    setHabits((prev) => {
      const next = [...prev, habitToAdd];
      try {
        const todayKey = getLocalDateKey();
        localStorage.setItem(`aurafit_habits_${activeProfileId}`, JSON.stringify(next));
        localStorage.setItem(`aurafit_habits_date_${activeProfileId}`, todayKey);
        localStorage.setItem('aurafit_habits', JSON.stringify(next));
        queueCloudSync(`aurafit_habits_${activeProfileId}`, next, activeProfileId);
      } catch (e) {}
      return next;
    });
    showToast(`✨ Hábito "${habitToAdd.name}" agregado con éxito.`);
    setShowAddHabitModal(false);
    setNewHabitForm({ name: '', target: '', icon: '🧘', category: 'bienestar', note: '' });
  };

  const handleUpdateHabit = (form) => {
    if (!form || !form.name || !form.name.trim()) return;
    setHabits((prev) => {
      const next = prev.map((h) => {
        if (h.id === form.id) {
          return {
            ...h,
            name: form.name.trim(),
            target: form.target ? form.target.trim() : (h.target || '1 vez al día'),
            icon: form.icon ? form.icon.trim() : (h.icon || '⭐'),
            category: form.category || h.category || 'bienestar',
            note: form.note !== undefined ? form.note.trim() : (h.note || '')
          };
        }
        return h;
      });
      try {
        const todayKey = getLocalDateKey();
        localStorage.setItem(`aurafit_habits_${activeProfileId}`, JSON.stringify(next));
        localStorage.setItem(`aurafit_habits_date_${activeProfileId}`, todayKey);
        localStorage.setItem('aurafit_habits', JSON.stringify(next));
        queueCloudSync(`aurafit_habits_${activeProfileId}`, next, activeProfileId);
      } catch (e) {}
      return next;
    });
    showToast(`✏️ Hábito "${form.name.trim()}" actualizado.`);
    setEditingHabit(null);
  };

  const handleResetDefaultHabits = () => {
    if (!confirm(`¿Restaurar los hábitos predeterminados de ${currentProfile.name}? Se restablecerán a la rutina original recomendada.`)) return;
    const defaultHabits = (currentProfile.habits || []).map((h) => ({ ...h, completed: false, time: null }));
    setHabits(defaultHabits);
    try {
      const todayKey = getLocalDateKey();
      localStorage.setItem(`aurafit_habits_${activeProfileId}`, JSON.stringify(defaultHabits));
      localStorage.setItem(`aurafit_habits_date_${activeProfileId}`, todayKey);
      localStorage.setItem('aurafit_habits', JSON.stringify(defaultHabits));
      queueCloudSync(`aurafit_habits_${activeProfileId}`, defaultHabits, activeProfileId);
    } catch (e) {}
    showToast(`🔄 Hábitos de ${currentProfile.name} restaurados por defecto.`);
  };

  const handleDeleteHabit = (habitId) => {
    setHabits((prev) => {
      const next = prev.filter((h) => h.id !== habitId);
      try {
        const todayKey = getLocalDateKey();
        localStorage.setItem(`aurafit_habits_${activeProfileId}`, JSON.stringify(next));
        localStorage.setItem(`aurafit_habits_date_${activeProfileId}`, todayKey);
        localStorage.setItem('aurafit_habits', JSON.stringify(next));
        queueCloudSync(`aurafit_habits_${activeProfileId}`, next, activeProfileId);
      } catch (e) {}
      return next;
    });
    showToast('🗑️ Hábito eliminado de tu rutina.');
  };

  const recordActivityToday = () => {
    try {
      const todayKey = getLocalDateKey();
      const savedRaw = localStorage.getItem(`aurafit_activity_days_${activeProfileId}`);
      let days = [];
      if (savedRaw) {
        try { days = JSON.parse(savedRaw); } catch (e) {}
      }
      if (!days.includes(todayKey)) {
        days.push(todayKey);
        if (days.length > 60) days = days.slice(-60);
        localStorage.setItem(`aurafit_activity_days_${activeProfileId}`, JSON.stringify(days));
        
        let streak = 0;
        let checkDate = new Date();
        while (true) {
          const k = getLocalDateKey(checkDate);
          if (days.includes(k)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        const finalStreak = Math.max(1, streak);
        setStreakDays(finalStreak);
        localStorage.setItem(`aurafit_streak_${activeProfileId}`, finalStreak.toString());
      }
    } catch (e) {}
  };

  const addWater = (ml) => {
    const todayKey = getLocalDateKey();
    const targetKey = selectedDateKey || todayKey;

    // Retrieve fresh water records from state or localStorage
    let currentByDate = { ...waterByDate };
    if (Object.keys(currentByDate).length === 0 && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`aurafit_water_by_date_${activeProfileId}`);
        if (raw) currentByDate = JSON.parse(raw);
      } catch (e) {}
    }

    const currentAmount = targetKey === todayKey
      ? Math.max(waterMl, currentByDate[todayKey] || 0)
      : (currentByDate[targetKey] || 0);

    const maxWater = (currentProfile.waterDailyMl || 3000) + 1500;
    const updated = Math.min(currentAmount + ml, maxWater);
    const updatedByDate = { ...currentByDate, [targetKey]: updated };

    // Update React states cleanly outside setter reducers
    if (targetKey === todayKey) {
      setWaterMl(updated);
    }
    setWaterByDate(updatedByDate);

    // Atomically persist to localStorage & cloud
    try {
      if (typeof window !== 'undefined') {
        if (targetKey === todayKey) {
          localStorage.setItem(`aurafit_water_daily_${activeProfileId}`, JSON.stringify({ date: todayKey, ml: updated }));
          localStorage.setItem(`aurafit_water_${activeProfileId}`, updated.toString());
        }
        localStorage.setItem(`aurafit_water_by_date_${activeProfileId}`, JSON.stringify(updatedByDate));
        queueCloudSync(`aurafit_water_by_date_${activeProfileId}`, updatedByDate, activeProfileId);
      }
    } catch (e) {
      console.warn('Error saving water:', e);
    }

    recordActivityToday();
    showToast(`💧 +${ml} ml de agua registrados.`);
  };

  const handleResetWater = () => {
    const todayKey = getLocalDateKey();
    const targetKey = selectedDateKey || todayKey;

    let currentByDate = { ...waterByDate };
    if (Object.keys(currentByDate).length === 0 && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`aurafit_water_by_date_${activeProfileId}`);
        if (raw) currentByDate = JSON.parse(raw);
      } catch (e) {}
    }

    const updatedByDate = { ...currentByDate, [targetKey]: 0 };
    if (targetKey === todayKey) {
      setWaterMl(0);
    }
    setWaterByDate(updatedByDate);

    try {
      if (typeof window !== 'undefined') {
        if (targetKey === todayKey) {
          localStorage.setItem(`aurafit_water_daily_${activeProfileId}`, JSON.stringify({ date: todayKey, ml: 0 }));
          localStorage.setItem(`aurafit_water_${activeProfileId}`, '0');
        }
        localStorage.setItem(`aurafit_water_by_date_${activeProfileId}`, JSON.stringify(updatedByDate));
        queueCloudSync(`aurafit_water_by_date_${activeProfileId}`, updatedByDate, activeProfileId);
      }
    } catch (e) {}
    showToast('💧 Contador de agua reiniciado a 0 ml.');
  };

  const handleUpdateSleepHours = (delta) => {
    setSleepHours((prev) => {
      const next = Math.min(12, Math.max(4, Math.round((prev + delta) * 10) / 10));
      try {
        const todayKey = getLocalDateKey();
        localStorage.setItem(`aurafit_sleep_${activeProfileId}`, JSON.stringify({ date: todayKey, hours: next, quality: sleepQuality }));
        queueCloudSync(`aurafit_sleep_${activeProfileId}`, { date: todayKey, hours: next, quality: sleepQuality }, activeProfileId);
      } catch (e) {}
      return next;
    });
  };

  const handleSetSleepQuality = (qual) => {
    setSleepQuality(qual);
    try {
      const todayKey = getLocalDateKey();
      localStorage.setItem(`aurafit_sleep_${activeProfileId}`, JSON.stringify({ date: todayKey, hours: sleepHours, quality: qual }));
      queueCloudSync(`aurafit_sleep_${activeProfileId}`, { date: todayKey, hours: sleepHours, quality: qual }, activeProfileId);
    } catch (e) {}
    showToast(`💤 Calidad de descanso registrada como ${qual === 'deep' ? 'Profunda & Reparadora' : qual === 'normal' ? 'Normal' : 'Ligera'}.`);
  };

  const handleToggleTodayWorkout = () => {
    setTodayWorkoutDone((prev) => {
      const next = !prev;
      const todayKey = getLocalDateKey();
      try {
        localStorage.setItem(`aurafit_workout_${activeProfileId}`, JSON.stringify({ date: todayKey, done: next, minutes: workoutDurationMins }));
        queueCloudSync(`aurafit_workout_${activeProfileId}`, { date: todayKey, done: next, minutes: workoutDurationMins }, activeProfileId);
      } catch (e) {}

      // Dynamically record in weekly workout logs for balance analytics and week strip dots!
      const currentSplitId = selectedSplit || (activeProfileId === 'andres' ? 'legs' : activeProfileId === 'pareja' ? 'glutes_legs' : 'mobility_gentle');
      const updatedWeek = {
        ...weeklyWorkoutLogs,
        [todayKey]: {
          split: currentSplitId,
          title: hybridPrescription.routineTitle,
          done: next,
          isMissedDay: isMissedDay,
          minutes: workoutDurationMins
        }
      };
      setWeeklyWorkoutLogs(updatedWeek);
      try {
        localStorage.setItem(`aurafit_workout_week_${activeProfileId}`, JSON.stringify(updatedWeek));
        queueCloudSync(`aurafit_workout_week_${activeProfileId}`, updatedWeek, activeProfileId);
      } catch (e) {}

      if (next) recordActivityToday();
      showToast(next ? '🏋️‍♂️ ¡Entrenamiento del día registrado y contabilizado en la semana!' : '🏋️‍♂️ Registro de entrenamiento actualizado.');
      return next;
    });
  };

  const handleSelectSplit = (splitId) => {
    setSelectedSplit(splitId);
    setIsMissedDay(false);
    try {
      localStorage.setItem(`aurafit_selected_split_${activeProfileId}`, splitId);
      localStorage.removeItem(`aurafit_missed_day_${activeProfileId}`);
      queueCloudSync(`aurafit_selected_split_${activeProfileId}`, splitId, activeProfileId);
    } catch (e) {}
    const splitObj = HYBRID_ATHLETE_SYSTEM.splits[activeProfileId]?.[splitId];
    const splitTitle = splitObj?.shortName || splitObj?.name || splitId;
    showToast(`🎯 Split de entrenamiento activo: ${splitTitle}`);
  };

  const handleToggleMissedDay = () => {
    const nextMissed = !isMissedDay;
    setIsMissedDay(nextMissed);
    const todayKey = getLocalDateKey();

    if (nextMissed) {
      setSelectedSplit('home_core');
      try {
        localStorage.setItem(`aurafit_missed_day_${activeProfileId}`, todayKey);
        localStorage.setItem(`aurafit_selected_split_${activeProfileId}`, 'home_core');
      } catch (e) {}

      const updatedWeek = {
        ...weeklyWorkoutLogs,
        [todayKey]: {
          split: 'home_core',
          title: 'Core & Planchas Express en Casa (Día Ocupado)',
          done: false,
          isMissedDay: true,
          minutes: 12
        }
      };
      setWeeklyWorkoutLogs(updatedWeek);
      try {
        localStorage.setItem(`aurafit_workout_week_${activeProfileId}`, JSON.stringify(updatedWeek));
      } catch (e) {}
      showToast('⚡ Día Ocupado registrado: Se prescribió rutina de 12 min de planchas en casa.');
    } else {
      try {
        localStorage.removeItem(`aurafit_missed_day_${activeProfileId}`);
      } catch (e) {}
      showToast('🔄 Modo Día Ocupado desactivado. Retomando entrenamiento habitual.');
    }
  };

  const handleAdjustWorkoutDuration = (delta) => {
    setWorkoutDurationMins((prev) => {
      const next = Math.min(120, Math.max(15, prev + delta));
      try {
        const todayKey = getLocalDateKey();
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
        queueCloudSync('aurafit_ingredients', updated, activeProfileId);
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
      localStorage.setItem(`aurafit_weights_${activeProfileId}`, JSON.stringify(updated));
      queueCloudSync(`aurafit_weights_${activeProfileId}`, updated, activeProfileId);
    } catch (e) {}
    setNewWeightInput('');
    setShowWeightModal(false);
    recordActivityToday();
  };

  // 100% Dynamic Week Days: computes actual dates for Monday through Sunday of current week
  const weekDays = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = (dayOfWeek + 6) % 7; // Monday = 0, Tuesday = 1, ..., Sunday = 6
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);

    const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const days = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateKey = getLocalDateKey(d);
      const isToday = dateKey === getLocalDateKey(now);
      const num = d.getDate();

      const weekLog = weeklyWorkoutLogs[dateKey];
      const hasFood = loggedFoods.some((f) => f.date === dateKey);
      const done = (weekLog && (weekLog.done || weekLog.isMissedDay)) || hasFood || (isToday && (todayWorkoutDone || waterMl > 0 || habits.some((h) => h.completed)));

      days.push({
        day: dayLabels[i],
        num,
        dateKey,
        isToday,
        done
      });
    }
    return days;
  }, [weeklyWorkoutLogs, todayWorkoutDone, loggedFoods, waterMl, habits]);

  const completedHabitsCount = habits.filter((h) => h.completed).length;

  // 100% Dynamic Menstrual Cycle Calculation for Active Profile
  const activeCycleConfig = useMemo(() => {
    return cycleConfigs[activeProfileId] || DEFAULT_CYCLE_CONFIGS[activeProfileId] || {
      enabled: currentProfile.gender === 'female',
      lastPeriodStartDate: '2026-10-06',
      cycleLengthDays: 28,
      periodDurationDays: 5
    };
  }, [cycleConfigs, activeProfileId, currentProfile.gender]);

  const activeCycleInfo = useMemo(() => {
    if (!activeCycleConfig?.enabled && currentProfile.gender !== 'female') {
      return null;
    }
    return calculateMenstrualCyclePhase({
      targetDate: activeDateKey,
      lastPeriodStartDate: activeCycleConfig?.lastPeriodStartDate || '2026-10-06',
      cycleLengthDays: activeCycleConfig?.cycleLengthDays || 28,
      periodDurationDays: activeCycleConfig?.periodDurationDays || 5,
      profileId: activeProfileId
    });
  }, [activeCycleConfig, activeDateKey, currentProfile.gender, activeProfileId]);

  const weekCycleMap = useMemo(() => {
    if (!activeCycleConfig?.enabled && currentProfile.gender !== 'female') {
      return {};
    }
    const map = {};
    weekDays.forEach((item) => {
      map[item.dateKey] = calculateMenstrualCyclePhase({
        targetDate: item.dateKey,
        lastPeriodStartDate: activeCycleConfig?.lastPeriodStartDate || '2026-10-06',
        cycleLengthDays: activeCycleConfig?.cycleLengthDays || 28,
        periodDurationDays: activeCycleConfig?.periodDurationDays || 5,
        profileId: activeProfileId
      });
    });
    return map;
  }, [activeCycleConfig, currentProfile.gender, weekDays, activeProfileId]);

  const handleMarkPeriodStartedToday = () => {
    const todayStr = getLocalDateKey();
    const updated = {
      ...activeCycleConfig,
      enabled: true,
      lastPeriodStartDate: todayStr
    };
    const nextConfigs = { ...cycleConfigs, [activeProfileId]: updated };
    setCycleConfigs(nextConfigs);
    try {
      localStorage.setItem(`aurafit_cycle_${activeProfileId}`, JSON.stringify(updated));
    } catch (e) {}
    showToast(`🩸 Periodo registrado: Día 1 iniciado hoy (${todayStr})`);
  };

  const handleOpenCycleModal = () => {
    setCycleForm({
      enabled: activeCycleConfig.enabled !== false,
      lastPeriodStartDate: activeCycleConfig.lastPeriodStartDate || getLocalDateKey(),
      cycleLengthDays: activeCycleConfig.cycleLengthDays || 28,
      periodDurationDays: activeCycleConfig.periodDurationDays || 5
    });
    setShowCycleConfigModal(true);
  };

  const handleSaveCycleConfig = () => {
    const updated = {
      enabled: Boolean(cycleForm.enabled),
      lastPeriodStartDate: cycleForm.lastPeriodStartDate || getLocalDateKey(),
      cycleLengthDays: Math.max(20, Math.min(45, Number(cycleForm.cycleLengthDays) || 28)),
      periodDurationDays: Math.max(2, Math.min(10, Number(cycleForm.periodDurationDays) || 5))
    };
    const nextConfigs = { ...cycleConfigs, [activeProfileId]: updated };
    setCycleConfigs(nextConfigs);
    try {
      localStorage.setItem(`aurafit_cycle_${activeProfileId}`, JSON.stringify(updated));
    } catch (e) {}
    setShowCycleConfigModal(false);
    showToast('🌸 Configuración de ciclo actualizada exitosamente');
  };

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
            className={`header-sync-btn ${isSyncing ? 'syncing' : ''}`}
            onClick={handleManualSync}
            title={
              cloudStatus === 'synced'
                ? `☁️ Sincronizado en la Nube (${lastSyncTime ? lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Neon'}). Toca para sincronizar.`
                : isSyncing
                ? '🔄 Sincronizando datos con la nube...'
                : '📱 Modo Local. Toca para sincronizar con la nube.'
            }
          >
            {isSyncing ? '🔄' : cloudStatus === 'synced' ? '☁️' : '📱'}
          </button>
          <button
            type="button"
            className="header-notif-btn"
            onClick={() => setShowNotificationModal(true)}
            title="Recordatorios de Creatina y Agua"
          >
            🔔
            {notificationConfig?.enabled && (
              <span className="notif-badge-dot" />
            )}
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

      {/* Update Available Banner for installed PWAs and mobile browsers */}
      {updateAvailable && (
        <div className="update-available-banner" onClick={handleForceUpdateApp}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🚀</span>
            <div style={{ fontSize: '12px', fontWeight: 800 }}>
              ¡Nueva versión disponible con sincronización y mejoras!
            </div>
          </div>
          <button type="button" className="update-btn-pill">
            Actualizar
          </button>
        </div>
      )}

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
          onClick={() => setShowAddMemberModal(true)}
          title="Agregar nuevo familiar o vincular persona"
          style={{ background: 'rgba(59, 130, 246, 0.12)', borderColor: 'var(--fitia-blue)', color: 'var(--fitia-blue)', fontSize: '15px', fontWeight: 900 }}
        >
          ➕
        </button>
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

      {/* 2. Fitia Week Calendar Strip (Screenshot 6) - 100% Dinámico */}
      <section className="fitia-week-strip" suppressHydrationWarning>
        {weekDays.map((item) => {
          const isSelected = selectedDateKey ? selectedDateKey === item.dateKey : selectedDay === item.num;
          const dayCycle = weekCycleMap[item.dateKey];
          return (
            <div
              key={item.dateKey}
              className={`fitia-day-col ${isSelected ? 'active' : ''} ${item.isToday ? 'today-active' : ''}`}
              onClick={() => {
                setSelectedDay(item.num);
                setSelectedDateKey(item.dateKey);
              }}
              title={`${item.dateKey}${item.isToday ? ' (Hoy)' : ''}${dayCycle ? ` · ${dayCycle.phaseName} (Día ${dayCycle.cycleDay})` : ''}`}
            >
              <span className="fitia-day-name">{item.day}</span>
              <div className="fitia-day-number" style={{ fontWeight: item.isToday ? 900 : 700 }}>{item.num}</div>
              <div className={`fitia-day-dot ${item.done ? '' : 'empty'}`} />
              {dayCycle && (
                <span
                  className="fitia-cycle-micro-dot"
                  style={{
                    background: dayCycle.bgColor,
                    color: dayCycle.color,
                    border: `1px solid ${dayCycle.borderColor}`
                  }}
                  title={`Día ${dayCycle.cycleDay}: ${dayCycle.phaseName}`}
                >
                  {dayCycle.icon}
                </span>
              )}
            </div>
          );
        })}
      </section>

      {/* 2.5. MENSTRUAL CYCLE & FEMALE HORMONAL EXPANSION CARD (CONFIGURABLE & ADAPTIVE) */}
      {activeCycleInfo && (currentProfile.gender === 'female' || activeCycleConfig?.enabled) && (
        <section
          className={`cycle-tracker-card ${activeCycleInfo.isBleedingDay ? 'active-glow' : ''}`}
          style={{
            border: `1.5px solid ${activeCycleInfo.borderColor}`,
            background: `linear-gradient(135deg, ${activeCycleInfo.bgColor} 0%, var(--bg-card) 60%)`
          }}
        >
          <div className="cycle-header-row">
            <div
              className="cycle-phase-tag"
              style={{
                background: activeCycleInfo.bgColor,
                color: activeCycleInfo.color,
                border: `1px solid ${activeCycleInfo.borderColor}`
              }}
            >
              <span>{activeCycleInfo.icon}</span>
              <span>Día {activeCycleInfo.cycleDay} de {activeCycleInfo.cycleLengthDays} · {activeCycleInfo.phaseName}</span>
            </div>
            <button
              type="button"
              className="cycle-config-btn"
              onClick={handleOpenCycleModal}
              title="Configurar duración y fecha de inicio de tu ciclo"
            >
              <span>⚙️</span>
              <span>Ajustar Ciclo</span>
            </button>
          </div>

          <div className="cycle-sub-info">
            <div className="cycle-sub-title">
              {activeCycleInfo.phaseSubtitle}
            </div>
            <div className="cycle-sub-meta">
              <span>📅 Próximo periodo estimado: <strong>{activeCycleInfo.nextPeriodDateStr}</strong></span>
              <span>•</span>
              <span style={{ color: activeCycleInfo.daysUntilNextPeriod <= 3 ? '#F43F5E' : 'inherit', fontWeight: activeCycleInfo.daysUntilNextPeriod <= 3 ? 800 : 600 }}>
                {activeCycleInfo.daysUntilNextPeriod === 1
                  ? '¡Inicia mañana!'
                  : `en ~${activeCycleInfo.daysUntilNextPeriod} días`}
              </span>
            </div>
          </div>

          {/* 1-Tap Quick Action & Expand Toggle */}
          <div className="cycle-actions-strip">
            <button
              type="button"
              className={`cycle-quick-btn ${activeCycleInfo.cycleDay === 1 ? 'active-day-one' : ''}`}
              onClick={handleMarkPeriodStartedToday}
            >
              <span>🩸</span>
              <span>{activeCycleInfo.cycleDay === 1 ? '✓ Periodo iniciado hoy (Día 1)' : 'Inició mi periodo hoy'}</span>
            </button>

            <button
              type="button"
              className="cycle-toggle-details-btn"
              onClick={() => setIsCycleExpanded(!isCycleExpanded)}
            >
              <span>{isCycleExpanded ? 'Ocultar Estrategia' : 'Ver Mapa Hormonal & Entrenamiento'}</span>
              <span>{isCycleExpanded ? '▴' : '▾'}</span>
            </button>
          </div>

          {/* Expanded Details: Timeline Map & Adapted Training / Nutrition Guidance */}
          {isCycleExpanded && (
            <div className="cycle-expanded-details">
              {/* Visual 28-day Segment Bar */}
              <div className="cycle-timeline-wrapper">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>
                  <span>Mapa del Ciclo ({activeCycleInfo.cycleLengthDays} días)</span>
                  <span style={{ color: activeCycleInfo.color }}>Pin: Día {activeCycleInfo.cycleDay}</span>
                </div>

                <div className="cycle-timeline-track">
                  {activeCycleInfo.allPhasesTimeline.map((seg) => {
                    const segDays = seg.endDay - seg.startDay + 1;
                    const widthPct = (segDays / activeCycleInfo.cycleLengthDays) * 100;
                    return (
                      <div
                        key={seg.id}
                        className="cycle-timeline-segment"
                        style={{
                          width: `${widthPct}%`,
                          background: seg.color,
                          opacity: activeCycleInfo.phaseId === seg.id ? 0.95 : 0.45
                        }}
                        title={`${seg.name} (Días ${seg.startDay}-${seg.endDay})`}
                      />
                    );
                  })}

                  {/* Glowing pin on current day */}
                  <div
                    className="cycle-day-marker-pin"
                    style={{
                      left: `${Math.min(98, Math.max(2, ((activeCycleInfo.cycleDay - 0.5) / activeCycleInfo.cycleLengthDays) * 100))}%`,
                      borderColor: activeCycleInfo.color,
                      boxShadow: `0 0 10px ${activeCycleInfo.color}`
                    }}
                  />
                </div>

                <div className="cycle-timeline-legend">
                  <span>🩸 Menstrual (1-{activeCycleInfo.periodDurationDays}d)</span>
                  <span>🌿 Folicular</span>
                  <span>✨ Ovulación</span>
                  <span>🌙 Lútea</span>
                  <span>🛡️ Premenstrual</span>
                </div>
              </div>

              {/* Strategy Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="cycle-strategy-box workout" style={{ borderLeftColor: activeCycleInfo.color }}>
                  <span className="cycle-box-label">
                    <span>🏋️‍♀️</span>
                    <span>Entrenamiento Adaptado ({activeCycleInfo.phaseName})</span>
                  </span>
                  <p className="cycle-box-text">
                    {activeCycleInfo.workoutAdvice}
                  </p>
                </div>

                <div className="cycle-strategy-box nutrition" style={{ borderLeftColor: '#10B981' }}>
                  <span className="cycle-box-label">
                    <span>🥑</span>
                    <span>Nutrición & Biohacking</span>
                  </span>
                  <p className="cycle-box-text">
                    {activeCycleInfo.nutritionAdvice}
                  </p>
                </div>

                <div className="cycle-strategy-box hormones" style={{ borderLeftColor: '#F59E0B' }}>
                  <span className="cycle-box-label">
                    <span>🧬</span>
                    <span>Clave Hormonal</span>
                  </span>
                  <p className="cycle-box-text">
                    <strong>Estrógeno:</strong> {activeCycleInfo.hormones.estrogen} · <strong>Progesterona:</strong> {activeCycleInfo.hormones.progesterone}. {activeCycleInfo.hormones.summary}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* MAIN TAB VIEWPORT */}
      <main className="fitia-content">
        {/* ===================================================================
            TAB 1: NUTRICIÓN ESTILO FITIA (Screenshots 1 a 6)
            =================================================================== */}
        {activeTab === 'nutrition' && (
          <>
            {/* Dynamic Date Selection Indicator */}
            {selectedDateKey !== getLocalDateKey() && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 14px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '14px',
                marginBottom: '14px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#3B82F6'
              }}>
                <span>📅 Registros del día: {selectedDateKey}</span>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    setSelectedDay(today.getDate());
                    setSelectedDateKey(getLocalDateKey(today));
                  }}
                  style={{
                    background: '#3B82F6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Volver a Hoy ↩
                </button>
              </div>
            )}

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

            {/* Sinergia Pilar 1 & 2: Combustible Nutricional según Split de Hoy */}
            <section style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: 'var(--card-shadow)'
            }}>
              <span style={{ fontSize: '26px' }}>
                {isMissedDay ? '⚡' : selectedSplit === 'legs' ? '🦵' : selectedSplit === 'push' ? '🛡️' : selectedSplit === 'pull' ? '🦅' : '🦁'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--fitia-green)', letterSpacing: '0.5px' }}>
                    Sinergia Nutrición ⟷ Entrenamiento
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    Pilar 1 + 2
                  </span>
                </div>
                <h4 suppressHydrationWarning style={{ fontSize: '13px', fontWeight: 900, margin: '2px 0 3px', color: 'var(--text-main)' }}>
                  {isMissedDay 
                    ? 'Día Ocupado: Sensibilidad a la Insulina & Core Express' 
                    : `Combustible para: ${HYBRID_ATHLETE_SYSTEM.splits[activeProfileId]?.[selectedSplit || (activeProfileId === 'andres' ? 'legs' : 'glutes_legs')]?.shortName || 'Entrenamiento del Día'}`}
                </h4>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.35 }}>
                  {isMissedDay 
                    ? 'Prioriza fuentes magras de proteína y ensalada abundante. Evita rebotes de hambre o ayunos extremos; tus 12m de planchas mantendrán activo tu metabolismo.'
                    : selectedSplit === 'legs'
                    ? 'Carga pesada de piernas: Ingiere 40-50g de carbohidratos complejos (avena, plátano o arroz) 2h antes para maximizar glucógeno en cuádriceps.'
                    : selectedSplit === 'pull'
                    ? 'Día de Espalda & Dominadas lastradas: Consume 30g de proteína de rápida asimilación post-entreno y mantén electrolitos para el agarre.'
                    : 'Mantén hidratación constante (+500ml con agua pura o limón) y 30-35g de proteína en tu comida post-workout.'}
                </p>
                <button
                  type="button"
                  style={{
                    marginTop: '8px',
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: 'var(--fitia-green)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setDetailReaderModal({
                    title: `Sinergia Nutricional: ${isMissedDay ? 'Core Express & Control Glucémico' : (HYBRID_ATHLETE_SYSTEM.splits[activeProfileId]?.[selectedSplit || (activeProfileId === 'andres' ? 'legs' : 'glutes_legs')]?.shortName || 'Entrenamiento del Día')}`,
                    subtitle: 'Optimización de Glucógeno, Síntesis Proteica y Recuperación Muscular',
                    icon: isMissedDay ? '⚡' : selectedSplit === 'legs' ? '🦵' : selectedSplit === 'push' ? '🛡️' : selectedSplit === 'pull' ? '🦅' : '🦁',
                    badge: 'TIMING NUTRICIONAL',
                    badgeBg: 'rgba(16, 185, 129, 0.12)',
                    badgeColor: 'var(--fitia-green)',
                    sections: [
                      {
                        heading: 'Ventana Pre-Entrenamiento (2 horas antes)',
                        icon: '🍌',
                        text: selectedSplit === 'legs'
                          ? 'Las demandas glucolíticas de sentadillas y prensa son elevadas. 40-50g de carbohidratos con bajo índice glucémico (avena con plátano o arroz) saturan los depósitos de glucógeno muscular en cuádriceps y glúteos.'
                          : 'Carbohidratos moderados de fácil digestión con una porción ligera de proteína. Evita excesos de grasas densas justo antes para no desviar flujo sanguíneo a la digestión estomacal.',
                        tip: 'Toma 400-500ml de agua 45 minutos antes para asegurar hidratación de los discos intervertebrales y articulaciones.'
                      },
                      {
                        heading: 'Ventana Post-Entrenamiento (1 a 2 horas después)',
                        icon: '🥩',
                        text: 'Ingesta de 30-35g de proteína rica en leucina (pollo, atún, huevos, queso o batido) para encender la vía mTORC1 y detener el catabolismo inducido por el esfuerzo muscular.',
                        alert: 'Si fue un día pesado de piernas o espalda en altitud (Cajabamba), acompaña con electrolitos (una pizca de sal marina en agua de limón) para prevenir calambres nocturnos.'
                      }
                    ],
                    actionText: '✓ Entendido / Cerrar Guía'
                  })}
                >
                  <span>📖</span>
                  <span>Ver Timing & Guía Nutricional</span>
                </button>
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

                <button
                  type="button"
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    color: 'var(--fitia-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setDetailReaderModal({
                    title: 'Secuenciación Bioquímica de Alimentos',
                    subtitle: 'Control Glucémico & Sensibilidad a la Insulina sin Restricción Calórica',
                    icon: '🥗',
                    badge: 'FISIOLOGÍA CLÍNICA',
                    badgeBg: 'var(--fitia-green-soft)',
                    badgeColor: 'var(--fitia-green)',
                    sections: [
                      {
                        heading: '1. El Efecto Malla de la Fibra',
                        icon: '🥦',
                        text: 'Al ingerir verduras crudas o cocidas (con limón o vinagre de manzana) al inicio del plato, la fibra soluble e insoluble tapiza las vellosidades del duodeno e íleon formando una red microscópica viscosa. Esto ralentiza la tasa de vaciado gástrico.',
                        tip: 'Añadir 1 cucharadita de aceite de oliva extra virgen y limón a tu ensalada amplifica este beneficio amortiguador.'
                      },
                      {
                        heading: '2. Estímulo Hormonal de Saciedad (GLP-1 y PYY)',
                        icon: '🥩',
                        text: 'Las proteínas (huevo, pollo, pescado, queso fresco) y las grasas monoinsaturadas activan las células L enteroendocrinas en el tracto digestivo, liberando neuropéptidos saciantes (GLP-1 y péptido YY) antes de que lleguen los almidones.',
                        tip: 'Come masticando pausadamente para darle 15-20 minutos al cerebro de recibir las señales de plenitud gástrica.'
                      },
                      {
                        heading: '3. Aplanamiento del Pico Glucémico',
                        icon: '🍚',
                        text: 'Cuando los carbohidratos (papa, arroz o camote) entran finalmente en el torrente digestivo, la glucosa se absorbe de forma gradual en vez de en tromba. Esto previene el "pico y caída" (crash de energía) y el deseo incontrolable de picar dulce 2 horas después.',
                        alert: 'No necesitas eliminar los carbohidratos de tu dieta peruana; cambiar el orden en que entran a tu estómago transforma su impacto hormonal por completo.'
                      }
                    ],
                    actionText: '✓ Entendido / Cerrar Guía'
                  })}
                >
                  <span>📖</span>
                  <span>Ver Fisiología Completa del Orden de Ingesta</span>
                </button>
              </section>
            )}

            {/* Quick Actions Row: Fitia Text Log / Menús del Día / Search Foods */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px 6px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: 800,
                  fontSize: '12px',
                  boxShadow: 'var(--card-shadow)',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
                onClick={() => setShowTextLogModal(true)}
              >
                <span>✍️</span>
                <span>Por Texto</span>
              </button>

              <button
                type="button"
                style={{
                  flex: 1.25,
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.15) 100%)',
                  border: '1.5px solid rgba(245, 158, 11, 0.45)',
                  padding: '12px 6px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: 900,
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setTargetMealSlot('comida');
                  setShowPeruvianMenuModal(true);
                }}
              >
                <span>🇵🇪</span>
                <span>Menús del Día</span>
              </button>

              <button
                type="button"
                style={{
                  flex: 1,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px 6px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: 800,
                  fontSize: '12px',
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
                <span>Buscar (+2M)</span>
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
                const slotFoods = activeDayFoods.filter((f) => f.mealSlot === slot.key);
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

                    {slot.key === 'comida' || slot.key === 'cena' ? (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <button
                          type="button"
                          className="btn-add-meal-slot"
                          style={{ flex: 1.3, margin: 0 }}
                          onClick={() => {
                            setTargetMealSlot(slot.key);
                            setShowFoodSearchModal(true);
                          }}
                        >
                          <span>+</span> Agregar a {slot.label}
                        </button>
                        <button
                          type="button"
                          style={{
                            flex: 1,
                            padding: '10px 8px',
                            borderRadius: '12px',
                            border: '1.5px solid rgba(245, 158, 11, 0.45)',
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%)',
                            color: 'var(--text-main)',
                            fontSize: '11.5px',
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setTargetMealSlot(slot.key);
                            setShowPeruvianMenuModal(true);
                          }}
                        >
                          <span>🇵🇪</span> Menú del Día
                        </button>
                      </div>
                    ) : (
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
                    )}
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

              {/* Sincronización de Cocina en Pareja & Despensa Compartida */}
              {coupleModeEnabled && (activeProfileId === 'andres' || activeProfileId === 'pareja') && (
                <div className="couple-kitchen-banner">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '18px' }}>👫</span>
                      <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                        Cocina en Pareja ({familyProfiles.andres?.name || 'Andrés'} & {partnerName})
                      </strong>
                    </div>
                    <span className="couple-badge-synced">100% Ingredientes Compartidos</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.4 }}>
                    Compran y cocinan los mismos alimentos para ahorrar tiempo. Las porciones se modulan según el objetivo: <strong>{familyProfiles.andres?.name || 'Andrés'} (~125% / 60% de la olla)</strong> y <strong>{partnerName} (~85% / 40% de la olla)</strong>.
                  </p>
                  <button
                    type="button"
                    className="btn-open-grocery-list"
                    onClick={() => setShowCoupleGroceryModal(true)}
                  >
                    <span>🛒</span>
                    <span>Lista de Compras Compartida ({familyProfiles.andres?.name || 'Andrés'} & {partnerName})</span>
                  </button>
                </div>
              )}

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
                                      {mult !== 1.0 && <span className="portion-scaler-tag">x{mult}</span>}
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

                            {/* Cocina en Pareja: Mismo Plato, 2 Porciones (Batch Cooking 1 Sartén) */}
                            {coupleModeEnabled && (activeProfileId === 'andres' || activeProfileId === 'pareja') && (() => {
                              const couple = calculateCouplePortions(meal, partnerName);
                              if (!couple) return null;
                              const isExp = couplePortionsExpanded[meal.id];
                              return (
                                <div className="couple-portion-box">
                                  <button
                                    type="button"
                                    className="btn-toggle-couple-portion"
                                    onClick={() => setCouplePortionsExpanded((prev) => ({ ...prev, [meal.id]: !prev[meal.id] }))}
                                  >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span>👫</span>
                                      <strong>Modo Pareja ({familyProfiles.andres?.name || 'Andrés'} & {partnerName}): 1 Sartén, 2 Porciones</strong>
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--fitia-blue)', fontWeight: 800 }}>
                                      {isExp ? '▲ Ocultar' : '▼ Ver desglose'}
                                    </span>
                                  </button>

                                  {isExp && (
                                    <div className="couple-portion-details">
                                      <div className="couple-batch-tip">
                                        {couple.batchCookingTip}
                                      </div>
                                      <div className="couple-portion-grid">
                                        {/* Columna Andrés */}
                                        <div className="couple-portion-card andres">
                                          <div className="couple-portion-header">
                                            <span>🦁 {couple.andres.profileName}</span>
                                            <span className="couple-ratio-badge">{couple.andres.servingRatio}</span>
                                          </div>
                                          <div className="couple-portion-macros">
                                            <strong>{couple.andres.calories} kcal</strong> · {couple.andres.protein}g P · {couple.andres.carbs}g C
                                          </div>
                                          <div className="couple-portion-desc">
                                            {couple.andres.portionDidactic}
                                          </div>
                                          <button
                                            type="button"
                                            className="btn-quick-log-couple andres"
                                            onClick={() => handleAddFood({
                                              name: `${meal.title || meal.name} (Porción ${couple.andres.profileName} 1.25x)`,
                                              calories: couple.andres.calories,
                                              protein: couple.andres.protein,
                                              carbs: couple.andres.carbs,
                                              fat: couple.andres.fat,
                                              mealSlot: slot
                                            })}
                                          >
                                            + Servir a {couple.andres.profileName}
                                          </button>
                                        </div>

                                        {/* Columna Pareja */}
                                        <div className="couple-portion-card pareja">
                                          <div className="couple-portion-header">
                                            <span>🌸 {couple.pareja.profileName}</span>
                                            <span className="couple-ratio-badge">{couple.pareja.servingRatio}</span>
                                          </div>
                                          <div className="couple-portion-macros">
                                            <strong>{couple.pareja.calories} kcal</strong> · {couple.pareja.protein}g P · {couple.pareja.carbs}g C
                                          </div>
                                          <div className="couple-portion-desc">
                                            {couple.pareja.portionDidactic}
                                          </div>
                                          <button
                                            type="button"
                                            className="btn-quick-log-couple pareja"
                                            onClick={() => handleAddFood({
                                              name: `${meal.title || meal.name} (Porción ${couple.pareja.profileName} 0.85x)`,
                                              calories: couple.pareja.calories,
                                              protein: couple.pareja.protein,
                                              carbs: couple.pareja.carbs,
                                              fat: couple.pareja.fat,
                                              mealSlot: slot
                                            })}
                                          >
                                            + Servir a {couple.pareja.profileName}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

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
                          const todayKey = getLocalDateKey();
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Hábitos Diarios ({currentProfile.name})
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--fitia-green)' }}>
                    {completedHabitsCount} / {habits.length}
                  </span>
                  <button
                    type="button"
                    className="btn-restore-habits"
                    onClick={handleResetDefaultHabits}
                    title="Restaurar lista de hábitos predeterminados de este perfil"
                  >
                    🔄 Restaurar
                  </button>
                  <button
                    type="button"
                    className="btn-add-habit-trigger"
                    onClick={() => {
                      setNewHabitForm({ name: '', target: '', icon: '🧘', category: 'bienestar', note: '' });
                      setShowAddHabitModal(true);
                    }}
                  >
                    <span>+</span>
                    <span>Agregar Hábito</span>
                  </button>
                </div>
              </div>
              {habits.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-subtle)' }}>
                  <div style={{ fontSize: '30px', marginBottom: '6px' }}>🌱</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>No tienes hábitos en tu rutina</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '12px' }}>
                    Agrega hábitos que se adapten a tu día a día o restaura los recomendados para {currentProfile.name}.
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn-add-habit-trigger"
                      onClick={() => {
                        setNewHabitForm({ name: '', target: '', icon: '🧘', category: 'bienestar', note: '' });
                        setShowAddHabitModal(true);
                      }}
                    >
                      + Crear Hábito
                    </button>
                    <button
                      type="button"
                      className="btn-restore-habits"
                      onClick={handleResetDefaultHabits}
                    >
                      🔄 Restaurar Originales
                    </button>
                  </div>
                </div>
              )}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>{habit.name}</span>
                        {habit.name?.toLowerCase().includes('creatina') && (
                          <button
                            type="button"
                            className="notif-chip-btn"
                            style={{ padding: '2px 7px', fontSize: '10px', borderRadius: '6px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowNotificationModal(true);
                            }}
                            title="Configurar recordatorio de creatina"
                          >
                            🔔 {notificationConfig?.creatineReminderTime || '10:00'}
                          </button>
                        )}
                        {habit.id === 'wimhof' && (
                          <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>
                            ▶ Asistente Guiado
                          </span>
                        )}
                        {habit.isCustom && (
                          <span style={{ fontSize: '9.5px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '1px 5px', borderRadius: '6px', fontWeight: 800 }}>
                            Personal
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {habit.target} {habit.completed && `· Completado a las ${habit.time || 'hoy'}`}
                      </div>
                      {habit.note && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-sub)', fontStyle: 'italic', lineHeight: 1.3, flex: 1, minWidth: '160px' }}>
                            {habit.note.length > 60 ? `${habit.note.slice(0, 58)}...` : habit.note}
                          </div>
                          <button
                            type="button"
                            style={{
                              background: 'var(--bg-card-subtle)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              padding: '2px 7px',
                              fontSize: '10px',
                              fontWeight: 800,
                              color: 'var(--fitia-blue)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailReaderModal({
                                title: habit.name,
                                subtitle: habit.target || 'Hábito Diario de Bienestar & Biohacking',
                                icon: habit.icon || '✨',
                                badge: (habit.category || 'bienestar').toUpperCase(),
                                badgeBg: 'var(--fitia-blue-soft)',
                                badgeColor: 'var(--fitia-blue)',
                                sections: [
                                  {
                                    heading: 'Mecanismo Fisiológico & Beneficio',
                                    icon: '🔬',
                                    text: habit.note
                                  },
                                  {
                                    heading: 'Protocolo de Ejecución & Consistencia',
                                    icon: '🎯',
                                    text: `Meta objetivo: ${habit.target}. La regularidad en el mismo horario cada día refuerza las sinapsis neuronales y maximiza los beneficios sistémicos.`,
                                    tip: habit.name.toLowerCase().includes('creatina')
                                      ? 'Toma 5g con un vaso de agua o carbohidratos para optimizar la absorción muscular vía transportadores SLC6A8.'
                                      : habit.name.toLowerCase().includes('sol')
                                      ? 'Exponer los ojos y piel sin gafas de sol durante 10-15 min antes de las 9am para calibrar el reloj circadiano central.'
                                      : habit.name.toLowerCase().includes('caminata')
                                      ? 'Caminar a paso suave durante 10 a 15 minutos después de comer activa transportadores GLUT-4 musculares sin demandar insulina.'
                                      : 'Completa este hábito diariamente para sumar puntos directos a tu AuraScore de Estilo de Vida.'
                                  }
                                ],
                                actionText: habit.completed ? '✓ Mantener Hábito Completado' : '✓ Marcar Hábito como Completado',
                                onAction: () => {
                                  if (!habit.completed) {
                                    toggleHabit(habit.id);
                                  }
                                }
                              });
                            }}
                          >
                            <span>📖</span>
                            <span>Guía</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      title={`Editar hábito "${habit.name}"`}
                      className="btn-edit-habit"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingHabit({
                          id: habit.id,
                          name: habit.name || '',
                          target: habit.target || '',
                          icon: habit.icon || '⭐',
                          category: habit.category || 'bienestar',
                          note: habit.note || ''
                        });
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      title={`Eliminar hábito "${habit.name}"`}
                      className="btn-delete-habit"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Eliminar el hábito "${habit.name}" de tu rutina diaria?`)) {
                          handleDeleteHabit(habit.id);
                        }
                      }}
                    >
                      🗑️
                    </button>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Hidratación Diaria</strong>
                      <button
                        type="button"
                        className="notif-chip-btn"
                        style={{ padding: '2px 7px', fontSize: '10px', borderRadius: '6px' }}
                        onClick={() => setShowNotificationModal(true)}
                        title="Configurar recordatorio de hidratación"
                      >
                        🔔 {notificationConfig?.waterIntervalMinutes ? `${notificationConfig.waterIntervalMinutes}m` : 'Recordatorio'}
                      </button>
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Inicia en 0 ml todos los días</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', color: 'var(--fitia-blue)', fontWeight: 900 }}>
                    {activeWaterMl} / {currentProfile.waterDailyMl || 2500} ml
                  </span>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {Math.round((activeWaterMl / (currentProfile.waterDailyMl || 2500)) * 100)}% alcanzado
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-card-subtle)', borderRadius: '999px', overflow: 'hidden', marginBottom: '14px' }}>
                <div
                  style={{
                    height: '100%',
                    background: 'var(--fitia-blue)',
                    width: `${Math.min(100, Math.round((activeWaterMl / (currentProfile.waterDailyMl || 2500)) * 100))}%`,
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
            TAB 3: WORKOUT ADAPTATIVO & ATLETA HÍBRIDO (ESTILO DEJAN STIPKE)
            =================================================================== */}
        {activeTab === 'workout' && (
          <>
            {/* 1. ATHLETE IDENTITY HERO */}
            <div style={{
              background: currentProfile.id === 'pareja' 
                ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)'
                : currentProfile.id === 'hermana'
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(255, 107, 0, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '18px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  color: currentProfile.id === 'pareja' ? '#EC4899' : currentProfile.id === 'hermana' ? '#10B981' : '#FF6B00'
                }}>
                  {currentProfile.id === 'pareja' ? '🌸 Atleta Funcional Femenina' : currentProfile.id === 'hermana' ? '🌿 Movilidad & Vitalidad' : '🦁 Sistema Atleta Híbrido (Dejan Stipke)'}
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 900, marginTop: '2px' }}>
                  {hybridPrescription.routineTitle}
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {hybridPrescription.focus}
                </p>
              </div>
              <div style={{
                fontSize: '32px',
                background: 'var(--bg-card)',
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}>
                {currentProfile.avatar}
              </div>
            </div>

            {/* PAREJA SPECIAL LUMBAR SAFETY BANNER */}
            {currentProfile.id === 'pareja' && (
              <div style={{
                background: 'rgba(236, 72, 153, 0.08)',
                border: '1.5px solid rgba(236, 72, 153, 0.35)',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '24px' }}>🛡️</span>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 900, color: '#DB2777' }}>
                    Blindaje Lumbar Activo: Cero Compresión Axial
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.45 }}>
                    Rutina diseñada con soporte completo de espalda (prensa inclinada, sentadilla búlgara con mancuernas a los lados y estabilización McGill Big 3). Glúteos y femoral al máximo sin tocar la columna.
                  </p>
                </div>
              </div>
            )}

            {/* HORMONAL CYCLE TRAINING ADAPTATION BANNER */}
            {activeCycleInfo && (currentProfile.gender === 'female' || activeCycleConfig?.enabled) && (
              <div
                className="cycle-workout-banner"
                style={{
                  borderLeft: `4px solid ${activeCycleInfo.color}`,
                  background: `linear-gradient(135deg, ${activeCycleInfo.bgColor} 0%, var(--bg-card) 60%)`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: activeCycleInfo.color, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {activeCycleInfo.icon} Sinergia Ciclo & Entrenamiento · Día {activeCycleInfo.cycleDay} ({activeCycleInfo.phaseName})
                  </span>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-muted)' }}>
                    {activeCycleInfo.phaseSubtitle}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.45, margin: 0 }}>
                  {activeCycleInfo.workoutAdvice}
                </p>
              </div>
            )}

            {/* 1.5. BALANCE SEMANAL & CONTROL TOTAL DEL SPLIT (USUARIO TIENE EL MANDO) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* BALANCE SEMANAL INTELIGENTE BANNER */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1.5px solid var(--fitia-green)',
                borderRadius: '18px',
                padding: '14px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                width: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--fitia-green)', letterSpacing: '0.5px' }}>
                    📊 Balance Semanal Adaptativo
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {currentProfile.id === 'hermana'
                      ? '🌸 Vitalidad Serena Diaria'
                      : currentProfile.id === 'pareja'
                      ? `Glúteo: ${weeklyWorkoutBalance.glutesCount || 0} · Piernas: ${weeklyWorkoutBalance.pureLegsCount || 0} · Espalda: ${weeklyWorkoutBalance.pullCount || 0} · Pecho: ${weeklyWorkoutBalance.pushCount || 0}`
                      : `Piernas: ${weeklyWorkoutBalance.pureLegsCount || 0} · Pecho: ${weeklyWorkoutBalance.pushCount || 0} · Espalda: ${weeklyWorkoutBalance.pullCount || 0} · Glúteo: ${weeklyWorkoutBalance.glutesCount || 0}`}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.4, margin: 0 }}>
                  {weeklyWorkoutBalance.weeklySummaryText}
                </p>
                {weeklyWorkoutBalance.recommendedSplit && selectedSplit !== weeklyWorkoutBalance.recommendedSplit && !isMissedDay && (
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'var(--fitia-green-soft)',
                      border: '1px solid var(--fitia-green)',
                      color: 'var(--fitia-green)',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      textAlign: 'center',
                      cursor: 'pointer',
                      lineHeight: 1.3
                    }}
                    onClick={() => handleSelectSplit(weeklyWorkoutBalance.recommendedSplit)}
                  >
                    {currentProfile.id === 'hermana'
                      ? `🌸 Aplicar Rutina Sugerida (${HYBRID_ATHLETE_SYSTEM.splits[activeProfileId]?.[weeklyWorkoutBalance.recommendedSplit]?.shortName || 'Movilidad Suave'})`
                      : `⚡ Aplicar Split Recomendado (${HYBRID_ATHLETE_SYSTEM.splits[activeProfileId]?.[weeklyWorkoutBalance.recommendedSplit]?.shortName || weeklyWorkoutBalance.recommendedSplit})`}
                  </button>
                )}
              </div>

              {/* CONTROLADOR DE SPLITS DISPONIBLES (USER FULL CONTROL) */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '14px 14px', boxShadow: 'var(--card-shadow)', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-main)' }}>
                    {currentProfile.id === 'hermana' ? '🌸 Tu Momento de Bienestar de Hoy:' : '🎯 Tu Split de Hoy:'}
                  </span>
                  <span style={{ fontSize: '11px', color: isMissedDay ? '#DC2626' : 'var(--fitia-green)', fontWeight: 800 }}>
                    {isMissedDay ? (currentProfile.id === 'hermana' ? '🌸 Pausa 5m' : '⚡ Planchas 12m') : 'Personalizable'}
                  </span>
                </div>

                {/* Grid of Split Options for Active Profile */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                  {Object.entries(HYBRID_ATHLETE_SYSTEM.splits[activeProfileId] || {}).map(([sKey, sObj]) => {
                    const isSel = (selectedSplit === sKey) || (!selectedSplit && sKey === (activeProfileId === 'andres' ? 'legs' : activeProfileId === 'pareja' ? 'glutes_legs' : 'mobility_gentle'));
                    return (
                      <button
                        key={sKey}
                        type="button"
                        style={{
                          minWidth: 0,
                          width: '100%',
                          padding: '9px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          textAlign: 'left',
                          background: isSel ? 'var(--fitia-green)' : 'var(--bg-card-subtle)',
                          color: isSel ? '#FFFFFF' : 'var(--text-main)',
                          border: isSel ? '1px solid var(--fitia-green)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxSizing: 'border-box',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => handleSelectSplit(sKey)}
                      >
                        <span style={{ fontSize: '15px', flexShrink: 0 }}>{sObj.icon || '⚡'}</span>
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sObj.shortName || sObj.name || sKey}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* BOTÓN: NO PUDE ENTRENAR HOY / DÍA OCUPADO */}
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-subtle)' }}>
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      background: isMissedDay ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-card-subtle)',
                      color: isMissedDay ? '#DC2626' : 'var(--text-muted)',
                      border: isMissedDay ? '1.5px solid #DC2626' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={handleToggleMissedDay}
                  >
                    <span style={{ minWidth: 0, flex: 1, textAlign: 'left', lineHeight: 1.25 }}>
                      {isMissedDay
                        ? (currentProfile.id === 'hermana' ? '🌸 Pausa Serena Activa (5-10 min)' : '⚡ Modo Día Ocupado Activo (12 min Planchas)')
                        : (currentProfile.id === 'hermana' ? '🌸 ¿Día complicado? Pausa de calma' : '❌ ¿Día complicado? No pude entrenar')}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 900, flexShrink: 0 }}>
                      {isMissedDay ? 'Desactivar ↩️' : (currentProfile.id === 'hermana' ? 'Pausa 5m →' : 'Planchas 12m →')}
                    </span>
                  </button>
                  {isMissedDay && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '8px 12px', marginTop: '8px', fontSize: '11.5px', color: '#B45309', lineHeight: 1.4 }}>
                      💡 <strong>Prescripción Dinámica:</strong> {currentProfile.id === 'hermana'
                        ? 'Pausa amable de 5-10 min con respiración relajante 4-4, movilidad suave e infusión tibia. Cero exigencia, oxigena el cuerpo y recarga tu energía.'
                        : 'Rutina express de 10-12 min de planchas y core isométrico en casa. Cero fricción, mantiene el SNC despierto y se sincroniza la nutrición para preservar la masa magra.'}
                    </div>
                  )}
                </div>
              </div>

              {/* CARD: LOS 4 PILARES DEL CUERPO ÓPTIMO (INTERCONEXIÓN SISTÉMICA) */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '18px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: 'var(--card-shadow)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🧬</span>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 900, margin: 0 }}>
                        Los 4 Pilares del Cuerpo Óptimo
                      </h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                        Nutrición celular, fuerza híbrida, SNC y biohacking
                      </p>
                    </div>
                  </div>
                  <div style={{
                    background: 'var(--fitia-green-soft)',
                    color: 'var(--fitia-green)',
                    fontWeight: 900,
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    border: '1px solid var(--fitia-green)'
                  }}>
                    {systemicPillars.totalAuraScore || 70}/100 PTS
                  </div>
                </div>

                {/* 4 Pillars Mini Gauges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
                  {[
                    { name: 'Nutrición', pts: systemicPillars.breakdown?.nutrition ?? 15, icon: '🥗', color: '#10B981' },
                    { name: 'Fuerza', pts: systemicPillars.breakdown?.workout ?? 15, icon: '🦁', color: '#F97316' },
                    { name: 'Sueño/SNC', pts: systemicPillars.breakdown?.sleep ?? 20, icon: '💤', color: '#6366F1' },
                    { name: 'Hábitos', pts: systemicPillars.breakdown?.habits ?? 15, icon: '🧘', color: '#3B82F6' }
                  ].map((p, pIdx) => (
                    <div key={pIdx} style={{
                      background: 'var(--bg-card-subtle)',
                      borderRadius: '10px',
                      padding: '8px 4px',
                      textAlign: 'center',
                      border: '1px solid var(--border-subtle)',
                      minWidth: 0,
                      overflow: 'hidden',
                      boxSizing: 'border-box'
                    }}>
                      <span style={{ fontSize: '14px' }}>{p.icon}</span>
                      <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{p.name}</div>
                      <div style={{ fontSize: '11.5px', fontWeight: 900, color: p.color, marginTop: '2px' }}>{p.pts}/25</div>
                    </div>
                  ))}
                </div>

                {/* Dynamic Cross-Pillar Synergies */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(systemicPillars.synergies || []).map((syn, sIdx) => (
                    <div
                      key={syn.id || sIdx}
                      style={{
                        background: 'var(--bg-card-subtle)',
                        borderLeft: '3px solid var(--fitia-green)',
                        padding: '10px 12px',
                        borderRadius: '0 10px 10px 0',
                        fontSize: '11.5px',
                        lineHeight: 1.35,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onClick={() => setDetailReaderModal({
                        title: syn.title,
                        subtitle: 'Sinergia Sistémica de Rendimiento & Recuperación Celular',
                        icon: syn.icon || '⚡',
                        badge: 'Sinergia AuraScore',
                        badgeBg: 'rgba(16, 185, 129, 0.15)',
                        badgeColor: 'var(--fitia-green)',
                        sections: [
                          {
                            heading: 'Mecanismo Biológico y Fisiológico',
                            icon: '🧬',
                            text: syn.text
                          },
                          {
                            heading: 'Impacto en tu Día',
                            icon: '💡',
                            tip: 'Al sincronizar estos dos pilares sistémicos, optimizas tu curva de glucosa, disponibilidad mitocondrial de ATP y estabilidad del sistema nervioso central.'
                          }
                        ],
                        actionText: '✓ Entendido / Cerrar Guía'
                      })}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                          {syn.icon} {syn.title}
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--fitia-green)', fontWeight: 800, whiteSpace: 'nowrap' }}>
                          📖 Ver Guía
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        {syn.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. CNS AUTO-REGULATION & READINESS CARD */}
            <div className="hybrid-readiness-hero">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🧠</span>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 900 }}>Auto-Regulación SNC & Preparación</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Evaluación neuromuscular según sueño y fatiga acumulada
                    </p>
                  </div>
                </div>
                <div style={{
                  background: hybridPrescription.badgeColor,
                  color: '#FFFFFF',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 900,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {hybridPrescription.readinessScore} / 100 SNC
                </div>
              </div>

              {/* Intensity Mode Indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-card)',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)'
              }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>
                  Modo Prescrito Hoy:
                </span>
                <span style={{ fontSize: '13px', fontWeight: 900, color: hybridPrescription.badgeColor }}>
                  {hybridPrescription.intensityMode}
                </span>
              </div>

              {/* Interactive Sleep Sync Override */}
              <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800 }}>
                    🛌 Sueño Sincronizado: <strong>{sleepHours}h</strong> ({sleepQuality === 'deep' ? 'Profundo' : sleepQuality === 'normal' ? 'Normal' : 'Ligero / Inquieto'})
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ajuste Rápido</span>
                </div>
                
                {/* Hours row */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  {[5.5, 6.5, 7.5, 8.5].map((h) => (
                    <button
                      key={h}
                      type="button"
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: sleepHours === h ? 'var(--fitia-green)' : 'var(--bg-card-subtle)',
                        color: sleepHours === h ? '#FFFFFF' : 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSleepHours(h)}
                    >
                      {h}h
                    </button>
                  ))}
                </div>

                {/* Quality row */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'deep', label: 'Profundo 🌙' },
                    { id: 'normal', label: 'Normal 💤' },
                    { id: 'light', label: 'Inquieto ⚠️' }
                  ].map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: sleepQuality === q.id ? '#3B82F6' : 'var(--bg-card-subtle)',
                        color: sleepQuality === q.id ? '#FFFFFF' : 'var(--text-main)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSleepQuality(q.id)}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Consecutive Heavy Days Tracker - Solo para Andrés y Pareja */}
              {currentProfile.id !== 'hermana' ? (
                <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800 }}>
                      🏋️ Días pesados seguidos esta semana:
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 900, color: recentHeavyDays >= 2 ? '#F59E0B' : 'var(--text-main)' }}>
                      {recentHeavyDays === 0 ? '0 días' : recentHeavyDays === 1 ? '1 día' : '2+ días (Fatiga)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { val: 0, label: '0 días' },
                      { val: 1, label: '1 día' },
                      { val: 2, label: '2+ días pesados ⚡' }
                    ].map((d) => (
                      <button
                        key={d.val}
                        type="button"
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 800,
                          background: recentHeavyDays === d.val ? (d.val >= 2 ? '#F59E0B' : 'var(--fitia-green)') : 'var(--bg-card-subtle)',
                          color: recentHeavyDays === d.val ? '#FFFFFF' : 'var(--text-main)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer'
                        }}
                        onClick={() => setRecentHeavyDays(d.val)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800 }}>
                      🌿 Nivel de Energía & Bienestar:
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--fitia-green)' }}>
                      Vitalidad Serena
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Cero sobrecarga articular ni fatiga pesada. Actividad orientada a la salud, circulación y relajación.
                  </div>
                </div>
              )}

              {/* Smart Alerts & Warnings */}
              {(hybridPrescription.warnings.length > 0 || hybridPrescription.recommendations.length > 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {hybridPrescription.warnings.map((warn, i) => (
                    <div key={i} style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#DC2626', fontWeight: 700 }}>
                      {warn}
                    </div>
                  ))}
                  {hybridPrescription.recommendations.map((rec, i) => (
                    <div key={i} style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#B45309', fontWeight: 700 }}>
                      {rec}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. CONTEXT & DURATION SELECTORS (SOLO PARA ANDRÉS Y PAREJA; OCULTO PARA ANICKA) */}
            {currentProfile.id !== 'hermana' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', paddingLeft: '4px' }}>
                  📍 ¿Dónde entrenas hoy?
                </div>
                <div style={{ display: 'flex', background: 'var(--bg-card-subtle)', padding: '4px', borderRadius: '14px', gap: '4px' }}>
                  {[
                    { id: 'gym', label: 'Gimnasio', icon: '🏋️' },
                    { id: 'home_bars', label: currentProfile.id === 'andres' ? 'Calistenia (Barras & Lastre)' : 'En Casa (Funcional)', icon: currentProfile.id === 'andres' ? '🤸‍♂️' : '🏡' },
                    { id: 'travel', label: 'Cajabamba / Viaje', icon: '🏔️' }
                  ].map((ctx) => {
                    const isSel = workoutContext === ctx.id;
                    return (
                      <button
                        key={ctx.id}
                        type="button"
                        className="hybrid-context-tab"
                        style={{
                          background: isSel ? 'var(--bg-card)' : 'transparent',
                          color: isSel ? 'var(--text-main)' : 'var(--text-muted)',
                          boxShadow: isSel ? 'var(--card-shadow)' : 'none'
                        }}
                        onClick={() => setWorkoutContext(ctx.id)}
                      >
                        <span>{ctx.icon}</span>
                        <span>{ctx.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Duration Switcher (2h vs 45m) */}
                <div style={{ display: 'flex', background: 'var(--bg-card-subtle)', padding: '4px', borderRadius: '14px', gap: '4px' }}>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 800,
                      background: workoutDurationMode === 'full' ? 'var(--bg-card)' : 'transparent',
                      color: workoutDurationMode === 'full' ? 'var(--text-main)' : 'var(--text-muted)',
                      boxShadow: workoutDurationMode === 'full' ? 'var(--card-shadow)' : 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => setWorkoutDurationMode('full')}
                  >
                    ⏱️ Sesión Completa (~90–120 min)
                  </button>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 800,
                      background: workoutDurationMode === 'express' ? 'var(--bg-card)' : 'transparent',
                      color: workoutDurationMode === 'express' ? 'var(--text-main)' : 'var(--text-muted)',
                      boxShadow: workoutDurationMode === 'express' ? 'var(--card-shadow)' : 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => setWorkoutDurationMode('express')}
                  >
                    ⚡ Sesión Express (45 min)
                  </button>
                </div>
              </div>
            ) : (
              /* Tarjeta Serena Exclusiva para Anicka */
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '26px' }}>🌸</span>
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block' }}>
                    Ruta de Movilidad & Bienestar Amable
                  </strong>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', display: 'block', lineHeight: 1.35 }}>
                    Sesiones suaves de 15 a 25 min para realizar cómodamente en casa o en un paseo tranquilo, sin pesas ni impacto articular.
                  </span>
                </div>
              </div>
            )}

            {/* Banner Específico para Andrés: Calistenia Intermedia con Lastre */}
            {currentProfile.id === 'andres' && workoutContext === 'home_bars' && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(16, 185, 129, 0.08))',
                border: '1.5px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '22px' }}>🤸‍♂️</span>
                    <div>
                      <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>
                        Calistenia Intermedia con Lastre (Barras en Casa)
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--fitia-orange)', fontWeight: 800 }}>
                        ⚡ Sobrecarga Progresiva Pesada (+kg) · Enfoque Dejan Stipke
                      </span>
                    </div>
                  </div>
                  <span style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#D97706',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '10.5px',
                    fontWeight: 900
                  }}>
                    INTERMEDIO
                  </span>
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Entrenamiento en barra fija y paralelas con tu <strong>cinturón de lastre</strong>. Prioriza rango de movimiento estricto, 2s de descenso excéntrico y descansos de 120s para reponer fosfocreatina.
                </div>

                {/* Selector rápido de peso de lastre */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '2px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-main)' }}>⚖️ Tu Lastre Hoy:</span>
                  {[5, 10, 15, 20, 25].map((kg) => (
                    <button
                      key={kg}
                      type="button"
                      style={{
                        padding: '4px 9px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 900,
                        cursor: 'pointer',
                        background: selectedLastreKg === kg ? 'var(--fitia-orange)' : 'var(--bg-card)',
                        color: selectedLastreKg === kg ? '#FFFFFF' : 'var(--text-main)',
                        border: selectedLastreKg === kg ? '1px solid var(--fitia-orange)' : '1px solid var(--border-subtle)',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => {
                        setSelectedLastreKg(kg);
                        showToast(`⚖️ Lastre fijado en +${kg} kg. ¡Rango objetivo: 6-8 reps estrictas!`);
                      }}
                    >
                      +{kg} kg
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Banner Específico para Tania: Blindaje Lumbar Activo (Cero Hip Thrust) */}
            {currentProfile.id === 'pareja' && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(59, 130, 246, 0.08))',
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '22px' }}>🛡️</span>
                    <div>
                      <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>
                        Blindaje Lumbar Activo (Tania)
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--fitia-green)', fontWeight: 800 }}>
                        🚫 CERO Hip Thrust · Cero Carga Axial en Columna
                      </span>
                    </div>
                  </div>
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: 'var(--fitia-green)',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '10.5px',
                    fontWeight: 900
                  }}>
                    LUMBAR SAFE
                  </span>
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  <strong>Contraindicación médica aplicada:</strong> El Hip Thrust en banco y pesos muertos están 100% excluidos para evitar cizalla en L4-L5/S1. Tus glúteos se estimulan con <strong>puentes en suelo con banda elástica</strong>, <strong>patadas en cuadrupedia</strong> y <strong>protocolo McGill Big 3</strong> (Bird-Dog + Planchas laterales).
                </div>
              </div>
            )}
            {/* Banner Específico: 100% Máquinas de Gimnasio en Piernas (Cero Híbrido) */}
            {(hybridPrescription.selectedSplit === 'legs' || hybridPrescription.selectedSplit === 'piernas' || hybridPrescription.selectedSplit === 'glutes') && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(16, 185, 129, 0.08))',
                border: '1.5px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '22px' }}>🦵</span>
                    <div>
                      <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>
                        Entrenamiento de Piernas: 100% Máquinas de Gimnasio
                      </strong>
                      <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: 800 }}>
                        ⚙️ Cero Híbrido en Piernas · Hipertrofia & Aislamiento Puro
                      </span>
                    </div>
                  </div>
                  <span style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#2563EB',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '10.5px',
                    fontWeight: 900
                  }}>
                    100% MÁQUINAS
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  <strong>Regla biomecánica aplicada:</strong> En piernas todo se realiza en máquinas guiadas (Prensa 45°, Hack Squat, Sillón de Extensiones, Curl Femoral sentado y Máquina de Aductores). Cero calistenia y cero inestabilidad libre para máxima sobrecarga muscular en estiramiento sin fatiga lumbar ni balanceos. En el <strong>tren superior sí se mantiene el sistema híbrido</strong> (calistenia de élite + pesas).
                </div>
              </div>
            )}

            {/* Banner Específico: Tren Superior Híbrido (Calistenia + Sobrecarga Pesada) */}
            {(hybridPrescription.selectedSplit === 'push' || hybridPrescription.selectedSplit === 'pull' || hybridPrescription.selectedSplit === 'full_upper') && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(99, 102, 241, 0.08))',
                border: '1.5px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '22px' }}>⚡</span>
                    <div>
                      <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block' }}>
                        Tren Superior Híbrido: Calistenia de Élite + Sobrecarga Pesada
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--fitia-orange)', fontWeight: 800 }}>
                        🤸‍♂️ Dejan Stipke Synergy · Barras, Lastre & Pesas Libres
                      </span>
                    </div>
                  </div>
                  <span style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: 'var(--fitia-orange)',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '10.5px',
                    fontWeight: 900
                  }}>
                    HÍBRIDO SUPERIOR
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  En tren superior se fusiona la sobrecarga pesada con barras, mancuernas y poleas, junto con el dominio de habilidades calisténicas de alto nivel (Dominadas lastradas, Fondos pesados, Handstand y Front Lever).
                </div>
              </div>
            )}

            {/* 4. MODULAR WORKOUT BLOCKS (DEJAN STIPKE SYSTEM) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {hybridPrescription.blocks.map((block, bIdx) => (
                <div key={bIdx} className="hybrid-block-card">
                  <div className="hybrid-block-header">
                    <div className="hybrid-block-title-wrap">
                      <span style={{ fontSize: '20px' }}>{block.icon || '⚡'}</span>
                      <h3 className="hybrid-block-title">{block.name}</h3>
                    </div>
                    <span className="hybrid-block-badge">
                      {block.exercises?.length || 0} ejercicios
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(block.exercises || []).map((ex, eIdx) => {
                      const exKey = `${bIdx}-${eIdx}-${ex.name}`;
                      const isDone = completedExercises.includes(exKey);
                      const isSubOpen = showSubstitutesFor === exKey;

                      return (
                        <div
                          key={eIdx}
                          className={`hybrid-exercise-card ${isDone ? 'completed' : ''}`}
                        >
                          {/* Row 1: Checkbox + Full Title */}
                          <div className="exercise-card-main-row">
                            <button
                              type="button"
                              className={`exercise-check-circle ${isDone ? 'checked' : ''}`}
                              onClick={() => {
                                if (isDone) {
                                  setCompletedExercises(completedExercises.filter((k) => k !== exKey));
                                } else {
                                  setCompletedExercises([...completedExercises, exKey]);
                                }
                              }}
                              title={isDone ? 'Marcar como pendiente' : 'Marcar como completado'}
                            >
                              {isDone ? '✓' : ''}
                            </button>
                            <div className="exercise-title-wrap">
                              <span className={`exercise-title ${isDone ? 'done' : ''}`}>
                                {ex.name}
                              </span>
                              {ex.equipment && (
                                <span className="exercise-equipment-tag">
                                  {ex.equipment === 'machine' ? '⚙️ Máquina guiada' : ex.equipment === 'calisthenics' ? '🤸‍♂️ Calistenia' : '🏋️ Peso libre'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Row 2: Target / Sets & Reps Pill */}
                          <div className="exercise-meta-row">
                            <span className="exercise-sets-badge">
                              <span style={{ fontSize: '12px' }}>🔥</span>
                              <span>{ex.sets && ex.reps ? `${ex.sets} sets × ${ex.reps}` : ex.target || 'Completar'}</span>
                            </span>
                          </div>

                          {/* Row 3: Biomechanical Note */}
                          {ex.note && (
                            <div className="exercise-note-box">
                              <span className="exercise-note-icon">💡</span>
                              <span className="exercise-note-text">{ex.note}</span>
                            </div>
                          )}

                          {/* Row 4: Quick Actions (Timer & Substitute Toggle) */}
                          <div className="exercise-actions-row">
                            {ex.restSeconds > 0 && (
                              <button
                                type="button"
                                className="exercise-action-pill rest"
                                onClick={() => {
                                  setActiveTimerSeconds(ex.restSeconds);
                                  setTimerRunning(true);
                                }}
                              >
                                <span>⏱️</span>
                                <span>Descanso {ex.restSeconds}s</span>
                              </button>
                            )}

                            {ex.note && (
                              <button
                                type="button"
                                className="exercise-action-pill technique"
                                onClick={() => setDetailReaderModal({
                                  title: ex.name,
                                  subtitle: `${block.name} · ${ex.sets && ex.reps ? `${ex.sets} sets × ${ex.reps}` : ex.target || 'Ejecución controlada'}`,
                                  icon: block.icon || '🏋️‍♂️',
                                  badge: block.name,
                                  badgeBg: 'var(--fitia-green-soft)',
                                  badgeColor: 'var(--fitia-green)',
                                  sections: [
                                    {
                                      heading: 'Prescripción de Series & Descanso',
                                      icon: '🎯',
                                      text: `Realiza ${ex.sets || 1} serie(s) de ${ex.reps || ex.target || 'repeticiones controladas'}${ex.restSeconds > 0 ? ` con ${ex.restSeconds} segundos de descanso.` : '.'}`
                                    },
                                    {
                                      heading: 'Instrucciones de Técnica & Bio-mecánica',
                                      icon: '💡',
                                      text: ex.note
                                    },
                                    ...(ex.substitute ? [{
                                      heading: 'Sustituto Libre en Gimnasio o en Casa',
                                      icon: '🔄',
                                      text: ex.substitute,
                                      tip: 'Ideal para realizar con mancuernas, barras libres o sin máquinas si el gimnasio está lleno.'
                                    }] : [])
                                  ],
                                  actionText: '✓ Entendido / Cerrar Guía'
                                })}
                              >
                                <span>📖</span>
                                <span>Ver Técnica</span>
                              </button>
                            )}

                            {ex.substitute && (
                              <button
                                type="button"
                                className={`exercise-action-pill substitute ${isSubOpen ? 'active' : ''}`}
                                onClick={() => setShowSubstitutesFor(isSubOpen ? null : exKey)}
                              >
                                <span>🔄</span>
                                <span>{isSubOpen ? 'Ocultar Sustituto' : 'Ver Sustituto Libre'}</span>
                              </button>
                            )}
                          </div>

                          {/* Substitute Box */}
                          {isSubOpen && ex.substitute && (
                            <div className="substitute-box">
                              <div style={{ fontWeight: 800, marginBottom: '2px', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>🔄</span>
                                <span>Sustituto Libre si la máquina está ocupada:</span>
                              </div>
                              <div>{ex.substitute}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                ✨ Perfecto para adaptarse a cualquier gimnasio comercial con mancuernas o barras libres.
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 5. CALISTHENICS & PROFILE SKILL TREE */}
            {(() => {
              const profileSkillTree = hybridPrescription.skillTree || {};
              const skillKeys = Object.keys(profileSkillTree);
              const effectiveSkillTab = profileSkillTree[selectedSkillTab]
                ? selectedSkillTab
                : (skillKeys[0] || 'handstand');
              const currentSkill = profileSkillTree[effectiveSkillTab];

              return (
                <div className="skill-tree-container">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 900 }}>
                        {currentProfile.id === 'pareja'
                          ? '🍑 Árbol de Blindaje Lumbar & Glúteos'
                          : currentProfile.id === 'hermana'
                          ? '🌸 Ruta de Vitalidad & Movilidad Amable'
                          : '🤸‍♂️ Árbol de Habilidades de Calistenia'}
                      </h3>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {currentProfile.id === 'pareja'
                          ? 'Activación de glúteos en colchoneta (CERO Hip Thrust), protocolo McGill Big 3 y postura descompresiva'
                          : currentProfile.id === 'hermana'
                          ? 'Pasos gentiles de bienestar, paseos relajantes y hábitos reconfortantes sin fatiga ni sobrecarga'
                          : 'Progresiones nivel por nivel para novatos hasta atletas avanzados'}
                      </p>
                    </div>
                    <span style={{ fontSize: '20px' }}>
                      {currentProfile.id === 'pareja' ? '🛡️' : currentProfile.id === 'hermana' ? '🌿' : '⚡'}
                    </span>
                  </div>

                  {/* Skill Tabs */}
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {skillKeys.map((sKey) => {
                      const skill = profileSkillTree[sKey];
                      const isSel = effectiveSkillTab === sKey;
                      return (
                        <button
                          key={sKey}
                          type="button"
                          className="skill-pill-btn"
                          style={{
                            background: isSel ? 'var(--fitia-green)' : 'var(--bg-card-subtle)',
                            color: isSel ? '#FFFFFF' : 'var(--text-main)',
                            border: '1px solid var(--border-subtle)'
                          }}
                          onClick={() => setSelectedSkillTab(sKey)}
                        >
                          <span>{skill.icon}</span>
                          <span>{skill.name.split(' (')[0]}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Skill Details & Progressive Levels */}
                  {currentSkill && (() => {
                    const activeLvl = activeSkillLevels[effectiveSkillTab] || 1;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{
                          background: 'var(--bg-card-subtle)',
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid var(--border-subtle)'
                        }}>
                          <div style={{ fontSize: '13px', fontWeight: 900 }}>
                            {currentSkill.icon} {currentSkill.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            🎯 Enfoque: {currentSkill.targetMuscle}
                          </div>
                          <div style={{ fontSize: '12px', marginTop: '4px', lineHeight: 1.4 }}>
                            {currentSkill.description}
                          </div>
                        </div>

                        {/* Level Cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {currentSkill.levels.map((lvl) => {
                            const isCurrentLevel = activeLvl === lvl.level;
                            const badgeBg = lvl.difficulty === 'Novato' || lvl.difficulty === 'Amable' ? '#10B981' : lvl.difficulty === 'Intermedio' || lvl.difficulty === 'Vital' ? '#3B82F6' : lvl.difficulty === 'Avanzado' || lvl.difficulty === 'Bienestar Pleno' ? '#8B5CF6' : '#EC4899';

                            return (
                              <div
                                key={lvl.level}
                                className={`skill-level-card ${isCurrentLevel ? 'active-level' : ''}`}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 900 }}>
                                    {lvl.title}
                                  </span>
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: 900,
                                    background: badgeBg,
                                    color: '#FFFFFF',
                                    padding: '2px 8px',
                                    borderRadius: '999px'
                                  }}>
                                    {lvl.difficulty}
                                  </span>
                                </div>

                                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--fitia-orange)' }}>
                                  🎯 Objetivo: {lvl.target} {lvl.restSeconds > 0 ? `· Descanso: ${lvl.restSeconds}s` : ''}
                                </div>

                                <div style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.45, background: 'var(--bg-card)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                  <strong>Clave:</strong> {lvl.cues}
                                </div>

                                {lvl.commonMistake && (
                                  <div style={{ fontSize: '11px', color: '#DC2626', background: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: '8px' }}>
                                    ⚠️ <strong>A tener en cuenta:</strong> {lvl.commonMistake}
                                  </div>
                                )}

                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '8px',
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      background: isCurrentLevel ? 'var(--fitia-green)' : 'var(--bg-card)',
                                      color: isCurrentLevel ? '#FFFFFF' : 'var(--text-muted)',
                                      border: '1px solid var(--border-subtle)',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => setActiveSkillLevels({
                                      ...activeSkillLevels,
                                      [effectiveSkillTab]: lvl.level
                                    })}
                                  >
                                    {isCurrentLevel ? '✓ Mi Nivel Actual' : 'Practicar este Nivel'}
                                  </button>

                                  <button
                                    type="button"
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '8px',
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      background: 'rgba(59, 130, 246, 0.1)',
                                      border: '1px solid rgba(59, 130, 246, 0.25)',
                                      color: '#2563EB',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    onClick={() => setDetailReaderModal({
                                      title: lvl.title,
                                      subtitle: `${currentSkill.name} · ${lvl.difficulty}`,
                                      icon: currentSkill.icon,
                                      badge: lvl.difficulty,
                                      badgeBg: badgeBg,
                                      badgeColor: '#FFFFFF',
                                      sections: [
                                        {
                                          heading: 'Objetivo y Parámetros del Nivel',
                                          icon: '🎯',
                                          text: `${lvl.target} ${lvl.restSeconds > 0 ? `· Descanso sugerido: ${lvl.restSeconds} segundos.` : ''}`
                                        },
                                        {
                                          heading: 'Instrucciones de Técnica y Postura',
                                          icon: '💡',
                                          text: lvl.cues
                                        },
                                        ...(lvl.commonMistake ? [{
                                          heading: 'Errores Comunes y Prevención de Fatiga / Molestia',
                                          icon: '⚠️',
                                          alert: lvl.commonMistake
                                        }] : []),
                                        ...(currentProfile.id === 'hermana' ? [{
                                          heading: 'Enfoque Amable & Adaptativo',
                                          icon: '🌸',
                                          tip: 'Respira con calma por la nariz, realiza los movimientos con total suavidad y disfruta de la reconexión energética sin exigencias extremas.'
                                        }] : [])
                                      ],
                                      actionText: isCurrentLevel ? 'Cerrar Guía' : 'Fijar como Mi Nivel Actual',
                                      onAction: isCurrentLevel ? null : () => setActiveSkillLevels({
                                        ...activeSkillLevels,
                                        [effectiveSkillTab]: lvl.level
                                      })
                                    })}
                                  >
                                    <span>📖</span>
                                    <span>Ver Guía Completa</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* 6. UNIVERSAL DIGITAL REST & SESSION TIMER */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '18px',
              textAlign: 'center',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>
                ⏱️ Cronómetro Digital de Descanso & Sesión
              </div>
              <div style={{ fontSize: '38px', fontWeight: 900, fontFamily: 'monospace', color: timerRunning ? 'var(--fitia-green)' : 'var(--text-main)' }}>
                {activeTimerSeconds ? `${Math.floor(activeTimerSeconds / 60).toString().padStart(2, '0')}:${(activeTimerSeconds % 60).toString().padStart(2, '0')}` : `${hybridPrescription.durationMinutes || 45}:00`}
              </div>

              {/* Preset Buttons */}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', margin: '12px 0 10px' }}>
                {[30, 60, 90, 120].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    style={{
                      background: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border-subtle)',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setActiveTimerSeconds(sec);
                      setTimerRunning(true);
                    }}
                  >
                    +{sec}s
                  </button>
                ))}
              </div>

              {/* Main Controls */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  type="button"
                  style={{
                    background: timerRunning ? '#EF4444' : 'var(--fitia-green)',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (!activeTimerSeconds) setActiveTimerSeconds((hybridPrescription.durationMinutes || 45) * 60);
                    setTimerRunning(!timerRunning);
                  }}
                >
                  {timerRunning ? 'Pausar' : 'Iniciar Reloj'}
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
                    setActiveTimerSeconds(0);
                  }}
                >
                  Reiniciar
                </button>
              </div>
            </div>

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
                  const currentVals = weightLogs.map((l) => Number(l.weight_kg) || currentProfile.weightKg);
                  const min = Math.min(...currentVals) - 0.5;
                  const max = Math.max(...currentVals) + 0.5;
                  const range = max - min || 1;
                  const pct = Math.max(10, Math.min(100, Math.round(((log.weight_kg - min) / range) * 100)));
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
        <div
          className="modal-backdrop food-modal-backdrop"
          onClick={() => setShowTextLogModal(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="modal-sheet food-modal-sheet"
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

      {/* Modal: Menú del Día Peruano (Opciones Rápidas & Armador en 3 toques) */}
      {showPeruvianMenuModal && (
        <div
          className="modal-backdrop food-modal-backdrop"
          onClick={() => setShowPeruvianMenuModal(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="modal-sheet food-modal-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '90dvh', padding: '20px 18px calc(24px + var(--safe-bottom))', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🇵🇪</span>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                    Menú del Día Peruano
                  </h3>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '4px 0 0', lineHeight: 1.35 }}>
                  Porciones estándar de restaurante (Arroz, menestra, camote/papa, ensalada y proteína).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPeruvianMenuModal(false)}
                style={{ fontSize: '20px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* Target Slot Selector & Tabs Switcher */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Registrar en:
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['comida', 'cena'].map((slotKey) => (
                    <button
                      key={slotKey}
                      type="button"
                      style={{
                        padding: '5px 12px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 800,
                        border: targetMealSlot === slotKey ? '1.5px solid var(--fitia-green)' : '1px solid var(--border-subtle)',
                        background: targetMealSlot === slotKey ? 'var(--fitia-green-soft)' : 'var(--bg-card-subtle)',
                        color: targetMealSlot === slotKey ? 'var(--fitia-green)' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setTargetMealSlot(slotKey)}
                    >
                      {slotKey === 'comida' ? 'Almuerzo' : 'Cena'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtabs: Presets vs Builder */}
              <div style={{ display: 'flex', background: 'var(--bg-card-subtle)', borderRadius: '12px', padding: '3px', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '8px 6px',
                    borderRadius: '10px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    border: 'none',
                    background: peruvianMenuTab === 'presets' ? 'var(--bg-card)' : 'transparent',
                    color: peruvianMenuTab === 'presets' ? 'var(--text-main)' : 'var(--text-muted)',
                    boxShadow: peruvianMenuTab === 'presets' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setPeruvianMenuTab('presets')}
                >
                  ⚡ Menús Clásicos (1 Clic)
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '8px 6px',
                    borderRadius: '10px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    border: 'none',
                    background: peruvianMenuTab === 'builder' ? 'var(--bg-card)' : 'transparent',
                    color: peruvianMenuTab === 'builder' ? 'var(--text-main)' : 'var(--text-muted)',
                    boxShadow: peruvianMenuTab === 'builder' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setPeruvianMenuTab('builder')}
                >
                  🎨 Arma tu Menú (3 Toques)
                </button>
              </div>
            </div>

            {/* Content Tab 1: Presets Rápidos */}
            {peruvianMenuTab === 'presets' && (
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '2px' }}>
                {PERUVIAN_MENU_OPTIONS.map((menu) => {
                  const isTodayHighlight = menu.id === 'menu-sopa-papaseca-pollo-lenteja-camote';

                  return (
                    <div
                      key={menu.id}
                      style={{
                        background: isTodayHighlight ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(245, 158, 11, 0.08) 100%)' : 'var(--bg-card)',
                        border: isTodayHighlight ? '1.5px solid var(--fitia-green)' : '1px solid var(--border-subtle)',
                        borderRadius: '16px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: 'var(--card-shadow)',
                        position: 'relative'
                      }}
                    >
                      {isTodayHighlight && (
                        <div style={{
                          alignSelf: 'flex-start',
                          fontSize: '10px',
                          fontWeight: 900,
                          background: 'var(--fitia-green)',
                          color: '#FFFFFF',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.4px'
                        }}>
                          ⭐ Tu Menú de Hoy (Recomendado)
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '28px', flexShrink: 0 }}>{menu.icon || '🍲'}</span>
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.25 }}>
                              {menu.shortName || menu.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {menu.servingDesc}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--fitia-green)' }}>
                            🔥 {menu.calories} kcal
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {menu.protein}g Proteína
                          </div>
                        </div>
                      </div>

                      {menu.breakdown && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-card-subtle)', padding: '6px 10px', borderRadius: '8px', lineHeight: 1.35 }}>
                          🥣 <em>{menu.breakdown}</em>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px dashed var(--border-subtle)' }}>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span><strong>{menu.protein}g</strong> P</span>
                          <span>•</span>
                          <span><strong>{menu.carbs}g</strong> C</span>
                          <span>•</span>
                          <span><strong>{menu.fat}g</strong> G</span>
                        </div>

                        <button
                          type="button"
                          style={{
                            background: isTodayHighlight ? 'var(--fitia-green)' : 'var(--fitia-green-soft)',
                            color: isTodayHighlight ? '#FFFFFF' : 'var(--fitia-green)',
                            border: isTodayHighlight ? 'none' : '1px solid var(--fitia-green)',
                            padding: '6px 14px',
                            borderRadius: '10px',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                          onClick={() => handleQuickLogPeruvianMenu(menu, targetMealSlot)}
                        >
                          + Registrar en {targetMealSlot === 'comida' ? 'Almuerzo' : 'Cena'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Content Tab 2: Custom Menu Builder */}
            {peruvianMenuTab === 'builder' && (() => {
              const currentCustom = calculatePeruvianCustomMenu({
                entradaId: builderEntradaId,
                segundoId: builderSegundoId,
                carboIds: builderCarboIds
              });

              return (
                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '2px' }}>
                  {/* Step 1: Entrada */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-main)', marginBottom: '6px' }}>
                      1. ¿Qué entrada comiste?
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
                      {PERUVIAN_ENTRADAS_DATABASE.map((ent) => {
                        const isSel = builderEntradaId === ent.id;
                        return (
                          <button
                            key={ent.id}
                            type="button"
                            style={{
                              padding: '8px 10px',
                              borderRadius: '12px',
                              border: isSel ? '1.5px solid var(--fitia-green)' : '1px solid var(--border-subtle)',
                              background: isSel ? 'var(--fitia-green-soft)' : 'var(--bg-card-subtle)',
                              color: isSel ? 'var(--fitia-green)' : 'var(--text-main)',
                              fontSize: '11px',
                              fontWeight: isSel ? 900 : 700,
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer'
                            }}
                            onClick={() => setBuilderEntradaId(ent.id)}
                          >
                            <span>{ent.icon}</span>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ent.name}</div>
                              <div style={{ fontSize: '10px', opacity: 0.8 }}>{ent.calories} kcal</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Segundo */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-main)', marginBottom: '6px' }}>
                      2. ¿Qué segundo (proteína) pediste?
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
                      {PERUVIAN_SEGUNDOS_DATABASE.map((seg) => {
                        const isSel = builderSegundoId === seg.id;
                        return (
                          <button
                            key={seg.id}
                            type="button"
                            style={{
                              padding: '8px 10px',
                              borderRadius: '12px',
                              border: isSel ? '1.5px solid var(--fitia-green)' : '1px solid var(--border-subtle)',
                              background: isSel ? 'var(--fitia-green-soft)' : 'var(--bg-card-subtle)',
                              color: isSel ? 'var(--fitia-green)' : 'var(--text-main)',
                              fontSize: '11px',
                              fontWeight: isSel ? 900 : 700,
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer'
                            }}
                            onClick={() => setBuilderSegundoId(seg.id)}
                          >
                            <span>{seg.icon}</span>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seg.name}</div>
                              <div style={{ fontSize: '10px', opacity: 0.8 }}>{seg.calories} kcal · {seg.protein}g P</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3: Guarniciones */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--text-main)' }}>
                        3. ¿Guarniciones / Carbohidratos? (Marca 1 o 2)
                      </span>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                        {builderCarboIds.length} seleccionada(s)
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
                      {PERUVIAN_CARBOS_DATABASE.map((carb) => {
                        const isSel = builderCarboIds.includes(carb.id);
                        return (
                          <button
                            key={carb.id}
                            type="button"
                            style={{
                              padding: '8px 10px',
                              borderRadius: '12px',
                              border: isSel ? '1.5px solid var(--fitia-green)' : '1px solid var(--border-subtle)',
                              background: isSel ? 'var(--fitia-green-soft)' : 'var(--bg-card-subtle)',
                              color: isSel ? 'var(--fitia-green)' : 'var(--text-main)',
                              fontSize: '11px',
                              fontWeight: isSel ? 900 : 700,
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              if (isSel) {
                                if (builderCarboIds.length > 1) {
                                  setBuilderCarboIds(builderCarboIds.filter((cid) => cid !== carb.id));
                                }
                              } else {
                                setBuilderCarboIds((prev) => (prev.length >= 2 ? [prev[1], carb.id] : [...prev, carb.id]));
                              }
                            }}
                          >
                            <span>{carb.icon}</span>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{carb.name}</div>
                              <div style={{ fontSize: '10px', opacity: 0.8 }}>{carb.calories} kcal · {carb.carbs}g C</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div style={{
                    marginTop: 'auto',
                    background: 'var(--bg-card)',
                    border: '1.5px solid var(--fitia-green)',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.12)'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--fitia-green)', textTransform: 'uppercase' }}>
                      ✨ Resumen de tu Menú Armado:
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-main)', margin: '3px 0' }}>
                      {currentCustom.name}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      <span>🔥 <strong>{currentCustom.calories}</strong> kcal</span>
                      <span>•</span>
                      <span>💪 <strong>{currentCustom.protein}g</strong> P</span>
                      <span>•</span>
                      <span>🍚 <strong>{currentCustom.carbs}g</strong> C</span>
                      <span>•</span>
                      <span>🥑 <strong>{currentCustom.fat}g</strong> G</span>
                    </div>

                    <button
                      type="button"
                      className="btn-primary"
                      style={{ width: '100%', padding: '12px', fontSize: '13px' }}
                      onClick={() => handleConfirmCustomMenuBuild(targetMealSlot)}
                    >
                      + Registrar Menú Completo en {targetMealSlot === 'comida' ? 'Almuerzo' : 'Cena'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal: Buscador de Alimentos (+2 Millones de Alimentos - Base Global & Perú) */}
      {showFoodSearchModal && (
        <div
          className="modal-backdrop food-modal-backdrop"
          onClick={() => setShowFoodSearchModal(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div className="modal-sheet food-modal-sheet" onClick={(e) => e.stopPropagation()}>
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
                  { key: 'menu_peruano', label: '🇵🇪 Menús del Día' },
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
                  } else if (nameLower.includes('jugo') || nameLower.includes('verde') || nameLower.includes('emoliente')) {
                    portionButtons = [
                      { label: '1 vaso (250ml)', g: 250 },
                      { label: '1 vaso grande (300ml)', g: 300 },
                      { label: '2 vasos (500ml)', g: 500 }
                    ];
                  } else if (nameLower.includes('humita')) {
                    portionButtons = [
                      { label: '1 humita (120g)', g: 120 },
                      { label: '1.5 humitas (180g)', g: 180 },
                      { label: '2 humitas (240g)', g: 240 }
                    ];
                  } else if (nameLower.includes('tamal')) {
                    portionButtons = [
                      { label: '1/2 tamal (80g)', g: 80 },
                      { label: '1 tamal (160g)', g: 160 },
                      { label: '1 tamalito (120g)', g: 120 },
                      { label: '2 tamales (320g)', g: 320 }
                    ];
                  } else if (nameLower.includes('huanca')) {
                    portionButtons = [
                      { label: 'Porción personal (150g)', g: 150 },
                      { label: 'Porción clásica (220g)', g: 220 },
                      { label: 'Porción generosa (300g)', g: 300 }
                    ];
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)' }}>⚖️ Cantidad:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            value={customGrams}
                            onChange={(e) => setCustomGrams(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            style={{
                              width: '56px',
                              padding: '4px 6px',
                              fontSize: '13px',
                              fontWeight: 800,
                              textAlign: 'center',
                              borderRadius: '8px',
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--bg-card-subtle)',
                              color: 'var(--text-main)'
                            }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 800 }}>g</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', width: '100%' }}>
                        {portionButtons.map((btn) => (
                          <button
                            key={btn.g}
                            type="button"
                            style={{
                              padding: '5px 9px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 800,
                              border: customGrams === btn.g ? '1.5px solid var(--fitia-green)' : '1px solid var(--border-subtle)',
                              background: customGrams === btn.g ? 'var(--fitia-green-soft)' : 'var(--bg-card-subtle)',
                              color: customGrams === btn.g ? 'var(--fitia-green)' : 'var(--text-muted)',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                            onClick={() => setCustomGrams(btn.g)}
                          >
                            {btn.label}
                          </button>
                        ))}
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
        <div
          className="modal-backdrop centered"
          onClick={() => setShowWeightModal(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="modal-sheet centered"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '340px', padding: '24px' }}
          >
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

      {/* Modal: Lista de Compras Compartida (Andrés & Pareja) */}
      {showCoupleGroceryModal && (
        <div
          className="modal-backdrop grocery-modal-backdrop"
          onClick={() => setShowCoupleGroceryModal(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div className="modal-sheet grocery-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '26px' }}>🛒</span>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-main)' }}>
                    Lista de Compras Compartida
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {familyProfiles.andres?.name || 'Andrés'} ({familyProfiles.andres?.weightKg || 92}kg) & {partnerName} ({familyProfiles.pareja?.weightKg || 58}kg) · Semana / Viaje Cajabamba
                  </div>
                </div>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}
                onClick={() => setShowCoupleGroceryModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Banner de Sincronización y Batch Cooking */}
            <div style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(59,130,246,0.1))', padding: '12px 14px', borderRadius: '16px', border: '1px solid rgba(236,72,153,0.25)', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '3px' }}>
                👫 ¿Por qué compran lo mismo {familyProfiles.andres?.name || 'Andrés'} y {partnerName}?
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Ahorran tiempo cocinando en <strong>1 sola sartén u olla</strong>. La diferencia no está en comprar comida separada, sino en <strong>la porción al servir</strong>: {familyProfiles.andres?.name || 'Andrés'} recibe el 60% (~125%) y {partnerName} el 40% (~85%).
              </div>
            </div>

            {/* List of Categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {coupleGroceryList.map((cat, idx) => (
                <div key={idx} className="grocery-category-block">
                  <div className="grocery-cat-header">
                    <span>{cat.icon}</span>
                    <span>{cat.category}</span>
                  </div>
                  <div>
                    {cat.items.map((item) => {
                      const isChecked = checkedGroceryItems[item.id];
                      return (
                        <div
                          key={item.id}
                          className={`grocery-item-row ${isChecked ? 'checked' : ''}`}
                          onClick={() => handleToggleGroceryItem(item.id)}
                        >
                          <div className="grocery-item-check">
                            {isChecked ? '✓' : ''}
                          </div>
                          <div className="grocery-item-info">
                            <div className="grocery-item-name">{item.name}</div>
                            <div className="grocery-item-qty">{item.qty}</div>
                            <div className="grocery-item-purpose">{item.purpose}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  background: 'var(--fitia-green)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '14px',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
                }}
                onClick={handleCopyGroceryList}
              >
                <span>📋</span>
                <span>Copiar para WhatsApp</span>
              </button>
              <button
                type="button"
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
                onClick={() => setShowCoupleGroceryModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear Nuevo Hábito Personalizado */}
      {showAddHabitModal && (
        <div
          className="modal-backdrop grocery-modal-backdrop"
          onClick={() => setShowAddHabitModal(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div className="modal-sheet grocery-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>✨</span>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-main)' }}>
                    Nuevo Hábito Personalizado
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Para {currentProfile.name} · Se integrará a tu AuraScore diario
                  </div>
                </div>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}
                onClick={() => setShowAddHabitModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Quick Templates (1-click inspiration) */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block', marginBottom: '8px' }}>
                💡 Ideas Rápidas (Toca para autocompletar):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  { name: '10 min Sol Matutino', target: '10 min al despertar', icon: '☀️', category: 'biohacking', note: 'Sincroniza ritmo circadiano y producción de melatonina' },
                  { name: 'Caminata Post-Comida', target: '15 min suave', icon: '🚶‍♂️', category: 'nutricion', note: 'Activa GLUT-4 y reduce picos de insulina' },
                  { name: 'Estiramiento Psoas & Lumbar', target: '10 min diarios', icon: '🧘‍♀️', category: 'recuperacion', note: 'Descompresión espinal y alivio lumbar' },
                  { name: 'Lectura sin Pantallas', target: '15 min antes de dormir', icon: '📖', category: 'salud_mental', note: 'Calma el sistema nervioso para sueño profundo' },
                  { name: 'Infusión Digestiva Caliente', target: '1 taza post-cena', icon: '🍵', category: 'bienestar', note: 'Previene reflujo y digestión pesada' },
                  { name: 'Ducha Fría de 2 Minutos', target: '2 min al finalizar', icon: '❄️', category: 'biohacking', note: 'Termogénesis activa y resiliencia mental' }
                ].map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    className="quick-template-chip"
                    onClick={() => setNewHabitForm({
                      name: tpl.name,
                      target: tpl.target,
                      icon: tpl.icon,
                      category: tpl.category,
                      note: tpl.note
                    })}
                  >
                    <span>{tpl.icon}</span>
                    <span>{tpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newHabitForm.name.trim()) {
                  alert('Por favor ingresa un nombre para tu hábito.');
                  return;
                }
                handleAddCustomHabit(newHabitForm);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {/* Name input */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  Nombre del Hábito *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Meditación Vipassana, Tomar té matcha..."
                  value={newHabitForm.name}
                  onChange={(e) => setNewHabitForm((prev) => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                  autoFocus
                />
              </div>

              {/* Icon selector & Target */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Emoji / Icono
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      maxLength={3}
                      value={newHabitForm.icon}
                      onChange={(e) => setNewHabitForm((prev) => ({ ...prev, icon: e.target.value }))}
                      style={{
                        width: '54px',
                        textAlign: 'center',
                        fontSize: '22px',
                        background: 'var(--bg-card-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        padding: '8px'
                      }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '80px' }}>
                      {['☀️', '🧘', '📖', '🍵', '💧', '🚶‍♂️', '❄️', '🧠'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          style={{
                            background: newHabitForm.icon === em ? 'var(--fitia-blue-soft)' : 'var(--bg-card-subtle)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            padding: '2px 4px'
                          }}
                          onClick={() => setNewHabitForm((prev) => ({ ...prev, icon: em }))}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Meta / Frecuencia
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 15 min diarios, 1 taza..."
                    value={newHabitForm.target}
                    onChange={(e) => setNewHabitForm((prev) => ({ ...prev, target: e.target.value }))}
                    style={{
                      width: '100%',
                      background: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      fontWeight: 700
                    }}
                  />
                </div>
              </div>

              {/* Note / Purpose */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  Nota o Beneficio Fisiológico (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Reduce cortisol matutino y activa el foco mental"
                  value={newHabitForm.note}
                  onChange={(e) => setNewHabitForm((prev) => ({ ...prev, note: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    padding: '12px',
                    borderRadius: '14px',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowAddHabitModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1.5,
                    background: 'var(--fitia-green)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '14px',
                    fontWeight: 900,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  ✨ Guardar Hábito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Hábito */}
      {editingHabit && (
        <div
          className="modal-backdrop grocery-modal-backdrop"
          onClick={() => setEditingHabit(null)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div className="modal-sheet grocery-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>{editingHabit.icon || '✏️'}</span>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-main)' }}>
                    Editar Hábito
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Personaliza este hábito para la rutina de {currentProfile.name}
                  </div>
                </div>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}
                onClick={() => setEditingHabit(null)}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingHabit.name || !editingHabit.name.trim()) {
                  alert('Por favor ingresa un nombre para tu hábito.');
                  return;
                }
                handleUpdateHabit(editingHabit);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {/* Name input */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  Nombre del Hábito *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Tomar creatina, Respiración..."
                  value={editingHabit.name}
                  onChange={(e) => setEditingHabit((prev) => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    fontWeight: 700
                  }}
                  autoFocus
                />
              </div>

              {/* Icon selector & Target */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Emoji / Icono
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      maxLength={3}
                      value={editingHabit.icon}
                      onChange={(e) => setEditingHabit((prev) => ({ ...prev, icon: e.target.value }))}
                      style={{
                        width: '54px',
                        textAlign: 'center',
                        fontSize: '22px',
                        background: 'var(--bg-card-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        padding: '8px'
                      }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '80px' }}>
                      {['☀️', '🧘', '📖', '🍵', '💧', '🚶‍♂️', '❄️', '🧠', '🫁', '⚡', '💊'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          style={{
                            background: editingHabit.icon === em ? 'var(--fitia-blue-soft)' : 'var(--bg-card-subtle)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            padding: '2px 4px'
                          }}
                          onClick={() => setEditingHabit((prev) => ({ ...prev, icon: em }))}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Meta / Frecuencia
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 15 min diarios, 5g con agua..."
                    value={editingHabit.target}
                    onChange={(e) => setEditingHabit((prev) => ({ ...prev, target: e.target.value }))}
                    style={{
                      width: '100%',
                      background: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      fontWeight: 700
                    }}
                  />
                </div>
              </div>

              {/* Note / Purpose */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  Nota o Beneficio Fisiológico (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Mejora la absorción y potencia el rendimiento cognitivo"
                  value={editingHabit.note}
                  onChange={(e) => setEditingHabit((prev) => ({ ...prev, note: e.target.value }))}
                  style={{
                    width: '100%',
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    padding: '12px',
                    borderRadius: '14px',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setEditingHabit(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1.5,
                    background: 'var(--fitia-blue)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '14px',
                    fontWeight: 900,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  ✓ Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Damage Control Modal */}
      {showDamageControl && (
        <div
          className="modal-backdrop"
          onClick={() => setShowDamageControl(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="modal-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '24px 20px calc(24px + var(--safe-bottom))' }}
          >
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
        <div
          className="modal-backdrop"
          onClick={() => setShowProfileModal(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="modal-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '24px 20px calc(24px + var(--safe-bottom))' }}
          >
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
            <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-card-subtle)', padding: '4px', borderRadius: '14px', marginBottom: '16px', overflowX: 'auto' }}>
              {Object.values(familyProfiles).map((prof) => (
                <button
                  key={prof.id}
                  type="button"
                  style={{
                    flex: '1 0 auto',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: editingProfile.id === prof.id ? 'var(--bg-card)' : 'transparent',
                    color: editingProfile.id === prof.id ? 'var(--fitia-green)' : 'var(--text-muted)',
                    fontWeight: 800,
                    fontSize: '11px',
                    cursor: 'pointer',
                    boxShadow: editingProfile.id === prof.id ? 'var(--card-shadow)' : 'none',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => setEditingProfile({ ...prof })}
                >
                  {prof.avatar} {prof.name.split(' ')[0]}
                </button>
              ))}
              <button
                type="button"
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px dashed var(--fitia-green)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  color: 'var(--fitia-green)',
                  fontWeight: 800,
                  fontSize: '11px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => {
                  setShowProfileModal(false);
                  setShowAddMemberModal(true);
                }}
              >
                ➕ Nuevo
              </button>
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

              {/* Couple Kitchen Mode Configuration */}
              <div style={{
                background: 'var(--bg-card-subtle)',
                border: '1.5px solid rgba(236, 72, 153, 0.35)',
                borderRadius: '14px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px' }}>👫</span>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 900, color: 'var(--text-main)' }}>
                        Modo Cocina en Pareja
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                        1 Sartén, 2 Porciones ({familyProfiles.andres?.name || 'Andrés'} 60% / {partnerName} 40%) en recetas y compras
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleCoupleMode}
                    style={{
                      background: coupleModeEnabled ? '#EC4899' : 'var(--bg-card)',
                      color: coupleModeEnabled ? '#FFFFFF' : 'var(--text-muted)',
                      border: '1px solid ' + (coupleModeEnabled ? '#EC4899' : 'var(--border-subtle)'),
                      borderRadius: '20px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: coupleModeEnabled ? '0 2px 8px rgba(236,72,153,0.3)' : 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {coupleModeEnabled ? 'Activado ✓' : 'Desactivado'}
                  </button>
                </div>

                {/* Enlace explícito de Pareja de Andrés */}
                <div style={{ background: 'rgba(236,72,153,0.06)', borderRadius: '10px', padding: '10px', border: '1px dashed rgba(236,72,153,0.3)' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#EC4899', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    💍 Nombre de la Pareja enlazada a Andrés:
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={familyProfiles.pareja?.name || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFamilyProfiles((prev) => {
                          const updated = {
                            ...prev,
                            pareja: { ...prev.pareja, name: val }
                          };
                          try {
                            localStorage.setItem('aurafit_family_profiles', JSON.stringify(updated));
                            queueCloudSync('aurafit_family_profiles', updated, activeProfileId);
                          } catch (err) {}
                          return updated;
                        });
                        if (editingProfile && editingProfile.id === 'pareja') {
                          setEditingProfile((prev) => ({ ...prev, name: val }));
                        }
                      }}
                      placeholder="Ej. Tania"
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        fontWeight: 700,
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Enlaza a Andrés y su pareja para que las porciones y la lista de compras se sincronicen con este nombre, aunque agregues más familiares.
                  </span>
                </div>
              </div>

              {/* Cloud Synchronization & Multi-Device Settings */}
              <div style={{
                background: 'var(--bg-card-subtle)',
                border: '1.5px solid rgba(59, 130, 246, 0.35)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>☁️</span>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 900, color: 'var(--text-main)' }}>
                        Sincronización en la Nube Multidispositivo
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Neon PostgreSQL · Comparte perfiles y despensa entre celulares
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '8px',
                    background: cloudStatus === 'synced' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: cloudStatus === 'synced' ? 'var(--fitia-green)' : 'var(--fitia-orange)',
                    border: '1px solid ' + (cloudStatus === 'synced' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)')
                  }}>
                    {cloudStatus === 'synced' ? 'En Línea ✓' : isSyncing ? 'Sincronizando...' : 'Modo Local'}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                  Todos los celulares de la familia (Andrés, Pareja y Anicka) comparten automáticamente los perfiles, despensa y registros en tiempo real.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    style={{
                      background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{isSyncing ? '🔄' : '☁️'}</span>
                    <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Datos'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleForceUpdateApp}
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '10px 8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>🚀</span>
                    <span>Forzar Actualizar App</span>
                  </button>
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

              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: 'var(--fitia-green)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '12px 10px',
                    borderRadius: '12px',
                    fontWeight: 900,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
                  }}
                  onClick={() => {
                    handleSaveProfileChanges(editingProfile);
                  }}
                >
                  💾 Guardar Cambios
                </button>
                {editingProfile.id !== activeProfileId && (
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      background: 'var(--bg-card-subtle)',
                      border: '1.5px solid var(--fitia-green)',
                      color: 'var(--fitia-green)',
                      padding: '12px 8px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                    onClick={() => {
                      handleSaveProfileChanges(editingProfile);
                      handleSwitchProfile(editingProfile.id);
                    }}
                  >
                    🔄 Guardar y Activar
                  </button>
                )}
                <button
                  type="button"
                  style={{
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowProfileModal(false)}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: AGREGAR NUEVO FAMILIAR / ENLAZAR PERSONA
          =================================================================== */}
      {showAddMemberModal && (
        <div
          className="modal-backdrop centered"
          onClick={() => setShowAddMemberModal(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="modal-sheet centered"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', padding: '24px 20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                  ➕ Agregar Familiar
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--fitia-green)', fontWeight: 700 }}>
                  Nueva persona para nutrición y bienestar
                </span>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}
                onClick={() => setShowAddMemberModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFamilyMember} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Nombre Completo o Apodo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Tania, Mamá, Papá..."
                  value={newMemberForm.name}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-subtle)', color: 'var(--text-main)', fontWeight: 700, fontSize: '14px', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Avatar (Icono)
                  </label>
                  <select
                    value={newMemberForm.avatar}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, avatar: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-subtle)', color: 'var(--text-main)', fontWeight: 700, fontSize: '14px', marginTop: '4px' }}
                  >
                    <option value="🌸">🌸 Flor (Femenino)</option>
                    <option value="🦁">🦁 León (Fuerza)</option>
                    <option value="🌿">🌿 Hoja (Vitalidad)</option>
                    <option value="✨">✨ Estrella</option>
                    <option value="🧘‍♀️">🧘‍♀️ Zen</option>
                    <option value="👑">👑 Corona</option>
                    <option value="👤">👤 Persona</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    PIN de Privacidad
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={newMemberForm.pin}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="1234"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-subtle)', color: 'var(--text-main)', fontWeight: 800, fontSize: '14px', letterSpacing: '2px', textAlign: 'center', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Meta / Enfoque
                </label>
                <select
                  value={newMemberForm.goal}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, goal: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-subtle)', color: 'var(--text-main)', fontWeight: 700, fontSize: '13px', marginTop: '4px' }}
                >
                  <option value="recomposition">Recomposición Corporal</option>
                  <option value="lean_bulk">Hipertrofia Limpia / Ganancia Muscular</option>
                  <option value="insulin_sensitivity">Sensibilidad a la Insulina & Vitalidad Amable</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Peso Aproximado (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newMemberForm.weightKg}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, weightKg: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card-subtle)', color: 'var(--text-main)', fontWeight: 800, fontSize: '14px', marginTop: '4px' }}
                />
              </div>

              {/* Opción para enlazar como Pareja de Andrés */}
              <div style={{ background: 'rgba(236, 72, 153, 0.08)', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="chkIsPartner"
                  checked={newMemberForm.isPartnerOfAndres}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, isPartnerOfAndres: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#EC4899', cursor: 'pointer' }}
                />
                <label htmlFor="chkIsPartner" style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer', lineHeight: 1.3 }}>
                  💍 <strong>Enlazar como la Pareja de Andrés</strong> (para cocina 1 sartén 60/40 y compras compartidas)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  style={{ flex: 1, background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '12px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => setShowAddMemberModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ flex: 2, background: 'var(--fitia-green)', color: '#FFFFFF', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '13px' }}
                >
                  Guardar Familiar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: ASISTENTE INTERACTIVO DE RESPIRACIÓN WIM HOF
          =================================================================== */}
      {showWimHofModal && (
        <div
          className="modal-backdrop centered"
          style={{ zIndex: 120 }}
          onClick={() => {
            setShowWimHofModal(false);
            setWimHofPhase('breathing');
            setWimHofBreathCount(0);
            setWimHofHoldSeconds(0);
          }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="modal-sheet centered"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '380px', padding: '26px 22px', textAlign: 'center', position: 'relative' }}
          >
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
        <div
          className="pin-lock-overlay modal-backdrop centered"
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div className="pin-lock-card modal-sheet centered">
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
        <div
          className="modal-backdrop"
          onClick={() => setSelectedRecipeDetail(null)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="modal-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '24px 20px calc(24px + var(--safe-bottom))' }}
          >
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
                      <span>⚖️ Porción: <strong>{Math.round(mult * 100)}% ({Math.round(350 * mult)}g)</strong></span>
                      {mult !== 1.0 && <span className="portion-scaler-tag">x{mult}</span>}
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
        <div
          className="modal-backdrop centered"
          onClick={() => setShowAdminPinModal(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="modal-sheet centered"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', padding: '24px 20px' }}
          >
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

      {/* ===================================================================
          MODAL DE NOTIFICACIONES Y RECORDATORIOS (CREATINA Y AGUA)
          =================================================================== */}
      {showNotificationModal && (
        <div
          className="modal-backdrop centered"
          style={{ zIndex: 10000 }}
          onClick={() => setShowNotificationModal(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="modal-sheet centered"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '430px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔔</span> Recordatorios Inteligentes
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Alertas al instante para Creatina y Agua en tu celular
                </p>
              </div>
              <button
                type="button"
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
                onClick={() => setShowNotificationModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Permission Status Box */}
            <div
              style={{
                background: notificationPermission === 'granted' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.12)',
                border: `1px solid ${notificationPermission === 'granted' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.35)'}`,
                borderRadius: '16px',
                padding: '14px 16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>
                    {notificationPermission === 'granted' ? '✅' : '🔔'}
                  </span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {notificationPermission === 'granted'
                        ? 'Notificaciones Autorizadas'
                        : 'Permiso de Notificación'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {notificationPermission === 'granted'
                        ? 'Tu celular recibirá alertas sonoras y visuales.'
                        : 'Habilita alertas para recibir avisos sin abrir la app.'}
                    </div>
                  </div>
                </div>
                {notificationPermission !== 'granted' && (
                  <button
                    type="button"
                    style={{
                      background: 'var(--fitia-blue)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
                    }}
                    onClick={handleRequestNotificationPermission}
                  >
                    Activar
                  </button>
                )}
              </div>

              {notificationPermission === 'granted' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Recordatorios automáticos
                  </span>
                  <button
                    type="button"
                    style={{
                      background: notificationConfig.enabled ? 'var(--fitia-green)' : 'var(--bg-card-subtle)',
                      color: notificationConfig.enabled ? '#FFFFFF' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '999px',
                      padding: '4px 12px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    onClick={handleToggleNotificationEnabled}
                  >
                    {notificationConfig.enabled ? 'Activados' : 'Pausados'}
                  </button>
                </div>
              )}
            </div>

            {/* 1. CREATINA SECTION */}
            <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>⚡</span>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>Creatina Monohidratada (5g)</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Te avisa a la hora fijada si no has marcado el hábito</span>
                  </div>
                </div>
                <button
                  type="button"
                  style={{
                    background: notificationConfig.creatineReminderEnabled ? '#F59E0B' : 'var(--bg-card)',
                    color: notificationConfig.creatineReminderEnabled ? '#FFFFFF' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    const newCfg = { ...notificationConfig, creatineReminderEnabled: !notificationConfig.creatineReminderEnabled };
                    setNotificationConfig(newCfg);
                    localStorage.setItem('aurafit_notifications_config', JSON.stringify(newCfg));
                    showToast(newCfg.creatineReminderEnabled ? '⚡ Recordatorio de Creatina activado.' : '⚡ Recordatorio de Creatina pausado.');
                  }}
                >
                  {notificationConfig.creatineReminderEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block', marginBottom: '8px' }}>
                  Hora programada
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {['08:00', '10:00', '12:00', '16:00', '19:00', '21:00'].map((time) => {
                    const isSel = notificationConfig.creatineReminderTime === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        className={`notif-chip-btn ${isSel ? 'active creatine' : ''}`}
                        onClick={() => handleSetCreatineTime(time)}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#D97706',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '12px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                onClick={handleTestCreatineNotification}
              >
                <span>⚡</span> Probar Notificación de Creatina
              </button>
            </div>

            {/* 2. AGUA / HIDRATACIÓN SECTION */}
            <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>💧</span>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block' }}>Recordatorio de Agua</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Alertas periódicas para mantener tu rendimiento</span>
                  </div>
                </div>
                <button
                  type="button"
                  style={{
                    background: notificationConfig.waterReminderEnabled ? 'var(--fitia-blue)' : 'var(--bg-card)',
                    color: notificationConfig.waterReminderEnabled ? '#FFFFFF' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    const newCfg = { ...notificationConfig, waterReminderEnabled: !notificationConfig.waterReminderEnabled };
                    setNotificationConfig(newCfg);
                    localStorage.setItem('aurafit_notifications_config', JSON.stringify(newCfg));
                    showToast(newCfg.waterReminderEnabled ? '💧 Recordatorio de Agua activado.' : '💧 Recordatorio de Agua pausado.');
                  }}
                >
                  {notificationConfig.waterReminderEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block', marginBottom: '8px' }}>
                  Intervalo de alerta
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {[
                    { label: 'Cada 45 min', val: 45 },
                    { label: 'Cada 60 min (Recom.)', val: 60 },
                    { label: 'Cada 90 min', val: 90 },
                    { label: 'Cada 2 horas', val: 120 }
                  ].map((item) => {
                    const isSel = notificationConfig.waterIntervalMinutes === item.val;
                    return (
                      <button
                        key={item.val}
                        type="button"
                        className={`notif-chip-btn ${isSel ? 'active' : ''}`}
                        onClick={() => handleSetWaterInterval(item.val)}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--fitia-blue)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '12px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                onClick={handleTestWaterNotification}
              >
                <span>💧</span> Probar Notificación de Agua
              </button>
            </div>

            {/* 3. TELEGRAM BOT NOTICE */}
            <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>✈️</span>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                <strong style={{ color: 'var(--text-main)' }}>Canal Telegram Bridge:</strong> Recibe alertas en tu Telegram conectando con <span style={{ color: 'var(--fitia-blue)', fontWeight: 700 }}>@mi_antigravity_pc_bot</span>.
              </div>
            </div>

            {/* Footer Actions */}
            <button
              type="button"
              style={{
                background: 'var(--fitia-green)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '14px',
                padding: '14px',
                fontSize: '14px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                transition: 'transform 0.15s ease'
              }}
              onClick={() => setShowNotificationModal(false)}
            >
              ✓ Guardar y Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL DE CONFIGURACIÓN DEL CICLO MENSTRUAL & ADAPTACIÓN HORMONAL
          =================================================================== */}
      {showCycleConfigModal && (
        <div
          className="cycle-modal-overlay"
          onClick={() => setShowCycleConfigModal(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="cycle-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#EC4899', letterSpacing: '0.5px' }}>
                  🌸 Calendario & Hormonas
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '2px 0 0 0' }}>
                  Ajustes de Ciclo ({currentProfile.name})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCycleConfigModal(false)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '16px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Enable / Disable Toggle */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block' }}>
                  Seguimiento Activo
                </strong>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Mostrar fases hormonales en calendario y rutinas
                </span>
              </div>
              <input
                type="checkbox"
                checked={cycleForm.enabled}
                onChange={(e) => setCycleForm({ ...cycleForm, enabled: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#EC4899', cursor: 'pointer' }}
              />
            </div>

            {/* Form Fields */}
            <div className="cycle-form-group">
              <label className="cycle-form-label">
                🩸 Fecha de inicio del último periodo:
              </label>
              <input
                type="date"
                className="cycle-form-input"
                value={cycleForm.lastPeriodStartDate || ''}
                onChange={(e) => setCycleForm({ ...cycleForm, lastPeriodStartDate: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setCycleForm({ ...cycleForm, lastPeriodStartDate: getLocalDateKey() })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EC4899',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: '2px 0'
                }}
              >
                + Marcar Hoy como fecha de inicio
              </button>
            </div>

            {/* Cycle Length Stepper */}
            <div className="cycle-form-group">
              <label className="cycle-form-label">
                🔄 Duración promedio de tu ciclo completo:
              </label>
              <div className="cycle-stepper-row">
                <button
                  type="button"
                  className="cycle-stepper-btn"
                  onClick={() => setCycleForm({ ...cycleForm, cycleLengthDays: Math.max(20, (Number(cycleForm.cycleLengthDays) || 28) - 1) })}
                >
                  -
                </button>
                <div className="cycle-stepper-val">
                  {cycleForm.cycleLengthDays} días
                </div>
                <button
                  type="button"
                  className="cycle-stepper-btn"
                  onClick={() => setCycleForm({ ...cycleForm, cycleLengthDays: Math.min(45, (Number(cycleForm.cycleLengthDays) || 28) + 1) })}
                >
                  +
                </button>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  (Normal: 24 a 35 días)
                </span>
              </div>
            </div>

            {/* Period Duration Stepper */}
            <div className="cycle-form-group">
              <label className="cycle-form-label">
                🩸 Días de sangrado / menstruación:
              </label>
              <div className="cycle-stepper-row">
                <button
                  type="button"
                  className="cycle-stepper-btn"
                  onClick={() => setCycleForm({ ...cycleForm, periodDurationDays: Math.max(2, (Number(cycleForm.periodDurationDays) || 5) - 1) })}
                >
                  -
                </button>
                <div className="cycle-stepper-val">
                  {cycleForm.periodDurationDays} días
                </div>
                <button
                  type="button"
                  className="cycle-stepper-btn"
                  onClick={() => setCycleForm({ ...cycleForm, periodDurationDays: Math.min(10, (Number(cycleForm.periodDurationDays) || 5) + 1) })}
                >
                  +
                </button>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  (Normal: 3 a 7 días)
                </span>
              </div>
            </div>

            {/* Informative Tip */}
            <div style={{
              background: 'rgba(236, 72, 153, 0.08)',
              border: '1px solid rgba(236, 72, 153, 0.25)',
              borderRadius: '14px',
              padding: '10px 12px',
              fontSize: '11.5px',
              color: 'var(--text-main)',
              lineHeight: 1.45
            }}>
              💡 <strong>Inteligencia Hormonal:</strong> AuraFit calculará automáticamente tus fases (Menstrual, Folicular, Ovulación, Lútea y Premenstrual) sugiriéndote la carga ideal y cuidando tu bienestar.
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowCycleConfigModal(false)}
                style={{
                  flex: 1,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  borderRadius: '14px',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCycleConfig}
                style={{
                  flex: 2,
                  background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '14px',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)'
                }}
              >
                ✓ Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL DE LECTURA DETALLADA (READER MODAL: TÉCNICA, GUÍAS, RECETAS)
          =================================================================== */}
      {detailReaderModal && (
        <div
          className="modal-backdrop reader-modal-backdrop"
          onClick={() => setDetailReaderModal(null)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div
            className="modal-sheet reader-modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="reader-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {detailReaderModal.icon && (
                  <div className="reader-modal-icon-wrap">
                    {detailReaderModal.icon}
                  </div>
                )}
                <div>
                  {detailReaderModal.badge && (
                    <span
                      className="reader-modal-badge"
                      style={{
                        background: detailReaderModal.badgeBg || 'var(--fitia-green-soft)',
                        color: detailReaderModal.badgeColor || 'var(--fitia-green)'
                      }}
                    >
                      {detailReaderModal.badge}
                    </span>
                  )}
                  <h3 className="reader-modal-title">{detailReaderModal.title}</h3>
                  {detailReaderModal.subtitle && (
                    <p className="reader-modal-subtitle">{detailReaderModal.subtitle}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
                onClick={() => setDetailReaderModal(null)}
              >
                ✕
              </button>
            </div>

            {/* Content Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(detailReaderModal.sections || []).map((sec, idx) => (
                <div key={idx} className="reader-section-card">
                  {sec.heading && (
                    <div className="reader-section-heading">
                      {sec.icon && <span>{sec.icon}</span>}
                      <span>{sec.heading}</span>
                    </div>
                  )}
                  {sec.text && (
                    <div className="reader-section-body">
                      {sec.text}
                    </div>
                  )}
                  {sec.steps && sec.steps.length > 0 && (
                    <div className="reader-step-list">
                      {sec.steps.map((st, sIdx) => (
                        <div key={sIdx} className="reader-step-item">
                          <span className="reader-step-number">{sIdx + 1}</span>
                          <span className="reader-step-content">{st}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {sec.alert && (
                    <div className="reader-alert-box">
                      <strong>⚠️ A tener en cuenta:</strong> {sec.alert}
                    </div>
                  )}
                  {sec.tip && (
                    <div className="reader-tip-box">
                      <strong>💡 Consejo práctico:</strong> {sec.tip}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action / Dismiss Button */}
            <div style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '13.5px' }}
                onClick={() => {
                  if (detailReaderModal.onAction) {
                    detailReaderModal.onAction();
                  }
                  setDetailReaderModal(null);
                }}
              >
                {detailReaderModal.actionText || '✓ Entendido / Cerrar Guía'}
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
