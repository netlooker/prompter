# Accessibility & Internationalization

## Overview

The Accessibility & Internationalization module ensures the Block Library is usable by people of all abilities and language preferences. It implements proper ARIA attributes, keyboard navigation, screen reader support, focus management, color contrast compliance, and language adaptation. This module makes the application more inclusive and helps meet legal requirements for accessibility while expanding the potential user base by supporting multiple languages.

## Key Components

### 1. Accessibility Provider

#### Interface and Context
```tsx
export interface AccessibilityContextType {
  // Focus management
  focusableElements: React.RefObject<HTMLElement[]>;
  trapFocus: boolean;
  setTrapFocus: (trap: boolean) => void;
  registerFocusable: (element: HTMLElement) => void;
  unregisterFocusable: (element: HTMLElement) => void;
  
  // Preferences
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  largeText: boolean;
  setLargeText: (enabled: boolean) => void;
  
  // Screen reader helpers
  announceScreen: (message: string) => void;
  announceAction: (message: string) => void;
}

export const AccessibilityContext = createContext<AccessibilityContextType>({
  focusableElements: { current: [] },
  trapFocus: false,
  setTrapFocus: () => {},
  registerFocusable: () => {},
  unregisterFocusable: () => {},
  
  highContrast: false,
  setHighContrast: () => {},
  reducedMotion: false,
  setReducedMotion: () => {},
  largeText: false,
  setLargeText: () => {},
  
  announceScreen: () => {},
  announceAction: () => {}
});

export const useAccessibility = () => useContext(AccessibilityContext);
```

#### Provider Implementation
```tsx
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  // Focus management
  const focusableElementsRef = useRef<HTMLElement[]>([]);
  const [trapFocus, setTrapFocus] = useState(false);
  
  // Accessibility preferences
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [largeText, setLargeText] = useState(false);
  
  // Screen reader announcement elements
  const screenAnnouncerRef = useRef<HTMLDivElement>(null);
  const actionAnnouncerRef = useRef<HTMLDivElement>(null);
  
  // Load preferences
  useEffect(() => {
    // Check for system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReducedMotion(prefersReducedMotion);
    
    // Check for high contrast mode
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
    setHighContrast(prefersHighContrast);
    
    // Load user preferences from storage
    const loadPreferences = async () => {
      try {
        const preferencesService = await import('../services/preferences-service').then(m => m.preferencesService);
        
        const a11yPrefs = await preferencesService.getPreference('accessibilityPreferences', {
          highContrast: prefersHighContrast,
          reducedMotion: prefersReducedMotion,
          largeText: false
        });
        
        setHighContrast(a11yPrefs.highContrast);
        setReducedMotion(a11yPrefs.reducedMotion);
        setLargeText(a11yPrefs.largeText);
      } catch (error) {
        console.error('Failed to load accessibility preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);
  
  // Save preferences when changed
  useEffect(() => {
    const savePreferences = async () => {
      try {
        const preferencesService = await import('../services/preferences-service').then(m => m.preferencesService);
        
        await preferencesService.setPreference('accessibilityPreferences', {
          highContrast,
          reducedMotion,
          largeText
        });
      } catch (error) {
        console.error('Failed to save accessibility preferences:', error);
      }
    };
    
    savePreferences();
  }, [highContrast, reducedMotion, largeText]);
  
  // Apply accessibility classes to document
  useEffect(() => {
    // High contrast
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
    
    // Large text
    if (largeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
  }, [highContrast, reducedMotion, largeText]);
  
  // Register a focusable element
  const registerFocusable = useCallback((element: HTMLElement) => {
    if (focusableElementsRef.current && !focusableElementsRef.current.includes(element)) {
      focusableElementsRef.current.push(element);
      
      // Sort by tabIndex
      focusableElementsRef.current.sort((a, b) => {
        const aTabIndex = a.tabIndex || 0;
        const bTabIndex = b.tabIndex || 0;
        return aTabIndex - bTabIndex;
      });
    }
  }, []);
  
  // Unregister a focusable element
  const unregisterFocusable = useCallback((element: HTMLElement) => {
    if (focusableElementsRef.current) {
      focusableElementsRef.current = focusableElementsRef.current.filter(el => el !== element);
    }
  }, []);
  
  // Announce a message to screen readers (for page/screen changes)
  const announceScreen = useCallback((message: string) => {
    if (screenAnnouncerRef.current) {
      screenAnnouncerRef.current.textContent = message;
    }
  }, []);
  
  // Announce an action to screen readers (for user actions)
  const announceAction = useCallback((message: string) => {
    if (actionAnnouncerRef.current) {
      actionAnnouncerRef.current.textContent = message;
    }
  }, []);
  
  // Handle focus trapping
  useEffect(() => {
    if (!trapFocus) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !focusableElementsRef.current || focusableElementsRef.current.length === 0) {
        return;
      }
      
      const firstElement = focusableElementsRef.current[0];
      const lastElement = focusableElementsRef.current[focusableElementsRef.current.length - 1];
      
      if (e.shiftKey && document.activeElement === firstElement) {
        // Shift+Tab on first element, move to last
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        // Tab on last element, move to first
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [trapFocus]);
  
  // Context value
  const contextValue: AccessibilityContextType = {
    focusableElements: focusableElementsRef,
    trapFocus,
    setTrapFocus,
    registerFocusable,
    unregisterFocusable,
    
    highContrast,
    setHighContrast,
    reducedMotion,
    setReducedMotion,
    largeText,
    setLargeText,
    
    announceScreen,
    announceAction
  };
  
  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      
      {/* Screen reader announcement regions */}
      <div
        ref={screenAnnouncerRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        role="status"
      />
      
      <div
        ref={actionAnnouncerRef}
        className="sr-only"
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
      />
    </AccessibilityContext.Provider>
  );
};
```

