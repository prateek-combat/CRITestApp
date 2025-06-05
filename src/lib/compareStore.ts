import { create } from 'zustand';

interface CompareStore {
  selected: string[];
  toggle: (id: string) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  count: number;
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  selected: [],

  toggle: (id: string) => {
    const current = get().selected;
    const isCurrentlySelected = current.includes(id);

    set({
      selected: isCurrentlySelected
        ? current.filter((x) => x !== id)
        : [...current, id].slice(-5), // Keep max 5 candidates
    });
  },

  clear: () => set({ selected: [] }),

  isSelected: (id: string) => get().selected.includes(id),

  get count() {
    return get().selected.length;
  },
}));
