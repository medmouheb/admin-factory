# Box Management System - Frontend Implementation Guide

This document provides a comprehensive guide for implementing the frontend of the Box Management System. It includes all API endpoints, request/response examples, usage scenarios, and best practices.

---

## Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
   - [ParentBox APIs](#parentbox-apis)
   - [BoxPart APIs](#boxpart-apis)
   - [BoxMovement APIs](#boxmovement-apis)
3. [Complete Implementation Scenarios](#complete-implementation-scenarios)
4. [Error Handling](#error-handling)
5. [UI/UX Recommendations](#uiux-recommendations)

---

## Authentication

All API endpoints require JWT authentication. Include the access token in cookies (credentials: 'include' for fetch, withCredentials: true for axios).

**Backend Configuration:**
- Authentication middleware: `authJwt.verifyToken`
- CORS enabled with credentials
- Session-based JWT tokens

**Frontend Setup:**
```javascript
// Using fetch
fetch('http://localhost:8080/api/parentbox', {
  method: 'GET',
  credentials: 'include', // Important for JWT cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Using axios
axios.get('http://localhost:8080/api/parentbox', {
  withCredentials: true // Important for JWT cookies
});
```

---

## API Endpoints

### ParentBox APIs

Base URL: `http://localhost:8080/api/parentbox`

#### 1. Create ParentBox
**POST** `/api/parentbox`

**Request Body:**
```json
{
  "ParentBoxCode": "PB-001-VOLVO-ENGINE",
  "description": "This box is full of parts of a Volvo engine"
}
```

**Response (201):**
```json
{
  "ParentBoxCode": "PB-001-VOLVO-ENGINE",
  "description": "This box is full of parts of a Volvo engine",
  "createdAt": "2026-01-06T03:00:00.000Z",
  "updatedAt": "2026-01-06T03:00:00.000Z"
}
```

**Error Responses:**
- `400`: ParentBoxCode is required
- `400`: ParentBoxCode already exists
- `500`: Server error

---

#### 2. Get All ParentBoxes
**GET** `/api/parentbox`

**Response (200):**
```json
[
  {
    "ParentBoxCode": "PB-001-VOLVO-ENGINE",
    "description": "This box is full of parts of a Volvo engine",
    "createdAt": "2026-01-06T03:00:00.000Z",
    "updatedAt": "2026-01-06T03:00:00.000Z",
    "boxParts": [
      {
        "BoxPartCode": "BP-001-PIN",
        "description": "Pin that holds the engine red wire",
        "picture": "boxpart-1704508800000-123456789.png",
        "regularDemand": 7,
        "inventoryTotalNumber": 100,
        "ParentBoxCode": "PB-001-VOLVO-ENGINE"
      }
    ]
  }
]
```

---

#### 3. Get ParentBox by ID
**GET** `/api/parentbox/:id`

**Example:** `GET /api/parentbox/PB-001-VOLVO-ENGINE`

**Response (200):** Same structure as Get All, but single object with boxParts included

**Error Responses:**
- `404`: ParentBox not found

---

#### 4. Get ParentBox by Code
**GET** `/api/parentbox/code/:code`

**Example:** `GET /api/parentbox/code/PB-001-VOLVO-ENGINE`

**Response (200):** Same as Get by ID

---

#### 5. Search ParentBoxes
**GET** `/api/parentbox/search?q={query}&page={page}&limit={limit}`

**Query Parameters:**
- `q` (optional): Search query (searches in ParentBoxCode and description)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Example:** `GET /api/parentbox/search?q=volvo&page=1&limit=10`

**Response (200):**
```json
{
  "page": 1,
  "limit": 10,
  "totalItems": 1,
  "totalPages": 1,
  "data": [
    {
      "ParentBoxCode": "PB-001-VOLVO-ENGINE",
      "description": "This box is full of parts of a Volvo engine",
      "boxParts": [...]
    }
  ]
}
```

---

#### 6. Update ParentBox
**PUT** `/api/parentbox/:id`

**Request Body:**
```json
{
  "description": "Updated description for Volvo engine parts box"
}
```

**Response (200):**
```json
{
  "message": "ParentBox updated successfully"
}
```

**Error Responses:**
- `404`: ParentBox not found

---

#### 7. Delete ParentBox
**DELETE** `/api/parentbox/:id`

**Example:** `DELETE /api/parentbox/PB-001-VOLVO-ENGINE`

**Response (200):**
```json
{
  "message": "ParentBox deleted successfully"
}
```

**Error Responses:**
- `404`: ParentBox not found

---

### BoxPart APIs

Base URL: `http://localhost:8080/api/boxpart`

#### 1. Create BoxPart (with Picture Upload)
**POST** `/api/boxpart`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `BoxPartCode` (string, required): Unique code
- `description` (string, optional): Part description
- `regularDemand` (number, optional, default: 0): Regular demand quantity
- `inventoryTotalNumber` (number, optional, default: 0): Initial inventory
- `ParentBoxCode` (string, optional): Parent box reference
- `picture` (file, optional): Image file (jpg, jpeg, png, gif, webp, max 5MB)

**JavaScript Example:**
```javascript
const formData = new FormData();
formData.append('BoxPartCode', 'BP-001-PIN');
formData.append('description', 'Pin that holds the engine red wire');
formData.append('regularDemand', '7');
formData.append('inventoryTotalNumber', '100');
formData.append('ParentBoxCode', 'PB-001-VOLVO-ENGINE');
formData.append('picture', fileInput.files[0]); // File from input element

fetch('http://localhost:8080/api/boxpart', {
  method: 'POST',
  credentials: 'include',
  body: formData // No Content-Type header needed, browser sets it automatically
});
```

**Response (201):**
```json
{
  "BoxPartCode": "BP-001-PIN",
  "description": "Pin that holds the engine red wire",
  "picture": "boxpart-1704508800000-123456789.png",
  "regularDemand": 7,
  "inventoryTotalNumber": 100,
  "ParentBoxCode": "PB-001-VOLVO-ENGINE",
  "createdAt": "2026-01-06T03:00:00.000Z",
  "updatedAt": "2026-01-06T03:00:00.000Z"
}
```

**Error Responses:**
- `400`: BoxPartCode is required
- `400`: BoxPartCode already exists
- `400`: ParentBoxCode does not exist
- `500`: Only image files are allowed

---

#### 2. Get All BoxParts
**GET** `/api/boxpart`

**Response (200):**
```json
[
  {
    "BoxPartCode": "BP-001-PIN",
    "description": "Pin that holds the engine red wire",
    "picture": "boxpart-1704508800000-123456789.png",
    "regularDemand": 7,
    "inventoryTotalNumber": 100,
    "ParentBoxCode": "PB-001-VOLVO-ENGINE",
    "createdAt": "2026-01-06T03:00:00.000Z",
    "updatedAt": "2026-01-06T03:00:00.000Z",
    "parentBox": {
      "ParentBoxCode": "PB-001-VOLVO-ENGINE",
      "description": "This box is full of parts of a Volvo engine"
    }
  }
]
```

---

#### 3. Get BoxPart by ID
**GET** `/api/boxpart/:id`

**Example:** `GET /api/boxpart/BP-001-PIN`

**Response (200):** Same structure as Get All, but single object

---

#### 4. Get BoxPart by Code
**GET** `/api/boxpart/code/:code`

**Example:** `GET /api/boxpart/code/BP-001-PIN`

**Response (200):** Same as Get by ID

---

#### 5. Get BoxPart Picture
**GET** `/api/boxpart/picture/:code`

**Example:** `GET /api/boxpart/picture/BP-001-PIN`

**Response (200):** Image file (binary)

**Usage in HTML:**
```html
<img 
  src="http://localhost:8080/api/boxpart/picture/BP-001-PIN" 
  alt="BoxPart Picture"
  crossOrigin="use-credentials"
/>
```

**Error Responses:**
- `404`: BoxPart not found
- `404`: No picture available for this BoxPart
- `404`: Picture file not found

---

#### 6. Search BoxParts
**GET** `/api/boxpart/search?q={query}&page={page}&limit={limit}`

**Query Parameters:**
- `q` (optional): Search query (searches in BoxPartCode and description)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response (200):** Paginated response with same structure as ParentBox search

---

#### 7. Update BoxPart (with Picture Upload)
**PUT** `/api/boxpart/:id`

**Content-Type:** `multipart/form-data`

**Form Data:** Same as Create (all fields optional except BoxPartCode in URL)

**Note:** If a new picture is uploaded, the old picture file will be automatically deleted.

**Response (200):**
```json
{
  "message": "BoxPart updated successfully"
}
```

---

#### 8. Delete BoxPart
**DELETE** `/api/boxpart/:id`

**Example:** `DELETE /api/boxpart/BP-001-PIN`

**Note:** This will also delete the associated picture file.

**Response (200):**
```json
{
  "message": "BoxPart deleted successfully"
}
```

---

### BoxMovement APIs

Base URL: `http://localhost:8080/api/boxmovement`

#### 1. Create BoxMovement
**POST** `/api/boxmovement`

**Request Body:**
```json
{
  "id": "BM-20260106-001",
  "ParentBoxCode": "PB-001-VOLVO-ENGINE",
  "movementType": "add",
  "BoxPartsDemanded": [
    {
      "BoxPartCode": "BP-001-PIN",
      "demand": 10
    },
    {
      "BoxPartCode": "BP-002-WIRE",
      "demand": 25
    }
  ]
}
```

**Behavior:**
- For `movementType: "add"`: Adds demand to each BoxPart's inventoryTotalNumber
- For `movementType: "subtract"`: Subtracts demand from each BoxPart's inventoryTotalNumber
- Validates that all BoxPartCodes exist
- Prevents negative inventory when subtracting

**Response (201):**
```json
{
  "id": "BM-20260106-001",
  "ParentBoxCode": "PB-001-VOLVO-ENGINE",
  "movementType": "add",
  "BoxPartsDemanded": [
    {
      "BoxPartCode": "BP-001-PIN",
      "demand": 10
    }
  ],
  "createdAt": "2026-01-06T03:00:00.000Z",
  "updatedAt": "2026-01-06T03:00:00.000Z"
}
```

**Error Responses:**
- `400`: id is required
- `400`: ParentBoxCode is required
- `400`: movementType must be 'add' or 'subtract'
- `400`: BoxPartsDemanded must be a non-empty array
- `400`: BoxMovement id already exists
- `400`: ParentBoxCode does not exist
- `500`: BoxPart with code {code} not found
- `500`: Insufficient inventory for BoxPart {code}

---

#### 2. Get All BoxMovements
**GET** `/api/boxmovement`

**Response (200):**
```json
[
  {
    "id": "BM-20260106-001",
    "ParentBoxCode": "PB-001-VOLVO-ENGINE",
    "movementType": "add",
    "BoxPartsDemanded": [...],
    "createdAt": "2026-01-06T03:00:00.000Z",
    "updatedAt": "2026-01-06T03:00:00.000Z"
  }
]
```

---

#### 3. Get BoxMovement by ID
**GET** `/api/boxmovement/:id`

**Example:** `GET /api/boxmovement/BM-20260106-001`

**Response (200):** Same structure as Get All, but single object

---

#### 4. Get BoxMovements by ParentBoxCode
**GET** `/api/boxmovement/parentbox/:code`

**Example:** `GET /api/boxmovement/parentbox/PB-001-VOLVO-ENGINE`

**Response (200):** Array of movements for the specified ParentBox

---

#### 5. Search BoxMovements
**GET** `/api/boxmovement/search?q={query}&page={page}&limit={limit}`

**Query Parameters:**
- `q` (optional): Search query (searches in id and ParentBoxCode)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response (200):** Paginated response

---

#### 6. Update BoxMovement
**PUT** `/api/boxmovement/:id`

**Request Body:** Same as Create (all fields optional)

**Important Behavior:**
- Reverses the previous movement's inventory changes
- Applies the new movement's inventory changes
- All operations are transactional (rollback on error)

**Response (200):**
```json
{
  "message": "BoxMovement updated successfully"
}
```

---

#### 7. Delete BoxMovement
**DELETE** `/api/boxmovement/:id`

**Example:** `DELETE /api/boxmovement/BM-20260106-001`

**Important Behavior:**
- Reverses the movement's inventory changes before deletion
- If movement was "add", deletion will subtract
- If movement was "subtract", deletion will add back

**Response (200):**
```json
{
  "message": "BoxMovement deleted successfully"
}
```

---

## Complete Implementation Scenarios

### Scenario 1: Creating a Complete Parent Box with Parts

**User Story:** As a warehouse manager, I want to create a new parent box for engine parts and add multiple parts to it.

**Step-by-Step Implementation:**

```javascript
// Step 1: Create ParentBox
async function createParentBox() {
  const response = await fetch('http://localhost:8080/api/parentbox', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ParentBoxCode: 'PB-001-VOLVO-ENGINE',
      description: 'This box is full of parts of a Volvo engine'
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
}

// Step 2: Create BoxParts with pictures
async function createBoxPart(partData, pictureFile) {
  const formData = new FormData();
  formData.append('BoxPartCode', partData.code);
  formData.append('description', partData.description);
  formData.append('regularDemand', partData.regularDemand);
  formData.append('inventoryTotalNumber', partData.initialInventory);
  formData.append('ParentBoxCode', partData.parentBoxCode);
  
  if (pictureFile) {
    formData.append('picture', pictureFile);
  }
  
  const response = await fetch('http://localhost:8080/api/boxpart', {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
}

// Step 3: Execute the workflow
async function setupNewParentBox() {
  try {
    // Create parent box
    const parentBox = await createParentBox();
    console.log('Created ParentBox:', parentBox);
    
    // Create parts
    const parts = [
      {
        code: 'BP-001-PIN',
        description: 'Pin that holds the engine red wire',
        regularDemand: 7,
        initialInventory: 0,
        parentBoxCode: 'PB-001-VOLVO-ENGINE'
      },
      {
        code: 'BP-002-WIRE',
        description: 'Red wire connector',
        regularDemand: 5,
        initialInventory: 0,
        parentBoxCode: 'PB-001-VOLVO-ENGINE'
      }
    ];
    
    for (const partData of parts) {
      // Get picture file from file input
      const pictureInput = document.getElementById(`picture-${partData.code}`);
      const pictureFile = pictureInput?.files[0];
      
      const boxPart = await createBoxPart(partData, pictureFile);
      console.log('Created BoxPart:', boxPart);
    }
    
    alert('Parent box and parts created successfully!');
  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
  }
}
```

**UI Components Needed:**
- Form for ParentBox (code, description)
- Form for BoxPart (code, description, regularDemand, picture upload)
- List to display created parts
- Submit button to execute workflow

---

### Scenario 2: Adding Inventory via Movement

**User Story:** As a warehouse operator, I want to record receiving new stock for multiple parts.

**Implementation:**

```javascript
async function addInventory() {
  const movement = {
    id: `BM-${Date.now()}`, // Generate unique ID
    ParentBoxCode: 'PB-001-VOLVO-ENGINE',
    movementType: 'add',
    BoxPartsDemanded: [
      {
        BoxPartCode: 'BP-001-PIN',
        demand: 50 // Adding 50 units
      },
      {
        BoxPartCode: 'BP-002-WIRE',
        demand: 100 // Adding 100 units
      }
    ]
  };
  
  const response = await fetch('http://localhost:8080/api/boxmovement', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(movement)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  const result = await response.json();
  console.log('Inventory added:', result);
  
  // Refresh BoxPart data to show updated inventory
  await refreshInventory();
}

async function refreshInventory() {
  const response = await fetch('http://localhost:8080/api/boxpart', {
    credentials: 'include'
  });
  
  const boxParts = await response.json();
  
  // Update UI with new inventory numbers
  boxParts.forEach(part => {
    const element = document.getElementById(`inventory-${part.BoxPartCode}`);
    if (element) {
      element.textContent = part.inventoryTotalNumber;
    }
  });
}
```

**UI Components Needed:**
- Table showing all BoxParts with current inventory
- Form to add parts to movement (BoxPartCode selector, demand input)
- Button to submit movement
- Real-time inventory display that updates after movement

---

### Scenario 3: Subtracting Inventory (Order Fulfillment)

**User Story:** As a warehouse operator, I want to record parts being used/shipped.

**Implementation:**

```javascript
async function fulfillOrder(orderDetails) {
  const movement = {
    id: `BM-ORDER-${orderDetails.orderId}`,
    ParentBoxCode: orderDetails.parentBoxCode,
    movementType: 'subtract',
    BoxPartsDemanded: orderDetails.items.map(item => ({
      BoxPartCode: item.code,
      demand: item.quantity
    }))
  };
  
  try {
    const response = await fetch('http://localhost:8080/api/boxmovement', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movement)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const result = await response.json();
    console.log('Order fulfilled:', result);
    alert('Order fulfilled successfully!');
    
    await refreshInventory();
  } catch (error) {
    // Handle insufficient inventory error
    if (error.message.includes('Insufficient inventory')) {
      alert('Cannot fulfill order: ' + error.message);
      // Show which parts are out of stock
    } else {
      alert('Error: ' + error.message);
    }
  }
}
```

---

### Scenario 4: Viewing Parent Box with All Parts and Movement History

**User Story:** As a warehouse manager, I want to see a complete view of a parent box including all its parts and movement history.

**Implementation:**

```javascript
async function loadParentBoxDetails(parentBoxCode) {
  try {
    // Fetch ParentBox with BoxParts
    const boxResponse = await fetch(
      `http://localhost:8080/api/parentbox/code/${parentBoxCode}`,
      { credentials: 'include' }
    );
    const parentBox = await boxResponse.json();
    
    // Fetch movement history
    const movementResponse = await fetch(
      `http://localhost:8080/api/boxmovement/parentbox/${parentBoxCode}`,
      { credentials: 'include' }
    );
    const movements = await movementResponse.json();
    
    // Display in UI
    displayParentBoxInfo(parentBox, movements);
  } catch (error) {
    console.error('Error loading details:', error);
  }
}

function displayParentBoxInfo(parentBox, movements) {
  // Display ParentBox info
  document.getElementById('box-code').textContent = parentBox.ParentBoxCode;
  document.getElementById('box-description').textContent = parentBox.description;
  
  // Display BoxParts table
  const partsTable = document.getElementById('parts-table');
  partsTable.innerHTML = parentBox.boxParts.map(part => `
    <tr>
      <td>${part.BoxPartCode}</td>
      <td>${part.description}</td>
      <td>
        ${part.picture ? 
          `<img src="http://localhost:8080/api/boxpart/picture/${part.BoxPartCode}" 
                width="50" crossorigin="use-credentials" />` 
          : 'No image'}
      </td>
      <td>${part.regularDemand}</td>
      <td>${part.inventoryTotalNumber}</td>
    </tr>
  `).join('');
  
  // Display movement history
  const movementList = document.getElementById('movement-list');
  movementList.innerHTML = movements.map(movement => `
    <div class="movement-card">
      <h4>${movement.id}</h4>
      <p>Type: ${movement.movementType}</p>
      <p>Date: ${new Date(movement.createdAt).toLocaleString()}</p>
      <ul>
        ${movement.BoxPartsDemanded.map(item => 
          `<li>${item.BoxPartCode}: ${movement.movementType === 'add' ? '+' : '-'}${item.demand}</li>`
        ).join('')}
      </ul>
    </div>
  `).join('');
}
```

**UI Components Needed:**
- Header section with ParentBox details
- Table of BoxParts with pictures and inventory
- Timeline/list of movements
- Filter/sort options for movements

---

### Scenario 5: Search and Filter

**User Story:** As a user, I want to search for parts across all parent boxes.

**Implementation:**

```javascript
async function searchBoxParts(query, page = 1) {
  const response = await fetch(
    `http://localhost:8080/api/boxpart/search?q=${encodeURIComponent(query)}&page=${page}&limit=20`,
    { credentials: 'include' }
  );
  
  const result = await response.json();
  
  // Display results
  displaySearchResults(result);
  
  // Display pagination
  displayPagination(result);
}

function displaySearchResults(result) {
  const container = document.getElementById('search-results');
  
  if (result.data.length === 0) {
    container.innerHTML = '<p>No results found</p>';
    return;
  }
  
  container.innerHTML = result.data.map(part => `
    <div class="part-card">
      <h3>${part.BoxPartCode}</h3>
      <p>${part.description}</p>
      <p>Parent Box: ${part.parentBox?.ParentBoxCode || 'N/A'}</p>
      <p>Inventory: ${part.inventoryTotalNumber}</p>
      <p>Regular Demand: ${part.regularDemand}</p>
      ${part.picture ? 
        `<img src="http://localhost:8080/api/boxpart/picture/${part.BoxPartCode}" 
              width="100" crossorigin="use-credentials" />` 
        : ''}
    </div>
  `).join('');
}

function displayPagination(result) {
  const pagination = document.getElementById('pagination');
  const pages = [];
  
  for (let i = 1; i <= result.totalPages; i++) {
    pages.push(`
      <button 
        onclick="searchBoxParts('${currentQuery}', ${i})"
        ${i === result.page ? 'class="active"' : ''}
      >
        ${i}
      </button>
    `);
  }
  
  pagination.innerHTML = pages.join('');
}

// Debounced search
let searchTimeout;
function onSearchInput(event) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentQuery = event.target.value;
    searchBoxParts(currentQuery);
  }, 300);
}
```

**UI Components Needed:**
- Search input with debounce
- Results grid/list
- Pagination controls
- Filters (by ParentBox, inventory level, etc.)

---

### Scenario 6: Low Stock Alerts

**User Story:** As a warehouse manager, I want to see which parts are running low on inventory.

**Implementation:**

```javascript
async function checkLowStock() {
  const response = await fetch('http://localhost:8080/api/boxpart', {
    credentials: 'include'
  });
  
  const allParts = await response.json();
  
  // Find parts where inventory is below regular demand
  const lowStockParts = allParts.filter(part => 
    part.inventoryTotalNumber < part.regularDemand
  );
  
  // Find parts critically low (less than 50% of regular demand)
  const criticalParts = allParts.filter(part => 
    part.inventoryTotalNumber < (part.regularDemand * 0.5)
  );
  
  displayLowStockAlerts(lowStockParts, criticalParts);
}

