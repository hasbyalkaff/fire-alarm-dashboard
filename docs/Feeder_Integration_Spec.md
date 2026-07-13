# Feeder ↔ Dashboard Integration Specification

| Field | Value |
|---|---|
| **Document Owner** | System Architecture |
| **Version** | 1.0 |
| **Last Updated** | 2026-07-12 |
| **Status** | Contract — for Feeder team implementation |
| **Audience** | Modbus Database Feeder Service team |
| **Related** | `docs/Technical_Architecture.md` (v2.0), `docs/PRD_Fire_Alarm_Monitoring_Dashboard.md` (v1.2) |

---

## 1. Purpose & Scope

This document is the **contract** between the upstream **Modbus Database Feeder Service** (the "Feeder") and the **Fire Alarm Monitoring Dashboard** (the "Dashboard").

The Dashboard is **read-only** and never talks to Modbus. It depends on the Feeder for exactly **two things**, both over the **shared PostgreSQL database** — there is **no message broker** in v1:

1. **Domain data** — the Feeder writes current state + event history; the Dashboard reads it.
2. **Real-time signal** — the Feeder fires a PostgreSQL `NOTIFY` after each committed change; the Dashboard `LISTEN`s and pushes updates to browsers.

> **What the Feeder team must deliver:** (a) the domain tables/columns in §3, (b) a read-only DB role in §4, and (c) the `NOTIFY` behavior in §5. Nothing else about the Feeder's internals is constrained by this document.

```text
Modbus Feeder                          PostgreSQL                      Dashboard Backend
─────────────                          ──────────                      ─────────────────
1. write state + event  ───────────▶   facp.* tables      ◀─────────   SELECT (read-only role)
2. NOTIFY facp_events   ───────────▶   LISTEN/NOTIFY bus   ─────────▶   LISTEN facp_events
                                                                        then SELECT full row by id
                                                                        then relay to browsers via SSE
```

---

## 2. Design Principles (why it works this way)

- **PostgreSQL is the permanent source of truth.** All current state and history live in the DB.
- **`NOTIFY` is a signal, not a queue.** It is **not durable**. If no listener is connected, the notification is lost — that is expected and handled by reconciliation (§6).
- **Small payloads.** The `NOTIFY` payload carries only *what changed* and *its id*, never the full record. The Dashboard fetches the full row itself. This keeps the DB-level payload well under limits and keeps the DB the single authority for data shape.
- **Commit-before-notify.** The Feeder must `NOTIFY` **only after** the transaction that wrote the row has committed, so the row is guaranteed readable when the Dashboard reacts.

---

## 3. Domain Data Contract (tables the Dashboard reads)

The Dashboard reads the following tables (schema **`facp`**, or another agreed schema name). Column names/types below are the **minimum required**; the Feeder may have additional columns. Any breaking change to these must be version-coordinated (§8).

### 3.1 `facp.panels`
| Column | Type | Notes |
|---|---|---|
| `id` | `int` PK | |
| `name` | `text` | Human label, e.g. "Panel A" |
| `building` | `text` | Optional grouping |
| `location` | `text` | Optional |

### 3.2 `facp.zones`
| Column | Type | Notes |
|---|---|---|
| `id` | `int` PK | |
| `panel_id` | `int` FK → panels | |
| `name` | `text` | e.g. "Warehouse A" |
| `building` | `text` | Optional |

### 3.3 `facp.devices`
| Column | Type | Notes |
|---|---|---|
| `id` | `int` PK | |
| `zone_id` | `int` FK → zones | |
| `panel_id` | `int` FK → panels | |
| `address` | `int` | Modbus device address |
| `type` | `text` | One of: `smoke`, `heat`, `mcp`, `bell`, `buzzer`, `io` |
| `label` | `text` | e.g. "Smoke Detector 15" |
| `location` | `text` | Plain-language location |
| `register_map` | `text`/`jsonb` | Read-only display of register mapping |

### 3.4 `facp.device_current_status`
| Column | Type | Notes |
|---|---|---|
| `device_id` | `int` PK FK → devices | One row per device (current state) |
| `status` | `text` | One of: `normal`, `alarm`, `fault`, `offline` |
| `severity` | `text` | e.g. `critical`, `major`, `minor`, `info` (agree the set) |
| `last_update` | `timestamptz` | When state last changed |

