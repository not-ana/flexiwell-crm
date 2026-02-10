# FlexiWell Data Import Documentation

This directory contains comprehensive import guides for migrating data from other fitness management platforms to FlexiWell using spreadsheet templates.

## Available Import Guides

### 📊 Spreadsheet-Based Imports

The following platforms use spreadsheet import methodology (CSV/Excel templates):

- **[ClassPass](./classpass.md)** - Import clients, classes, and booking history from ClassPass
- **[Mindbody](./mindbody.md)** - Comprehensive migration guide for Mindbody data
- **[Glofox](./glofox.md)** - Complete Glofox migration with European/UK focus
- **[Tecnofit](./tecnofit.md)** - Brazilian market migration guide (Portuguese)

### 🔌 API-Based Integrations

The following platforms have direct API integrations available:

- **TotalPass** - Direct API integration (see Settings → Integrations → TotalPass)
- **Wellhub** - Direct API integration (see Settings → Integrations → Wellhub)

## Why Spreadsheet Import?

For ClassPass, Mindbody, Glofox, and Tecnofit, we use spreadsheet-based imports because:

1. **API Limitations:** Not all platforms provide partner API access
2. **Cost Efficiency:** No ongoing API maintenance costs
3. **Data Control:** You have full control over what data is imported
4. **One-Time Migration:** Most migrations happen once during platform switch
5. **Flexibility:** Easy to clean and prepare data before import

## Import Process Overview

All spreadsheet-based imports follow this general process:

### 1. Export Data
Export your data from the source platform (ClassPass, Mindbody, Glofox, or Tecnofit)

### 2. Download Templates
Download our standardized CSV templates for your platform

### 3. Map Data
Map fields from your export to our template format

### 4. Format & Validate
Ensure data follows required formats (dates, phones, emails, etc.)

### 5. Import to FlexiWell
Upload CSV files through Settings → Integrations → [Platform]

### 6. Verify
Check imported data and resolve any issues

## Common Data Types

All import guides cover importing:

- ✅ **Client/Member Information** - Names, emails, phones, addresses
- ✅ **Class Schedules** - Class names, times, instructors, capacities
- ✅ **Memberships/Plans** - Active subscriptions and packages
- ✅ **Booking History** - Past and future class bookings
- ✅ **Payment Records** - Transaction history (optional)

## Format Standards

All imports use these standard formats:

| Data Type | Format | Example |
|-----------|--------|---------|
| Date | YYYY-MM-DD | 2026-02-10 |
| Time | HH:MM (24h) | 14:30 |
| Phone | +[country][number] | +12125551234 |
| Currency | Numbers only | 149.90 |
| Boolean | true/false | true |
| Encoding | UTF-8 | Required for special characters |

## Getting Help

### Documentation
- Each import guide has comprehensive instructions
- Includes field mappings, examples, and troubleshooting

### Support Channels
- **Live Chat:** Available in FlexiWell dashboard
- **Email:** support@flexiwell.com
- **Migration Assistance:** migrations@flexiwell.com
- **Video Tutorials:** Available for each platform

### Migration Services
Need help? We offer:
- Free migration assistance for all plans
- Data mapping and validation support
- 1-on-1 migration calls
- Post-import verification

## Best Practices

1. **Start Small** - Test with 10-20 records first
2. **Backup Everything** - Keep original exports
3. **Clean Data** - Remove test accounts and duplicates
4. **Verify Formats** - Check dates, phones, emails
5. **Import in Order** - Always import clients before classes/memberships
6. **Test Thoroughly** - Verify data after each import step
7. **Communicate** - Inform clients about platform change

## Template Downloads

All templates are available at:
- https://flexiwell.com/templates/

Or access them directly through:
Settings → Integrations → [Platform] → Download Template

## FAQ

### Q: Can I import data from multiple platforms?
A: Yes! You can import from multiple sources. Just follow each platform's guide separately.

### Q: What happens to duplicate emails?
A: FlexiWell will merge records with matching emails. You'll see a merge summary before confirming.

### Q: How long does import take?
A: Most imports complete within minutes. Large datasets (1000+ records) may take 10-15 minutes.

### Q: Can I undo an import?
A: Yes, within 24 hours of import, you can request a rollback by contacting support.

### Q: What if I have custom fields?
A: Contact support before importing. We can create matching custom fields in FlexiWell.

### Q: Is there a record limit?
A: No hard limit, but we recommend batching very large imports (5000+ records).

## Platform-Specific Notes

### ClassPass
- Focus on booking history and client data
- May require manual class setup
- See [classpass.md](./classpass.md)

### Mindbody
- Most comprehensive import (clients, classes, contracts, visits)
- Multiple CSV files needed
- See [mindbody.md](./mindbody.md)

### Glofox
- Popular in Ireland/UK/Europe
- Includes regional phone format guidance
- See [glofox.md](./glofox.md)

### Tecnofit
- Brazilian market focus
- Portuguese documentation
- CPF and Brazilian address fields
- See [tecnofit.md](./tecnofit.md)

## Updates

These guides are regularly updated to reflect:
- Platform export changes
- New FlexiWell features
- User feedback and common issues

Last updated: February 2026

---

**Need personalized migration help?** Contact our migration team at migrations@flexiwell.com or schedule a call at https://calendly.com/flexiwell-migration
