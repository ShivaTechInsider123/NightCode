import { TextAttributes } from "@opentui/core";
import { useTheme } from "../providers/theme";
import { usePromptConfig } from "../providers/prompt-config";
import { Mode } from "../../../database/generated/prisma/enums";

export function StatusBar() {
    const { colors } = useTheme()
    const { mode, model } = usePromptConfig()
    return (
        <box flexDirection="row" gap={1}>
            <text fg={mode === Mode.PLAN ? colors.planMode : colors.primary}>
                {mode === Mode.PLAN ? "Plan" : "Build"}
            </text>

            <text fg={colors.dimSeparator} attributes={TextAttributes.DIM}>
                &#8250;
            </text>
            <text>{model}</text>
        </box>
    )
}