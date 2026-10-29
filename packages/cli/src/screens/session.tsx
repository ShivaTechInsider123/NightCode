import { useLocation, useNavigate, useParams } from "react-router";
import { SessionShell } from "../components/session-shell";
import type { InferResponseType } from "hono/client";
import { apiClient } from "../lib/api-client";
import z from "zod";
import { BotMessage, ErrorMessage, UserMessage } from "../components/messages";
import { useToast } from "../providers/toast";
import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../lib/http-errors";
import { useChat, type Message } from "../hooks/use-chat";
import { DEFAULT_CHAT_MODEL_ID, type SupportedChatModelId } from "@nightcode/shared";
import prettyMs from "pretty-ms";
import { MessageStatus } from "../../../database/generated/prisma/enums";
import { useKeyboardLayer } from "../providers/keyboard-layer";
import { useKeyboard } from "@opentui/react";


type SessionData = InferResponseType<(typeof apiClient.sessions)[":id"]["$get"], 200>;

const sessionLocationSchema = z.object({
    session: z.custom<SessionData>((val) => val != null && typeof val === "object" && "id" in val)
});


function ChatMessage({ msg }: { msg: Message }) {
    if (msg.role === "user") {
        return <UserMessage message={msg.content} />
    }
    if (msg.role === "error") {
        return <ErrorMessage message={msg.content} />

    }
    return <BotMessage
        parts={msg.parts}
        model={msg.model}
        mode={msg.mode}
        duration={msg.duration}
        streaming={false}
        interrupted={msg.interrupted}
    />
}


function mapDbMessages(dbMessages: SessionData["messages"]): Message[] {
    return dbMessages.map((m): Message => {
        if (m.role === "ERROR") {
            return { id: m.id, role: "error", content: m.content };
        }

        if (m.role === "USER") {
            return {
                id: m.id,
                role: "user",
                content: m.content,
                mode: m.mode,
                model: m.model as SupportedChatModelId,
            };
        }

        return {
            id: m.id,
            role: "assistant",
            content: m.content,
            model: m.model as SupportedChatModelId,
            mode: m.mode,
            parts: [{ type: "text", text: m.content }],
            ...(m.duration != null ? { duration: prettyMs(m.duration * 1000) } : {}),
            interrupted: m.status === MessageStatus.INTERRUPTED

        };
    });
};


function SessionChat({ session }: { session: SessionData }) {
    const [initialMessages] = useState(mapDbMessages(session.messages))
    const { isTopLayer } = useKeyboardLayer()
    const { submit, abort, messages, streaming, interrupt } = useChat(session.id, initialMessages)

    useEffect(() => {
        return () => abort()
    }, [abort])


    useKeyboard((key) => {
        if (key.name === "escape" && isTopLayer("base") && streaming.status === "streaming") {
            key.preventDefault()
            interrupt()
        }
    })

    return (
        <SessionShell
            onSubmit={(text) =>
                submit({ userText: text, mode: "BUILD", model: DEFAULT_CHAT_MODEL_ID })
            }

            loading={streaming.status === "streaming"}
            interruptable={streaming.status === "streaming"}
            inputDisabled={streaming.status === "streaming"}
        >
            {messages.map((m) => (
                <ChatMessage key={m.id} msg={m} />
            ))}

            {streaming.status === "streaming" && (
                <BotMessage
                    parts={streaming.parts}
                    mode={streaming.mode}
                    model={streaming.model}
                    streaming

                />
            )}

        </SessionShell>
    )

}

export function Session() {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const toast = useToast()


    const prefetched = useMemo(() => {

        const parsed = sessionLocationSchema.safeParse(location.state)
        return parsed.success === true ? parsed.data.session : null

    }, [location.state])


    const [session, setSession] = useState<SessionData | null>(prefetched)


    useEffect(() => {
        if (prefetched) return

        setSession(null)

        if (!id) return

        let ignore = false

        const fetchSesion = async () => {
            try {
                const res = await apiClient.sessions[":id"]["$get"]({
                    param: { id }
                })

                if (ignore) return

                if (!res.ok) throw new Error(await getErrorMessage(res))

                setSession(await res.json())
            } catch (error) {
                if (ignore) return
                toast.show({
                    variant: "error",
                    message: error instanceof Error ? error.message : "Failed to fetch session"
                })
                navigate("/", { replace: true })

            }
        }
        fetchSesion()

        return () => {
            ignore = true
        }
    }, [id, navigate, toast, prefetched])


    if (!session) {
        return <SessionShell onSubmit={() => { }} loading inputDisabled />
    }

    return (
        <SessionChat key={session.id} session={session} />
    )
}