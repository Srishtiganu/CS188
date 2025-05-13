"use client"

import type React from "react"

// Adapted from: https://ui.shadcn.com/docs/components/toast
import { useState, useEffect, useCallback } from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToastProps = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type Toast = ToastProps & {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

const listeners: ((state: Toast[]) => void)[] = []

let memoryState: Toast[] = []

function dispatch(action: {
  type: string
  toast?: Toast
  toastId?: string
}) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

interface Action {
  type: keyof typeof actionTypes
  toast?: Toast
  toastId?: string
}

function reducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case "ADD_TOAST":
      return [...state, { ...action.toast! }].slice(-TOAST_LIMIT)

    case "UPDATE_TOAST":
      return state.map((t) => (t.id === action.toastId ? { ...t, ...action.toast } : t))

    case "DISMISS_TOAST": {
      return state.map((t) => (t.id === action.toastId ? { ...t } : t))
    }

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return []
      }
      return state.filter((t) => t.id !== action.toastId)

    default:
      return state
  }
}

function useToast() {
  const [state, setState] = useState<Toast[]>(memoryState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  const toast = useCallback((props: Omit<ToastProps, "id">) => {
    const id = genId()

    const update = (props: ToastProps) =>
      dispatch({
        type: "UPDATE_TOAST",
        toast: { ...props },
        toastId: id,
      })

    const dismiss = () => {
      dispatch({ type: "DISMISS_TOAST", toastId: id })
      setTimeout(() => {
        dispatch({ type: "REMOVE_TOAST", toastId: id })
      }, TOAST_REMOVE_DELAY)
    }

    dispatch({
      type: "ADD_TOAST",
      toast: {
        ...props,
        id,
        onDismiss: dismiss,
      },
    })

    return {
      id,
      dismiss,
      update,
    }
  }, [])

  return {
    toast,
    toasts: state,
  }
}

export { useToast }
