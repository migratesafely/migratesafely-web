# Community Hardship Draw Request - Setup & Configuration

## Overview

The Community Hardship Draw Request feature allows active members to submit hardship requests via email. This is a **privacy-first, email-only** system with no database storage of sensitive hardship narratives.

---

## Environment Variables Required

Add these to your `.env.local` file:

```env
# SMTP Configuration for Hardship Request Emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
```

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password
   - Use this as `SMTP_PASS`

3. **Configure Variables:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hardshipdraw@migratesafely.com
SMTP_PASS=your-16-char-app-password
```

### Alternative SMTP Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-smtp-username
SMTP_PASS=your-mailgun-smtp-password
```

**AWS SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

---

## Feature Specifications

### Access Control
- **Visible to:** Logged-in members with `active` membership only
- **Location:** Dashboard → "Community Hardship Draw Request" card
- **Not visible to:** Guests, agents, inactive members, admins

### Submission Limits
- **Frequency:** 1 submission per calendar year per member
- **Enforcement:** Database flag (`last_hardship_request_year` in `profiles`)
- **Reset:** Automatic at year change (2026 → 2027)

### File Upload Rules
- **Max files:** 3
- **Max size:** 10MB per file
- **Allowed types:** PDF, JPG, PNG
- **Storage:** Temporary (attached to email only)
- **Retention:** Not stored after email sent

### Email Delivery
- **Recipient:** hardshipdraw@migratesafely.com
- **Subject:** `Community Hardship Draw Request – Membership #[NUMBER]`
- **Attachments:** Up to 3 files
- **Format:** Plain text with clear sections

---

## Database Schema

### Migration Applied
```sql
ALTER TABLE profiles 
ADD COLUMN last_hardship_request_year INTEGER;

COMMENT ON COLUMN profiles.last_hardship_request_year 
IS 'Tracks the year of the last Community Hardship Draw request submission (one per year limit)';
```

### Data Flow
1. User submits form → Frontend validation
2. Check `last_hardship_request_year` → Enforce annual limit
3. Send email with attachments → `hardshipdraw@migratesafely.com`
4. Update `last_hardship_request_year` → Current year
5. Show success confirmation

**No hardship narratives or evidence are stored in the database.**

---

## Form Fields

### Auto-filled (Read-only)
- Membership Number (from `memberships.membership_number`)
- Full Name (from `profiles.full_name`)
- Email (from `auth.users.email`)
- Country (from `profiles.country_code`)

### User Input (Required)
1. **Personal Background** (textarea)
   - Prompt: "Tell us briefly about yourself"
   - Validation: Required, non-empty

2. **Hardship Explanation** (textarea)
   - Prompt: "Explain your current hardship situation"
   - Validation: Required, non-empty

3. **Scam Declaration** (radio buttons)
   - Options: Yes / No
   - Validation: Required selection

4. **Scam Details** (conditional textarea)
   - Visible if: Scam Declaration = "Yes"
   - Prompt: "Describe the scam and how it affected you"
   - Validation: Required if visible

### Optional
- **Supporting Evidence** (file upload)
  - Up to 3 files (PDF, JPG, PNG)
  - Max 10MB each

---

## Email Template

```
Community Hardship Draw Request

Membership Number: 12345
Full Name: John Doe
Email: john.doe@example.com
Country: BD
Submission Date: 2026-01-24

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERSONAL BACKGROUND:
[User's personal background text]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HARDSHIP EXPLANATION:
[User's hardship explanation text]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCAM DECLARATION: YES

SCAM DETAILS & IMPACT:
[User's scam details if applicable]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ATTACHED EVIDENCE: 2 file(s)
- document1.pdf
- evidence-photo.jpg
```

---

## Testing Checklist

### Functional Tests

**Access Control:**
- [ ] Page accessible only when logged in
- [ ] Redirects to `/login` if not authenticated
- [ ] Visible only if `membership.status = 'active'`
- [ ] Shows error if membership inactive

**Submission Limit:**
- [ ] First submission of year → Success
- [ ] Second submission same year → Blocked with message
- [ ] Next calendar year → Allowed again

**Form Validation:**
- [ ] Empty personal background → Error
- [ ] Empty hardship explanation → Error
- [ ] No scam declaration selected → Error
- [ ] Scam = "Yes" but no details → Error
- [ ] Valid form → No errors

**File Upload:**
- [ ] Upload 1 file → Success
- [ ] Upload 3 files → Success
- [ ] Upload 4th file → Error message
- [ ] Upload 11MB file → Error message
- [ ] Upload .exe file → Error message
- [ ] Upload PDF/JPG/PNG → Success

**Email Delivery:**
- [ ] Email sent to hardshipdraw@migratesafely.com
- [ ] Subject includes membership number
- [ ] Body contains all form data
- [ ] Attachments included (if uploaded)
- [ ] Submission date present

