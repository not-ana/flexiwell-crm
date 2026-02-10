# Tecnofit Data Import Guide

Welcome to the Tecnofit data import guide for FlexiWell. This comprehensive guide will help you migrate all your Tecnofit data using spreadsheet templates.

**Note:** This guide is designed for Tecnofit, a popular fitness management platform in Brazil.

## Overview

Import from Tecnofit includes:
- Client/member profiles and contact information
- Workout plans and training sheets
- Class schedules and sessions
- Training history
- Membership plans and subscriptions
- Payment records
- Instructor information

## Steps to Import Data

### 1. Export Your Data from Tecnofit

Tecnofit provides data export functionality through their platform:

1. Log in to your **Tecnofit Dashboard**
2. Navigate to **Relatórios** (Reports)
3. Export the following data:

#### Export Students/Members
- Go to **Alunos** (Students) → **Lista de Alunos** (Student List)
- Click **Exportar** (Export) in top right
- Select **Todos os campos** (All fields)
- Choose **CSV** format
- Save as `tecnofit-students.csv`

#### Export Training/Classes
- Go to **Treinos** (Training) → **Agendamento** (Schedule)
- Select date range (recommended: next 90 days)
- Click **Exportar Agenda** (Export Schedule)
- Save as `tecnofit-classes.csv`

#### Export Training Plans
- Go to **Treinos** (Training) → **Fichas de Treino** (Training Sheets)
- Export active training plans
- Save as `tecnofit-training-plans.csv`

#### Export Membership Plans
- Go to **Financeiro** (Financial) → **Planos** (Plans)
- Select active plans
- Click **Exportar** (Export)
- Save as `tecnofit-plans.csv`

**Note:** If you need assistance exporting data, contact Tecnofit support at suporte@tecnofit.com.br

### 2. Download FlexiWell Import Templates

Download our standardized import templates:

