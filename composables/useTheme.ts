export function useTheme() {
  const isDarkMode = useState<boolean>("isDarkMode", () => true);

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value;
  };

  return {
    isDarkMode,
    toggleTheme,
  };
}
