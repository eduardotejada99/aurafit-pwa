'use client';

import { useState, useEffect } from 'react';
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

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('nutrition'); // Fitia first
  const [selectedDay, setSelectedDay] = useState(12); // Wednesday (M)
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [waterMl, setWaterMl] = useState(2250);
  const [streakDays, setStreakDays] = useState(213);
  const [showDamageControl, setShowDamageControl] = useState(false);
  
  // Nutrition & Pantry state (Fitia Coach)
  const [selectedIngredients, setSelectedIngredients] = useState(['huevos', 'avena', 'platano', 'pollo', 'arroz']);
  const [newIngredient, setNewIngredient] = useState('');
  const [meals, setMeals] = useState([]);
  const [userLoggedCalories, setUserLoggedCalories] = useState(2004);
  
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
      const savedHabits = localStorage.getItem('aurafit_habits');
      if (savedHabits) setHabits(JSON.parse(savedHabits));

      const savedWater = localStorage.getItem('aurafit_water');
      if (savedWater) setWaterMl(parseInt(savedWater, 10));

      const savedIngredients = localStorage.getItem('aurafit_ingredients');
      if (savedIngredients) setSelectedIngredients(JSON.parse(savedIngredients));

      const savedWeights = localStorage.getItem('aurafit_weights');
      if (savedWeights) setWeightLogs(JSON.parse(savedWeights));
    } catch (err) {
      console.warn('Storage sync err:', err);
    }
  }, []);

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

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Week days for calendar strip (Screenshot 6)
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
    <div className="mobile-shell">
      {/* 1. Fitia Top Header (Screenshot 6) */}
      <header className="fitia-header">
        <div className="fitia-header-left">
          <span className="fitia-header-title">Hoy</span>
          <span className="fitia-header-arrow">▾</span>
        </div>
        <div className="fitia-header-right">
          <div className="fitia-streak-pill">
            <span>🔥</span>
            <span>{streakDays}</span>
          </div>
          <div className="fitia-avatar" title={DEFAULT_USER_PROFILE.fullName}>
            <span>⚡</span>
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

      {/* TAB CONTENT */}
      <main className="fitia-content">
        {/* ===================================================================
            TAB 1: NUTRICIÓN ESTILO FITIA (Screenshots 1, 2, 5, 6)
            =================================================================== */}
        {activeTab === 'nutrition' && (
          <>
            {/* Fitia Hero Calorie Tracker Card (Screenshot 6) */}
            <section className="fitia-hero-card">
              <span className="fitia-cal-label">kcal</span>
              <div className="fitia-cal-val">
                2,004 <span>/ {targets.targetCalories}</span>
              </div>

              {/* Fitia Sweet-Spot Calorie Gauge */}
              <div className="fitia-gauge-wrap">
                <div className="fitia-gauge-track">
                  <div className="fitia-gauge-fill" style={{ width: '85%' }} />
                  <div className="fitia-gauge-pin" style={{ left: '85%' }}>
                    ✓
                  </div>
                </div>
                <div className="fitia-gauge-labels">
                  <span>1,787</span>
                  <span>Meta Lean Bulk</span>
                  <span>2,185</span>
                </div>
              </div>

              {/* 3 Fitia Macro Progress Bars */}
              <div className="fitia-macros-row">
                <div className="fitia-macro-item">
                  <span className="fitia-macro-name">Proteínas</span>
                  <span className="fitia-macro-numbers">
                    165 <span>/ {targets.macros.proteinGrams} g</span>
                  </span>
                  <div className="fitia-macro-bar-wrap">
                    <div className="fitia-macro-bar-fill" style={{ width: '95%' }} />
                  </div>
                </div>
                <div className="fitia-macro-item">
                  <span className="fitia-macro-name">Carb.</span>
                  <span className="fitia-macro-numbers">
                    194 <span>/ {targets.macros.carbsGrams} g</span>
                  </span>
                  <div className="fitia-macro-bar-wrap">
                    <div className="fitia-macro-bar-fill" style={{ width: '78%' }} />
                  </div>
                </div>
                <div className="fitia-macro-item">
                  <span className="fitia-macro-name">Grasas</span>
                  <span className="fitia-macro-numbers">
                    62 <span>/ {targets.macros.fatGrams} g</span>
                  </span>
                  <div className="fitia-macro-bar-wrap">
                    <div className="fitia-macro-bar-fill" style={{ width: '88%' }} />
                  </div>
                </div>
              </div>
            </section>

            {/* Meal Slots List (Screenshot 6) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Desayuno */}
              <div className="fitia-meal-card">
                <div className="fitia-meal-header">
                  <span className="fitia-meal-title">Desayuno</span>
                  <span className="fitia-meal-macro-pill">
                    🔥 450 kcal · 32P · 45C · 14G
                  </span>
                </div>
                <div className="fitia-dish-item">
                  <div className="fitia-dish-thumb">🍳</div>
                  <div className="fitia-dish-info">
                    <div className="fitia-dish-name">Huevos revueltos, pan integral y avena</div>
                    <div className="fitia-dish-meta">⏱️ 8 min · Alto en proteína</div>
                  </div>
                </div>
              </div>

              {/* Comida / Almuerzo */}
              <div className="fitia-meal-card">
                <div className="fitia-meal-header">
                  <span className="fitia-meal-title">Comida</span>
                  <span className="fitia-meal-macro-pill">
                    🔥 732 kcal · 86P · 71C · 10G
                  </span>
                </div>
                <div className="fitia-dish-item">
                  <div className="fitia-dish-thumb">🍗</div>
                  <div className="fitia-dish-info">
                    <div className="fitia-dish-name">Pechuga de pollo a la plancha con arroz y brócoli</div>
                    <div className="fitia-dish-meta">⏱️ 15 min · Volumen limpio</div>
                  </div>
                </div>
              </div>

              {/* Cena */}
              <div className="fitia-meal-card">
                <div className="fitia-meal-header">
                  <span className="fitia-meal-title">Cena</span>
                  <span className="fitia-meal-macro-pill">
                    🔥 512 kcal · 42P · 48C · 12G
                  </span>
                </div>
                <div className="fitia-dish-item">
                  <div className="fitia-dish-thumb">🐟</div>
                  <div className="fitia-dish-info">
                    <div className="fitia-dish-name">Filete de atún con papas al vapor y palta</div>
                    <div className="fitia-dish-meta">⏱️ 12 min · Grasas saludables</div>
                  </div>
                </div>
              </div>

              {/* Snacks */}
              <div className="fitia-meal-card">
                <div className="fitia-meal-header">
                  <span className="fitia-meal-title">Snack & Post-Entreno</span>
                  <span className="fitia-meal-macro-pill">
                    🔥 310 kcal · 25P · 30C · 4G
                  </span>
                </div>
                <div className="fitia-dish-item">
                  <div className="fitia-dish-thumb">🥣</div>
                  <div className="fitia-dish-info">
                    <div className="fitia-dish-name">Yogur griego con plátano y 5g de creatina</div>
                    <div className="fitia-dish-meta">⏱️ 3 min · Absorción óptima</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fitia Coach / Asesoría Nutricional de Despensa (Screenshot 5) */}
            <section className="fitia-coach-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🥗</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                  Fitia Coach · Generador de Despensa
                </span>
              </div>

              {/* Chat Dialog */}
              <div className="fitia-chat-bubble fitia-bubble-bot">
                👋 Hola Eduardo, ¿qué ingredientes tienes disponibles hoy en tu despensa?
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
                  placeholder="Escribe otro ingrediente..."
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    color: 'var(--text-main)',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: 'var(--fitia-green)',
                    color: '#060E10',
                    fontWeight: 700,
                    border: 'none',
                    padding: '0 16px',
                    borderRadius: '10px'
                  }}
                >
                  Agregar
                </button>
              </form>

              <div className="fitia-chat-bubble fitia-bubble-bot" style={{ marginTop: '4px' }}>
                Aquí tienes recetas listas para tu superávit magro (+300 kcal):
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
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid var(--border-active)',
                          color: 'var(--fitia-green-light)',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700
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
              <span className="fitia-cal-label">Tu puntaje nutricional de hoy</span>
              <div className="fitia-gauge-circle-wrap">
                <svg width="180" height="95" viewBox="0 0 180 95">
                  <path
                    d="M 15 90 A 75 75 0 0 1 165 90"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 15 90 A 75 75 0 0 1 165 90"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="14"
                    strokeDasharray="235"
                    strokeDashoffset="35"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="fitia-gauge-inner-val">
                  <div className="fitia-score-big">85</div>
                  <div className="fitia-score-grade">Bueno</div>
                </div>
              </div>

              {/* Floating Insight Cards (Screenshot 2) */}
              <div className="fitia-insight-card">
                <div className="fitia-insight-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🌾</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>Fibra dietaria</strong>
                  </div>
                  <span className="fitia-insight-badge fitia-badge-red">Muy bajo</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Te faltan <strong>18 g</strong> para tu meta de 30 g.
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-sub)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                  💡 Sugerencia Fitia: Agrega avena integral o brócoli en tu próxima comida.
                </div>
              </div>

              <div className="fitia-insight-card" style={{ marginTop: '8px' }}>
                <div className="fitia-insight-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚡</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>Balance Calórico</strong>
                  </div>
                  <span className="fitia-insight-badge fitia-badge-green">Excelente</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  2,004 / 2,185 kcal · Ritmo óptimo para aumento de peso magro.
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
              <div style={{ background: 'var(--bg-card)', padding: '14px 10px', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '20px' }}>💧</span>
                <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '4px' }}>{(waterMl / 1000).toFixed(2)} L</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Agua Hoy</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '14px 10px', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '4px' }}>5 g</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Creatina</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '14px 10px', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '20px' }}>🧘</span>
                <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '4px' }}>MindValley</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Meditación</div>
              </div>
            </div>

            {/* Progress Card (Screenshot 11) */}
            <div style={{ background: 'linear-gradient(135deg, #10292B 0%, #091719 100%)', border: '1px solid var(--border-active)', borderRadius: '20px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '28px' }}>🔥</span>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>Racha de 14 Días</div>
                    <div style={{ fontSize: '12px', color: 'var(--fitia-green-light)' }}>¡Progreso constante!</div>
                  </div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {completedHabitsCount} / {habits.length}
                </div>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', marginTop: '14px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #10B981, #34D399)',
                    width: `${(completedHabitsCount / habits.length) * 100}%`,
                    borderRadius: '999px'
                  }}
                />
              </div>
            </div>

            {/* Habits Checklist (Screenshot 11) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Hábitos del Día
              </div>
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className={`fitia-habit-row ${habit.completed ? 'completed' : ''}`}
                  onClick={() => toggleHabit(habit.id)}
                >
                  <div className="fitia-habit-left">
                    <div className="fitia-habit-icon">{habit.icon}</div>
                    <div>
                      <div className="fitia-habit-name">{habit.name}</div>
                      <div className="fitia-habit-sub">
                        {habit.target} {habit.completed && `· Completado a las ${habit.time || 'hoy'}`}
                      </div>
                    </div>
                  </div>
                  <div className={`fitia-radio-check ${habit.completed ? 'checked' : ''}`}>
                    ✓
                  </div>
                </div>
              ))}
            </div>

            {/* Water Tracker Quick Buttons */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800 }}>💧 Hidratación Rápida</span>
                <span style={{ fontSize: '12px', color: 'var(--fitia-blue)' }}>{waterMl} / 3,500 ml</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38BDF8',
                    padding: '10px',
                    borderRadius: '10px',
                    fontWeight: 700,
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
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38BDF8',
                    padding: '10px',
                    borderRadius: '10px',
                    fontWeight: 700,
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
            <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  background: workoutMode === 'gym' ? 'var(--bg-card)' : 'transparent',
                  color: workoutMode === 'gym' ? 'var(--text-main)' : 'var(--text-muted)',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '13px'
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
                  fontWeight: 700,
                  fontSize: '13px'
                }}
                onClick={() => setWorkoutMode('home_emom')}
              >
                🏠 Sin Gym (EMOM Casa)
              </button>
            </div>

            {/* Active Routine Details */}
            {workoutMode === 'gym' ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800 }}>{WORKOUT_ROUTINES.gym.title}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{WORKOUT_ROUTINES.gym.focus}</p>
                  </div>
                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--fitia-green-light)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                    {WORKOUT_ROUTINES.gym.targetTime}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {WORKOUT_ROUTINES.gym.exercises.map((ex, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{ex.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--fitia-orange)', fontWeight: 700 }}>
                          {ex.sets} sets × {ex.reps}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-sub)', marginTop: '4px' }}>
                        Descanso: {ex.rest} · {ex.notes}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800 }}>{WORKOUT_ROUTINES.home_emom.title}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{WORKOUT_ROUTINES.home_emom.focus}</p>
                  </div>
                  <span style={{ background: 'rgba(249, 115, 22, 0.15)', color: 'var(--fitia-orange)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                    {WORKOUT_ROUTINES.home_emom.targetTime}
                  </span>
                </div>

                {/* EMOM Active Timer */}
                <div style={{ background: 'var(--bg-surface)', padding: '18px', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border-active)' }}>
                  <div style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'monospace', color: 'var(--text-main)' }}>
                    {formatTimer(activeTimerSeconds || 1200)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                    <button
                      type="button"
                      style={{
                        background: timerRunning ? '#EF4444' : 'var(--fitia-green)',
                        color: '#060E10',
                        fontWeight: 800,
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: '10px'
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
                        borderRadius: '10px'
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
                    <div key={idx} style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--fitia-green-light)' }}>{item.minute}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{item.work}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weight Progression Card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '18px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800 }}>Evolución de Peso Magro</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Actual: <strong>{weightAnalytics.currentWeight} kg</strong> · Ritmo: <strong>{weightAnalytics.ratePerWeekKg} kg/sem</strong>
                  </p>
                </div>
                <button
                  type="button"
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid var(--border-active)',
                    color: 'var(--fitia-green-light)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700
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
                            background: i === weightLogs.slice(-7).length - 1 ? 'var(--fitia-green)' : 'rgba(255,255,255,0.15)',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '9px', color: 'var(--text-sub)' }}>{log.log_date.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Weight Modal */}
      {showWeightModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '340px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '6px' }}>Registrar Peso Diario</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Pésate en ayunas después de ir al baño para máxima precisión.
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
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px',
                  borderRadius: '10px',
                  color: 'var(--text-main)',
                  fontSize: '18px',
                  textAlign: 'center',
                  fontWeight: 800,
                  marginBottom: '14px'
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '10px', borderRadius: '10px', fontWeight: 600 }}
                  onClick={() => setShowWeightModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, background: 'var(--fitia-green)', color: '#060E10', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 800 }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px calc(24px + var(--safe-bottom))', width: '100%', maxWidth: '430px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🛡️</span>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Protocolo Damage Control</h3>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px' }}
                onClick={() => setShowDamageControl(false)}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {DAMAGE_CONTROL_PROTOCOL.subtitle}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {DAMAGE_CONTROL_PROTOCOL.steps.map((st) => (
                <div key={st.step} style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--fitia-orange)' }}>
                    PASO {st.step} · {st.timing}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, margin: '4px 0' }}>{st.action}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{st.rationale}</div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: '18px' }}
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