### 2. FocusTrap Component

```tsx
interface FocusTrapProps {
  active: boolean;
  children: React.ReactNode;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  active,
  children
}) => {
  const trapRef = useRef<HTMLDivElement>(null);
  const { setTrapFocus } = useAccessibility();
  
  useEffect(() => {
    setTrapFocus(active);
    
    if (active && trapRef.current) {
      // Find all focusable elements
      const focusableElements = trapRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      // Focus first element
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
      
      // Store previous active element to restore focus later
      const previousActiveElement = document.activeElement as HTMLElement;
      
      return () => {
        // Restore focus when unmounting or when active becomes false
        if (previousActiveElement && previousActiveElement.focus) {
          previousActiveElement.focus();
        }
      };
    }
  }, [active, setTrapFocus]);
  
  return (
    <div ref={trapRef}>
      {children}
    </div>
  );
};
```

### 3. Internationalization Provider

#### Interface and Context
```tsx
export interface I18nContextType {
  // Current language
  currentLanguage: string;
  setLanguage: (language: string) => void;
  
  // Translation function
  t: (key: string, params?: Record<string, string | number>) => string;
  
  // Available languages
  availableLanguages: { code: string; name: string }[];
  
  // Locale-specific functions
  formatDate: (date: Date | number) => string;
  formatNumber: (num: number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
}

export const I18nContext = createContext<I18nContextType>({
  currentLanguage: 'en',
  setLanguage: () => {},
  t: key => key,
  availableLanguages: [{ code: 'en', name: 'English' }],
  formatDate: (date) => new Date(date).toLocaleDateString(),
  formatNumber: (num) => num.toString(),
  formatCurrency: (amount) => `$${amount.toFixed(2)}`
});

export const useI18n = () => useContext(I18nContext);
```

