export function useTheme() {
  const colorMode = useColorMode();
  const theme = useState("theme", () => "default");

  const setTheme = (newTheme: string) => {
    theme.value = newTheme;

    // Set the data-theme attribute on the html element
    if (newTheme === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
    }
  };

  // Watch for changes in colorMode.preference to update theme
  watch(
    colorMode,
    () => {
      //When colorMode updates we need to load the correct theme.
      if (theme.value === "default") {
        //we don't need to change anything, because default does not set a data-theme attribute.
      } else {
        setTheme(theme.value);
      }
    },
    { deep: true },
  );

  // On mount, set the initial theme
  onMounted(() => {
    setTheme(theme.value);
  });

  return {
    theme,
    setTheme,
  };
}