function displayLowStockAlerts(lowStock, critical) {
  const container = document.getElementById('alerts');
  
  let html = '';
  
  if (critical.length > 0) {
    html += '<div class="alert alert-danger"><h3>Critical Stock Levels</h3><ul>';
    critical.forEach(part => {
      html += `
        <li>
          <strong>${part.BoxPartCode}</strong>: ${part.inventoryTotalNumber} units 
          (Regular demand: ${part.regularDemand})
          <button onclick="quickOrder('${part.BoxPartCode}')">Quick Order</button>
        </li>
      `;
    });
    html += '</ul></div>';
  }
  
  if (lowStock.length > 0) {
    html += '<div class="alert alert-warning"><h3>Low Stock</h3><ul>';
    lowStock.forEach(part => {
      html += `
        <li>
          <strong>${part.BoxPartCode}</strong>: ${part.inventoryTotalNumber} units 
          (Regular demand: ${part.regularDemand})
        </li>
      `;
    });
    html += '</ul></div>';
  }
  
  if (critical.length === 0 && lowStock.length === 0) {
    html = '<div class="alert alert-success">All parts have adequate stock levels</div>';
  }
  
  container.innerHTML = html;
}
```

---

## Error Handling

### General Error Handling Pattern

```javascript
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include'
    });
    
    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      // Redirect to login
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    
    // Handle other errors
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: `HTTP ${response.status}: ${response.statusText}` 
      }));
      throw new Error(error.message || 'An error occurred');
    }
    
    return await response.json();
  } catch (error) {
    // Network errors
    if (error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}

// Usage
try {
  const result = await apiCall('http://localhost:8080/api/parentbox', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  // Handle success
} catch (error) {
  // Show user-friendly error
  showErrorNotification(error.message);
}
```

### Common Error Scenarios

1. **Duplicate Code Error**
```javascript
// Error: BoxPartCode already exists
// UI: Show inline validation error on the code input field
// Suggest: Check if user wants to update instead
```

2. **Insufficient Inventory**
```javascript
// Error: Insufficient inventory for BoxPart BP-001-PIN
// UI: Show detailed error with current vs. requested quantities
// Action: Allow user to adjust demand or cancel
```

3. **Parent Code Not Found**
```javascript
// Error: ParentBoxCode does not exist
// UI: Show dropdown of valid ParentBox codes
// Action: Let user select from existing or create new
```

4. **File Upload Errors**
```javascript
// Error: Only image files are allowed
// UI: Show accepted file types (jpg, png, etc.)
// Action: Clear file input and show format requirements
```

---

## UI/UX Recommendations

### 1. Dashboard Layout

**Recommended Sections:**
- **Overview Cards**: Total ParentBoxes, Total Parts, Low Stock Alerts, Recent Movements
- **Quick Actions**: Create ParentBox, Add Part, Record Movement
- **Recent Activity**: Latest movements with links to details

### 2. ParentBox Management Page

**Features:**
- Table/Grid view of all ParentBoxes
- Search and filter
- Click to expand and see associated BoxParts
- Quick actions: Edit, Delete, View Details
- Create button with modal/form

**Table Columns:**
- ParentBoxCode
- Description
- Number of Parts
- Total Inventory Value
- Last Updated
- Actions

### 3. BoxPart Management Page

**Features:**
- Grid view with pictures
- List view with detailed information
- Search by code or description
- Filter by ParentBox, inventory level
- Bulk upload option
- Quick edit inventory

**Card/Row Design:**
- Large picture thumbnail
- BoxPartCode and description
- Inventory status (with color coding)
- Regular demand indicator
- Quick action buttons

### 4. BoxMovement Page

**Features:**
- **Add Movement Form**:
  - ParentBox selector (autocomplete)
  - Movement type toggle (Add/Subtract)
  - Dynamic part selector (filtered by ParentBox)
  - Quantity inputs with validation
  - Preview of inventory changes
  - Submit button

- **Movement History**:
  - Timeline view
  - Filter by date range, ParentBox, movement type
  - Export to CSV/Excel
  - Reverse movement option (create opposite movement)

### 5. Inventory Status Page

**Features:**
- Real-time inventory levels
- Color-coded status (green = good, yellow = low, red = critical)
- Charts/graphs:
  - Inventory by ParentBox (pie chart)
  - Movement trends (line chart)
  - Top demanded parts (bar chart)
- Export reports

### 6. Mobile Responsiveness

**Considerations:**
- Use responsive tables (horizontal scroll or card view on mobile)
- Large touch targets for buttons
- Simplified navigation on mobile
- Camera integration for picture upload on mobile devices

### 7. Form Validation

**Client-Side Validation:**
```javascript
function validateParentBoxForm(formData) {
  const errors = {};
  
  if (!formData.ParentBoxCode || formData.ParentBoxCode.trim() === '') {
    errors.ParentBoxCode = 'Parent Box Code is required';
  }
  
  if (formData.ParentBoxCode && formData.ParentBoxCode.length > 50) {
    errors.ParentBoxCode = 'Code must be 50 characters or less';
  }
  
  return Object.keys(errors).length === 0 ? null : errors;
}
```

### 8. Notifications

**Use toast notifications for:**
- Success messages (e.g., "ParentBox created successfully")
- Error messages
- Warning messages (e.g., "Low stock detected")
- Info messages (e.g., "Inventory updated")

**Example Library:** React Toastify, Notistack, or custom toast component

### 9. Loading States

**Show loading indicators for:**
- API calls
- File uploads
- Search results
- Large data tables

### 10. Confirmation Dialogs

**Require confirmation for:**
- Delete operations
- Large inventory movements
- Bulk operations

```javascript
function confirmDelete(boxPartCode) {
  if (confirm(`Are you sure you want to delete BoxPart ${boxPartCode}? This action cannot be undone.`)) {
    deleteBoxPart(boxPartCode);
  }
}
```

---

## TypeScript Type Definitions

For TypeScript projects, here are the recommended type definitions:

```typescript
// types/box-management.ts

export interface ParentBox {
  ParentBoxCode: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  boxParts?: BoxPart[];
}

export interface BoxPart {
  BoxPartCode: string;
  description: string;
  picture: string | null;
  regularDemand: number;
  inventoryTotalNumber: number;
  ParentBoxCode: string | null;
  createdAt: string;
  updatedAt: string;
  parentBox?: ParentBox;
}

export interface BoxPartDemand {
  BoxPartCode: string;
  demand: number;
}

export interface BoxMovement {
  id: string;
  ParentBoxCode: string;
  movementType: 'add' | 'subtract';
  BoxPartsDemanded: BoxPartDemand[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  data: T[];
}

export interface ApiError {
  message: string;
}
```

---

## Additional API Suggestions

Based on common warehouse management needs, consider implementing these additional endpoints **on the backend**:

### 1. Bulk Operations
- `POST /api/boxpart/bulk-create` - Create multiple parts at once
- `POST /api/boxmovement/bulk-create` - Create multiple movements at once

### 2. Statistics and Reports
- `GET /api/parentbox/stats` - Get statistics (total boxes, total parts, etc.)
- `GET /api/boxpart/low-stock?threshold=0.5` - Get parts below threshold
- `GET /api/boxmovement/summary?startDate=...&endDate=...` - Movement summary

### 3. Export
- `GET /api/boxpart/export-excel?parentBoxCode=...` - Export parts to Excel
- `GET /api/boxmovement/export-excel?startDate=...&endDate=...` - Export movements

### 4. Inventory Adjustments
- `POST /api/boxpart/:code/adjust-inventory` - Direct inventory adjustment with reason

---

## Best Practices Summary

1. **Always use credentials: 'include'** for authenticated requests
2. **Handle file uploads** with FormData (don't set Content-Type header)
3. **Validate on client-side** before sending to server
4. **Show loading states** during API calls
5. **Display user-friendly error messages**
6. **Implement debounced search** to reduce API calls
7. **Use pagination** for large datasets
8. **Cache frequently accessed data** (e.g., ParentBox list for dropdowns)
9. **Implement optimistic UI updates** where appropriate
10. **Add confirmation dialogs** for destructive actions
11. **Monitor inventory levels** and show alerts
12. **Keep movement history** for auditing
13. **Use transactions** for inventory-critical operations (handled by backend)
14. **Implement proper error boundaries** in React applications
15. **Test with various file sizes and formats** for picture uploads

---

## Example React Components Structure

```
src/
├── components/
│   ├── ParentBox/
│   │   ├── ParentBoxList.tsx
│   │   ├── ParentBoxForm.tsx
│   │   ├── ParentBoxCard.tsx
│   │   └── ParentBoxDetails.tsx
│   ├── BoxPart/
│   │   ├── BoxPartList.tsx
│   │   ├── BoxPartForm.tsx
│   │   ├── BoxPartCard.tsx
│   │   └── BoxPartPictureUpload.tsx
│   ├── BoxMovement/
│   │   ├── MovementForm.tsx
│   │   ├── MovementHistory.tsx
│   │   ├── MovementCard.tsx
│   │   └── MovementSummary.tsx
│   └── shared/
│       ├── SearchBar.tsx
│       ├── Pagination.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorMessage.tsx
├── services/
│   ├── parentBoxService.ts
│   ├── boxPartService.ts
│   └── boxMovementService.ts
├── hooks/
│   ├── useParentBoxes.ts
│   ├── useBoxParts.ts
│   └── useBoxMovements.ts
└── pages/
    ├── Dashboard.tsx
    ├── ParentBoxManagement.tsx
    ├── BoxPartManagement.tsx
    └── InventoryManagement.tsx
```

---

This guide provides everything you need to implement a complete, production-ready frontend for the Box Management System. Start with the basic CRUD operations for each entity, then add advanced features like search, low stock alerts, and movement history as needed.
