export function useTheme() {
  const isDarkMode = useState<boolean>("isDarkMode", () => {
    if (process.server) {
      return false; // Default to light mode on the server
    }
    if (process.client) {
      const userPreference = localStorage.getItem("isDarkMode");
      if (userPreference !== null) {
        return userPreference === "true";
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value;
    if (process.client) {
      localStorage.setItem("isDarkMode", isDarkMode.value.toString());
    }
  };

  return {
    isDarkMode,
    toggleTheme,
  };
}
