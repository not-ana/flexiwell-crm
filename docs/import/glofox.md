# Glofox Data Import Guide

Welcome to the Glofox data import guide for FlexiWell. This guide will help you seamlessly migrate your Glofox data using spreadsheet templates.

## Overview

Migrate from Glofox with ease:
- Member profiles and contact details
- Class schedules and bookings
- Membership plans and packages
- Booking history
- Payment records
- Staff information

## Steps to Import Data

### 1. Export Your Data from Glofox

Glofox provides data export functionality through their platform:

1. Log in to your **Glofox Dashboard**
2. Navigate to **Reports** section
3. Export the following data:

#### Members Export
- Go to **Members** → **All Members**
- Click **Export** (top right)
- Select **All Fields**
- Choose **CSV format**
- Save as `glofox-members.csv`

#### Classes Export
- Go to **Schedule** → **Classes**
- Select date range (recommend next 90 days)
- Click **Export Schedule**
- Save as `glofox-classes.csv`

#### Bookings Export
- Go to **Bookings** → **All Bookings**
- Filter by date range if needed
- Click **Export**
- Save as `glofox-bookings.csv`

#### Memberships Export
- Go to **Members** → **Memberships**
- Select **Active** and **Expiring** memberships
- Click **Export**
- Save as `glofox-memberships.csv`

**Note:** If you need assistance exporting data, contact Glofox support at support@glofox.com

### 2. Download FlexiWell Import Templates

Download our templates designed for Glofox migration:

