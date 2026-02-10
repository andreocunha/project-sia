import { NextRequest, NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

/**
 * Proxy for Google Places Autocomplete (Legacy) API.
 * Uses the older endpoint that requires only "Places API" (not "New").
 * Keeps the API key server-side.
 */
export async function POST(req: NextRequest) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEY não configurada" },
      { status: 500 }
    );
  }

  const { query } = (await req.json()) as { query: string };

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const params = new URLSearchParams({
      input: query,
      key: GOOGLE_API_KEY,
      language: "pt-BR",
      components: "country:br",
      types: "geocode",
      // Bias results toward Florianópolis
      location: "-27.5954,-48.548",
      radius: "50000",
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Places error:", errorText);
      return NextResponse.json(
        { error: "Erro ao buscar sugestões" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places API status:", data.status, data.error_message);
      return NextResponse.json(
        { error: data.error_message || `Places API error: ${data.status}` },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const suggestions = (data.predictions || []).map((p: any) => ({
      placeId: p.place_id,
      mainText: p.structured_formatting?.main_text || p.description || "",
      secondaryText: p.structured_formatting?.secondary_text || "",
      fullText: p.description || "",
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Places API error:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar sugestões" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/places?placeId=XXX - Fetch place details to extract
 * structured address components (neighborhood, city, etc.)
 * Uses the Legacy Place Details endpoint.
 */
export async function GET(req: NextRequest) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEY não configurada" },
      { status: 500 }
    );
  }

  const placeId = req.nextUrl.searchParams.get("placeId");
  if (!placeId) {
    return NextResponse.json(
      { error: "placeId é obrigatório" },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_API_KEY,
      language: "pt-BR",
      fields: "name,formatted_address,address_components,geometry",
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Place details error:", errorText);
      return NextResponse.json(
        { error: "Erro ao buscar detalhes do local" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Place details status:", data.status, data.error_message);
      return NextResponse.json(
        { error: data.error_message || `Details error: ${data.status}` },
        { status: 400 }
      );
    }

    const result = data.result;

    // Extract neighborhood and city from address components
    let neighborhood = "";
    let city = "";
    let state = "";

    for (const component of result.address_components || []) {
      const types: string[] = component.types || [];
      if (
        types.includes("sublocality_level_1") ||
        types.includes("sublocality") ||
        types.includes("neighborhood")
      ) {
        neighborhood = component.long_name || component.short_name || "";
      }
      if (
        types.includes("administrative_area_level_2") ||
        types.includes("locality")
      ) {
        city = component.long_name || component.short_name || "";
      }
      if (types.includes("administrative_area_level_1")) {
        state = component.short_name || "";
      }
    }

    return NextResponse.json({
      displayName: result.name || "",
      formattedAddress: result.formatted_address || "",
      neighborhood,
      city,
      state,
      location: result.geometry?.location || null,
    });
  } catch (error) {
    console.error("Place details error:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar detalhes" },
      { status: 500 }
    );
  }
}
