# Mindbody Data Import Guide

Welcome to the Mindbody data import guide for FlexiWell. This comprehensive guide will help you migrate all your Mindbody data using spreadsheet templates.

## Overview

Import from Mindbody includes:
- Client profiles and contact information
- Class schedules and sessions
- Membership plans and subscriptions
- Purchase history and payments
- Attendance records
- Staff and instructor information

## Steps to Import Data

### 1. Export Your Data from Mindbody

Mindbody provides comprehensive export tools:

1. Log in to your **Mindbody Business** dashboard
2. Navigate to **Manager** → **Reports**
3. Export the following reports:

#### Client Data Export
- Go to **Reports** → **Clients** → **Client List**
- Select **All Clients** or filter by date
- Click **Export** → **CSV**
- Save as `mindbody-clients.csv`

#### Class Schedule Export
- Go to **Reports** → **Classes** → **Class Schedule**
- Select date range (recommended: next 3 months)
- Click **Export** → **CSV**
- Save as `mindbody-classes.csv`

#### Visit/Attendance Export
- Go to **Reports** → **Classes** → **Class Visits**
- Select historical date range
- Click **Export** → **CSV**
- Save as `mindbody-visits.csv`

#### Membership Export
- Go to **Reports** → **Clients** → **Client Contracts**
- Select **Active Contracts**
- Click **Export** → **CSV**
- Save as `mindbody-memberships.csv`

### 2. Download FlexiWell Import Templates

Download our standardized import templates:

