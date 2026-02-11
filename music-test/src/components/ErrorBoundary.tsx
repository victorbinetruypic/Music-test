'use client'

import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorIcon } from '@/components/icons'

interface Props {
  children: ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center px-4 py-8">
          <div className="max-w-md w-full bg-[#181818] rounded-xl p-8 text-center">
            <div className="mb-4 w-12 h-12 mx-auto rounded-full bg-[#e91429]/20 flex items-center justify-center">
              <ErrorIcon className="w-6 h-6 text-[#e91429]" />
            </div>
            <h2 className="text-lg font-bold mb-2">
              {this.props.fallbackTitle || 'Something went wrong'}
            </h2>
            <p className="text-sm text-[#a7a7a7] mb-4">
              {this.props.fallbackMessage || 'An unexpected error occurred. Please try again.'}
            </p>
            <Button
              onClick={this.handleReset}
              className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-full px-6"
            >
              Try again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
