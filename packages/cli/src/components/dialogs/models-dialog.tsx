import type { SupportedChatModelId } from "@nightcode/shared"
import { useDialog } from "../../providers/dialog"
import { useCallback } from "react"
import { DialogSearchList } from "../dialog-search-list"



type ModelsDialogContentProps = {
    models: SupportedChatModelId[]
    onSelectModel: (modelId: SupportedChatModelId) => void
}


export const ModelsDialogContent = ({ models, onSelectModel }: ModelsDialogContentProps) => {

    const dialog = useDialog()

    const handleSelect = useCallback((modelId: SupportedChatModelId) => {
        onSelectModel(modelId)
        dialog.close()
    }, [dialog, onSelectModel])


    return (
        <DialogSearchList
            items={models}
            onSelect={handleSelect}
            filterFn={(modelId, query) => modelId.toLowerCase().includes(query.toLowerCase())}
            renderItem={(modelId, isSelected) => (
                <text selectable={false} fg={isSelected ? "black" : "white"}>
                    {modelId}
                </text>
            )}

            getKey={(item) => item}
            placeholder="Search Model"
            emptyText="No matching models"

        />
    )
}