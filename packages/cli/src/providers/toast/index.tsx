import { useEffect, useState, useContext, useCallback, createContext, type ReactNode, useRef, useMemo } from "react";
import { DEFAULT_DURATION, type ToastOptions, type ToastVariant } from "./types";
import { useTerminalDimensions } from "@opentui/react";
import { useTheme } from "../theme";


export type ToastContextValue = {
    show: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
    const value = useContext(ToastContext)
    if (!value) {
        throw new Error("useToast must be used with in a ToastProvider")
    }
    return value
}


type ToastProviderProps = {
    children: ReactNode
}
export function ToastProvider({ children }: ToastProviderProps) {
    const [currentToast, setCurrentToast] = useState<ToastOptions | null>(null);
    const timeoutHandleRef = useRef<NodeJS.Timeout | null>(null)

    const clearTimeOut = useCallback(() => {
        if (timeoutHandleRef.current) {
            clearTimeout(timeoutHandleRef.current)
            timeoutHandleRef.current = null
        }
    }, [])


    const show = useCallback((options: ToastOptions) => {

        const duration = options.duration ?? DEFAULT_DURATION

        clearTimeOut()
        setCurrentToast({
            variant: options.variant ?? "info",
            ...options,
            duration
        })

        timeoutHandleRef.current = setTimeout(() => {
            setCurrentToast(null)
            timeoutHandleRef.current = null
        }, duration)
    }, [clearTimeOut])


    const value = useMemo(() => {
        return { show }
    }, [show])


    return (
        <ToastContext.Provider value={value}>
            {children}
            <Toast currentToast={currentToast} />
        </ToastContext.Provider>
    )
}


type ToastProps = {
    currentToast: ToastOptions | null
}

function Toast({ currentToast }: ToastProps) {

    const { width } = useTerminalDimensions()
    const { colors } = useTheme()

    if (!currentToast) {
        return null
    }

    const variantColors: Record<ToastVariant, string> = {
        success: colors.success,
        error: colors.error,
        info: colors.info
    }

    const borderColor = currentToast.variant
        ? variantColors[currentToast.variant]
        : variantColors["info"]


    return (
        <box
            position="absolute"
            justifyContent="center"
            alignItems="center"
            top={2}
            right={2}
            width={Math.max(1, Math.min(60, width - 60))}
            paddingLeft={2}
            paddingRight={2}
            paddingBottom={1}
            paddingTop={1}
            backgroundColor={colors.surface}
            borderColor={borderColor}
            border={["left", "right"]}
        >
            <box flexDirection="column" gap={1} width="100%">
                <text fg="#E1E1E1" wrapMode="word" width="100%">{currentToast.message}</text>
            </box>

        </box>
    )

}