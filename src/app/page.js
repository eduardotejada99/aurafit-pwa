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
  const [activeTab, setActiveTab] = useState('habits');
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [waterMl, setWaterMl] = useState(1750);
  const [streakDays, setStreakDays] = useState(14);
  const [showDamageControl, setShowDamageControl] = useState(false);
  
  // Nutrition & Pantry state
  const [selectedIngredients, setSelectedIngredients] = useState(['huevos', 'avena', 'platano', 'arroz']);
  const [newIngredient, setNewIngredient] = useState('');
  const [meals, setMeals] = useState([]);
  
  // Workout state
  const [workoutMode, setWorkoutMode] = useState('gym'); // 'gym' or 'home_emom'
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

  const addIngredient = (e) => {
    e.preventDefault();
    if (!newIngredient.trim()) return;
    const item = newIngredient.trim().toLowerCase();
    if (!selectedIngredients.includes(item)) {
      const updated = [...selectedIngredients, item];
      setSelectedIngredients(updated);
      try {
        localStorage.setItem('aurafit_ingredients', JSON.stringify(updated));
      } catch (e) {}
    }
    setNewIngredient('');
  };

  const removeIngredient = (ing) => {
    const updated = selectedIngredients.filter((i) => i !== ing);
    setSelectedIngredients(updated);
    try {
      localStorage.setItem('aurafit_ingredients', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleAddWeight = (e) => {
    e.preventDefault();
    const val = parseFloat(newWeightInput);
    if (!val || val < 40 || val > 150) return;
    const now = new Date();
    const dateStr = `${now.getDate()} ${now.toLocaleString('es-ES', { month: 'short' })}`;
    const updated = [...weightLogs, { log_date: dateStr, weight_kg: val }];
    setWeightLogs(updated);
    setNewWeightInput('');
    setShowWeightModal(false);
    try {
      localStorage.setItem('aurafit_weights', JSON.stringify(updated));
    } catch (e) {}
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startWalkTimer = (mins = 20) => {
    setActiveTimerSeconds(mins * 60);
    setTimerRunning(true);
  };

  return (
    <>
      {/* Sticky Header */}
      <header className="app-header">
        <div className="brand-badge">
          <div className="brand-icon">⚡</div>
          <div>
            <h1 className="brand-title">AuraFit</h1>
          </div>
        </div>
        <div className="streak-pill">
          <span>🔥</span>
          <span>{streakDays} Días Racha</span>
        </div>
      </header>

      {/* Main Tabbed Content */}
      <main className="main-content">
        {/* ============================================================ */}
        {/* TAB 1: HÁBITOS & BIOHACKING                                   */}
        {/* ============================================================ */}
        {activeTab === 'habits' && (
          <>
            {/* Daily Summary Hero */}
            <div className="aura-card glow-emerald">
              <div className="card-header-row">
                <span className="card-title">
                  <span>⚡</span> Hábitos de Hoy
                </span>
                <span className="card-subtitle">
                  {habits.filter((h) => h.completed).length} de {habits.length} listos
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  margin: '8px 0 14px'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(habits.filter((h) => h.completed).length / habits.length) * 100}%`,
                    background: 'linear-gradient(90deg, #10B981, #06B6D4)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Consistencia celular activa. La regla: <em>nunca fallar dos días seguidos</em>.
              </p>
            </div>

            {/* Habit Items */}
            <div>
              {habits.map((habit) => (
                <div key={habit.id} className={`habit-item ${habit.completed ? 'done' : ''}`}>
                  <div className="habit-info">
                    <div className="habit-icon-box">{habit.icon}</div>
                    <div>
                      <div className="habit-title">{habit.name}</div>
                      <div className="habit-sub">
                        {habit.target} {habit.time ? `• Hecho a las ${habit.time}` : ''}
                      </div>
                    </div>
                  </div>
                  <button
                    className={`check-button ${habit.completed ? 'checked' : ''}`}
                    onClick={() => toggleHabit(habit.id)}
                    aria-label={`Completar ${habit.name}`}
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Water Boost */}
            <div className="aura-card">
              <div className="card-header-row">
                <span className="card-title">
                  <span>💧</span> Hidratación Celular
                </span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                  {waterMl} / {DEFAULT_USER_PROFILE.waterDailyMl} ml
                </span>
              </div>
              <div
                style={{
                  height: '8px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '12px'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min((waterMl / DEFAULT_USER_PROFILE.waterDailyMl) * 100, 100)}%`,
                    background: 'linear-gradient(90deg, #06B6D4, #3B82F6)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => addWater(250)}>
                  + 250 ml
                </button>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => addWater(500)}>
                  + 500 ml Electrolitos
                </button>
              </div>
            </div>

            {/* Telegram Communicator Integration Card */}
            <div className="aura-card glow-cyan" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🤖</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700' }}>Telegram Bridge Conectado</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Alerta preventiva programada a las 18:00 si falta creatina o lección.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* TAB 2: NUTRICIÓN & DESPENSA                                  */}
        {/* ============================================================ */}
        {activeTab === 'nutrition' && (
          <>
            {/* Lean Bulk Caloric Target */}
            <div className="aura-card glow-emerald">
              <div className="card-header-row">
                <span className="card-title">
                  <span>🥗</span> Plan Nutricional: Lean Bulk
                </span>
                <span style={{ fontSize: '12px', background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                  +{targets.surplus} kcal Superávit
                </span>
              </div>
              <div style={{ margin: '8px 0 12px' }}>
                <span style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-1px' }}>
                  {targets.targetCalories.toLocaleString()}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '6px' }}>kcal / día</span>
              </div>

              {/* Macros Breakdown */}
              <div className="macros-grid">
                <div className="macro-box">
                  <div className="macro-val" style={{ color: '#60A5FA' }}>{targets.macros.proteinGrams}g</div>
                  <div className="macro-name">Proteína (2g/kg)</div>
                </div>
                <div className="macro-box">
                  <div className="macro-val" style={{ color: '#FBBF24' }}>{targets.macros.carbsGrams}g</div>
                  <div className="macro-name">Carbohidratos</div>
                </div>
                <div className="macro-box">
                  <div className="macro-val" style={{ color: '#F472B6' }}>{targets.macros.fatGrams}g</div>
                  <div className="macro-name">Grasas Saludables</div>
                </div>
              </div>
            </div>

            {/* BOTÓN SOS DAMAGE CONTROL */}
            <button className="btn-sos" onClick={() => setShowDamageControl(true)}>
              <span>🚨</span>
              <span>Comí Mal: Activar Damage Control</span>
            </button>

            {/* Pantry & Meal Suggestions */}
            <div className="aura-card">
              <div className="card-header-row">
                <span className="card-title">
                  <span>🍳</span> ¿Qué tengo en mi cocina?
                </span>
                <span className="card-subtitle">{selectedIngredients.length} ingredientes</span>
              </div>

              {/* Ingredients Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                {selectedIngredients.map((ing) => (
                  <span
                    key={ing}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {ing}
                    <button
                      onClick={() => removeIngredient(ing)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-sub)', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Ingredient Form */}
              <form onSubmit={addIngredient} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Agregar ingrediente (ej. pollo, espinaca)"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                />
                <button type="submit" className="btn-secondary">
                  + Añadir
                </button>
              </form>

              {/* Suggested Meals */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-muted)' }}>
                  PLATOS SUGERIDOS PARA HOY:
                </div>
                {meals.map((meal) => (
                  <div
                    key={meal.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px',
                      marginBottom: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>{meal.name}</div>
                      <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '700' }}>
                        ⏱ {meal.prepMinutes} min
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 8px' }}>
                      {meal.description}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-sub)' }}>
                      <span>🔥 <strong>{meal.calories}</strong> kcal</span>
                      <span>💪 <strong>{meal.proteinG}g</strong> P</span>
                      <span>🌾 <strong>{meal.carbsG}g</strong> C</span>
                      <span>🥑 <strong>{meal.fatG}g</strong> G</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* TAB 3: WORKOUT HÍBRIDO ADAPTATIVO                            */}
        {/* ============================================================ */}
        {activeTab === 'workout' && (
          <>
            {/* Toggle Segmented Control: Gym vs Home */}
            <div className="segmented-control">
              <button
                className={`segment-btn ${workoutMode === 'gym' ? 'active' : ''}`}
                onClick={() => setWorkoutMode('gym')}
              >
                🏋️ Gimnasio (Push / Torso)
              </button>
              <button
                className={`segment-btn ${workoutMode === 'home_emom' ? 'active' : ''}`}
                onClick={() => setWorkoutMode('home_emom')}
              >
                🏠 En Casa (EMOM 30m)
              </button>
            </div>

            {/* Workout Details Card */}
            <div className="aura-card glow-cyan">
              <div className="card-header-row">
                <span className="card-title">
                  <span>{workoutMode === 'gym' ? '🏋️' : '⏱️'}</span>
                  {WORKOUT_ROUTINES[workoutMode].title}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: '700' }}>
                  {WORKOUT_ROUTINES[workoutMode].durationMinutes} min
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                <strong>Enfoque:</strong> {WORKOUT_ROUTINES[workoutMode].focus} • {WORKOUT_ROUTINES[workoutMode].equipment}
              </p>

              {/* Workout Exercises */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {workoutMode === 'gym'
                  ? WORKOUT_ROUTINES.gym.exercises.map((ex, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-surface)',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>{ex.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {ex.sets} series × {ex.reps} reps (RIR {ex.rir})
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          Descanso {ex.restSeconds}s
                        </span>
                      </div>
                    ))
                  : WORKOUT_ROUTINES.home_emom.exercises.map((ex, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-surface)',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>
                            Minuto {ex.minute}: {ex.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ex.target}</div>
                        </div>
                        <span style={{ fontSize: '11px', color: '#FBBF24', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          Pausa {ex.restSeconds}s
                        </span>
                      </div>
                    ))}
              </div>
            </div>

            {/* Weight Tracker & Moving Average */}
            <div className="aura-card glow-emerald">
              <div className="card-header-row">
                <span className="card-title">
                  <span>⚖️</span> Seguimiento de Ganancia Magra
                </span>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                  onClick={() => setShowWeightModal(true)}
                >
                  + Pesaje
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', margin: '8px 0 14px' }}>
                <div className="macro-box">
                  <div className="macro-val">{weightAnalytics.currentWeight} kg</div>
                  <div className="macro-name">Actual</div>
                </div>
                <div className="macro-box">
                  <div className="macro-val" style={{ color: '#10B981' }}>{weightAnalytics.movingAverage} kg</div>
                  <div className="macro-name">Media 7 días</div>
                </div>
                <div className="macro-box">
                  <div className="macro-val" style={{ color: '#60A5FA' }}>{weightAnalytics.targetWeight} kg</div>
                  <div className="macro-name">Meta</div>
                </div>
              </div>

              {/* Minimalist SVG Trend Chart */}
              <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span>Tendencia Últimos Días</span>
                  <span style={{ color: '#10B981', fontWeight: '700' }}>
                    +{weightAnalytics.weeklyChangeKg} kg/semana (Ritmo Óptimo)
                  </span>
                </div>
                <svg width="100%" height="60" viewBox="0 0 320 60" style={{ overflow: 'visible' }}>
                  <polyline
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="10,48 50,42 90,44 130,38 170,30 210,34 250,26 290,20"
                  />
                  {/* Dots */}
                  {[
                    [10, 48], [50, 42], [90, 44], [130, 38], [170, 30], [210, 34], [250, 26], [290, 20]
                  ].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="4" fill="#0A0E1A" stroke="#10B981" strokeWidth="2" />
                  ))}
                </svg>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ============================================================ */}
      {/* MODAL SOS: DAMAGE CONTROL POST-COMIDA CHATARRA               */}
      {/* ============================================================ */}
      {showDamageControl && (
        <div className="modal-overlay" onClick={() => setShowDamageControl(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🚨</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-rose)' }}>
                  Damage Control Activo
                </span>
              </div>
              <button
                onClick={() => setShowDamageControl(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-sub)', fontSize: '20px' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {DAMAGE_CONTROL_PROTOCOL.objective}
            </p>

            {/* Timer Box */}
            <div
              style={{
                background: 'rgba(244,63,94,0.1)',
                border: '1px solid rgba(244,63,94,0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                textAlign: 'center',
                marginBottom: '18px'
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--accent-rose)', fontWeight: '700', textTransform: 'uppercase' }}>
                Temporizador de Caminata GLUT-4
              </div>
              <div style={{ fontSize: '38px', fontWeight: '900', color: 'var(--text-main)', margin: '6px 0' }}>
                {formatTimer(activeTimerSeconds > 0 ? activeTimerSeconds : 1200)}
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  className="btn-primary"
                  style={{ width: 'auto', padding: '8px 20px', background: 'var(--accent-rose)' }}
                  onClick={() => (timerRunning ? setTimerRunning(false) : startWalkTimer(20))}
                >
                  {timerRunning ? 'Pausar' : 'Iniciar 20 Min'}
                </button>
              </div>
            </div>

            {/* Protocol Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {DAMAGE_CONTROL_PROTOCOL.steps.map((st) => (
                <div
                  key={st.id}
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <span>{st.icon}</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{st.title}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-main)', marginBottom: '4px' }}>
                    {st.action}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    🔬 <strong>Base científica:</strong> {st.science}
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn-secondary"
              style={{ width: '100%', marginTop: '16px', padding: '12px' }}
              onClick={() => setShowDamageControl(false)}
            >
              Cerrar y Regresar
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL REGISTRAR PESAJE                                        */}
      {/* ============================================================ */}
      {showWeightModal && (
        <div className="modal-overlay" onClick={() => setShowWeightModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '16px', fontWeight: '800' }}>Registrar Pesaje de Hoy</span>
              <button
                onClick={() => setShowWeightModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-sub)', fontSize: '20px' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddWeight}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Peso corporal en ayunas (kg):
                </label>
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
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-main)',
                    fontSize: '18px',
                    fontWeight: '700'
                  }}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-primary">
                Guardar Pesaje
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Thumb-Zone Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
}