- [📥 Member Import Template](https://flexiwell.com/templates/glofox-members-import.csv)
- [📥 Class Schedule Template](https://flexiwell.com/templates/glofox-classes-import.csv)
- [📥 Membership Plans Template](https://flexiwell.com/templates/glofox-memberships-import.csv)
- [📥 Complete Import Kit (ZIP)](https://flexiwell.com/templates/glofox-complete-import.zip)

### 3. Map Your Data to FlexiWell Format

#### Member Information Mapping

| Glofox Field | FlexiWell Field | Required | Notes |
|--------------|-----------------|----------|-------|
| First Name | first_name | Yes | Member's first name |
| Last Name | last_name | Yes | Member's last name |
| Email Address | email | Yes | Primary email |
| Mobile Number | phone | Recommended | Include country code |
| Date of Birth | birth_date | No | YYYY-MM-DD format |
| Gender | gender | No | M/F/Other |
| Address Line 1 | address_line1 | No | Street address |
| Address Line 2 | address_line2 | No | Apt/Unit number |
| City | city | No | City name |
| Country | country | No | Country code |
| Postcode | postal_code | No | ZIP/Postal code |
| Emergency Contact | emergency_contact_name | No | Full name |
| Emergency Number | emergency_contact_phone | No | Phone number |
| Medical Conditions | medical_notes | No | Any relevant conditions |
| Member Since | registration_date | No | YYYY-MM-DD |
| Member ID | external_id | No | Glofox member ID |
| Profile Photo URL | photo_url | No | URL to photo |

#### Class Schedule Mapping

| Glofox Field | FlexiWell Field | Required | Notes |
|--------------|-----------------|----------|-------|
| Class Name | class_name | Yes | Name of the class |
| Description | description | No | Class description |
| Class Type | class_type | No | Type/category |
| Date | start_date | Yes | YYYY-MM-DD |
| Start Time | start_time | Yes | HH:MM (24h) |
| End Time | end_time | Yes | HH:MM (24h) |
| Duration | duration_minutes | No | Length in minutes |
| Instructor | instructor_name | Recommended | Instructor name |
| Location/Room | location | No | Room name |
| Max Bookings | max_capacity | Recommended | Maximum attendees |
| Bookings Made | current_bookings | No | Current count |
| Recurring | is_recurring | No | true/false |
| Recurrence Type | recurrence_pattern | No | weekly/daily |

#### Membership Plan Mapping

| Glofox Field | FlexiWell Field | Required | Notes |
|--------------|-----------------|----------|-------|
| Member Email | client_email | Yes | Link to member |
| Plan Name | plan_name | Yes | Membership plan name |
| Plan Type | plan_type | No | unlimited/class-pack |
| Start Date | start_date | Yes | YYYY-MM-DD |
| End Date | end_date | No | YYYY-MM-DD (if applicable) |
| Price | price | Yes | Monthly/plan price |
| Billing Cycle | billing_frequency | No | monthly/weekly/annual |
| Classes Remaining | credits_remaining | No | For class packs |
| Status | status | Yes | active/paused/expired |
| Auto-Renew | auto_renew | No | true/false |

### 4. Format Guidelines

**Required Formats:**
- **Dates:** YYYY-MM-DD (e.g., 2026-02-10)
- **Times:** HH:MM in 24-hour format (e.g., 18:30)
- **Phone:** International format +[country code][number] (e.g., +353851234567 for Ireland)
- **Email:** Valid email addresses
- **Boolean:** true/false
- **Numbers:** No currency symbols (e.g., 99.00 not €99.00)

**Character Encoding:** UTF-8 (for Irish and international characters)

**Currency Note:** FlexiWell will use your account's default currency. Just enter numbers without symbols.

### 5. Upload to FlexiWell

#### Import Sequence (Important!)

1. **Import Members First**
   - Go to **Settings** → **Integrations** → **Glofox**
   - Click **Import Members**
   - Upload your formatted members CSV
   - Review preview and validation
   - Click **Import**
   - Wait for completion

2. **Import Classes Second**
   - Click **Import Classes**
   - Upload your classes CSV
   - Map instructors if needed
   - Click **Import**

3. **Import Memberships Last**
   - Click **Import Memberships**
   - Upload your memberships CSV
   - Verify member linking
   - Click **Import**

### 6. Verify Your Import

Post-import checklist:

1. **Check Member Count:**
   - Navigate to **Members** page
   - Verify total count matches Glofox
   - Spot-check 10-20 random member profiles

2. **Verify Class Schedule:**
   - Go to **Classes** → **Schedule**
   - Check upcoming classes match Glofox
   - Verify instructors are assigned correctly

3. **Check Memberships:**
   - Select random members
   - Verify their membership status
   - Check expiration dates
   - Confirm pricing matches

4. **Review Import Logs:**
   - Click **View Import Log**
   - Check for any warnings
   - Address any skipped records

## Common Issues & Solutions

### Issue: "Duplicate email found"
**Solution:**
- Glofox may have had duplicate emails
- FlexiWell will merge records with same email
- Review merge summary
- Manually fix if needed via **Members** → **Merge Duplicates**

### Issue: "Invalid phone number for Ireland/UK"
**Solution:**
- Irish mobile: +353[85/86/87/88/89]xxxxxxx
- UK mobile: +44[7]xxxxxxxxx
- Remove spaces, dashes, and parentheses
- Include country code with +

### Issue: "Member not found for membership"
**Solution:**
- Ensure members are imported first
- Check that email in membership file matches member email exactly
- Check for typos in email addresses

### Issue: "Class capacity exceeded"
**Solution:**
- This is a warning, not an error
- Indicates more bookings than capacity in historical data
- FlexiWell will import all bookings
- You can adjust capacity manually after import

### Issue: "Special characters (é, í, ó, etc.) not displaying"
**Solution:**
- Save CSV with UTF-8 encoding
- In Excel: File → Save As → CSV UTF-8
- In Google Sheets: Download → CSV automatically uses UTF-8

## Field Reference

### Member Required Fields

| Field | Example | Validation |
|-------|---------|------------|
| first_name | Aoife | 1-50 characters |
| last_name | O'Brien | 1-50 characters |
| email | aoife@example.ie | Valid email format |

### Member Optional Fields

| Field | Example | Notes |
|-------|---------|-------|
| phone | +353851234567 | International format |
| birth_date | 1995-06-20 | YYYY-MM-DD |
| gender | F | M/F/Other |
| address_line1 | 15 Grafton Street | Street address |
| city | Dublin | City name |
| postal_code | D02 | Eircode/Postcode |
| country | IE | 2-letter code (IE, UK, US, etc.) |
| medical_notes | Knee injury | Any relevant info |

### Class Required Fields

| Field | Example | Validation |
|-------|---------|------------|
| class_name | CrossFit WOD | 1-100 characters |
| start_date | 2026-02-15 | YYYY-MM-DD |
| start_time | 06:00 | HH:MM (24h format) |
| end_time | 07:00 | HH:MM (24h format) |

## Example Data

### Members CSV Example
```csv
first_name,last_name,email,phone,birth_date,gender,address_line1,city,postal_code,country,external_id
Aoife,O'Brien,aoife@example.ie,+353851234567,1995-06-20,F,15 Grafton Street,Dublin,D02,IE,GLX12345
Cian,Murphy,cian@example.ie,+353861234567,1988-03-15,M,42 Camden Street,Dublin,D08,IE,GLX12346
```

### Classes CSV Example
```csv
class_name,description,start_date,start_time,end_time,instructor_name,max_capacity,location,is_recurring,recurrence_pattern
CrossFit WOD,Daily workout of the day,2026-02-15,06:00,07:00,John Smith,20,Main Gym,true,daily
Yoga Flow,Vinyasa flow class,2026-02-15,18:30,19:30,Sarah O'Connor,15,Studio 1,true,weekly
```

### Memberships CSV Example
```csv
client_email,plan_name,start_date,end_date,price,billing_frequency,auto_renew,status,credits_remaining
aoife@example.ie,Unlimited Monthly,2026-01-01,2026-12-31,129.00,monthly,true,active,
cian@example.ie,10 Class Pack,2026-02-01,2026-05-01,100.00,one-time,false,active,8
```

## Migration Checklist

- [ ] Export all data from Glofox
- [ ] Download FlexiWell import templates
- [ ] Map member data to template
- [ ] Map class schedule to template
- [ ] Map membership data to template
- [ ] Verify all phone numbers have country codes
- [ ] Check date formats (YYYY-MM-DD)
- [ ] Verify UTF-8 encoding for special characters
- [ ] Import members (step 1)
- [ ] Import classes (step 2)
- [ ] Import memberships (step 3)
- [ ] Verify import counts
- [ ] Spot-check member profiles
- [ ] Test booking system
- [ ] Review import logs
- [ ] Notify members of platform change

## Tips for Successful Import

1. **Timing:** Perform migration during off-peak hours (weekends recommended)
2. **Test Run:** Import 10-20 records first to test the process
3. **Backup:** Keep original Glofox exports as backup
4. **Clean Data:** Remove test accounts and inactive members before import
5. **Communicate:** Inform members about the platform change
6. **Training:** Schedule time to train staff on FlexiWell before go-live

## Regional Considerations

### Ireland & UK
- **Currency:** EUR (€) or GBP (£) - just enter numbers, no symbols
- **Phone Format:** Include +353 (IE) or +44 (UK)
- **Date Format:** Use YYYY-MM-DD (not DD/MM/YYYY)
- **VAT:** Can be configured after import in Settings
- **Eircode:** Optional but recommended for member addresses

### Other Regions
- **Currency:** Set your default currency in **Settings** → **Business**
- **Phone:** Always include country code (+1, +61, +64, etc.)
- **Date:** Always use YYYY-MM-DD format
- **Tax:** Configure in Settings after import

## Advanced Features

### Custom Fields
If you have custom fields in Glofox:
1. List all custom field names and types
2. Contact FlexiWell support to create matching fields
3. Add columns to your import template
4. Map the data

### Bulk Photo Import
Import member photos:
1. Upload photos to cloud storage (Google Drive, Dropbox, etc.)
2. Get public URLs for each photo
3. Add `photo_url` column to member import
4. Paste URLs in the column
5. Photos will be downloaded during import

### Payment History
To import payment history:
1. Export transaction history from Glofox
2. Contact FlexiWell support for payment import template
3. Map transaction data
4. Import as separate step

## Need Help?

We're here to assist with your migration:

- **Live Chat:** Available 9am-5pm GMT in your FlexiWell dashboard
- **Email Support:** support@flexiwell.com
- **Migration Call:** [Book 1-on-1 assistance](https://calendly.com/flexiwell-migration)
- **Video Guide:** [Watch Glofox Migration Tutorial](https://youtube.com/flexiwell-glofox)
- **Community:** [Join our user community](https://community.flexiwell.com)
- **Documentation:** [Full docs](https://docs.flexiwell.com)

## What's Next After Import?

1. **Configure Settings:**
   - Set your timezone
   - Configure notification templates
   - Set up payment methods

2. **Customize:**
   - Add your branding/logo
   - Customize booking page
   - Set up class categories

3. **Train Your Team:**
   - Schedule staff training session
   - Review key workflows
   - Test different scenarios

4. **Go Live:**
   - Send announcement to members
   - Share new booking link
   - Monitor for questions

5. **Optimize:**
   - Review analytics after first week
   - Adjust class schedules based on bookings
   - Gather member feedback

---

**Migration Support:** For personalized migration assistance, including data mapping and validation, contact our migration team at migrations@flexiwell.com

Last updated: February 2026
