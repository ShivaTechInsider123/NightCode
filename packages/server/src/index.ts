import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import sessionRouter from "./routes/sessions"
import chat from "./routes/chat"
import auth from "./routes/auth"
import billing from "./routes/billing"
import { sentry } from '@sentry/hono/bun'
import * as Sentry from "@sentry/hono/bun";
import { requireAuth } from './middleware/require-auth'


const app = new Hono()


app.use(
    sentry(app, {
        dsn: "https://aa974ebe0622ea69ff4041aae86a35b9@o4511675848523776.ingest.us.sentry.io/4512293012439040",
        tracesSampleRate: 1.0,
    }),
);


app.get("/debug-sentry", () => {
    // Send a log before throwing the error
    Sentry.logger.info('User triggered test error', {
        action: 'test_error_endpoint',
    });
    // Send a test metric before throwing the error
    Sentry.metrics.count('test_counter', 1);
    throw new Error("My first Sentry error!");
});

app.onError((error, c) => {
    if (error instanceof HTTPException) {
        Sentry.logger.warn("Handled Http Error", {
            staus: error.status,
            message: error.message,
            path: c.req.path,
            method: c.req.method
        })
        return c.json({
            error: error.message || "Request Failed"
        }, error.status)
    }

    Sentry.logger.error("Ungandled server error", {
        path: c.req.path,
        method: c.req.method,
        message: error instanceof Error ? error.message : "Unkown error"
    })

    return c.json({ error: "Internal server error" }, 500)
})

app.use("/sessions/*", requireAuth)
app.use("/chat/*", requireAuth)
app.use("/billing/checkout", requireAuth)
app.use("/billing/portal", requireAuth)

const routes = app
    .route("/auth", auth)
    .route("/billing", billing)
    .route("/sessions", sessionRouter)
    .route("/chat", chat);

export type AppType = typeof routes
export default { port: 3000, fetch: app.fetch, idleTimeout: 255 }   