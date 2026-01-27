import { create } from 'zustand';

export const useSettingsStore = create((set, get) => ({
  // Language settings
  instructionLanguage: 'en', // en, ur
  programmingLanguage: 'python', // python, cpp, javascript
  
  // Theme
  theme: 'default',
  isDarkMode: true,
  
  // Sound & Voice
  soundEnabled: true,
  voiceTutorEnabled: true,
  
  // Editor settings
  editorFontSize: 14,
  editorTabSize: 4,
  
  // Actions
  setInstructionLanguage: (lang) => {
    set({ instructionLanguage: lang });
    // Update i18n language
    import('../i18n').then((i18n) => {
      i18n.default.changeLanguage(lang);
    });
  },
  
  setProgrammingLanguage: (lang) => set({ programmingLanguage: lang }),
  
  setTheme: (theme) => set({ theme }),
  
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  
  toggleVoiceTutor: () => set((state) => ({ voiceTutorEnabled: !state.voiceTutorEnabled })),
  
  setEditorFontSize: (size) => set({ editorFontSize: size }),
  
  setEditorTabSize: (size) => set({ editorTabSize: size }),
}));