#### Provider Implementation
```tsx
export interface TranslationMessages {
  [key: string]: string;
}

export interface TranslationResources {
  [language: string]: TranslationMessages;
}

export interface I18nProviderProps {
  children: React.ReactNode;
  defaultLanguage?: string;
  supportedLanguages?: { code: string; name: string }[];
  resources?: TranslationResources;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  defaultLanguage = 'en',
  supportedLanguages = [{ code: 'en', name: 'English' }],
  resources = { en: {} }
}) => {
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const [translations, setTranslations] = useState<TranslationMessages>(resources[defaultLanguage] || {});
  
  // Load translations for current language
  useEffect(() => {
    const loadTranslations = async () => {
      // If we already have translations for this language, use them
      if (resources[currentLanguage]) {
        setTranslations(resources[currentLanguage]);
        return;
      }
      
      // Otherwise, try to load them
      try {
        // Dynamic import based on language
        const translationModule = await import(`../translations/${currentLanguage}.json`);
        setTranslations(translationModule.default);
        
        // Update resources cache
        resources[currentLanguage] = translationModule.default;
      } catch (error) {
        console.error(`Failed to load translations for ${currentLanguage}:`, error);
        
        // Fall back to default language
        if (currentLanguage !== defaultLanguage) {
          setCurrentLanguage(defaultLanguage);
        }
      }
    };
    
    loadTranslations();
  }, [currentLanguage, defaultLanguage, resources]);
  
  // Set language and persist preference
  const handleSetLanguage = async (language: string) => {
    // Validate language
    if (!supportedLanguages.some(lang => lang.code === language)) {
      console.error(`Language ${language} is not supported`);
      return;
    }
    
    setCurrentLanguage(language);
    
    // Save preference
    try {
      const preferencesService = await import('../services/preferences-service').then(m => m.preferencesService);
      await preferencesService.setPreference('language', language);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };
  
  // Load language preference
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const preferencesService = await import('../services/preferences-service').then(m => m.preferencesService);
        const savedLanguage = await preferencesService.getPreference<string>('language');
        
        if (savedLanguage && supportedLanguages.some(lang => lang.code === savedLanguage)) {
          setCurrentLanguage(savedLanguage);
        } else {
          // Get browser language
          const browserLanguage = navigator.language.split('-')[0];
          
          // Check if we support it
          if (supportedLanguages.some(lang => lang.code === browserLanguage)) {
            setCurrentLanguage(browserLanguage);
            await preferencesService.setPreference('language', browserLanguage);
          }
        }
      } catch (error) {
        console.error('Failed to load language preference:', error);
      }
    };
    
    loadLanguagePreference();
  }, [supportedLanguages]);
  
  // Translation function
  const translate = useCallback((key: string, params?: Record<string, string | number>): string => {
    if (!translations[key]) {
      console.warn(`Translation key "${key}" not found in language ${currentLanguage}`);
      return key;
    }
    
    let text = translations[key];
    
    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{{${param}}}`, String(value));
      });
    }
    
    return text;
  }, [translations, currentLanguage]);
  
  // Format date according to current locale
  const formatDate = useCallback((date: Date | number): string => {
    return new Date(date).toLocaleDateString(currentLanguage);
  }, [currentLanguage]);
  
  // Format number according to current locale
  const formatNumber = useCallback((num: number): string => {
    return new Intl.NumberFormat(currentLanguage).format(num);
  }, [currentLanguage]);
  
  // Format currency according to current locale
  const formatCurrency = useCallback((amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency
    }).format(amount);
  }, [currentLanguage]);
  
  // Context value
  const contextValue: I18nContextType = {
    currentLanguage,
    setLanguage: handleSetLanguage,
    t: translate,
    availableLanguages: supportedLanguages,
    formatDate,
    formatNumber,
    formatCurrency
  };
  
  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};
