import { Mode, type ModeType } from "@nightcode/shared"
import { useTheme } from "../../providers/theme"
import { EmptyBorder } from "../border"

type props = {
    message: string,
    mode: ModeType
}

export function UserMessage({ message, mode }: props) {
    const { colors } = useTheme()


    return (
        <box width="100%" alignItems="center">
            <box
                border={["left"]}
                borderColor={mode === Mode.PLAN ? colors.planMode : colors.primary}
                width="100%"
                customBorderChars={{
                    ...EmptyBorder,
                    vertical: "┃",
                    bottomLeft: "|"
                }}
            >
                <box
                    justifyContent="center"
                    paddingX={2}
                    paddingY={1}
                    backgroundColor={colors.surface}
                    width="100%"
                >
                    <text>{message}</text>
                </box>

            </box>
        </box>
    )
}