### 3.5 `facp.alarm_events` (event history)
| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` PK | **Monotonic / gap-tolerant, strictly increasing** (see §6) |
| `device_id` | `int` FK | |
| `zone_id` | `int` FK | |
| `panel_id` | `int` FK | |
| `event_type` | `text` | One of: `alarm`, `fault`, `restore`, `online`, `offline` |
| `severity` | `text` | |
| `status` | `text` | `active` or `restored` |
| `created_at` | `timestamptz` | Event time (indexed, used for reconciliation ordering) |
| `restored_at` | `timestamptz` NULL | When cleared |

### 3.6 `facp.panel_status`
| Column | Type | Notes |
|---|---|---|
| `panel_id` | `int` PK FK | |
| `status` | `text` | `online` or `offline` |
| `last_communication` | `timestamptz` | |

### 3.7 `facp.panel_connection_log`
| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` PK | |
| `panel_id` | `int` FK | |
| `event` | `text` | `connect` or `disconnect` |
| `occurred_at` | `timestamptz` | |

### 3.8 Indexes requested on Feeder tables
To keep dashboard queries fast at 100 panels / ~20k devices / 5-yr history:

```sql
CREATE INDEX IF NOT EXISTS idx_alarm_events_created_at ON facp.alarm_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alarm_events_id         ON facp.alarm_events (id);
CREATE INDEX IF NOT EXISTS idx_alarm_events_filters    ON facp.alarm_events (panel_id, zone_id, device_id, severity, event_type);
CREATE INDEX IF NOT EXISTS idx_alarm_events_active     ON facp.alarm_events (status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_device_status_status    ON facp.device_current_status (status);
```

> **Retention:** `alarm_events` is retained **5 years**. Recommend **monthly range partitioning** on `created_at` so recent-window dashboard queries stay fast while old partitions remain for audit.

---

## 4. Database Access Boundary (roles the Feeder deployment must create)

The Dashboard must be **physically unable** to modify hardware-backed data — enforced at the PostgreSQL permission level, not only in application code.

```sql
-- Dashboard's read-only role for all domain (Feeder-owned) tables
CREATE ROLE dashboard_ro LOGIN PASSWORD '<set-in-secret>';
GRANT USAGE ON SCHEMA facp TO dashboard_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA facp TO dashboard_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA facp GRANT SELECT ON TABLES TO dashboard_ro;

-- dashboard_ro must also be allowed to LISTEN (LISTEN needs no table grant, only a DB connection)
GRANT CONNECT ON DATABASE <db> TO dashboard_ro;

-- The Dashboard owns a SEPARATE schema for its own data (users, sessions, audit, settings)
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION dashboard_rw;
```

- `dashboard_ro`: **SELECT-only** on `facp.*` + permission to `LISTEN`. **No INSERT/UPDATE/DELETE.**
- `dashboard_rw`: full rights **only** within the `app` schema (Dashboard-owned tables). No access to `facp.*` beyond SELECT.
- The Feeder keeps its own read/write role on `facp.*`; the Dashboard never uses it.

---

## 5. Real-Time Signal Contract (`LISTEN/NOTIFY`)

### 5.1 Channel
- **Channel name:** `facp_events` (exact, lowercase).
- The Feeder issues one `NOTIFY` per meaningful state change.

### 5.2 Payload
JSON string, **small** — event type + identifier **only**:

```json
{ "event": "alarm.created", "event_id": "88213" }
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `event` | string | ✅ | Event name from the enum in §5.3 |
| `event_id` | string | ✅ | The `id` of the row the Dashboard should fetch (usually `alarm_events.id`; for panel/device-status events, the affected `panel_id`/`device_id` — see §5.3) |

**Payload size:** must stay well within PostgreSQL's `NOTIFY` payload limit (**8000 bytes**). The contract above is ~40 bytes — do **not** add full record data.

### 5.3 Event enum & id semantics

| `event` | Fired when | `event_id` refers to | Dashboard fetches |
|---|---|---|---|
| `alarm.created` | New alarm becomes active | `alarm_events.id` | The event row + device/zone/panel labels |
| `alarm.restored` | Alarm clears | `alarm_events.id` | Updated event row (`status=restored`) |
| `fault.created` | Device enters fault | `alarm_events.id` | Event row |
| `fault.restored` | Fault clears | `alarm_events.id` | Event row |
| `device.status_changed` | Device current status changes | `device_id` | `device_current_status` row |
| `panel.status_changed` | Panel online/offline changes | `panel_id` | `panel_status` row |

> If the Feeder prefers a single generic `event` value (e.g. always `event.created`) plus the row id, that is acceptable **as long as** the Dashboard can read `event_type` from the fetched row. Confirm which approach during implementation kickoff; the enum above is preferred for clarity.

### 5.4 Ordering requirement — **commit before notify**

The `NOTIFY` **must be issued only after** the writing transaction commits. Two safe patterns:

**Option A — application-level (recommended):** commit first, then notify.
```sql
BEGIN;
  UPDATE facp.device_current_status SET status='alarm', severity='critical', last_update=now() WHERE device_id=15;
  INSERT INTO facp.alarm_events (device_id, zone_id, panel_id, event_type, severity, status, created_at)
    VALUES (15, 7, 3, 'alarm', 'critical', 'active', now());