```

### 4. AccessibleButton Component

```tsx
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: React.ReactNode;
  tooltipText?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  label,
  icon,
  tooltipText,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  className,
  onClick,
  ...props
}) => {
  const { reducedMotion } = useAccessibility();
  const { t } = useI18n();
  
  // Handle click with accessibility announcement
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled || isLoading) {
      e.preventDefault();
      return;
    }
    
    onClick?.(e);
  };
  
  // Variant-specific classes
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200',
    outline: 'border border-gray-300 hover:bg-gray-100 text-gray-700 focus:ring-gray-500 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-300',
    ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-500 dark:hover:bg-gray-800 dark:text-gray-300',
    link: 'text-blue-600 hover:underline focus:ring-blue-500 dark:text-blue-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800'
  };
  
  // Size-specific classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  
  // High contrast mode classes
  const highContrastClasses = {
    primary: 'high-contrast:bg-black high-contrast:text-white high-contrast:border-2 high-contrast:border-white',
    secondary: 'high-contrast:bg-white high-contrast:text-black high-contrast:border-2 high-contrast:border-black',
    outline: 'high-contrast:border-2 high-contrast:border-black dark:high-contrast:border-white',
    ghost: 'high-contrast:underline',
    link: 'high-contrast:underline high-contrast:text-black dark:high-contrast:text-white',
    danger: 'high-contrast:bg-black high-contrast:text-white high-contrast:border-2 high-contrast:border-white'
  };
  
  // Loading and disabled classes
  const stateClasses = isDisabled
    ? 'opacity-50 cursor-not-allowed'
    : isLoading
    ? 'cursor-wait'
    : 'cursor-pointer';
  
  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition ${
        reducedMotion ? 'transition-none' : ''
      } ${variantClasses[variant]} ${sizeClasses[size]} ${highContrastClasses[variant]} ${stateClasses} ${className || ''}`}
      onClick={handleClick}
      disabled={isDisabled}
      aria-disabled={isDisabled || isLoading}
      aria-label={tooltipText || label}
      title={tooltipText}
      data-testid="accessible-button"
      {...props}
    >
      {isLoading && (
        <span className="mr-2">
          <Spinner size={size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'} />
        </span>
      )}
      
      {icon && <span className={`${label ? 'mr-2' : ''}`}>{icon}</span>}
      
      {label && <span>{t(label)}</span>}
    </button>
  );
};
```

### 5. SkipLink Component

```tsx
export const SkipLink: React.FC = () => {
  const { t } = useI18n();
  
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-white focus:text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {t('accessibility.skipToContent')}
    </a>
  );
};
```

### 6. Translation Files Structure

```json
// src/translations/en.json
{
  "app.title": "Block Library",
  "app.description": "Organize and manage your prompt blocks",
  
  "blockTypes.roleSettings": "Role Setting",
  "blockTypes.context": "Context",
  "blockTypes.taskDescription": "Task Description",
  "blockTypes.action": "Action",
  "blockTypes.outputFormat": "Output Format",
  "blockTypes.successCriteria": "Success Criteria",
  "blockTypes.constraints": "Constraints",
  "blockTypes.examples": "Examples",
  "blockTypes.boosters": "Boosters",
  
  "sidebar.blocks": "Blocks",
  "sidebar.templates": "Templates",
  "sidebar.collections": "Collections",
  "sidebar.recent": "Recent",
  "sidebar.favorites": "Favorites",
  "sidebar.pinned": "Pinned",
  
  "commandPalette.title": "Prompt Blocks",
  "commandPalette.searchPlaceholder": "Search blocks...",
  "commandPalette.noResults": "No blocks found",
  
  "blockExplorer.title": "Block Explorer",
  "blockExplorer.createNew": "Create New",
  "blockExplorer.deleteSelected": "Delete Selected",
  "blockExplorer.confirmDelete": "Are you sure you want to delete {{count}} selected block(s)?",
  
  "editor.insertBlock": "Insert Block",
  "editor.replaceSelection": "Replace Selection",
  
  "templates.createTemplate": "Create Template",
  "templates.editTemplate": "Edit Template",
  "templates.addPlaceholder": "Add Placeholder",
  "templates.addBlock": "Add Block",
  "templates.noBlocks": "No blocks added yet",
  
  "settings.title": "Settings",
  "settings.general": "General",
  "settings.interface": "Interface",
  "settings.shortcuts": "Keyboard Shortcuts",
  "settings.collections": "Collections",
  "settings.theme": "Theme",
  "settings.theme.light": "Light",
  "settings.theme.dark": "Dark",
  "settings.theme.system": "System",
  
  "accessibility.skipToContent": "Skip to main content",
  "accessibility.highContrast": "High Contrast Mode",
  "accessibility.reducedMotion": "Reduced Motion",
  "accessibility.largeText": "Large Text",
  
  "actions.create": "Create",
  "actions.edit": "Edit",
  "actions.delete": "Delete",
  "actions.save": "Save",
  "actions.cancel": "Cancel",
  "actions.close": "Close",
  "actions.back": "Back",
  "actions.next": "Next",
  "actions.apply": "Apply",
  "actions.reset": "Reset",
  "actions.import": "Import",
  "actions.export": "Export",
  "actions.search": "Search",
  "actions.filter": "Filter",
  "actions.sort": "Sort",
  "actions.selectAll": "Select All",
  "actions.deselectAll": "Deselect All"
}

// src/translations/es.json
{
  "app.title": "Biblioteca de Bloques",
  "app.description": "Organiza y gestiona tus bloques de prompt",
  
  "blockTypes.roleSettings": "Configuración de Rol",
  "blockTypes.context": "Contexto",
  "blockTypes.taskDescription": "Descripción de Tarea",
  "blockTypes.action": "Acción",
  "blockTypes.outputFormat": "Formato de Salida",
  "blockTypes.successCriteria": "Criterios de Éxito",
  "blockTypes.constraints": "Restricciones",
  "blockTypes.examples": "Ejemplos",
  "blockTypes.boosters": "Potenciadores",
  
  "sidebar.blocks": "Bloques",
  "sidebar.templates": "Plantillas",
  "sidebar.collections": "Colecciones",
  "sidebar.recent": "Recientes",
  "sidebar.favorites": "Favoritos",
  "sidebar.pinned": "Fijados",
  
  "commandPalette.title": "Bloques de Prompt",
  "commandPalette.searchPlaceholder": "Buscar bloques...",
  "commandPalette.noResults": "No se encontraron bloques",
  
  // More translations...
  
  "accessibility.skipToContent": "Saltar al contenido principal",
  "accessibility.highContrast": "Modo de Alto Contraste",
  "accessibility.reducedMotion": "Movimiento Reducido",
  "accessibility.largeText": "Texto Grande"
}
```

