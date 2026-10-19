'use client';

import { useState, useEffect, useMemo } from 'react';
import BottomNav from './BottomNav';
import {
  DEFAULT_HABITS,
  DEFAULT_USER_PROFILE,
  calculateLeanBulkTargets,
  generateMealsFromPantry,
  DAMAGE_CONTROL_PROTOCOL,
  WORKOUT_ROUTINES,
  calculateWeightAnalytics
} from '@/lib/fitness-data';
import {
  CURATED_PERUVIAN_FOODS,
  parseNaturalLanguageFood,
  calculateCompensatoryRebalance
} from '@/lib/food-database';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('nutrition'); // Fitia default
  const [isDarkMode, setIsDarkMode] = useState(false); // Fitia Signature Light Mode as default
  const [selectedDay, setSelectedDay] = useState(12); // Wednesday (M)
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [waterMl, setWaterMl] = useState(2250);
  const [streakDays, setStreakDays] = useState(213);
  const [showDamageControl, setShowDamageControl] = useState(false);
  const [showTextLogModal, setShowTextLogModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Daily Logged Foods State
  const [loggedFoods, setLoggedFoods] = useState([
    {
      id: 'init-des-1',
      name: 'Huevos revueltos con pan tostado integral',
      brand: 'Casero',
      mealSlot: 'desayuno',
      servingDesc: '2 huevos + 1 pan',
      grams: 180,
      calories: 296,
      protein: 21,
      carbs: 16,
      fat: 15,
      icon: '🍳'
    },
    {
      id: 'init-com-1',
      name: 'Pollo a la plancha, brócoli y arroz',
      brand: 'Casero',
      mealSlot: 'comida',
      servingDesc: '1 plato balanceado',
      grams: 350,
      calories: 732,
      protein: 86,
      carbs: 71,
      fat: 10,
      icon: '🍗'
    }
  ]);

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
  const [newIngredient, setNewIngredient] = useState('');
  const [meals, setMeals] = useState([]);
  const [quickTextEntry, setQuickTextEntry] = useState('chifles y un kekito');
  
  // Workout state
  const [workoutMode, setWorkoutMode] = useState('gym');
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Weight tracking state
  const [weightLogs, setWeightLogs] = useState([
    { log_date: '10 Oct', weight_kg: 72.1 },
    { log_date: '11 Oct', weight_kg: 72.3 },
    { log_date: '12 Oct', weight_kg: 72.2 },
    { log_date: '13 Oct', weight_kg: 72.4 },
    { log_date: '14 Oct', weight_kg: 72.6 },
    { log_date: '15 Oct', weight_kg: 72.5 },
    { log_date: '16 Oct', weight_kg: 72.7 },
    { log_date: '17 Oct', weight_kg: 72.8 }
  ]);
  const [newWeightInput, setNewWeightInput] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);

  // Lean bulk calculations
  const targets = calculateLeanBulkTargets({
    weightKg: DEFAULT_USER_PROFILE.weightKg,
    heightCm: DEFAULT_USER_PROFILE.heightCm,
    age: DEFAULT_USER_PROFILE.age,
    activityLevel: DEFAULT_USER_PROFILE.activityLevel,
    surplus: 300
  });

  const weightAnalytics = calculateWeightAnalytics(weightLogs);

  // Load local storage if available
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('aurafit_theme');
      if (savedTheme === 'dark') setIsDarkMode(true);

      const savedHabits = localStorage.getItem('aurafit_habits');
      if (savedHabits) setHabits(JSON.parse(savedHabits));

      const savedWater = localStorage.getItem('aurafit_water');
      if (savedWater) setWaterMl(parseInt(savedWater, 10));

      const savedIngredients = localStorage.getItem('aurafit_ingredients');
      if (savedIngredients) setSelectedIngredients(JSON.parse(savedIngredients));

      const savedWeights = localStorage.getItem('aurafit_weights');
      if (savedWeights) setWeightLogs(JSON.parse(savedWeights));

      const savedLoggedFoods = localStorage.getItem('aurafit_logged_foods');
      if (savedLoggedFoods) setLoggedFoods(JSON.parse(savedLoggedFoods));
    } catch (err) {
      console.warn('Storage sync err:', err);
    }
  }, []);

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
        localStorage.setItem('aurafit_logged_foods', JSON.stringify(next));
      } catch (e) {}
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

  // Update meals whenever ingredients change
  useEffect(() => {
    setMeals(generateMealsFromPantry(selectedIngredients));
  }, [selectedIngredients]);

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
        localStorage.setItem('aurafit_habits', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const addWater = (ml) => {
    setWaterMl((prev) => {
      const updated = Math.min(prev + ml, 4000);
      try {
        localStorage.setItem('aurafit_water', updated.toString());
      } catch (e) {}
      return updated;
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
      {/* 1. Fitia Top Header (Screenshot 6) */}
      <header className="fitia-header">
        <div className="fitia-header-left" onClick={() => alert('Seleccionando plan: Aumento de Masa Magra (+300 kcal)')}>
          <span className="fitia-header-title">Hoy</span>
          <span className="fitia-header-arrow">▾</span>
        </div>
        <div className="fitia-header-right">
          <div className="fitia-streak-pill">
            <span>🔥</span>
            <span>{streakDays}</span>
          </div>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <div className="fitia-avatar" title={DEFAULT_USER_PROFILE.fullName}>
            <span>🥑</span>
          </div>
        </div>
      </header>

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
                  <span>{targets.targetCalories - 250}</span>
                  <span>Meta Lean Bulk (+300)</span>
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

            {/* Fitia Coach / Asesoría Nutricional (Screenshot 5) */}
            <section className="fitia-coach-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>🥑</span>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)' }}>
                    Fitia Coach · ¿Qué puedo comer?
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Generador de recetas adaptado a tu despensa y meta calórica.
                  </p>
                </div>
              </div>

              {/* Chat Dialog (Screenshot 5) */}
              <div className="fitia-chat-bubble fitia-bubble-bot">
                ¿Qué ingredientes tienes disponibles hoy en tu cocina?
              </div>

              <div className="fitia-pantry-pills">
                {['huevos', 'avena', 'platano', 'pollo', 'arroz', 'brocoli', 'leche', 'atun', 'papa'].map((item) => {
                  const isSel = selectedIngredients.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      className={`fitia-pantry-pill ${isSel ? 'active' : ''}`}
                      onClick={() => toggleIngredient(item)}
                    >
                      {isSel ? '✓ ' : '+ '}
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleAddIngredient} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Otro ingrediente (ej. almendras, manzana)..."
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    color: 'var(--text-main)',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'var(--fitia-green)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    border: 'none',
                    padding: '0 16px',
                    borderRadius: '12px'
                  }}
                >
                  Agregar
                </button>
              </form>

              <div className="fitia-chat-bubble fitia-bubble-bot" style={{ marginTop: '4px' }}>
                Aquí tienes recetas listas para tu meta de volumen magro:
              </div>

              {/* Horizontal Scroll Recipes (Screenshot 5) */}
              <div className="fitia-recipes-scroll">
                {meals.map((meal) => (
                  <div key={meal.id} className="fitia-recipe-card">
                    <div className="fitia-recipe-thumb">
                      {meal.id.includes('pancake')
                        ? '🥞'
                        : meal.id.includes('parfait')
                        ? '🥣'
                        : meal.id.includes('bowl')
                        ? '🍗'
                        : '🥘'}
                      <div className="fitia-recipe-badge">⏱️ {meal.prepMinutes} min</div>
                    </div>
                    <div className="fitia-recipe-body">
                      <div className="fitia-recipe-title">{meal.title}</div>
                      <div className="fitia-recipe-macros">
                        🔥 {meal.calories} kcal · {meal.protein}P · {meal.carbs}C · {meal.fat}G
                      </div>
                      <button
                        type="button"
                        style={{
                          marginTop: '6px',
                          background: 'var(--fitia-green-soft)',
                          border: '1px solid var(--fitia-green)',
                          color: 'var(--fitia-green)',
                          padding: '7px 8px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 800
                        }}
                        onClick={() => alert(`¡${meal.title} agregado a tu plan de hoy!`)}
                      >
                        + Agregar a mi plan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Puntaje Nutricional (Screenshot 2) */}
            <section className="fitia-score-card">
              <span className="fitia-cal-label">Tu puntaje nutricional</span>
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
                    stroke="#00C06D"
                    strokeWidth="16"
                    strokeDasharray="251"
                    strokeDashoffset="40"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="fitia-gauge-inner-val">
                  <div className="fitia-score-big">85</div>
                  <div className="fitia-score-grade">Bueno</div>
                </div>
              </div>

              {/* Floating Insight Card (Screenshot 2) */}
              <div className="fitia-insight-card">
                <div className="fitia-insight-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🌾</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Fibra dietaria</strong>
                  </div>
                  <span className="fitia-insight-badge fitia-badge-red">Muy bajo</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Te faltan <strong>22 g</strong> para tu meta de 30 g.
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-sub)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', lineHeight: 1.35 }}>
                  Prueba cambiar el pan blanco por pan integral en tu próxima comida.
                </div>
              </div>

              <div className="fitia-insight-card" style={{ marginTop: '8px' }}>
                <div className="fitia-insight-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚡</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>Calorías</strong>
                  </div>
                  <span className="fitia-insight-badge fitia-badge-green">Excelente</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  2,150 / 2,200 kcal · Ritmo óptimo para superávit limpio.
                </div>
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
            {/* Top Habits Summary Cards (Screenshot 11) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ background: 'var(--bg-card)', padding: '16px 10px', borderRadius: '18px', textAlign: 'center', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
                <span style={{ fontSize: '22px' }}>💧</span>
                <div style={{ fontSize: '16px', fontWeight: 900, marginTop: '4px' }}>{(waterMl / 1000).toFixed(2)} L</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Agua Hoy</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '16px 10px', borderRadius: '18px', textAlign: 'center', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
                <span style={{ fontSize: '22px' }}>⚡</span>
                <div style={{ fontSize: '16px', fontWeight: 900, marginTop: '4px' }}>5 g</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Creatina</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '16px 10px', borderRadius: '18px', textAlign: 'center', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
                <span style={{ fontSize: '22px' }}>🧘</span>
                <div style={{ fontSize: '16px', fontWeight: 900, marginTop: '4px' }}>MindValley</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Meditación</div>
              </div>
            </div>

            {/* Habits Progress Header (Screenshot 11) */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '18px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '28px' }}>🔥</span>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 900 }}>4 Días de Racha</div>
                    <div style={{ fontSize: '12px', color: 'var(--fitia-green)' }}>¡Excelente consistencia!</div>
                  </div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-main)' }}>
                  {completedHabitsCount} / {habits.length}
                </div>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-card-subtle)', borderRadius: '999px', marginTop: '14px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: 'var(--fitia-green)',
                    width: `${(completedHabitsCount / habits.length) * 100}%`,
                    borderRadius: '999px'
                  }}
                />
              </div>
            </div>

            {/* Habits Checklist (Screenshot 11) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Hábitos Diarios
              </span>
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
                  onClick={() => toggleHabit(habit.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-card-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      {habit.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>{habit.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {habit.target} {habit.completed && `· Completado a las ${habit.time || 'hoy'}`}
                      </div>
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
                      fontWeight: 900
                    }}
                  >
                    ✓
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Water Tracker */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '18px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800 }}>💧 Hidratación Diaria</span>
                <span style={{ fontSize: '13px', color: 'var(--fitia-blue)', fontWeight: 800 }}>{waterMl} / 3,500 ml</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: 'var(--fitia-blue-soft)',
                    border: '1px solid rgba(2, 132, 199, 0.25)',
                    color: 'var(--fitia-blue)',
                    padding: '11px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '13px'
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
                    padding: '11px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '13px'
                  }}
                  onClick={() => addWater(500)}
                >
                  +500 ml (Botella)
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
            {/* Mode Switcher */}
            <div style={{ display: 'flex', background: 'var(--bg-card-subtle)', padding: '4px', borderRadius: '14px', gap: '4px' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  background: workoutMode === 'gym' ? 'var(--bg-card)' : 'transparent',
                  color: workoutMode === 'gym' ? 'var(--text-main)' : 'var(--text-muted)',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '13px',
                  boxShadow: workoutMode === 'gym' ? 'var(--card-shadow)' : 'none'
                }}
                onClick={() => setWorkoutMode('gym')}
              >
                🏋️ Gimnasio (Hipertrofia)
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  background: workoutMode === 'home_emom' ? 'var(--bg-card)' : 'transparent',
                  color: workoutMode === 'home_emom' ? 'var(--text-main)' : 'var(--text-muted)',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '13px',
                  boxShadow: workoutMode === 'home_emom' ? 'var(--card-shadow)' : 'none'
                }}
                onClick={() => setWorkoutMode('home_emom')}
              >
                🏠 Sin Gym (EMOM Casa)
              </button>
            </div>

            {/* Active Routine Details */}
            {workoutMode === 'gym' ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 900 }}>{WORKOUT_ROUTINES.gym.title}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{WORKOUT_ROUTINES.gym.focus}</p>
                  </div>
                  <span style={{ background: 'var(--fitia-green-soft)', color: 'var(--fitia-green)', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 800 }}>
                    {WORKOUT_ROUTINES.gym.targetTime}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {WORKOUT_ROUTINES.gym.exercises.map((ex, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-card-subtle)', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800 }}>{ex.name}</span>
                        <span style={{ fontSize: '13px', color: 'var(--fitia-orange)', fontWeight: 800 }}>
                          {ex.sets} sets × {ex.reps}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Descanso: {ex.rest} · {ex.notes}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 900 }}>{WORKOUT_ROUTINES.home_emom.title}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{WORKOUT_ROUTINES.home_emom.focus}</p>
                  </div>
                  <span style={{ background: 'var(--fitia-orange-soft)', color: 'var(--fitia-orange)', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 800 }}>
                    {WORKOUT_ROUTINES.home_emom.targetTime}
                  </span>
                </div>

                {/* EMOM Active Timer */}
                <div style={{ background: 'var(--bg-card-subtle)', padding: '20px', borderRadius: '18px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '40px', fontWeight: 900, fontFamily: 'monospace', color: 'var(--text-main)' }}>
                    {activeTimerSeconds ? `${Math.floor(activeTimerSeconds / 60).toString().padStart(2, '0')}:${(activeTimerSeconds % 60).toString().padStart(2, '0')}` : '20:00'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '14px' }}>
                    <button
                      type="button"
                      style={{
                        background: timerRunning ? '#EF4444' : 'var(--fitia-green)',
                        color: '#FFFFFF',
                        fontWeight: 900,
                        border: 'none',
                        padding: '10px 26px',
                        borderRadius: '12px'
                      }}
                      onClick={() => {
                        if (!activeTimerSeconds) setActiveTimerSeconds(1200);
                        setTimerRunning(!timerRunning);
                      }}
                    >
                      {timerRunning ? 'Pausar' : 'Iniciar EMOM'}
                    </button>
                    <button
                      type="button"
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)',
                        padding: '10px 16px',
                        borderRadius: '12px'
                      }}
                      onClick={() => {
                        setTimerRunning(false);
                        setActiveTimerSeconds(1200);
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {WORKOUT_ROUTINES.home_emom.structure.map((item, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-card-subtle)', padding: '11px 14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--fitia-green)' }}>{item.minute}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600 }}>{item.work}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

              {/* Chips de Categorías Rápidas */}
              <div className="food-filter-chips">
                {[
                  { key: 'all', label: 'Todos' },
                  { key: 'chifles', label: '🍌 Chifles & Snacks', query: 'chifles' },
                  { key: 'keke', label: '🧁 Kekitos & Dulces', query: 'keke' },
                  { key: 'pollo', label: '🍗 Proteínas Magras', query: 'pechuga' },
                  { key: 'arroz', label: '🍚 Carbohidratos', query: 'arroz' },
                  { key: 'palta', label: '🥑 Grasas Saludables', query: 'palta' }
                ].map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    className={`food-chip ${foodFilterCategory === chip.key ? 'active' : ''}`}
                    onClick={() => {
                      setFoodFilterCategory(chip.key);
                      if (chip.query) setFoodSearchQuery(chip.query);
                      else setFoodSearchQuery('');
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Resultados */}
            <div className="food-results-scroll">
              {foodSearchResults.length > 0 ? (
                foodSearchResults.map((food) => {
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
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔎</div>
                  <div style={{ fontWeight: 800, fontSize: '14px' }}>No encontramos resultados exactos</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    Prueba buscando por "chifles", "kekito", "pechuga", "huevo" o "atún".
                  </div>
                </div>
              )}
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

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