- [📥 Client Import Template](https://flexiwell.com/templates/mindbody-clients-import.csv)
- [📥 Class Schedule Template](https://flexiwell.com/templates/mindbody-classes-import.csv)
- [📥 Membership Template](https://flexiwell.com/templates/mindbody-memberships-import.csv)
- [📥 Complete Import Package (ZIP)](https://flexiwell.com/templates/mindbody-complete-import.zip)

### 3. Map Your Data to FlexiWell Format

#### Client Information Mapping

| Mindbody Field | FlexiWell Field | Required | Notes |
|----------------|-----------------|----------|-------|
| First Name | first_name | Yes | Client's first name |
| Last Name | last_name | Yes | Client's last name |
| Email | email | Yes | Primary email |
| Mobile Phone | phone | Recommended | With country code |
| Home Phone | phone_alternate | No | Secondary phone |
| Birth Date | birth_date | No | Format: YYYY-MM-DD |
| Gender | gender | No | M/F/Other |
| Street | address_line1 | No | Street address |
| City | city | No | City name |
| State | state | No | State/Province |
| Postal Code | postal_code | No | ZIP/Postal code |
| Country | country | No | Country code (US, BR, etc.) |
| Liability Waiver | waiver_signed | No | true/false |
| Emergency Contact Name | emergency_contact_name | No | Full name |
| Emergency Contact Phone | emergency_contact_phone | No | Phone number |
| Notes | notes | No | Any additional notes |
| Referred By | referral_source | No | How they found you |
| Client ID | external_id | No | Mindbody client ID |

#### Class Schedule Mapping

| Mindbody Field | FlexiWell Field | Required | Notes |
|----------------|-----------------|----------|-------|
| Class Name | class_name | Yes | Name of class |
| Class Description | description | No | Description |
| Start Date | start_date | Yes | YYYY-MM-DD |
| Start Time | start_time | Yes | HH:MM (24h) |
| End Time | end_time | Yes | HH:MM (24h) |
| Duration | duration_minutes | No | In minutes |
| Staff | instructor_name | Recommended | Instructor name |
| Location | location | No | Room/location name |
| Max Capacity | max_capacity | Recommended | Maximum spots |
| Is Canceled | is_cancelled | No | true/false |
| Recurrence | recurrence_pattern | No | daily/weekly/monthly |
| Recurrence End Date | recurrence_end_date | No | When series ends |

#### Membership/Contract Mapping

| Mindbody Field | FlexiWell Field | Required | Notes |
|----------------|-----------------|----------|-------|
| Client Name | client_email | Yes | Match to client |
| Contract Name | membership_name | Yes | Plan name |
| Start Date | start_date | Yes | YYYY-MM-DD |
| Expiration Date | end_date | No | YYYY-MM-DD |
| Payment Amount | price | Yes | Monthly price |
| Billing Frequency | billing_frequency | No | monthly/weekly/annual |
| Auto-Renew | auto_renew | No | true/false |
| Status | status | Yes | active/paused/cancelled |

### 4. Format Guidelines

**Date Format:** YYYY-MM-DD (e.g., 2026-02-10)
**Time Format:** HH:MM in 24-hour format (e.g., 14:30 for 2:30 PM)
**Phone Format:** International format with + (e.g., +12125551234)
**Boolean Values:** true/false or yes/no
**Currency:** Numbers only, no currency symbols (e.g., 99.00 not $99.00)
**Encoding:** UTF-8

### 5. Upload to FlexiWell

#### Import Process

1. **Go to Settings** → **Integrations** → **Mindbody**
2. **Upload Files in Order:**
   - Step 1: Upload `clients.csv` first
   - Step 2: Upload `classes.csv` second
   - Step 3: Upload `memberships.csv` third
   - Step 4: Upload `visits.csv` last (optional)

3. **Review Each Import:**
   - Check validation errors
   - Review duplicate warnings
   - Confirm field mappings

4. **Complete Import:**
   - Click **Import Data** for each file
   - Wait for completion message
   - Review import summary

### 6. Post-Import Verification

After completing all imports:

1. **Verify Client Count:**
   - Go to **Clients** page
   - Check total count matches Mindbody
   - Spot-check random client profiles

2. **Verify Classes:**
   - Go to **Classes** page
   - Check class schedule accuracy
   - Verify instructor assignments

3. **Verify Memberships:**
   - Go to **Clients** → Select a client
   - Check membership status and dates
   - Verify pricing matches

4. **Review Import Logs:**
   - Check for any warnings or errors
   - Address any skipped records

## Common Issues & Solutions

### Issue: "Duplicate email address"
**Solution:**
- FlexiWell will merge records with the same email
- Review merge summary before confirming
- Manually resolve conflicts if needed

### Issue: "Invalid phone number format"
**Solution:**
- Add country code prefix (e.g., +1 for US)
- Remove special characters except +
- Format: +12125551234 (no spaces, dashes, or parentheses)

### Issue: "Class instructor not found"
**Solution:**
- Import staff/instructors first
- Or use instructor email instead of name
- Or leave blank and assign manually later

### Issue: "Membership dates in the past"
**Solution:**
- Historical memberships import as cancelled
- Check if you want to import only active memberships
- Adjust end_date to extend memberships

### Issue: "Special characters in names appear as �"
**Solution:**
- Save CSV with UTF-8 encoding
- In Excel: File → Save As → CSV UTF-8 (Comma delimited)
- In Google Sheets: File → Download → CSV

## Field Reference

### Client Required Fields

| Field | Example | Validation |
|-------|---------|------------|
| first_name | John | 1-50 characters |
| last_name | Smith | 1-50 characters |
| email | john@example.com | Valid email format |

### Client Optional Fields

| Field | Example | Notes |
|-------|---------|-------|
| phone | +12125551234 | International format |
| birth_date | 1990-05-15 | YYYY-MM-DD |
| gender | M | M/F/Other/Prefer not to say |
| address_line1 | 123 Main St | Street address |
| city | New York | City name |
| state | NY | State/Province code |
| postal_code | 10001 | ZIP/Postal code |
| country | US | 2-letter country code |

### Class Required Fields

| Field | Example | Validation |
|-------|---------|------------|
| class_name | Yoga Flow | 1-100 characters |
| start_date | 2026-02-15 | YYYY-MM-DD |
| start_time | 09:00 | HH:MM (24h) |
| end_time | 10:00 | HH:MM (24h) |

## Example Data

### Clients CSV Example
```csv
first_name,last_name,email,phone,birth_date,gender,address_line1,city,state,postal_code,country,external_id
John,Smith,john@example.com,+12125551234,1985-03-20,M,123 Main St,New York,NY,10001,US,MB12345
Sarah,Johnson,sarah@example.com,+12125555678,1990-07-15,F,456 Oak Ave,Brooklyn,NY,11201,US,MB12346
```

### Classes CSV Example
```csv
class_name,description,start_date,start_time,end_time,instructor_name,max_capacity,location,recurrence_pattern
Yoga Flow,Vinyasa flow for all levels,2026-02-15,09:00,10:00,Jane Doe,20,Studio A,weekly
HIIT Training,High intensity interval training,2026-02-15,18:00,19:00,Mike Brown,15,Studio B,weekly
```

### Memberships CSV Example
```csv
client_email,membership_name,start_date,end_date,price,billing_frequency,auto_renew,status
john@example.com,Unlimited Monthly,2026-01-01,2026-12-31,149.00,monthly,true,active
sarah@example.com,10-Class Pack,2026-02-01,2026-05-01,120.00,one-time,false,active
```

## Migration Checklist

- [ ] Export all data from Mindbody
- [ ] Download FlexiWell templates
- [ ] Map client data to template
- [ ] Map class data to template
- [ ] Map membership data to template
- [ ] Verify data formatting
- [ ] Upload clients first
- [ ] Upload classes second
- [ ] Upload memberships third
- [ ] Verify import counts
- [ ] Spot-check random records
- [ ] Review import logs
- [ ] Test booking system
- [ ] Notify clients of migration (optional)

## Tips for Successful Import

1. **Import During Off-Hours:** Schedule imports when fewer clients are active
2. **Backup Everything:** Keep copies of all original Mindbody exports
3. **Test First:** Import a small sample (10-20 records) before full import
4. **Clean Data First:** Remove test accounts and outdated records
5. **Standardize Names:** Ensure consistent naming for classes and instructors
6. **Document Changes:** Note any mapping decisions for future reference

## Advanced: Custom Field Mapping

If you have custom fields in Mindbody:

1. Note the custom field names and values
2. Contact FlexiWell support to set up matching custom fields
3. Add custom columns to your import template
4. Map data in your CSV

Example custom fields:
- Medical conditions
- Fitness goals
- Preferred class types
- Marketing preferences

## Need Help?

- **Live Chat:** Available in your FlexiWell dashboard
- **Email Support:** support@flexiwell.com
- **Video Tutorial:** [Watch Mindbody Import Tutorial](https://youtube.com/flexiwell-mindbody)
- **Schedule Call:** [Book migration assistance](https://calendly.com/flexiwell-support)
- **Full Documentation:** [docs.flexiwell.com](https://docs.flexiwell.com)

## What's Next?

After successful import:
1. Configure your class schedule
2. Set up automated notifications
3. Test client booking flow
4. Train staff on FlexiWell
5. Announce the migration to clients

---

Last updated: February 2026
