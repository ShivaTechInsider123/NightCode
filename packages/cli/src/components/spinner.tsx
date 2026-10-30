import { Mode } from "../../../database/generated/prisma/enums"
import { useTheme } from "../providers/theme"
import "opentui-spinner/react"


type SpinnerProps = {
    mode?: Mode
}


export function Spinner({ mode = Mode.BUILD }: SpinnerProps) {
    const { colors } = useTheme()
    const activeColor = mode === Mode.PLAN ? colors.planMode : colors.primary
    return (
        <spinner name="aesthetic" color={activeColor} />
    )
}