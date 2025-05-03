import React, { createContext, ReactNode, useContext, useState } from 'react'

interface HeaderContextType {
  isFormValid: boolean
  isSaving: boolean
  saveNote: () => void
  setIsFormValid: (isValid: boolean) => void
  setIsSaving: (isSaving: boolean) => void
  step: number
  totalSteps: number
  handleNextStep: () => void
  handlePreviousStep: () => void
  setStep: (step: number) => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export const HeaderProvider = ({ children }: { children: ReactNode }) => {
  const [isFormValid, setIsFormValid] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [totalSteps, setTotalSteps] = useState(2)

  const saveNote = () => {
    // Your save note logic here
    console.log('Saving note...')
  }

  const handleNextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <HeaderContext.Provider
      value={{
        isFormValid,
        isSaving,
        saveNote,
        setIsFormValid,
        setIsSaving,
        step,
        totalSteps,
        handleNextStep,
        handlePreviousStep,
        setStep
      }}
    >
      {children}
    </HeaderContext.Provider>
  )
}

export const useHeaderContext = () => {
  const context = useContext(HeaderContext)
  if (context === undefined) {
    throw new Error('useHeaderContext must be used within a HeaderProvider')
  }
  return context
}