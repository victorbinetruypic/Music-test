'use client'

import { Button } from '@/components/ui/button'
import { initiateOAuthFlow } from '@/lib/spotify'
import { useAuthStore } from '@/stores/authStore'
import { SpotifyIcon, WaveformIcon, LibraryIcon, WaveIcon, PlayIcon } from '@/components/icons'

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}): React.ReactElement {
  return (
    <div className="bg-[#181818] rounded-lg p-6 text-center hover:bg-[#282828] transition-colors">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#282828] flex items-center justify-center text-[#1DB954]">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-[#a7a7a7] text-sm">{description}</p>
    </div>
  )
}

export function LandingView(): React.ReactElement {
  const isLoggingIn = useAuthStore((s) => s.isLoggingIn)
  const setIsLoggingIn = useAuthStore((s) => s.setIsLoggingIn)

  const handleConnect = (): void => {
    setIsLoggingIn(true)
    initiateOAuthFlow()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1DB954]/30 via-[#121212] to-black pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1DB954]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#1DB954]/5 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg shadow-[#1DB954]/25">
              <WaveformIcon className="w-10 h-10 text-black" />
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4">Music Journey</h1>
          <p className="text-xl sm:text-2xl text-[#a7a7a7] mb-8 max-w-lg mx-auto">
            Transform your liked songs into intentional listening experiences
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <span className="px-4 py-2 rounded-full bg-[#282828] text-sm text-[#a7a7a7]">Emotional Arcs</span>
            <span className="px-4 py-2 rounded-full bg-[#282828] text-sm text-[#a7a7a7]">Smart Sequencing</span>
            <span className="px-4 py-2 rounded-full bg-[#282828] text-sm text-[#a7a7a7]">Your Music, Elevated</span>
          </div>

          <Button
            size="lg"
            onClick={handleConnect}
            disabled={isLoggingIn}
            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold px-8 py-6 text-lg rounded-full transition-all hover:scale-105 shadow-lg shadow-[#1DB954]/25"
          >
            {isLoggingIn ? (
              <div className="flex items-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <SpotifyIcon className="w-6 h-6" />
                <span>Continue with Spotify</span>
              </div>
            )}
          </Button>

          <p className="mt-6 text-sm text-[#6a6a6a]">Connect your Spotify account to get started</p>
        </div>
      </div>

      <div className="px-4 py-16 bg-[#121212]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard icon={<LibraryIcon className="w-8 h-8" />} title="Your Library" description="We analyze your liked songs to understand your taste" />
            <FeatureCard icon={<WaveIcon className="w-8 h-8" />} title="Choose a Mood" description="Pick how you want to feel during your listening session" />
            <FeatureCard icon={<PlayIcon className="w-8 h-8" />} title="Experience" description="Enjoy a curated journey with intentional energy flow" />
          </div>
        </div>
      </div>

      <footer className="px-4 py-8 border-t border-[#282828]">
        <div className="max-w-4xl mx-auto text-center text-sm text-[#6a6a6a]">
          <p>Built for music lovers. Powered by Spotify.</p>
        </div>
      </footer>
    </div>
  )
}