### 7. Accessibility Settings Component

```tsx
export const AccessibilitySettings: React.FC = () => {
  const { 
    highContrast, 
    setHighContrast, 
    reducedMotion, 
    setReducedMotion, 
    largeText, 
    setLargeText 
  } = useAccessibility();
  
  const { t } = useI18n();
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">{t('accessibility.title')}</h2>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="high-contrast" className="font-medium">
            {t('accessibility.highContrast')}
          </label>
          <Switch
            id="high-contrast"
            checked={highContrast}
            onCheckedChange={setHighContrast}
            aria-label={t('accessibility.highContrast')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <label htmlFor="reduced-motion" className="font-medium">
            {t('accessibility.reducedMotion')}
          </label>
          <Switch
            id="reduced-motion"
            checked={reducedMotion}
            onCheckedChange={setReducedMotion}
            aria-label={t('accessibility.reducedMotion')}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <label htmlFor="large-text" className="font-medium">
            {t('accessibility.largeText')}
          </label>
          <Switch
            id="large-text"
            checked={largeText}
            onCheckedChange={setLargeText}
            aria-label={t('accessibility.largeText')}
          />
        </div>
      </div>
      
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {t('accessibility.settingsDescription')}
      </div>
    </div>
  );
};
```

## Implementation Steps

### Step 1: Set Up Accessibility Provider

1. Create the accessibility context and provider:
```typescript
// src/contexts/accessibility-context.tsx
// Implementation as defined earlier
```

2. Add to the app's providers:
```tsx
// src/App.tsx
import { AccessibilityProvider } from './contexts/accessibility-context';

export const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      {/* Other providers and app content */}
    </AccessibilityProvider>
  );
};
```

3. Create CSS variables for accessibility:
```css
/* src/styles/accessibility.css */
:root {
  /* Base sizes */
  --font-size-base: 16px;
  --line-height-base: 1.5;
  --spacing-base: 1rem;
  
  /* Transition settings */
  --transition-duration: 0.2s;
  --transition-timing: ease-in-out;
}

.large-text {
  --font-size-base: 20px;
  --line-height-base: 1.6;
  --spacing-base: 1.25rem;
}

.reduced-motion * {
  transition-duration: 0.001ms !important;
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
}

.high-contrast {
  --color-contrast-light: #ffffff;
  --color-contrast-dark: #000000;
  
  /* Override theme colors with high contrast alternatives */
  --color-primary: #0000ff;
  --color-background: var(--color-contrast-light);
  --color-text: var(--color-contrast-dark);
  --color-border: var(--color-contrast-dark);
}

.dark.high-contrast {
  --color-background: var(--color-contrast-dark);
  --color-text: var(--color-contrast-light);
  --color-border: var(--color-contrast-light);
  --color-primary: #00aaff;
}

html {
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}
```

