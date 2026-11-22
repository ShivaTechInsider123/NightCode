import { createPolar } from "@polar-sh/sdk/2026-10"

type PolarServer = "sandbox" | "production"

function getRequiredEnv(name: string) {
    const value = process.env[name]
    if (!value) {
        throw new Error(`${name} environment variable is required.`)
    }
    return value
}


export function getPolarAccessToken() {
    return getRequiredEnv("POLAR_ACCESS_TOKEN")
}

export function getPolarProductId() {
    return getRequiredEnv("POLAR_PRODUCT_ID")
}

export function getPolarCreditsMeterId() {
    return getRequiredEnv("POLAR_CREDITS_METER_ID")
}

export function getPolarServer(): PolarServer {
    const server = process.env.POLAR_SERVER
    if (!server) {
        return "sandbox"
    }
    if (server !== "sandbox" && server !== "production") {
        throw new Error("POLAR SERVER must be either sanbox or production")
    }
    return server
}

const polar = createPolar({
    accessToken: getPolarAccessToken(),
    environment: getPolarServer()
})


function hasStatusCode(error: unknown): error is { statusCode: number } {
    return (
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        typeof error.statusCode === "number"
    )
}


type CreateCheckoutUrlParams = {
    customerExternalId: string,
    requestUrl: string
}


export async function createCheckoutUrl({
    customerExternalId,
    requestUrl
}: CreateCheckoutUrlParams) {
    const result = await polar.checkouts.create({
        products: [getPolarProductId()],
        success_url: new URL("/billing/success", requestUrl).toString(),
        external_customer_id: customerExternalId,
        metadata: { source: "nightcode-cli" },
    })

    return result.url
}

export async function createCustomerPortalUrl({
    customerExternalId,
    requestUrl
}: CreateCheckoutUrlParams) {
    const result = await polar.customerSessions.create({
        external_customer_id: customerExternalId,
        return_url: new URL("/billing/success", requestUrl).toString()
    })

    return result.customer_portal_url
}

export async function getAvailableCreditBalance(customerExternalId: string) {
    try {
        const cutomerState = await polar.customers.getStateExternal(customerExternalId)

        const matchingMeters = cutomerState.active_meters.filter(
            (meter) => meter.meter_id === getPolarCreditsMeterId()
        )

        if (matchingMeters.length > 1) {
            throw new Error("Expected exactly one matching polar credit meter")
        }

        const creditMeter = matchingMeters[0]
        return creditMeter?.balance ?? 0
    } catch (error) {
        if (hasStatusCode(error) && error.statusCode === 404) {
            return 0
        }

        throw error
    }
}


type InngestAiUsageParams = {
    externalCustomerId: string,
    eventId: string,
    credits: number
}

export async function inngestAiUsage({
    externalCustomerId,
    eventId,
    credits
}: InngestAiUsageParams) {
    await polar.events.ingest({
        events: [
            {
                name: "nightcode_usage",
                external_id: eventId,
                external_customer_id: externalCustomerId,
                metadata: { credits },
            },
        ],
    });
}

