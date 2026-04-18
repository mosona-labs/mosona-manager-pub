# Public Preview Page API

## Purpose

This document is only for developing the public preview page.

It only includes APIs and routes that the public page itself needs:

- HTML entry routes
- Static asset route
- Public bootstrap API
- Public SSE API
- Response shapes used by the page

It does not include Team management/config APIs.

## Page Entry

### Path mode

`GET /preview/:name`

Example:

- `/preview/acme-status`

Use this when the public page is opened by custom name.

Behavior:

- If `:name` resolves to an enabled public page, backend serves the public preview HTML
- If not found, backend returns `404`

### Domain mode

Example:

- `https://status.example.com/`

Use this when the public page is opened by custom domain.

Behavior:

- If request host matches an enabled public page domain, backend serves the public preview HTML
- If not matched, request falls through to the normal site

### Static assets

`GET /preview-assets/*`

Examples:

- `/preview-assets/index.js`
- `/preview-assets/index.css`

Use this for all static assets of the public preview page.

## API Base

Base path:

- `/api/public`

Auth:

- Not required

Headers:

- Public page responses include `X-Robots-Tag: noindex`

## Frontend Flow

### Path mode flow

1. Read `name` from route params
2. Call `GET /api/public/preview/:name/bootstrap`
3. Render initial page state
4. Open `EventSource('/api/public/preview/:name/sse')`
5. On each `update` event, replace `servers`, `status`, `now`

### Domain mode flow

1. Call `GET /api/public/preview/bootstrap`
2. Render initial page state
3. Open `EventSource('/api/public/preview/sse')`
4. On each `update` event, replace `servers`, `status`, `now`

Important:

- In domain mode, always call APIs relative to current origin
- Do not hardcode another host

## Bootstrap API

### By name

`GET /api/public/preview/:name/bootstrap`

Example:

- `/api/public/preview/acme-status/bootstrap`

### By domain

`GET /api/public/preview/bootstrap`

Use this only when the page is opened from a custom domain.

### Success response

```json
{
  "code": "ok",
  "msg": "Success",
  "data": {
    "page": {
      "title": "Acme Status",
      "name": "acme-status",
      "domain": "status.example.com",
      "description": null
    },
    "servers": [
      {
        "id": 12,
        "name": "JP-1",
        "category": 3,
        "weight": 100,
        "os": "Ubuntu 24.04",
        "county": "JP",
        "area": "Japan",
        "open_time": "2026-04-18T11:00:00Z",
        "provider": "Oracle",
        "cycle": 1,
        "start_time": null,
        "end_time": null,
        "amount": "$5",
        "bandwidth": "1Gbps",
        "traffic": "1TB",
        "traffic_type": 2,
        "note_public": "Stable"
      }
    ],
    "status": {
      "12": {
        "cpu": 12.4,
        "mem_total_mb": 1024,
        "mem_used_mb": 512,
        "swap_total_mb": 0,
        "swap_used_mb": 0,
        "disk_total_gb": 25,
        "disk_used_gb": 7,
        "disk_read_kib_s": 0,
        "disk_write_kib_s": 0,
        "disk_read_iops": 0,
        "disk_write_iops": 0,
        "rx_kib_s": 8,
        "tx_kib_s": 3,
        "rx_total_mb": 180,
        "tx_total_mb": 90,
        "tcp_total": 45,
        "udp_total": 3,
        "time": "2026-04-18T18:00:00Z"
      }
    },
    "now": 1776506400
  }
}
```

### Response fields

`data.page`

```ts
type PublicPageSummary = {
  title: string
  name?: string | null
  domain?: string | null
  description?: string | null
}
```

Notes:

- `title` is always present
- `name` may be absent/null in domain mode
- `domain` may be absent/null in name-only mode
- `description` may be absent/null

`data.servers`

```ts
type PublicMonitor = {
  id: number
  name: string
  category: number
  weight: number
  os?: string | null
  county?: string | null
  area?: string | null
  open_time?: string | null
  provider?: string | null
  cycle?: number | null
  start_time?: string | null
  end_time?: string | null
  amount?: string | null
  bandwidth?: string | null
  traffic?: string | null
  traffic_type?: number | null
  note_public?: string | null
}
```

`data.status`

