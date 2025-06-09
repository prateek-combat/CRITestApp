import { create } from 'zustand';

interface CompareStore {
  selected: string[];
  isComparing: boolean;
  toggle: (id: string) => void;
  clear: () => void;
  startCompare: () => void;
  stopCompare: () => void;
  isSelected: (id: string) => boolean;
  count: number;
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  selected: [],
  isComparing: false,

  toggle: (id: string) => {
    const current = get().selected;
    const isCurrentlySelected = current.includes(id);

    set({
      selected: isCurrentlySelected
        ? current.filter((x) => x !== id)
        : [...current, id].slice(-5), // Keep max 5 candidates
    });
  },

  clear: () => set({ selected: [], isComparing: false }),

  startCompare: () => set({ isComparing: true }),

  stopCompare: () => set({ isComparing: false }),

  isSelected: (id: string) => get().selected.includes(id),

  get count() {
    return get().selected.length;
  },
}));
