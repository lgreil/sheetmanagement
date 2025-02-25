import { ref } from 'vue';

export function useMenu() {
  const menuOpen = ref(false);

  const toggleMenu = () => {
    menuOpen.value = !menuOpen.value;
  };

  const closeMenu = () => {
    menuOpen.value = false;
  };

  return {
    menuOpen,
    toggleMenu,
    closeMenu,
  };
}