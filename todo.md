# Project TODOs - 16.03.2025

## React 19 & Tailwind CSS 4 Best Practices Review

### React 19 Compliance
- ✅ Functional components used throughout
- ✅ Proper hooks implementation (useState/useEffect with cleanup)
- ✅ Modern createRoot API correctly implemented
- ✅ TypeScript integration with interfaces for props
- ✅ StrictMode enabled for detecting potential issues
- ⚠️ Replace `any` type in InstallPWA for deferredPrompt with more specific types

### Tailwind CSS 4 Compliance
- ✅ Dark mode using 'class' strategy
- ✅ Clean conditional class application
- ✅ Responsive design patterns
- ✅ Proper transition utilities usage
- ✅ Theme extensions configured correctly

## Optimization Opportunities

1. Performance optimizations:
   - Apply `React.memo()` to components that rarely change
   - Implement `useCallback` for event handlers passed as props
   - Consider using `useMemo` for expensive calculations

2. TypeScript enhancements:
   - Create specific types for browser APIs (e.g., BeforeInstallPromptEvent)
   - Add proper type annotations for all functions and variables

3. Tailwind improvements:
   - Explore Tailwind v4's new color system
   - Utilize the improved animation utilities
   - Consider `@apply` directives for frequently repeated class combinations
   - Leverage the updated responsive utilities

4. PWA enhancements:
   - Add offline fallback for API requests
   - Implement background sync capabilities
   - Add push notification support
   - Consider periodic background sync for content updates

## Next Steps
- Perform a comprehensive accessibility audit
- Review bundle size and implement code splitting if needed
- Add comprehensive end-to-end testing
