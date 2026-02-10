"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Search, X, Loader2 } from "lucide-react";

interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}

interface PlaceDetails {
  displayName: string;
  formattedAddress: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface PlacesAutocompleteProps {
  onPlaceSelected: (details: PlaceDetails) => void;
  onClose: () => void;
}

export function PlacesAutocomplete({
  onPlaceSelected,
  onClose,
}: PlacesAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const searchPlaces = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setSuggestions([]);
      } else {
        setSuggestions(data.suggestions || []);
      }
    } catch {
      setError("Erro ao buscar endereços");
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(value), 300);
  };

  const handleSelect = async (suggestion: PlaceSuggestion) => {
    setIsLoadingDetails(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/places?placeId=${encodeURIComponent(suggestion.placeId)}`
      );
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setIsLoadingDetails(false);
        return;
      }

      onPlaceSelected({
        displayName: data.displayName || suggestion.mainText,
        formattedAddress: data.formattedAddress || suggestion.fullText,
        neighborhood: data.neighborhood || "",
        city: data.city || "",
        state: data.state || "",
      });
    } catch {
      setError("Erro ao obter detalhes do local");
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="animate-in slide-in-from-bottom-2 fade-in duration-200 border border-blue-200 dark:border-blue-800 rounded-xl bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
      {/* Search Input */}
      <div className="relative px-3 py-2">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Digite o endereço, bairro ou rua..."
          className="w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {isSearching && (
          <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 pb-2">
          <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading details overlay */}
      {isLoadingDetails && (
        <div className="px-3 py-4 flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando detalhes...
        </div>
      )}

      {/* Suggestions */}
      {!isLoadingDetails && suggestions.length > 0 && (
        <ul className="max-h-48 overflow-y-auto border-t border-gray-100 dark:border-gray-700">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-start gap-2.5 cursor-pointer"
              >
                <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {s.mainText}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {s.secondaryText}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Empty state */}
      {!isLoadingDetails &&
        !isSearching &&
        query.length >= 2 &&
        suggestions.length === 0 &&
        !error && (
          <div className="px-3 py-3 text-xs text-gray-400 text-center">
            Nenhum resultado encontrado
          </div>
        )}

      {/* Tip */}
      {!isLoadingDetails && query.length < 2 && (
        <div className="px-3 py-3 text-xs text-gray-400 dark:text-gray-500 text-center">
          Digite pelo menos 2 caracteres para buscar
        </div>
      )}
    </div>
  );
}