```ts
type ServerStatus = {
  cpu: number
  mem_total_mb: number
  mem_used_mb: number
  swap_total_mb: number
  swap_used_mb: number
  disk_total_gb: number
  disk_used_gb: number
  disk_read_kib_s: number
  disk_write_kib_s: number
  disk_read_iops: number
  disk_write_iops: number
  rx_kib_s: number
  tx_kib_s: number
  rx_total_mb: number
  tx_total_mb: number
  tcp_total: number
  udp_total: number
  time: string
}

type StatusMap = Record<string, ServerStatus>
```

Important:

- JSON object keys are strings
- Read status by `status[String(server.id)]`
- A server may have no latest status entry yet

`data.now`

```ts
type Now = number // unix seconds
```

## SSE API

### By name

`GET /api/public/preview/:name/sse`

Example:

- `/api/public/preview/acme-status/sse`

### By domain

`GET /api/public/preview/sse`

Use this only when the page is opened from a custom domain.

### Connection details

- Content-Type: `text/event-stream`
- Update interval: `5s`
- No auth required

### Event types

- `update`
- `error`

### `update` event

Example:

```text
event: update
data: {"servers":[...],"status":{"12":{"cpu":12.4}},"now":1776506400}
```

Payload shape:

```ts
type UpdateEventPayload = {
  servers: PublicMonitor[]
  status: StatusMap
  now: number
}
```

Notes:

- SSE payload does not include `page`
- Keep `page` from bootstrap response
- Replace `servers`, `status`, and `now` on each update

### `error` event

Example:

```text
event: error
data: {"msg":"Failed to load public preview data"}
```

Suggested frontend behavior:

- Keep last successful data on screen
- Mark UI as stale or reconnecting
- Let `EventSource` reconnect automatically

## Error Responses

### Not found

Used when the public page name/domain cannot be resolved.

Status:

- `404`

Body:

```json
{
  "code": "not_found",
  "msg": "Public page not found"
}
```

Suggested handling:

- Render dedicated "Public page not found" state

### Internal error

Status:

- `500`

Body example:

```json
{
  "code": "error",
  "msg": "Failed to load public preview data"
}
```

Suggested handling:

- Show retry UI for bootstrap failure
- For SSE failure, keep current data and wait for reconnect

## Frontend Notes

- Do not assume every server has a `status` entry
- Do not assume `description` exists
- Do not assume `domain` exists
- Do not assume detail/chart APIs exist yet
- The public page currently only needs bootstrap + SSE

## Minimal TypeScript Example

```ts
export type PublicPageSummary = {
  title: string
  name?: string | null
  domain?: string | null
  description?: string | null
}

export type PublicMonitor = {
  id: number
  name: string
  category: number
  weight: number
  os?: string | null
  county?: string | null
  area?: string | null
  open_time?: string | null
  provider?: string | null
  cycle?: number | null
  start_time?: string | null
  end_time?: string | null
  amount?: string | null
  bandwidth?: string | null
  traffic?: string | null
  traffic_type?: number | null
  note_public?: string | null
}

export type ServerStatus = {
  cpu: number
  mem_total_mb: number
  mem_used_mb: number
  swap_total_mb: number
  swap_used_mb: number
  disk_total_gb: number
  disk_used_gb: number
  disk_read_kib_s: number
  disk_write_kib_s: number
  disk_read_iops: number
  disk_write_iops: number
  rx_kib_s: number
  tx_kib_s: number
  rx_total_mb: number
  tx_total_mb: number
  tcp_total: number
  udp_total: number
  time: string
}

export type PublicBootstrapResponse = {
  code: string
  msg: string
  data: {
    page: PublicPageSummary
    servers: PublicMonitor[]
    status: Record<string, ServerStatus>
    now: number
  }
}

export type PublicSSEPayload = {
  servers: PublicMonitor[]
  status: Record<string, ServerStatus>
  now: number
}
```

## Endpoint Summary

Path mode:

- `GET /preview/:name`
- `GET /api/public/preview/:name/bootstrap`
- `GET /api/public/preview/:name/sse`

Domain mode:

- `GET /`
- `GET /api/public/preview/bootstrap`
- `GET /api/public/preview/sse`

Static assets:

- `GET /preview-assets/*`