**Post-Submission:**
- [ ] Success message displayed
- [ ] User redirected to confirmation screen
- [ ] `last_hardship_request_year` updated in DB
- [ ] Return to dashboard button works

### Edge Cases

- [ ] User closes browser mid-submission → No partial data stored
- [ ] Network failure during upload → Graceful error
- [ ] SMTP credentials invalid → Error logged, user notified
- [ ] Member membership expires after opening form → Block submission
- [ ] User submits Dec 31, 2026 → Can submit again Jan 1, 2027

### Security Tests

- [ ] Unauthenticated API call → 401 Unauthorized
- [ ] Invalid JWT token → 401 Unauthorized
- [ ] SQL injection attempts → Prevented by parameterized queries
- [ ] File path traversal → Prevented by formidable
- [ ] XSS in textarea → Sanitized (email plain text)

### Performance

- [ ] Form loads < 2 seconds
- [ ] File upload (3x10MB) completes < 30 seconds
- [ ] Email sends < 5 seconds
- [ ] No memory leaks after submission

---

## Troubleshooting

### Email Not Sending

**Check SMTP credentials:**
```bash
# Test SMTP connection
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'your@email.com', pass: 'your-password' }
});
transport.verify().then(console.log).catch(console.error);
"
```

**Common issues:**
- Gmail: App password not generated → Generate at myaccount.google.com/apppasswords
- Gmail: 2FA not enabled → Enable 2-factor authentication first
- Port blocked: Try port 465 (SSL) instead of 587 (TLS)
- Firewall: Check if outbound SMTP is blocked

### "Already Submitted This Year" Error

**Manual reset (admin only):**
```sql
-- Reset specific user's submission year
UPDATE profiles 
SET last_hardship_request_year = NULL 
WHERE id = 'user-uuid-here';

-- Verify
SELECT id, full_name, last_hardship_request_year 
FROM profiles 
WHERE id = 'user-uuid-here';
```

### File Upload Fails

**Check formidable installation:**
```bash
npm list formidable
# Should show formidable@latest
```

**Increase Next.js timeout (if needed):**
```javascript
// next.config.mjs
export default {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
};
```

---

## Privacy & Compliance

### Data Handling
- **Hardship narratives:** Never stored in database
- **Evidence files:** Temporary only (deleted after email sent)
- **Email recipient:** Secure inbox (hardshipdraw@migratesafely.com)
- **Member data:** Auto-filled from existing profile (no new PII collected)

### GDPR Compliance
- No sensitive data persistence
- Email-only workflow
- Member can request email deletion from recipient inbox
- No automated decision-making

### Security Measures
- Authentication required (JWT)
- File type validation
- File size limits
- SQL injection prevention (parameterized queries)
- XSS prevention (plain text email)

---

## Maintenance

### Annual Tasks
- [ ] Monitor email inbox: hardshipdraw@migratesafely.com
- [ ] Review submission patterns (by querying `last_hardship_request_year`)
- [ ] Update SMTP credentials if expired
- [ ] Test email delivery end-to-end

### Monitoring Queries

**Submissions this year:**
```sql
SELECT COUNT(*) 
FROM profiles 
WHERE last_hardship_request_year = EXTRACT(YEAR FROM NOW());
```

**Submissions by country:**
```sql
SELECT country_code, COUNT(*) as submissions
FROM profiles 
WHERE last_hardship_request_year = EXTRACT(YEAR FROM NOW())
GROUP BY country_code
ORDER BY submissions DESC;
```

**Members who can still submit:**
```sql
SELECT COUNT(*) 
FROM profiles p
JOIN memberships m ON p.id = m.user_id
WHERE m.status = 'active'
  AND (p.last_hardship_request_year IS NULL 
    OR p.last_hardship_request_year < EXTRACT(YEAR FROM NOW()));
```

---

## Success Criteria

✅ **Implemented:**
- [x] Page accessible only to active members
- [x] One submission per year enforced
- [x] Email sent with all form data and attachments
- [x] No database storage of hardship narratives
- [x] File upload (max 3, 10MB each, PDF/JPG/PNG)
- [x] Success confirmation shown
- [x] Dashboard integration complete

✅ **Zero Performance Impact:**
- [x] No additional database tables
- [x] No background jobs
- [x] Minimal API overhead
- [x] Email async (non-blocking)

✅ **Privacy-First:**
- [x] No sensitive data stored
- [x] Email-only workflow
- [x] GDPR compliant
- [x] Secure file handling

---

## Support

For issues or questions:
- Technical: Check Next.js logs and email delivery logs
- Member support: Direct members to support@migratesafely.com
- Hardship review: Check hardshipdraw@migratesafely.com inbox

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-24  
**Feature Status:** ✅ Production Ready