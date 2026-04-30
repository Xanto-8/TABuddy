'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

type LookMode = 'follow' | 'look-away' | 'look-each-other'

interface CharacterInteractionContextType {
  lookMode: LookMode
  setLookMode: (mode: LookMode) => void
  onUsernameFocus: () => void
  onUsernameBlur: () => void
  onPasswordFocus: () => void
  onPasswordBlur: () => void
}

const CharacterInteractionContext = createContext<CharacterInteractionContextType | undefined>(undefined)

export function CharacterInteractionProvider({ children }: { children: ReactNode }) {
  const [lookMode, setLookMode] = useState<LookMode>('follow')

  const onUsernameFocus = () => setLookMode('look-each-other')
  const onUsernameBlur = () => setLookMode('follow')
  const onPasswordFocus = () => setLookMode('look-away')
  const onPasswordBlur = () => setLookMode('follow')

  return (
    <CharacterInteractionContext.Provider value={{ lookMode, setLookMode, onUsernameFocus, onUsernameBlur, onPasswordFocus, onPasswordBlur }}>
      {children}
    </CharacterInteractionContext.Provider>
  )
}

export function useCharacterInteraction() {
  const context = useContext(CharacterInteractionContext)
  if (context === undefined) {
    throw new Error('useCharacterInteraction must be used within CharacterInteractionProvider')
  }
  return context
}
