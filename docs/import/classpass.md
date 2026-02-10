# ClassPass Data Import Guide

Welcome to the ClassPass data import guide for FlexiWell. This guide will help you migrate your ClassPass data using a spreadsheet template.

## Overview

ClassPass integration via spreadsheet allows you to import:
- Client information
- Class schedules
- Booking history
- Attendance records

**Note:** Since ClassPass doesn't provide direct API access to all partners, we use a spreadsheet-based approach for data migration.

## Steps to Import Data

### 1. Export Your Data from ClassPass

ClassPass provides data exports through their partner dashboard:

1. Log in to your ClassPass Partner Dashboard
2. Navigate to **Reports** → **Data Exports**
3. Select the data you want to export:
   - Client bookings
   - Class schedules
   - Customer information
4. Choose date range (recommended: last 12 months)
5. Download the CSV file

### 2. Download FlexiWell Import Template

Download our standardized import template:

- [📥 Download ClassPass Import Template (CSV)](https://flexiwell.com/templates/classpass-import.csv)
- [📄 View Template Structure](https://flexiwell.com/templates/classpass-import-example)

### 3. Map Your Data to FlexiWell Format

Open both the ClassPass export and FlexiWell template. Map the fields as follows:

#### Client Information

| ClassPass Field | FlexiWell Field | Required | Notes |
|----------------|-----------------|----------|-------|
| customer_name | client_name | Yes | Full name |
| customer_email | email | Yes | Primary contact email |
| customer_phone | phone | No | Include country code |
| customer_id | external_id | No | For reference tracking |

#### Class & Booking Information

| ClassPass Field | FlexiWell Field | Required | Notes |
|----------------|-----------------|----------|-------|
| class_name | class_title | Yes | Name of the class |
| class_date | date | Yes | Format: YYYY-MM-DD |
| class_time | time | Yes | Format: HH:MM (24h) |
| instructor_name | instructor | No | Instructor's name |
| booking_status | status | Yes | Values: confirmed, cancelled, completed |
| spots_booked | quantity | No | Number of spots (default: 1) |

### 4. Format Guidelines

**Required Formats:**
- **Dates:** YYYY-MM-DD (e.g., 2026-02-10)
- **Times:** HH:MM in 24-hour format (e.g., 14:30)
- **Phone:** International format with + (e.g., +1234567890)
- **Email:** Valid email format
- **Status:** One of: confirmed, cancelled, completed, no-show

**Character Encoding:** UTF-8 (to support special characters)

### 5. Upload to FlexiWell

1. Go to **Settings** → **Integrations** → **ClassPass**
2. Click **Upload Import File**
3. Select your formatted CSV file
4. Review the preview showing:
   - Number of records found
   - Any validation errors
   - Data mapping confirmation
5. Click **Import Data**
6. Wait for the import process to complete

### 6. Verify Import

After import:
1. Check **Clients** page for imported client records
2. Review **Classes** page for schedule
3. Verify **Bookings** match your records
4. Check the import log for any skipped records

## Common Issues & Solutions

### Issue: "Email already exists"
**Solution:** FlexiWell will merge records with matching emails. Review merge conflicts in the import report.

### Issue: "Invalid date format"
**Solution:** Ensure all dates are in YYYY-MM-DD format. Check for extra spaces or invalid dates like 2026-02-30.

### Issue: "Missing required field"
**Solution:** Ensure all required fields (client_name, email, class_title, date, time, status) are filled.

### Issue: "Special characters not displaying correctly"
**Solution:** Save your CSV with UTF-8 encoding. In Excel: File → Save As → CSV UTF-8.

## Field Reference

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| client_name | Full name of the client | John Smith |
| email | Client's email address | john@example.com |
| class_title | Name of the class | Yoga Flow |
| date | Date of class | 2026-02-10 |
| time | Start time of class | 09:00 |
| status | Booking status | confirmed |

### Optional Fields

| Field | Description | Example |
|-------|-------------|---------|
| phone | Client's phone number | +12125551234 |
| external_id | ClassPass customer ID | CP123456 |
| instructor | Instructor name | Jane Doe |
| quantity | Number of spots | 1 |
| notes | Additional notes | First-time visitor |
| class_duration | Duration in minutes | 60 |
| price_paid | Amount paid (for reference) | 15.00 |

## Tips for Successful Import

1. **Start Small:** Test with a small batch (10-20 records) before importing everything
2. **Clean Your Data:** Remove duplicates and fix formatting issues before upload
3. **Backup Original:** Keep a copy of your original ClassPass export
4. **Check Dates:** Verify date ranges match your expectations
5. **Contact Support:** If you encounter issues, contact support@flexiwell.com with your import log

## Example Data

```csv
client_name,email,phone,class_title,date,time,instructor,status,external_id
John Smith,john@example.com,+12125551234,Yoga Flow,2026-02-15,09:00,Jane Doe,confirmed,CP123456
Sarah Johnson,sarah@example.com,+12125555678,HIIT Training,2026-02-15,10:30,Mike Brown,confirmed,CP123457
```

## Need Help?

- **Documentation:** [Full Import Documentation](https://docs.flexiwell.com/import)
- **Video Tutorial:** [Watch Import Tutorial](https://youtube.com/flexiwell-import)
- **Support:** support@flexiwell.com
- **Chat:** Available in your FlexiWell dashboard

---

Last updated: February 2026