COMMIT;
-- AFTER commit succeeds:
SELECT pg_notify('facp_events', json_build_object('event','alarm.created','event_id', currval('facp.alarm_events_id_seq')::text)::text);
```

> ⚠️ If `NOTIFY` runs **inside** the transaction, PostgreSQL delivers it only on commit anyway — but if you compute the payload inside the txn, ensure the row id is final. The simplest correct approach is: **commit, capture the new id, then `pg_notify`.**

**Option B — database trigger:** an `AFTER INSERT/UPDATE` trigger on the Feeder tables that calls `pg_notify`. This is transaction-safe by construction (fires on commit). Example:
```sql
CREATE OR REPLACE FUNCTION facp.notify_alarm_event() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('facp_events',
    json_build_object('event',
      CASE WHEN NEW.event_type='alarm' AND NEW.status='active' THEN 'alarm.created'
           WHEN NEW.event_type='alarm' THEN 'alarm.restored'
           WHEN NEW.event_type='fault' AND NEW.status='active' THEN 'fault.created'
           WHEN NEW.event_type='fault' THEN 'fault.restored'
           ELSE 'event.created' END,
      'event_id', NEW.id::text)::text);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_alarm_event
  AFTER INSERT OR UPDATE ON facp.alarm_events
  FOR EACH ROW EXECUTE FUNCTION facp.notify_alarm_event();
```
Add equivalent triggers for `device_current_status` and `panel_status` (using `device_id` / `panel_id` as `event_id`).

> Either option is acceptable. The Dashboard does not care *how* the `NOTIFY` is produced — only that it is **correct, post-commit, and matches the payload contract.**

---

## 6. Reconciliation Contract (non-durable NOTIFY)

Because `NOTIFY` is not durable, the Dashboard reconciles after any loss of its `LISTEN` connection. For this to work, the Feeder must guarantee:

1. **`alarm_events.id` is strictly increasing** (a `bigserial`/identity sequence is ideal). The Dashboard tracks the last id it processed and, on reconnect, runs:
   ```sql
   SELECT * FROM facp.alarm_events WHERE id > :last_processed_id ORDER BY id ASC;
   ```
2. **`created_at` is set at insert time** and never back-dated, so time-window queries (30–90 day dashboard view) are correct.
3. **Rows are immutable once created**, except the documented `status`/`restored_at` transition (active → restored). If a restore updates the same row, the Feeder should `NOTIFY` again (`alarm.restored`) so the Dashboard re-fetches it.

> These three guarantees are the only things reconciliation depends on. No dedup/offset table is required on the Feeder side.

---

## 7. Health & Freshness

The Dashboard exposes a `/health` endpoint that reports **Feeder freshness** by checking the most recent `last_communication` / `last_update` / event timestamp. To make this meaningful, the Feeder should:

- Keep `panel_status.last_communication` current on every successful poll (even when status is unchanged), so "stale data" can be distinguished from "nothing happened."
- (Optional) expose a heartbeat row or timestamp the Dashboard can read to confirm the Feeder itself is alive.

---

## 8. Versioning & Change Management

- This contract is **versioned** (see header). Any **breaking** change — renamed/removed column, changed enum value, changed channel name or payload shape — requires a coordinated version bump and a migration window.
- **Additive** changes (new nullable column, new optional event type) are backward-compatible and do not require a Dashboard release.
- Both teams should keep a shared changelog entry when either the domain schema or the `NOTIFY` payload changes.

---

## 9. Feeder Team Checklist

- [ ] Domain tables (§3) present with at least the required columns and enum values.
- [ ] Requested indexes (§3.8) created; retention/partitioning agreed.
- [ ] `dashboard_ro` role created with **SELECT-only** on `facp.*` + `LISTEN`/`CONNECT` (§4).
- [ ] `app` schema owned by `dashboard_rw`; Feeder role has no write path forced into it.
- [ ] `NOTIFY facp_events` fired **after commit** for every relevant change (§5.4).
- [ ] Payload matches `{ "event": "...", "event_id": "..." }` and stays tiny (§5.2).
- [ ] Event enum + `event_id` semantics agreed (§5.3).
- [ ] `alarm_events.id` strictly increasing; `created_at` set at insert; rows immutable except documented restore (§6).
- [ ] `panel_status.last_communication` updated on every successful poll (§7).

---

*End of Feeder Integration Specification — v1.0*
