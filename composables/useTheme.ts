export function useTheme() {
  const colorMode = useColorMode();
  
  const isDarkMode = computed(() => colorMode.value === 'dark');

  const toggleTheme = () => {
    colorMode.preference = isDarkMode.value ? 'light' : 'dark';
  };

  return {
    isDarkMode,
    toggleTheme,
  };
}