### Step 2: Implement Focus Trap Component

```tsx
// src/components/accessibility/FocusTrap.tsx
// Implementation as defined earlier
```

### Step 3: Set Up Internationalization Provider

1. Create the i18n context and provider:
```typescript
// src/contexts/i18n-context.tsx
// Implementation as defined earlier
```

2. Create translation files:
```json
// src/translations/en.json
// English translations as defined earlier

// src/translations/es.json
// Spanish translations as defined earlier

// Add more languages as needed
```

3. Add to the app's providers:
```tsx
// src/App.tsx
import { I18nProvider } from './contexts/i18n-context';
import enTranslations from './translations/en.json';
import esTranslations from './translations/es.json';

const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' }
];

const translationResources = {
  en: enTranslations,
  es: esTranslations
};

export const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <I18nProvider
        defaultLanguage="en"
        supportedLanguages={supportedLanguages}
        resources={translationResources}
      >
        {/* Other providers and app content */}
      </I18nProvider>
    </AccessibilityProvider>
  );
};
```

### Step 4: Create Accessible Components

1. Create base accessible components:
```tsx
// src/components/accessibility/AccessibleButton.tsx
// Implementation as defined earlier

// src/components/accessibility/SkipLink.tsx
// Implementation as defined earlier
```

2. Create accessibility settings component:
```tsx
// src/components/accessibility/AccessibilitySettings.tsx
// Implementation as defined earlier
```

### Step 5: Enhance Existing Components with Accessibility

```tsx
// Example: Enhancing the Command Palette
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onInsertBlock
}) => {
  const { t } = useI18n();
  const { announceScreen } = useAccessibility();
  
  // Announce when opened
  useEffect(() => {
    if (isOpen) {
      announceScreen(t('commandPalette.screenReaderOpen'));
    }
  }, [isOpen, announceScreen, t]);
  
  // Rest of component...
  
  return (
    <FocusTrap active={isOpen}>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        
        {/* Content */}
        <div 
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[70vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 
              id="command-palette-title"
              className="text-lg font-semibold"
            >
              {t('commandPalette.title')}
            </h2>
            
            <button 
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={onClose}
              aria-label={t('actions.close')}
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Rest of palette... */}
        </div>
      </div>
    </FocusTrap>
  );
};
```

### Step 6: Add Language Selector Component

```tsx
export const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage, availableLanguages, t } = useI18n();
  
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="language-selector" className="sr-only">
        {t('settings.language')}
      </label>
      
      <select
        id="language-selector"
        value={currentLanguage}
        onChange={(e) => setLanguage(e.target.value)}
        className="py-1 px-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
        aria-label={t('settings.language')}
      >
        {availableLanguages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </select>
    </div>
  );
};
```

## Testing

### Accessibility Testing

```typescript
describe('AccessibilityProvider', () => {
  test('applies high contrast mode when enabled', () => {
    render(
      <AccessibilityProvider>
        <AccessibilityConsumer />
      </AccessibilityProvider>
    );
    
    // Find the high contrast toggle and click it
    const highContrastToggle = screen.getByLabelText('High Contrast Mode');
    fireEvent.click(highContrastToggle);
    
    // Check that the appropriate class was added to the document
    expect(document.documentElement).toHaveClass('high-contrast');
  });
  
  test('applies large text mode when enabled', () => {
    render(
      <AccessibilityProvider>
        <AccessibilityConsumer />
      </AccessibilityProvider>
    );
    
    // Find the large text toggle and click it
    const largeTextToggle = screen.getByLabelText('Large Text');
    fireEvent.click(largeTextToggle);
    
    // Check that the appropriate class was added to the document
    expect(document.documentElement).toHaveClass('large-text');
  });
  
  // Helper component to expose accessibility context
  const AccessibilityConsumer: React.FC = () => {
    const { 
      highContrast, 
      setHighContrast, 
      reducedMotion, 
      setReducedMotion, 
      largeText, 
      setLargeText 
    } = useAccessibility();
    
    return (
      <div>
        <button 
          onClick={() => setHighContrast(!highContrast)}
          aria-label="High Contrast Mode"
        >
          Toggle High Contrast
        </button>
        
        <button 
          onClick={() => setReducedMotion(!reducedMotion)}
          aria-label="Reduced Motion"
        >
          Toggle Reduced Motion
        </button>
        
        <button 
          onClick={() => setLargeText(!largeText)}
          aria-label="Large Text"
        >
          Toggle Large Text
        </button>
      </div>
    );
  };
});
```

