import { NextResponse } from 'next/server';
import { CURATED_PERUVIAN_FOODS } from '@/lib/food-database';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query) {
      // Return popular foods as default recommendations
      return NextResponse.json({
        success: true,
        source: 'curated',
        totalAvailable: '3,200,000+',
        results: CURATED_PERUVIAN_FOODS.slice(0, 10)
      });
    }

    const normalize = (str) => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const queryNorm = normalize(query);

    // 1. Search local curated database (accent-tolerant, multi-field)
    const localMatches = CURATED_PERUVIAN_FOODS.filter((food) => {
      const nameMatch = normalize(food.name).includes(queryNorm);
      const shortMatch = normalize(food.shortName).includes(queryNorm);
      const brandMatch = normalize(food.brand).includes(queryNorm);
      const catMatch = normalize(food.category).includes(queryNorm);
      const descMatch = normalize(food.breakdown || food.servingDesc).includes(queryNorm);
      return nameMatch || shortMatch || brandMatch || catMatch || descMatch;
    }).map((item) => ({
      ...item,
      source: 'Verificado Fitia / Perú'
    }));

    // 2. Query Open Food Facts global database (+3M products) with 2500ms timeout
    let globalMatches = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const offRes = await fetch(
        `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}&page_size=15`,
        {
          headers: {
            'User-Agent': 'AuraFitPWA/1.0 - Android - Version 1.0 (info@aurafit.app)',
            'Accept': 'application/json'
          },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);

      if (offRes.ok) {
        const offData = await offRes.json();
        if (Array.isArray(offData.hits)) {
          globalMatches = offData.hits
            .filter((h) => h.product_name && h.nutriments)
            .map((h, idx) => {
              const kcal100 = Math.round(Number(h.nutriments['energy-kcal_100g'] || h.nutriments['energy-kcal'] || 0));
              const prot100 = parseFloat(Number(h.nutriments['proteins_100g'] || 0).toFixed(1));
              const carbs100 = parseFloat(Number(h.nutriments['carbohydrates_100g'] || 0).toFixed(1));
              const fat100 = parseFloat(Number(h.nutriments['fat_100g'] || 0).toFixed(1));
              const fiber100 = parseFloat(Number(h.nutriments['fiber_100g'] || 0).toFixed(1));

              const brandName = Array.isArray(h.brands) ? h.brands.join(', ') : (h.brands || 'Marca Global');

              const isSnack =
                queryLower.includes('chifle') ||
                queryLower.includes('keke') ||
                queryLower.includes('snack') ||
                queryLower.includes('galleta') ||
                queryLower.includes('chocolate') ||
                fat100 > 15;

              return {
                id: `off-${h.code || idx}`,
                name: h.product_name,
                brand: brandName,
                servingDesc: 'Porción estándar 100g',
                grams: 100,
                calories: kcal100 > 0 ? kcal100 : Math.round(prot100 * 4 + carbs100 * 4 + fat100 * 9),
                protein: prot100,
                carbs: carbs100,
                fat: fat100,
                fiber: fiber100,
                category: isSnack ? 'snack' : 'general',
                isSnack,
                isUltraProcessed: isSnack || fat100 > 15,
                icon: isSnack ? '🍪' : '🥗',
                source: 'Base Global (+3M Alimentos)'
              };
            })
            .filter((item) => item.calories > 0);
        }
      }
    } catch {
      // Fail gracefully to local curated if offline or timeout
    }

    // Merge without duplicates
    const combined = [...localMatches];
    const seenNames = new Set(localMatches.map((i) => i.name.toLowerCase()));

    for (const g of globalMatches) {
      if (!seenNames.has(g.name.toLowerCase())) {
        seenNames.add(g.name.toLowerCase());
        combined.push(g);
      }
    }

    return NextResponse.json({
      success: true,
      query,
      count: combined.length,
      totalDatabaseCount: '3,200,000+',
      results: combined
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
