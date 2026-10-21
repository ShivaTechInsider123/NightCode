import { useLocation, useNavigate, useParams } from "react-router";
import { SessionShell } from "../components/session-shell";
import type { InferResponseType } from "hono/client";
import { apiClient } from "../lib/api-client";
import z from "zod";
import { BotMessage, ErrorMessage, UserMessage } from "../components/messages";
import { useToast } from "../providers/toast";
import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../lib/http-errors";


type SessionData = InferResponseType<(typeof apiClient.sessions)[":id"]["$get"], 200>;

const sessionLocationSchema = z.object({
    session: z.custom<SessionData>((val) => val != null && typeof val === "object" && "id" in val)
});


function ChatMessage({ msg }: { msg: SessionData["messages"][number] }) {
    if (msg.role === "USER") {
        return <UserMessage message={msg.content} />
    }
    if (msg.role === "ERROR") {
        return <ErrorMessage message={msg.content} />

    }
    return <BotMessage content={msg.content} model={msg.model} />
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
        <SessionShell onSubmit={() => { }} loading={false} inputDisabled={false}>
            {session.messages.map((msg, i) => (
                <ChatMessage key={i} msg={msg} />
            ))}
        </SessionShell>
    )
}