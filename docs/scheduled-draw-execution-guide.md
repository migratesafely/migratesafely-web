# Scheduled Prize Draw Execution & Notification System

## System Overview

This document describes the automated prize draw execution system implemented in PROMPT A5.3. The system automatically executes prize draws at their scheduled time without manual intervention.

---

## Architecture

### Components

1. **Edge Function**: `execute-scheduled-draws`
   - Runs on Supabase Edge Runtime (Deno)
   - Triggered by cron schedule or manual invocation
   - Stateless and idempotent

2. **Database Functions**:
   - `select_random_winners()` - Winner selection logic
   - `generate_draw_report()` - Immutable audit records
   - `queue_winner_notifications()` - Notification dispatch
   - `validate_draw_execution_safety()` - Pre-execution checks

3. **Service Layer**:
   - `scheduledDrawExecutor.ts` - Client-side monitoring
   - `prizeNotificationService.ts` - Notification management
   - `prizeDrawService.ts` - Core draw operations

---

## Execution Flow

### 1. Scheduled Trigger (Automated)

```
Cron Schedule: Every 5 minutes
  ↓
Edge Function: execute-scheduled-draws
  ↓
Query: Find draws where:
  - status = 'active'
  - executed_at IS NULL
  - draw_date <= TODAY
  - draw_time <= NOW
  ↓
For each due draw:
  ├─ Lock draw (status → 'executing')
  ├─ Validate safety checks
  ├─ Select random winners
  ├─ Process payouts
  ├─ Generate report
  ├─ Queue notifications
  └─ Mark complete (status → 'completed', executed_at = NOW)
```

### 2. Manual Trigger (Admin Fallback)

```
Admin Dashboard
  ↓
"Execute Draw" Button
  ↓
manuallyExecuteDraw(drawId)
  ↓
Edge Function with manual flag
  ↓
Execute single draw immediately
```

---

## Idempotency Guarantees

### Double Execution Prevention

1. **Status Lock**:
   ```sql
   UPDATE prize_draws 
   SET status = 'executing'
   WHERE id = draw_id 
     AND status = 'active'
     AND executed_at IS NULL;
   ```
   - Only one process can transition to 'executing'
   - Subsequent attempts return 0 rows affected

2. **Executed Timestamp**:
   ```sql
   SELECT * FROM prize_draws
   WHERE executed_at IS NOT NULL;
   ```
   - Once set, draw is permanently marked as executed
   - Query excludes already-executed draws

3. **Winner Uniqueness**:
   ```sql
   CONSTRAINT unique_draw_entry_winner 
     UNIQUE (draw_id, winner_user_id)
   ```
   - Prevents duplicate winner records
   - Database-level enforcement

---

## Safety Validations

### Pre-Execution Checks

```typescript
function validate_draw_execution_safety(p_draw_id UUID) {
  // 1. Draw exists and is active
  // 2. Entry cutoff time has passed
  // 3. Fairness lock is enabled
  // 4. Prizes are configured
  // 5. Sufficient pool balance
  // 6. Not already executed
}
```

### Failure Handling

```typescript
try {
  // Execution logic
} catch (error) {
  // 1. Rollback status to 'active'
  // 2. Log error to audit_logs
  // 3. Set execution_error field
  // 4. Notify admins of failure
  // 5. Draw remains unexecuted (can retry)
}
```

---

## Notification System

### Notification Queue

```sql
CREATE TABLE prize_notification_queue (
  id UUID PRIMARY KEY,
  draw_id UUID,
  recipient_user_id UUID,
  notification_type TEXT,
  template_data JSONB,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ
);
```

### Notification Types

1. **winner_announcement**
   - Recipient: Winner user
   - Template: "🎉 Congratulations! You Won {prize_title}"
   - Content: Prize amount, draw name, claim instructions

2. **non_winner**
   - Recipient: All entrants who didn't win
   - Template: "Thank you for participating"
   - Content: Encouragement, next draw teaser

