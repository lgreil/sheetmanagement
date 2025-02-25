import { ref } from 'vue';

export function useTheme() {
  const isDarkMode = ref(false);

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value;
    document.documentElement.classList.toggle('dark', isDarkMode.value);
  };

  return {
    isDarkMode,
    toggleTheme,
  };
}