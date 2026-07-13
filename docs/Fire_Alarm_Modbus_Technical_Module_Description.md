# Fire Alarm Monitoring System - Technical Module Description

## 1. Modbus Database Feeder Service

### Overview

Modbus Database Feeder Service merupakan background service yang
berfungsi sebagai middleware antara Fire Alarm Control Panel (FACP) dan
aplikasi monitoring. Service ini melakukan komunikasi dengan Ethernet
Gateway menggunakan Modbus TCP, melakukan polling register secara
periodik, menerjemahkan raw register menjadi domain object aplikasi,
mendeteksi perubahan status perangkat, memperbarui database, serta
mengirimkan event real-time kepada sistem monitoring.

Service ini berjalan secara terus-menerus (daemon/service) dan tidak
memiliki user interface.

------------------------------------------------------------------------

### Main Components

#### 1. Modbus Client

**Responsibilities** - Connect/disconnect ke Modbus Gateway - Read
Holding Registers - Read Input Registers - Read Coil - Read Discrete
Input - Retry ketika timeout - Reconnect ketika koneksi terputus

#### 2. Polling Scheduler

**Responsibilities** - Menjalankan polling berdasarkan interval -
Mengelompokkan register agar efisien - Mengatur polling multiple panel -
Retry policy - Timeout management

**Example Polling Rate**

  Register Group            Interval
  ------------------------- ------------
  Critical Alarm Register   1 second
  Device Status             2 seconds
  Power / Battery Status    10 seconds

#### 3. Register Decoder

**Responsibilities** - Decode uint16 - Decode float - Decode bitmask -
Decode string - Decode multi-register value

**Example**

Raw Register

``` text
40002 = 1
```

↓

Business Value

``` text
Fire Alarm Active
```

#### 4. Mapping Engine

**Responsibilities** - Mapping register ke device - Mapping device ke
zone - Mapping zone ke building - Mapping building ke panel

**Example**

``` text
Device Address 15
↓
Smoke Detector
↓
Warehouse A
↓
Smoke Detector - Warehouse A
```

#### 5. State Manager

**Responsibilities** - Cache current state - Compare previous state -
Detect status changes - Ignore duplicate state

**Example**

``` text
NORMAL
NORMAL
ALARM
ALARM
NORMAL
```

Hanya perubahan status yang diproses menjadi event.

#### 6. Alarm Processor

**Responsibilities** - Generate Alarm Event - Generate Fault Event -
Generate Restore Event - Generate Offline/Online Event - Determine
Severity - Apply Business Rules

#### 7. Database Writer

**Responsibilities** - Update current device status - Insert alarm
history - Insert communication log - Update panel status

**Main Tables**

-   device_current_status
-   alarm_events
-   panel_status
-   panel_connection_log

#### 8. Event Publisher

**Responsibilities** - Publish real-time events - Broadcast perubahan
status - Integrasi dengan Server-Sent Events (SSE)

**Example Event**

``` json
{
  "event": "alarm.created",
  "device": "Smoke Detector 15",
  "location": "Warehouse A"
}
```

#### 9. Health Monitor

**Responsibilities** - Monitor gateway connectivity - Monitor polling
latency - Monitor failure count - Last successful polling - Service
health monitoring

------------------------------------------------------------------------

### Data Flow

``` text
Modbus Gateway
      │
      ▼
Polling Scheduler
      │
      ▼
Modbus Client
      │
      ▼
Register Decoder
      │
      ▼
Mapping Engine
      │
      ▼
State Manager
      │
      ▼
Alarm Processor
      │
      ▼
Database Writer
      │
      ▼
Event Publisher
      │
      ▼
Monitoring Dashboard
```

------------------------------------------------------------------------

# 2. Fire Alarm Monitoring Dashboard

## Overview

Fire Alarm Monitoring Dashboard merupakan aplikasi fullstack yang
menyediakan visualisasi kondisi Fire Alarm System secara real-time.
Dashboard mengambil data awal melalui REST API dan menerima perubahan
status melalui Server-Sent Events (SSE). Dashboard tidak pernah
berkomunikasi langsung dengan Modbus, melainkan hanya mengonsumsi data
yang telah diproses oleh Modbus Database Feeder Service.

------------------------------------------------------------------------

## Main Components

### 1. Authentication

-   Login
-   JWT Authentication
-   Role-based Authorization
-   Session Management

### 2. Dashboard Summary

Menampilkan: - Panel Online - Panel Offline - Active Alarm - Active
Fault - Active Device - Last Update

### 3. Panel Monitoring

Menampilkan status setiap Fire Alarm Control Panel: - Online - Offline -
Last Communication

### 4. Zone Monitoring

Menampilkan kondisi setiap zona: - Normal - Alarm - Fault - Offline

### 5. Device Monitoring

Menampilkan seluruh perangkat: - Smoke Detector - Heat Detector - Manual
Call Point - Fire Bell - Buzzer - Input/Output Module

Setiap device memiliki: - Current Status - Severity - Location - Last
Update

### 6. Alarm Monitoring

Menampilkan alarm aktif: - Timestamp - Panel - Zone - Device -
Severity - Status

### 7. Event History

Fitur: - Timeline Event - Filter berdasarkan tanggal - Filter panel -
Filter zone - Filter device - Filter severity - Filter event type

### 8. Device Detail

Menampilkan: - Device Information - Current Status - Register Mapping -
Alarm History - Last Communication

### 9. Real-time Event Listener (SSE)

Responsibilities: - Connect ke SSE Endpoint - Auto Reconnect - Update
Dashboard - Update Counter - Update Alarm List - Update Panel Status

### 10. REST API Layer

Initial Data:

``` http
GET /dashboard
GET /panels
GET /zones
GET /devices
GET /alarms
GET /events
```

### 11. Reporting

Generate: - Daily Report - Monthly Report - Alarm Statistics - Fault
Statistics - Device Statistics

------------------------------------------------------------------------

## Dashboard Data Flow

``` text
REST API
     │
     ▼
Load Initial Data
     │
     ▼
Render Dashboard
     │
     ▼
Connect SSE
     │
     ▼
Receive Event
     │
     ▼
Update Components
     │
     ▼
Refresh Dashboard
```