### Internationalization Testing

```typescript
describe('I18nProvider', () => {
  const translations = {
    en: {
      'test.key': 'Hello, {{name}}!',
      'test.plural': 'You have {{count}} item(s)'
    },
    es: {
      'test.key': '¡Hola, {{name}}!',
      'test.plural': 'Tienes {{count}} elemento(s)'
    }
  };
  
  test('translates keys correctly', () => {
    render(
      <I18nProvider 
        defaultLanguage="en"
        supportedLanguages={[
          { code: 'en', name: 'English' },
          { code: 'es', name: 'Spanish' }
        ]}
        resources={translations}
      >
        <I18nConsumer />
      </I18nProvider>
    );
    
    // Check initial translation (English)
    expect(screen.getByTestId('translation')).toHaveTextContent('Hello, World!');
    
    // Change language to Spanish
    fireEvent.change(screen.getByLabelText('Select Language'), { target: { value: 'es' } });
    
    // Check Spanish translation
    expect(screen.getByTestId('translation')).toHaveTextContent('¡Hola, World!');
  });
  
  // Helper component to expose i18n context
  const I18nConsumer: React.FC = () => {
    const { t, currentLanguage, setLanguage, availableLanguages } = useI18n();
    
    return (
      <div>
        <div data-testid="translation">
          {t('test.key', { name: 'World' })}
        </div>
        
        <select 
          value={currentLanguage}
          onChange={(e) => setLanguage(e.target.value)}
          aria-label="Select Language"
        >
          {availableLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
    );
  };
});
```

## Integration with Other Components

### How the Accessibility & Internationalization Module is Used

- **Core Data Layer**: Enhances error messages and status information for screen readers
- **Search Engine**: Provides accessible search results and internationalized search
- **Command Palette**: Implements keyboard navigation and screen reader support
- **Block Explorer**: Offers accessible grid and list views with proper ARIA roles
- **Editor Integration**: Improves keyboard accessibility for block insertion
- **Template System**: Makes templates accessible with proper focus management
- **Sidebar Panel**: Enhances navigation with accessible accordions and tabs
- **PWA Features**: Provides internationalized offline messages and notifications
- **User Preferences**: Stores and applies accessibility and language preferences

## Implementation Considerations

1. **Keyboard Accessibility**:
   - Ensure all interactive elements are keyboard accessible
   - Implement logical tab order that follows visual layout
   - Provide visible focus indicators
   - Support standard keyboard shortcuts
   - Test navigation with keyboard only

2. **Screen Reader Support**:
   - Use semantic HTML elements
   - Add appropriate ARIA attributes
   - Provide text alternatives for non-text content
   - Announce dynamic content changes
   - Test with actual screen readers

3. **Focus Management**:
   - Trap focus in modals and dialogs
   - Return focus to trigger element when dialogs close
   - Maintain focus position during view changes
   - Skip navigation links for keyboard users
   - Focus first error field in forms

4. **Text Alternatives**:
   - Provide alt text for all images
   - Use aria-label for buttons with only icons
   - Include accessible names for form controls
   - Add descriptions for complex UI elements
   - Ensure sufficient context for all actions

5. **Internationalization**:
   - Extract all user-facing text to translation files
   - Use variables for dynamic content in translations
   - Support right-to-left languages
   - Handle pluralization correctly
   - Allow user to change language preference

6. **Testing and Compliance**:
   - Perform automated accessibility checks
   - Conduct manual testing with assistive technologies
   - Test with users who have disabilities
   - Follow WCAG 2.1 AA guidelines
   - Document accessibility features