3. **admin_summary**
   - Recipient: Super Admin, Manager Admin
   - Template: "Prize Draw Completed: {draw_name}"
   - Content: Winner count, total awarded, leftover amount

4. **next_draw_teaser**
   - Recipient: All active members
   - Template: "Next Prize Draw Coming Soon!"
   - Content: Generic encouragement (NO amounts or logic)

### Internal Notification Flow

```
Queue Notification
  ↓
Insert into prize_notification_queue
  ↓
Background Processor (separate job)
  ↓
Create message in messages table
  ↓
Create recipient in message_recipients
  ↓
Mark notification as sent
  ↓
User sees in dashboard inbox
```

### Email Integration (Optional)

```typescript
// Email-ready export
const emailBatch = await exportEmailReadyNotifications();
// Returns:
// [
//   {
//     recipient_email: "user@example.com",
//     subject: "Congratulations! You Won 20 Lakhs BDT",
//     body: "...",
//     template_type: "winner_announcement"
//   }
// ]

// Send via external email service (Supabase Edge Function, SendGrid, etc.)
// NOT REQUIRED for internal notifications to work
```

---

## Monitoring & Admin Tools

### Edge Function Health Check

```typescript
// Test if Edge Function is responsive
const { healthy, error } = await healthCheckExecutor();

if (!healthy) {
  console.error("Edge Function not responding:", error);
}
```

### Get Due Draws

```typescript
// Admin dashboard monitoring
const dueDraws = await getDueDraws();
// Returns:
// [
//   {
//     drawId: "uuid",
//     drawName: "Europe Migration Support Package",
//     scheduledTime: "2026-02-15T20:00:00Z",
//     isDue: true,
//     isOverdue: false
//   }
// ]
```

### Manual Execution (Fallback)

```typescript
// Admin triggers execution manually
const result = await manuallyExecuteDraw(drawId);

if (result.success) {
  console.log(`Winners: ${result.winnersSelected}`);
  console.log(`Total Awarded: ${result.totalAwarded} BDT`);
} else {
  console.error(`Execution failed: ${result.error}`);
}
```

### Execution Status

```typescript
// Check if draw has executed
const status = await getDrawExecutionStatus(drawId);
// Returns:
// {
//   status: "completed",
//   executedAt: "2026-02-15T20:00:05Z",
//   winnersSelected: 10,
//   totalAwarded: 45000,
//   leftoverAmount: 5000
// }
```

---

## Cron Configuration

### Supabase Edge Function Cron

**Recommended Schedule**: Every 5 minutes

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule Edge Function invocation
SELECT cron.schedule(
  'execute-prize-draws',
  '*/5 * * * *',  -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/execute-scheduled-draws',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

### Vercel Cron (Alternative)

**File**: `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/execute-draws",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**API Route**: `src/pages/api/cron/execute-draws.ts`
```typescript
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data, error } = await supabase.functions.invoke(
    "execute-scheduled-draws"
  );

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
}
```

---

## Production Checklist

### Before Enabling Automation

- [ ] Edge Function deployed successfully
- [ ] Database functions created (select_random_winners, etc.)
- [ ] Cron schedule configured
- [ ] Test draw executed manually (verify flow)
- [ ] Notification queue tested
- [ ] Admin monitoring dashboard working
- [ ] Audit logs capturing all events

### SMTP Configuration (Optional)

- [ ] Email service provider configured (SendGrid, AWS SES, etc.)
- [ ] SMTP credentials in environment variables
- [ ] Email templates tested
- [ ] Unsubscribe links included
- [ ] Spam score checked

### Monitoring Alerts

- [ ] Draw execution failures trigger admin alerts
- [ ] Edge Function errors logged to Supabase
- [ ] Wallet credit failures escalated immediately
- [ ] Double execution detected → auto-rollback

---

## Troubleshooting

### Draw Not Executing

**Symptoms**: Draw time has passed, but status still 'active'

**Checks**:
1. Verify Edge Function is deployed:
   ```bash
   supabase functions list
   ```

2. Check draw configuration:
   ```sql
   SELECT draw_date, draw_time, status, executed_at
   FROM prize_draws
   WHERE id = 'draw-uuid';
   ```

3. Verify cron is running:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'execute-prize-draws';
   ```

