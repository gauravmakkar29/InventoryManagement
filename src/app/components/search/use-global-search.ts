import { useState, useEffect, useCallback, useRef } from "react";
import type { GlobalSearchResult, SearchEntityType } from "@/lib/opensearch-types";

// =============================================================================
// Story 18.2 — Global Search Hook (useGlobalSearch)
// Debounced search with recent searches stored in localStorage.
// =============================================================================

const RECENT_SEARCHES_KEY = "ims-recent-searches";
const MAX_RECENT = 5;
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/** Mock search data for development — replaced by real API in production */
const MOCK_RESULTS: GlobalSearchResult[] = [
  {
    id: "d1",
    entityType: "Device",
    title: "INV-3200A",
    subtitle: "SN-4821 | Denver, CO",
    _score: 9.2,
    _highlights: { deviceName: ["<mark>INV-3200A</mark>"] },
  },
  {
    id: "d2",
    entityType: "Device",
    title: "INV-3200B",
    subtitle: "SN-4822 | Houston, TX",
    _score: 8.8,
    _highlights: { deviceName: ["<mark>INV-3200B</mark>"] },
  },
  {
    id: "d5",
    entityType: "Device",
    title: "INV-3100E",
    subtitle: "SN-3455 | New York, NY",
    _score: 7.5,
    _highlights: { deviceName: ["<mark>INV</mark>-3100E"] },
  },
  {
    id: "f1",
    entityType: "Firmware",
    title: "IMS Firmware v4.0.0",
    subtitle: "Released 2026-01-15 | 12 devices",
    _score: 6.9,
    _highlights: { name: ["IMS <mark>Firmware</mark> v4.0.0"] },
  },
  {
    id: "f2",
    entityType: "Firmware",
    title: "IMS Firmware v3.2.1",
    subtitle: "Released 2025-11-20 | 5 devices",
    _score: 6.5,
    _highlights: { name: ["IMS <mark>Firmware</mark> v3.2.1"] },
  },
  {
    id: "so1",
    entityType: "ServiceOrder",
    title: "Annual Maintenance — Denver Site",
    subtitle: "Scheduled | High Priority",
    _score: 5.8,
    _highlights: { title: ["Annual <mark>Maintenance</mark>"] },
  },
  {
    id: "so2",
    entityType: "ServiceOrder",
    title: "Firmware Upgrade — Houston",
    subtitle: "In Progress | Medium Priority",
    _score: 5.2,
    _highlights: { title: ["<mark>Firmware</mark> Upgrade"] },
  },
  {
    id: "c1",
    entityType: "Compliance",
    title: "NIST 800-53 Rev5 Audit",
    subtitle: "Approved | Last audit: 2026-01-10",
    _score: 4.8,
    _highlights: { name: ["<mark>NIST</mark> 800-53 Rev5"] },
  },
  {
    id: "v1",
    entityType: "Vulnerability",
    title: "CVE-2026-1234",
    subtitle: "Critical | OpenSSL 3.0.x | 8 affected",
    _score: 4.5,
    _highlights: { vulnCveId: ["<mark>CVE-2026-1234</mark>"] },
  },
  {
    id: "v2",
    entityType: "Vulnerability",
    title: "CVE-2026-5678",
    subtitle: "High | libcurl | 3 affected",
    _score: 4.1,
    _highlights: { vulnCveId: ["<mark>CVE-2026-5678</mark>"] },
  },
];

export interface SearchState {
  query: string;
  results: GlobalSearchResult[];
  isLoading: boolean;
  isOpen: boolean;
  recentSearches: string[];
  selectedEntityTypes: SearchEntityType[];
  selectedIndex: number;
}

export interface UseGlobalSearchReturn extends SearchState {
  setQuery: (q: string) => void;
  setOpen: (open: boolean) => void;
  setSelectedEntityTypes: (types: SearchEntityType[]) => void;
  selectNext: () => void;
  selectPrev: () => void;
  clearRecentSearches: () => void;
  addRecentSearch: (q: string) => void;
  groupedResults: Record<string, GlobalSearchResult[]>;
  flatResults: GlobalSearchResult[];
}

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.slice(0, MAX_RECENT) as string[];
    return [];
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: string[]): void {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)));
  } catch {
    // localStorage unavailable — ignore
  }
}

function fuzzyMatch(query: string, results: GlobalSearchResult[]): GlobalSearchResult[] {
  const q = query.toLowerCase();
  return results.filter((r) => {
    const searchable = `${r.title} ${r.subtitle}`.toLowerCase();
    // Simple fuzzy: check if all chars of query appear in order
    let qi = 0;
    for (let i = 0; i < searchable.length && qi < q.length; i++) {
      if (searchable[i] === q[qi]) qi++;
    }
    return qi === q.length;
  });
}

export function useGlobalSearch(): UseGlobalSearchReturn {
  const [query, setQueryRaw] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches);
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<SearchEntityType[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setQuery = useCallback((q: string) => {
    setQueryRaw(q);
    setSelectedIndex(-1);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(() => {
      // Mock search — in production, call searchGlobal() from hlm-api
      let filtered = fuzzyMatch(query, MOCK_RESULTS);
      if (selectedEntityTypes.length > 0) {
        filtered = filtered.filter((r) => selectedEntityTypes.includes(r.entityType));
      }
      setResults(filtered);
      setIsLoading(false);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedEntityTypes]);

  const groupedResults = results.reduce<Record<string, GlobalSearchResult[]>>((acc, r) => {
    if (!acc[r.entityType]) acc[r.entityType] = [];
    acc[r.entityType]!.push(r);
    return acc;
  }, {});

  const flatResults = results;

  const selectNext = useCallback(() => {
    setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
  }, [results.length]);

  const selectPrev = useCallback(() => {
    setSelectedIndex((prev) => Math.max(prev - 1, -1));
  }, []);

  const addRecentSearch = useCallback((q: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== q);
      const updated = [q, ...filtered].slice(0, MAX_RECENT);
      saveRecentSearches(updated);
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    saveRecentSearches([]);
  }, []);

  return {
    query,
    results,
    isLoading,
    isOpen,
    recentSearches,
    selectedEntityTypes,
    selectedIndex,
    setQuery,
    setOpen,
    setSelectedEntityTypes,
    selectNext,
    selectPrev,
    clearRecentSearches,
    addRecentSearch,
    groupedResults,
    flatResults,
  };
}