- [📥 Member Import Template](https://flexiwell.com/templates/tecnofit-members-import.csv)
- [📥 Class Schedule Template](https://flexiwell.com/templates/tecnofit-classes-import.csv)
- [📥 Membership Plans Template](https://flexiwell.com/templates/tecnofit-plans-import.csv)
- [📥 Complete Import Kit (ZIP)](https://flexiwell.com/templates/tecnofit-complete-import.zip)

### 3. Map Your Data to FlexiWell Format

#### Member Information Mapping

| Tecnofit Field | FlexiWell Field | Required | Notes |
|----------------|-----------------|----------|-------|
| Nome | first_name | Yes | First name |
| Sobrenome | last_name | Yes | Last name |
| E-mail | email | Yes | Primary email |
| Telefone/Celular | phone | Recommended | Include country code (+55) |
| Data de Nascimento | birth_date | No | YYYY-MM-DD format |
| Sexo | gender | No | M/F/Other |
| CPF | tax_id | No | Brazilian tax ID (numbers only) |
| Endereço | address_line1 | No | Full street address |
| Complemento | address_line2 | No | Apt, suite, etc. |
| Bairro | neighborhood | No | Neighborhood name |
| Cidade | city | No | City name |
| Estado | state | No | State code (SP, RJ, MG, etc.) |
| CEP | postal_code | No | Postal code (00000-000) |
| País | country | No | BR (Brazil) |
| Contato de Emergência | emergency_contact_name | No | Full name |
| Telefone de Emergência | emergency_contact_phone | No | With country code |
| Condições Médicas | medical_notes | No | Restrictions/conditions |
| Objetivo | fitness_goal | No | Training goal |
| Data de Cadastro | registration_date | No | YYYY-MM-DD |
| ID do Aluno | external_id | No | Tecnofit student ID |
| Foto (URL) | photo_url | No | Photo URL |

#### Class Schedule Mapping

| Tecnofit Field | FlexiWell Field | Required | Notes |
|----------------|-----------------|----------|-------|
| Nome da Aula | class_name | Yes | Class/activity name |
| Descrição | description | No | Class description |
| Tipo | class_type | No | Type (Weight training/Functional/etc.) |
| Data | start_date | Yes | YYYY-MM-DD |
| Hora Início | start_time | Yes | HH:MM (24h format) |
| Hora Fim | end_time | Yes | HH:MM (24h format) |
| Duração | duration_minutes | No | Duration in minutes |
| Instrutor/Professor | instructor_name | Recommended | Instructor name |
| Local/Sala | location | No | Room name |
| Vagas Máximas | max_capacity | Recommended | Maximum capacity |
| Vagas Ocupadas | current_bookings | No | Current count |
| Recorrente | is_recurring | No | true/false |
| Padrão de Recorrência | recurrence_pattern | No | weekly/daily |

#### Membership Plan Mapping

| Tecnofit Field | FlexiWell Field | Required | Notes |
|----------------|-----------------|----------|-------|
| E-mail do Aluno | client_email | Yes | Link to member |
| Nome do Plano | plan_name | Yes | Plan name |
| Tipo de Plano | plan_type | No | unlimited/pack |
| Data Início | start_date | Yes | YYYY-MM-DD |
| Data Vencimento | end_date | No | YYYY-MM-DD |
| Valor | price | Yes | Monthly price |
| Frequência de Cobrança | billing_frequency | No | monthly/quarterly/annual |
| Aulas Restantes | credits_remaining | No | For class packs |
| Status | status | Yes | active/paused/cancelled |
| Renovação Automática | auto_renew | No | true/false |

### 4. Format Guidelines

**Required Formats:**
- **Dates:** YYYY-MM-DD (e.g., 2026-02-10)
- **Times:** HH:MM in 24-hour format (e.g., 18:30)
- **Phone:** International format +55[DDD][number] (e.g., +5511987654321)
- **Email:** Valid email format
- **CPF:** Numbers only, no dots or dashes (e.g., 12345678900)
- **CEP:** With or without hyphen (e.g., 01310-100 or 01310100)
- **Currency:** Decimal numbers with period (e.g., 149.90 not R$ 149,90)
- **Boolean:** true/false or yes/no

**Character Encoding:** UTF-8 (for Portuguese characters with accents)

**Currency Note:** FlexiWell will use your configured currency (BRL). Enter numbers only without symbols.

### 5. Upload to FlexiWell

#### Import Sequence (Important!)

1. **Import Members First**
   - Go to **Settings** → **Integrations** → **Tecnofit**
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
   - Verify total count matches Tecnofit
   - Spot-check 10-20 random member profiles

2. **Verify Class Schedule:**
   - Go to **Classes** → **Schedule**
   - Check upcoming classes match Tecnofit
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
- Tecnofit may have duplicate emails in the database
- FlexiWell will merge records with same email
- Review merge summary before confirming
- Manually fix if needed via **Members** → **Merge Duplicates**

### Issue: "Invalid phone number"
**Solution:**
- Add +55 before area code (DDD)
- Correct format: +5511987654321
- Remove spaces, dashes, and parentheses
- Area code (DDD) must be 2 digits

### Issue: "Invalid CPF"
**Solution:**
- Use numbers only (11 digits)
- Remove dots and dashes
- Example: 12345678900
- Verify CPF is valid

### Issue: "Member not found for membership"
**Solution:**
- Ensure members are imported first
- Check that email in membership file exactly matches member email
- Check for typos in email addresses

### Issue: "Accented characters not displaying correctly"
**Solution:**
- Save CSV with UTF-8 encoding
- In Excel: File → Save As → CSV UTF-8
- In Google Sheets: Download → CSV automatically uses UTF-8

### Issue: "Invalid date format"
**Solution:**
- Use YYYY-MM-DD format (2026-02-10)
- Don't use DD/MM/YYYY
- Configure Excel to prevent automatic date conversion

## Field Reference

### Member Required Fields

| Field | Example | Validation |
|-------|---------|------------|
| first_name | João | 1-50 characters |
| last_name | Silva | 1-50 characters |
| email | joao@example.com.br | Valid email format |

### Member Optional Fields

| Field | Example | Notes |
|-------|---------|-------|
| phone | +5511987654321 | International format |
| tax_id | 12345678900 | CPF without dots/dashes |
| birth_date | 1990-05-15 | YYYY-MM-DD |
| gender | M | M/F/Other |
| address_line1 | Av. Paulista, 1000 | Full address |
| neighborhood | Bela Vista | Neighborhood name |
| city | São Paulo | City name |
| state | SP | State code |
| postal_code | 01310-100 | CEP with or without hyphen |

### Class Required Fields

| Field | Example | Validation |
|-------|---------|-----------|
| class_name | CrossFit WOD | 1-100 characters |
| start_date | 2026-02-15 | YYYY-MM-DD |
| start_time | 06:00 | HH:MM (24h) |
| end_time | 07:00 | HH:MM (24h) |

## Example Data

### Members CSV Example
```csv
first_name,last_name,email,phone,tax_id,birth_date,gender,address_line1,neighborhood,city,state,postal_code,country,external_id
João,Silva,joao@example.com.br,+5511987654321,12345678900,1990-03-15,M,Av. Paulista 1000,Bela Vista,São Paulo,SP,01310-100,BR,TEC12345
Maria,Santos,maria@example.com.br,+5511976543210,98765432100,1985-07-20,F,Rua Augusta 500,Consolação,São Paulo,SP,01305-000,BR,TEC12346
```

### Classes CSV Example
```csv
class_name,description,start_date,start_time,end_time,instructor_name,max_capacity,location,is_recurring,recurrence_pattern
CrossFit WOD,High intensity functional training,2026-02-15,06:00,07:00,Carlos Oliveira,20,Main Room,true,daily
Pilates,Pilates for all levels,2026-02-15,18:30,19:30,Ana Paula,12,Studio 1,true,weekly
```

### Memberships CSV Example
```csv
client_email,plan_name,start_date,end_date,price,billing_frequency,auto_renew,status,credits_remaining
joao@example.com.br,Unlimited Monthly,2026-01-01,2026-12-31,149.90,monthly,true,active,
maria@example.com.br,10 Class Pack,2026-02-01,2026-05-01,120.00,one-time,false,active,8
```

## Migration Checklist

- [ ] Export all data from Tecnofit
- [ ] Download FlexiWell import templates
- [ ] Map member data to template
- [ ] Map class data to template
- [ ] Map membership data to template
- [ ] Verify all phone numbers have +55
- [ ] Verify CPF (numbers only)
- [ ] Check date formats (YYYY-MM-DD)
- [ ] Verify UTF-8 encoding
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
3. **Backup:** Keep original Tecnofit exports as backup
4. **Clean Data:** Remove test accounts and inactive members before import
5. **Communication:** Inform members about the platform change
6. **Training:** Schedule time to train staff on FlexiWell before go-live

## Regional Considerations

### Brazil
- **Currency:** Brazilian Real (BRL) - enter numbers only without symbols
- **Phone:** Always include +55 + area code + number
- **CPF:** Optional but recommended for identification
- **Date Format:** Use YYYY-MM-DD (not DD/MM/YYYY)
- **CEP:** Can be with or without hyphen
- **Timezone:** Configure in **Settings** → **Business**

## Advanced Features

### Custom Fields
If you have custom fields in Tecnofit:
1. List all custom field names and types
2. Contact FlexiWell support to create matching custom fields
3. Add columns to your import template
4. Map the data

### Bulk Photo Import
To import member photos:
1. Upload photos to cloud storage (Google Drive, Dropbox, etc.)
2. Get public URLs for each photo
3. Add `photo_url` column to member import
4. Paste URLs in the column
5. Photos will be downloaded during import

### Payment History
To import payment history:
1. Export transaction history from Tecnofit
2. Contact FlexiWell support for payment import template
3. Map transaction data
4. Import as separate step

## Need Help?

We're here to assist with your migration:

- **Live Chat:** Available 9am-6pm Brasília Time in your FlexiWell dashboard
- **Email Support:** support@flexiwell.com
- **WhatsApp:** [Contact us](https://wa.me/5511999999999)
- **Migration Call:** [Book 1-on-1 assistance](https://calendly.com/flexiwell-migration)
- **Video Tutorial:** [Watch Tecnofit Migration Tutorial](https://youtube.com/flexiwell-tecnofit)
- **Community:** [Join our community](https://community.flexiwell.com)
- **Documentation:** [Full docs](https://docs.flexiwell.com)

## What's Next After Import?

1. **Configure Settings:**
   - Set your timezone (Brasília Time)
   - Configure notification templates
   - Set up payment methods (PIX, credit card, boleto)

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

**Note:** This guide was developed specifically for the Brazilian market and considers the particularities of Tecnofit. If you have specific questions about your gym, our team is ready to help.

Last updated: February 2026
