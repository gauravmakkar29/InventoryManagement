import { useState, useCallback, useRef } from "react";
import { MapPin, X, Search } from "lucide-react";
import type { CityCoordinates } from "../../../lib/location-coords";
import { getCityCoordinates } from "../../../lib/location-coords";

// ---------------------------------------------------------------------------
// LocationSearchBar (Story 10.3)
// ---------------------------------------------------------------------------

/** Story 10.3: Location search bar with autocomplete */
export function LocationSearchBar({
  onLocationSelect,
  onClear,
}: {
  onLocationSelect: (coords: CityCoordinates) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CityCoordinates[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setNoResults(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      // Client-side geocoding against known cities (mock for Places API)
      const normalizedQuery = value.toLowerCase().trim();
      const matches: CityCoordinates[] = [];

      const knownNames = [
        "new york",
        "los angeles",
        "chicago",
        "houston",
        "phoenix",
        "dallas",
        "denver",
        "sydney",
        "melbourne",
        "singapore",
        "tokyo",
        "shanghai",
        "london",
        "munich",
        "sao paulo",
      ];

      for (const name of knownNames) {
        if (name.includes(normalizedQuery)) {
          const coords = getCityCoordinates(name);
          if (coords) matches.push(coords);
        }
      }

      if (matches.length === 0) {
        setNoResults(true);
        setSuggestions([]);
      } else {
        setSuggestions(matches.slice(0, 5));
        setNoResults(false);
      }
      setShowSuggestions(true);
    }, 300);
  }, []);

  const handleSelect = useCallback(
    (coords: CityCoordinates) => {
      setQuery(coords.label);
      setSuggestions([]);
      setShowSuggestions(false);
      setNoResults(false);
      onLocationSelect(coords);
    },
    [onLocationSelect],
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setNoResults(false);
    onClear();
    inputRef.current?.focus();
  }, [onClear]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const first = suggestions[0];
      if (e.key === "Enter" && first) {
        handleSelect(first);
      }
    },
    [suggestions, handleSelect],
  );

  return (
    <div className="absolute top-3 left-3 z-20 w-[240px]">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 || noResults) setShowSuggestions(true);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search location..."
          className="w-full rounded-md border border-border bg-card/95 py-1.5 pl-8 pr-8 text-[14px] text-foreground shadow-sm backdrop-blur-sm placeholder:text-muted-foreground focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          aria-label="Search location"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground cursor-pointer"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showSuggestions && (suggestions.length > 0 || noResults) && (
        <div className="mt-1 rounded-md border border-border bg-card shadow-lg overflow-hidden">
          {noResults ? (
            <div className="px-3 py-2 text-[13px] text-muted-foreground">Location not found</div>
          ) : (
            suggestions.map((s) => (
              <button
                key={s.label}
                onMouseDown={() => handleSelect(s)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] text-foreground/80 hover:bg-blue-50 cursor-pointer"
              >
                <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span>{s.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
