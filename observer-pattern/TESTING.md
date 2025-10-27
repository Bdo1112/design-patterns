# Observer Pattern - Testing Guide

## Architecture

- **DB Server (Subject)**: Port 3000 - Manages data and notifies observers
- **Caller Server (Observer)**: Port 3001 - Receives notifications via webhook

## How to Run

### Terminal 1 - Start DB Server
```bash
yarn dev:db
```

### Terminal 2 - Start Caller Server
```bash
yarn dev:caller
```

## Testing the Observer Pattern

### Step 1: Subscribe Caller to DB Server

```bash
curl -X POST http://localhost:3001/subscribe
```

You should see confirmation in both server terminals.

### Step 2: Add Data (triggers notification)

```bash
curl -X POST http://localhost:3000/data \
  -H "Content-Type: application/json" \
  -d '{"name": "User1", "value": "John Doe"}'
```

**Expected behavior:**
- DB Server: Adds data and notifies observers
- Caller Server: Receives webhook notification about DATA_ADDED

### Step 3: Update Data (triggers notification)

```bash
curl -X PUT http://localhost:3000/data/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "User1", "value": "Jane Doe"}'
```

**Expected behavior:**
- Caller Server receives DATA_UPDATED notification

### Step 4: Delete Data (triggers notification)

```bash
curl -X DELETE http://localhost:3000/data/1
```

**Expected behavior:**
- Caller Server receives DATA_DELETED notification

### Step 5: View Current Data

```bash
curl http://localhost:3000/data
```

### Step 6: View Subscribed Observers

```bash
curl http://localhost:3000/observers
```

### Step 7: Unsubscribe

```bash
curl -X POST http://localhost:3001/unsubscribe
```

After unsubscribing, the Caller will no longer receive notifications.

## Observer Pattern Components

### Subject (DB Server)
- ✅ Manages observer list
- ✅ subscribe() - adds observers
- ✅ unsubscribe() - removes observers
- ✅ notify() - sends webhooks to all observers
- ✅ Data operations trigger notifications

### Observer (Caller Server)
- ✅ Registers webhook URL with subject
- ✅ Receives notifications when data changes
- ✅ Processes events based on type
