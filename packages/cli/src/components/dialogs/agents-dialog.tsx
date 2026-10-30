import { useCallback } from "react"
import { Mode } from "../../../../database/generated/prisma/enums"
import { useDialog } from "../../providers/dialog"
import { DialogSearchList } from "../dialog-search-list"



type AgentsDialogContentProps = {
    currentMode: Mode,
    onSelectMode: (mode: Mode) => void
}

function getModeLabel(mode: Mode) {
    return mode === Mode.PLAN ? "Plan" : "Build"

}


const AVAILABLE_MODES: Mode[] = [Mode.BUILD, Mode.PLAN]

export const AgentsDialogContent = ({ currentMode, onSelectMode }: AgentsDialogContentProps) => {

    const dialog = useDialog()

    const handleSelect = useCallback((nextMode: Mode) => {

        onSelectMode(nextMode)
        dialog.close()
    }, [])


    return (
        <DialogSearchList
            items={AVAILABLE_MODES}
            onSelect={handleSelect}
            filterFn={(item, query) => getModeLabel(item).toLowerCase().includes(query.toLowerCase())}
            renderItem={(item, isSelected) => (
                <text selectable={false} fg={isSelected ? "black" : "white"}>
                    {item === currentMode ? " ● " : "  "}
                    {getModeLabel(item)}
                </text>
            )}

            getKey={(item) => item}
            placeholder="Search Agents"
            emptyText="No Matching Agents"

        />
    )
}

