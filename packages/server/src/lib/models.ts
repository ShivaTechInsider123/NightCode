import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"
import {
    findSupportedChatModel,
    type SupportedChatModel,
    type SupportedChatModelId,
    type SupportedProvider
} from "@nightcode/shared"

import type { LanguageModel, streamText } from "ai";

export type ProviderOptions = NonNullable<Parameters<typeof streamText>[0]>["providerOptions"];

type AnthropicModelId = Extract<SupportedChatModel, { provider: "anthropic" }>["id"]
type OpenAiModelId = Extract<SupportedChatModel, { provider: "openai" }>["id"]


export type ResolvedModel = {
    model: LanguageModel,
    provider: SupportedProvider,
    modelId: SupportedChatModelId,
    providerOptions?: ProviderOptions
}


const ANTHROPIC_PROVIDER_OPTIONS: Partial<Record<AnthropicModelId, ProviderOptions>> = {
    "claude-opus-4-6": {
        anthropic: {
            thinking: {
                type: "enabled",
                budgetTokens: 10000
            }
        }
    },

    "claude-sonnet-4-6": {
        anthropic: {
            thinking: {
                type: "enabled",
                budgetTokens: 10000
            }
        }
    }
}


const OPENAI_PROVIDER_OPTIONS: Partial<Record<OpenAiModelId, ProviderOptions>> = {
    "gpt-5.4": {
        openai: {
            reasoningEffort: "medium",    // flat — enables thinking
            reasoningSummary: "detailed", // get the reasoning text back
        }
    },
};


function assertUnsupportedProvider(provider: never): never {
    throw new Error(`Unsupported Provider: ${provider}`)
}


function resolveAnthropicModel(modelId: AnthropicModelId): ResolvedModel {
    return {
        model: anthropic(modelId),
        provider: "anthropic",
        modelId,
        providerOptions: ANTHROPIC_PROVIDER_OPTIONS[modelId]
    }
}


function resolveOpenAiModel(modelId: OpenAiModelId): ResolvedModel {
    return {
        model: openai(modelId),
        provider: "openai",
        modelId,
        providerOptions: OPENAI_PROVIDER_OPTIONS[modelId]
    }
}



function resolveSupportedChatModel(model: SupportedChatModel): ResolvedModel {
    const provider = model.provider

    switch (provider) {
        case "anthropic":
            return resolveAnthropicModel(model.id)
        case "openai":
            return resolveOpenAiModel(model.id)
        default:
            return assertUnsupportedProvider(provider)
    }
}


export function isSupportedChatModel(modelId: string): modelId is SupportedChatModelId {
    return findSupportedChatModel(modelId) != null
}


export function resolveChatModel(modelId: string): ResolvedModel {
    const model = findSupportedChatModel(modelId)

    if (!model) {
        throw new Error(`Unsupported model: ${modelId}`)
    }

    return resolveSupportedChatModel(model)
}

