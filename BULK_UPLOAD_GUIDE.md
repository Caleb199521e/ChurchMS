# Bulk Upload Members - User Guide

## Overview
The bulk upload feature allows you to import multiple members at once using CSV or Excel files.

## Accessing Bulk Upload
1. Go to the **Members** page
2. Click the **"Bulk Upload"** button (next to "Add Member")

## Supported File Formats
- **CSV** (.csv) - Comma-separated values
- **Excel** (.xlsx, .xls) - Microsoft Excel format

## File Format & Columns

### Required Column
- **fullName** - The member's full name (must be provided)

### Optional Columns
| Column | Format | Example | Notes |
|--------|--------|---------|-------|
| phone | Text | 0244123456 | Any format accepted |
| email | Email | john@example.com | Must be valid email |
| gender | male / female / other | male | Case-insensitive |
| role | member / deacon / elder / pastor / leader / worker | member | Default is "member" |
| department | Department name | Music | Must match existing department |
| address | Text | 123 Main Street | Free text |
| joinDate | YYYY-MM-DD | 2024-01-15 | Date format required |
| notes | Text | New member | Free text |

## How to Create a Upload File

### Option 1: Download Template (Recommended)
1. Click "Bulk Upload" button
2. Click "📥 Download Sample Template" 
3. A CSV file will download with example data
4. Edit the template with your member data
5. Save and upload

### Option 2: Manual Creation in Excel
1. Create columns with the headers (fullName is required)
2. Add member data in rows
3. Export as CSV or keep as Excel (.xlsx)
4. Upload the file

### Option 3: Manual Creation in CSV Editor
Use any text editor or CSV tool to create a file with comma-separated values:
```
fullName,phone,email,gender,role,department,joinDate
John Doe,0244123456,john@example.com,male,member,Music,2024-01-15
Jane Smith,0209876543,jane@example.com,female,deacon,Women,2024-01-20
```

## Upload Process

1. **Select File** - Click the upload area or drag and drop your file
2. **Validation** - The system validates each row:
   - Checks for required fields
   - Validates gender and role values
   - Verifies departments exist
   - Reports any errors
3. **Review** - See a preview of valid records
4. **Upload** - Click "Upload X Members" to import

## Validation Rules

- **fullName** is required for every row
- **gender** must be: male, female, or other (case-insensitive)
- **role** must be: member, deacon, elder, pastor, leader, or worker (case-insensitive)
- **department** must match an existing department name (case-insensitive)
- **email** should be a valid email format (optional check)
- **joinDate** should be in YYYY-MM-DD format if provided

## Error Handling

If there are validation errors:
- Invalid rows will be listed with specific error messages
- Valid rows will still be imported
- Review the error details and re-upload only the failed rows after corrections

## Example Upload File

```csv
fullName,phone,email,gender,role,department,address,joinDate,notes
Kwame Asante,0244123456,kwame@church.com,male,member,Music,123 Main St,2024-01-15,New member
Ama Johnson,0209876543,ama@church.com,female,deacon,Women,456 Oak Ave,2023-06-20,Active in ministry
Kofi Mensah,0271234567,,male,elder,Leadership,789 Pine Rd,2022-03-10,Long-time member
```

## Tips for Success

1. **Use the template** - Start with the downloaded template for correct column order
2. **Keep data consistent** - Use consistent formatting for phone numbers and dates
3. **Verify departments** - Ensure department names match exactly those in the system
4. **Test first** - Upload a small batch first to verify the process
5. **Check for duplicates** - Review existing members before uploading to avoid duplicates
6. **Leave blank for unknown** - Leave optional fields empty if no data is available

## Support

If you encounter any issues:
- Check the validation error messages for specific problems
- Ensure your file format is CSV or Excel
- Verify column headers are spelled correctly
- Make sure required fields (fullName) are not empty
