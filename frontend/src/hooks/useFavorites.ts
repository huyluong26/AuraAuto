'use client';

import { useSyncExternalStore, useCallback } from 'react';

const STORAGE_KEY = 'aura_favorites';
const EVENT_KEY = 'aura_favorites_updated';

let cachedRaw: string | null = null;
let cachedMap: Record<string, boolean> = {};
const serverSnapshot: Record<string, boolean> = {};

function getSnapshot(): Record<string, boolean> {
  if (typeof window === 'undefined') return serverSnapshot;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '[]';
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      const list = JSON.parse(raw);
      const map: Record<string, boolean> = {};
      if (Array.isArray(list)) {
        list.forEach((id: string) => {
          map[id] = true;
        });
      }
      cachedMap = map;
    }
  } catch (err) {
    console.error('Failed to parse favorites from storage:', err);
  }
  return cachedMap;
}

function getServerSnapshot(): Record<string, boolean> {
  return serverSnapshot;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT_KEY, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT_KEY, callback);
    window.removeEventListener('storage', callback);
  };
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleFavorite = useCallback(
    (id: string, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (typeof window === 'undefined') return;

      try {
        const raw = localStorage.getItem(STORAGE_KEY) || '[]';
        let list: string[] = [];
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) list = parsed;
        } catch {
          list = [];
        }

        let nextList: string[];
        if (list.includes(id)) {
          nextList = list.filter((item) => item !== id);
        } else {
          nextList = [...list, id];
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
        cachedRaw = null; // Invalidate cache so getSnapshot computes new map
        window.dispatchEvent(new Event(EVENT_KEY));
      } catch (err) {
        console.error('Failed to toggle favorite:', err);
      }
    },
    []
  );

  const isFavorite = useCallback(
    (id: string) => !!favorites[id],
    [favorites]
  );

  const favoriteCount = Object.keys(favorites).length;

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    favoriteCount,
  };
}
