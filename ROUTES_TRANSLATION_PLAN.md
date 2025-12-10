# Translation Implementation Plan for Routes

## Routes to Translate

This document outlines the translation implementation for the following routes:
1. `/repairage` - Repair Stepper
2. `/tickets-done` - Tickets Done (Coming Soon page)
3. `/users` - Users Management
4. `/export-import` - Export/Import functionality  
5. `/references` - Parts References
6. `/materials` - Materials Management
7. `/logs` - System Logs

## Implementation Approach

Given the extensive scope of these pages (over 2000 lines of code combined), I recommend a phased approach:

### Phase 1: Add Translation Keys (PRIORITY)
Add all necessary translation keys to `en.json`, `fr.json`, and `ar.json` files.

### Phase 2: Update Components by Priority
1. **High Priority**: References, Materials, Logs (most user-facing content)
2. **Medium Priority**: Users, Export-Import
3. **Lower Priority**: Repair Stepper (complex component with many states)

## Translation Keys Needed

### Common Keys (used across multiple pages)
```json
"common": {
  "search": "Search",
  "searchPlaceholder": "Search...",
  "refresh": "Refresh",
  "add": "Add",
  "edit": "Edit",
  "delete": "Delete",
  "cancel": "Cancel",
  "save": "Save",
  "actions": "Actions",
  "loading": "Loading...",
  "loadingData": "Loading data...",
  "noResults": "No results found.",
  "showing": "Showing",
  "of": "of",
  "entries": "entries",
  "page": "Page",
  "previous": "Previous",
  "next": "Next",
  "areYouSure": "Are you absolutely sure?",
  "cannotBeUndone": "This action cannot be undone.",
  "openMenu": "Open menu"
}
```

### References Page
```json
"references": {
  "title": "References",
  "subtitle": "Manage your parts catalogue, including Lear and Tesca part numbers.",
  "addReference": "Add Reference",
  "searchReferences": "Search References",
  "searchPlaceholder": "Search by Lear PN, Tesca PN, or description...",
  "learPN": "Lear PN",
  "tescaPN": "Tesca PN",
  "description": "Description",
  "qtyPerBox": "Qty/Box",
  "loadingReferences": "Loading references...",
  "noReferencesFound": "No references found matching criteria.",
  "deleteConfirm": "This will permanently delete the reference",
  "andRemove": "and remove it from our servers.",
  "referenceForm": "Reference Form"
}
```

### Materials Page
```json
"materials": {
  "title": "Materials",
  "subtitle": "Manage your materials inventory.",
  "addMaterial": "Add Material",
  "searchMaterials": "Search materials...",
  "material": "Material",
  "description": "Description",
  "storage": "Storage",
  "availStock": "Avail Stock",
  "deleteConfirm": "This will permanently delete the material",
  "materialForm": "Material Form"
}
```

### Logs Page
```json
"logs": {
  "title": "System Logs",
  "subtitle": "Audit trail of system activities and data changes",
  "filterLogs": "Filter Logs",
  "resetFilters": "Reset Filters",
  "username": "Username",
  "filterByUser": "Filter by user...",
  "model": "Model",
  "selectModel": "Select model",
  "allModels": "All Models",
  "startDate": "Start Date",
  "endDate": "End Date",
  "pickDate": "Pick a date",
  "applyFilters": "Apply Filters",
  "timestamp": "Timestamp",
  "user": "User",
  "action": "Action",
  "changesSummary": "Changes Summary",
  "details": "Details",
  "loadingLogs": "Loading logs...",
  "noLogsFound": "No logs found matching criteria.",
  "logDetails": "Log Details",
  "on": "on",
  "performedBy": "Performed by",
  "at": "at",
  "field": "Field",
  "previousValue": "Previous Value",
  "newValue": "New Value",
  "value": "Value",
  "passwordChanged": "Password Changed",
  "securityUpdated": "User security credentials have been updated",
  "modifiedID": "Modified ID",
  "createdID": "Created ID",
  "deletedID": "Deleted ID",
  "noDetailsAvailable": "No details available",
  "viewDetails": "View Details"
}
```

### Users Page
```json
"users": {
  "title": "Users",
  "subtitle": "Manage system users and their roles",
  "addUser": "Add User",
  "searchUsers": "Search users...",
  "firstName": "First Name",
  "lastName": "Last Name",
  "matricule": "Matricule",
  "email": "Email",
  "phone": "Phone",
  "role": "Role",
  "status": "Status",
  "createdAt": "Created At",
  "updatedAt": "Updated At"
}
```

### Export-Import Page
```json
"exportImport": {
  "title": "Export / Import",
  "subtitle": "Export and import data",
  "export": "Export",
  "import": "Import",
  "selectDateRange": "Select date range",
  "download": "Download",
  "uploadFile": "Upload file",
  "selectFile": "Select file"
}
```

### Repair Stepper (Repairage)
```json
"repairStepper": {
  "title": "Repair Ticket Generation",
  "step1": "Material & Part",
  "step2": "Transfer Preparation",
  "materialInfo": "Material Information",
  "partInfo": "Part Information",
  "scanBarcode": "Scan Barcode",
  "quantity": "Quantity",
  "storageUnit": "Storage Unit",
  "validate": "Validate",
  "next": "Next",
  "previous": "Previous",
  "finish": "Finish",
  "generateTicket": "Generate Ticket",
  "printTicket": "Print Ticket"
}
```

## Recommendation

Due to the extensive nature of this task, I recommend:

1. **Start with the most critical pages first** (References, Materials, Logs) as these have the most user-facing text
2. **Use a consistent translation pattern** across all pages
3. **Test each page after translation** to ensure nothing breaks
4. **Consider creating reusable translation components** for common patterns (tables, forms, dialogs)

Would you like me to:
A) Proceed with adding all translation keys to the JSON files first?
B) Focus on translating specific pages one at a time?
C) Create a helper utility for common translation patterns?

Please let me know your preference and I'll proceed accordingly.
