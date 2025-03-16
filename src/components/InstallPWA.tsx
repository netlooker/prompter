import { useState, useEffect } from 'react'

const InstallPWA = () => {
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  
  useEffect(() => {
    // Check if already installed
    const isPwaInstalled = () => {
      return window.matchMedia('(display-mode: standalone)').matches || 
             window.matchMedia('(display-mode: fullscreen)').matches || 
             (window.navigator as any).standalone === true // For iOS
    }
    
    // Don't show button if already installed
    if (isPwaInstalled()) {
      return
    }
    
    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault()
      // Store the event for later use
      setDeferredPrompt(e)
      // Show the install button
      setIsInstallable(true)
    }
    
    // Handle app installed event
    const handleAppInstalled = () => {
      console.log('App was installed')
      setIsInstallable(false)
      setDeferredPrompt(null)
    }
    
    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])
  
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }
    
    // Show the install prompt
    deferredPrompt.prompt()
    
    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice
    
    // Clear the deferred prompt
    setDeferredPrompt(null)
    
    // Hide button if installed
    if (outcome === 'accepted') {
      setIsInstallable(false)
    }
  }
  
  if (!isInstallable) {
    return null
  }
  
  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-5 right-5 z-50 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors"
      aria-label="Install app"
    >
      Install PWA
    </button>
  )
}

export default InstallPWA