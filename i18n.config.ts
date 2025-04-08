export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'de',
  fallbackLocale: 'de',
  messages: {
    de: {
      navigation: {
        concerts: 'Konzerte',
        pieces: 'Stücke',
        instruments: 'Instrumente',
        about: 'Über uns',
        contact: 'Kontakt'
      },
      auth: {
        signIn: 'Anmelden',
        signOut: 'Abmelden',
        profile: 'Profil',
        settings: 'Einstellungen'
      },
      footer: {
        copyright: '© 2025 Bachkreis-Sheetmanagement. Alle Rechte vorbehalten.',
        about: 'Über uns',
        contact: 'Kontakt'
      }
    },
    en: {
      navigation: {
        concerts: 'Concerts',
        pieces: 'Pieces',
        instruments: 'Instruments',
        about: 'About',
        contact: 'Contact'
      },
      auth: {
        signIn: 'Sign in',
        signOut: 'Sign out',
        profile: 'Profile',
        settings: 'Settings'
      },
      footer: {
        copyright: '© 2025 Bachkreis-Sheetmanagement. All rights reserved.',
        about: 'About',
        contact: 'Contact'
      }
    }
  }
})) 