4. Check Edge Function logs:
   ```bash
   supabase functions logs execute-scheduled-draws
   ```

### Double Execution Detected

**Symptoms**: Same winner listed twice

**Response**:
1. Database constraint should prevent this (unique_draw_entry_winner)
2. If detected, check audit_logs for duplicate execution timestamps
3. Rollback duplicate winner records manually
4. Investigate idempotency failure

### Notification Queue Stuck

**Symptoms**: Notifications in 'pending' status for extended period

**Checks**:
1. Check notification processor is running
2. Verify message creation permissions
3. Check for database errors in logs
4. Process queue manually:
   ```typescript
   const result = await processNotificationQueue(100);
   console.log(`Processed: ${result.processed}, Failed: ${result.failed}`);
   ```

---

## API Reference

### Edge Function Endpoints

**Execute Scheduled Draws**
```
POST https://PROJECT_REF.supabase.co/functions/v1/execute-scheduled-draws
Authorization: Bearer ANON_KEY

Response:
{
  "success": true,
  "drawsProcessed": 2,
  "totalWinnersSelected": 20,
  "totalAwarded": 90000
}
```

**Manual Draw Execution**
```
POST https://PROJECT_REF.supabase.co/functions/v1/execute-scheduled-draws
Authorization: Bearer ANON_KEY
Content-Type: application/json

{
  "manualDrawId": "uuid"
}

Response:
{
  "success": true,
  "winnersSelected": 10,
  "totalAwarded": 45000
}
```

**Health Check**
```
POST https://PROJECT_REF.supabase.co/functions/v1/execute-scheduled-draws
Authorization: Bearer ANON_KEY
Content-Type: application/json

{
  "healthCheck": true
}

Response:
{
  "healthy": true,
  "timestamp": "2026-01-30T17:00:00Z"
}
```

---

## Security Considerations

### Member Visibility (ZERO EXPOSURE)

Members CANNOT see:
- ❌ Execution logic
- ❌ Pool balances or splits
- ❌ Notification queue
- ❌ Admin endpoints
- ❌ Edge Function URLs

Members CAN see:
- ✅ Draw results (after completion)
- ✅ Personal win/lose notification
- ✅ Total prize pool balance (read-only)

### Authentication

- Edge Function: Requires Supabase anon key (public, but rate-limited)
- Manual execution: Requires Super Admin session
- Database functions: RLS policies enforced
- Cron endpoints: Secret token required (Vercel cron)

---

## Performance Metrics

### Expected Performance

- Draw execution time: 2-5 seconds (100 entries)
- Draw execution time: 10-20 seconds (1000 entries)
- Winner selection: O(n log n) complexity
- Notification queue: Batch processing (100 per cycle)

### Resource Usage

- Edge Function: Cold start ~500ms, warm ~50ms
- Database: Indexed queries for due draws
- Memory: < 128MB per execution

---

## Future Enhancements

### Potential Improvements

1. **Real-time Draw Streaming**
   - WebSocket connection for live winner announcement
   - Animated countdown on member dashboard

2. **Email Campaign Integration**
   - Automated email sequences
   - Winner announcement broadcast
   - Draw reminder notifications

3. **Multi-Region Support**
   - Extend beyond Bangladesh
   - Timezone-aware execution
   - Currency conversion

4. **Advanced Analytics**
   - Draw performance metrics
   - Winner demographics
   - Pool utilization trends

---

## Support

For issues or questions:
- Check Edge Function logs: `supabase functions logs`
- Review audit logs: Query `audit_logs` table
- Monitor draw status: Admin dashboard `/admin/prize-draws`
- Manual fallback: Use "Execute Draw" button in admin portal

---

**Last Updated**: 2026-01-30  
**System Version**: A5.3 (Production Ready)  
**Status**: ✅ Automated Execution Enabled