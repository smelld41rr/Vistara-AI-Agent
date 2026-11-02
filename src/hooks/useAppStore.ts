import { create } from 'zustand';
import type { View } from '../components/types';
interface UIState { view: View; setView: (view: View) => void }
export const useAppStore = create<UIState>((set) => ({ view: 'Chat', setView: (view) => set({ view }) }));
