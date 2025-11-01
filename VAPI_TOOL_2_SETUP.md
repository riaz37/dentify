# Creating the "Get Available Doctors" Tool

This tool allows the AI assistant to fetch and list available doctors when users ask about dentists or need help choosing one.

## Step-by-Step Instructions

### Step 1: Create the Tool

1. In VAPI Dashboard, go to **Tools** section
2. Click **"+ Create Tool"** button
3. Select **"Function"** type (not a default tool)

### Step 2: Basic Configuration

**Tool Name:** `get_available_doctors`

**Description:** `Retrieves a list of available dentists with their specialties`

### Step 3: Function Configuration

**Function Name:** `get_available_doctors`

**Function Description:** `Returns a list of all available dentists with their names and specialties`

### Step 4: Parameters

Since this tool doesn't need any input parameters, use this minimal configuration:

```json
{
  "type": "object",
  "properties": {}
}
```

Or simply leave the parameters field empty/default.

**Required fields:** None (empty array)

### Step 5: Server URL

Enter your API endpoint:
```
https://dentify37.vercel.app/api/vapi-get-doctors
```

### Step 6: Timeout

- **Recommended:** `10 seconds` (this is a simple read operation, shouldn't take long)
- You can keep default if it's around 10-20 seconds

### Step 7: Authorization

- **Setting:** "No authentication" ✅
- Same as the booking tool - your endpoint doesn't require API keys

### Step 8: HTTP Headers

- **Setting:** None needed ✅
- Leave empty

### Step 9: Messages (Optional but Recommended)

Click **"+ Add Message"** and add:

**Request Complete:**
```
"Here are the available doctors:"
```

**Request Failed:**
```
"I'm having trouble retrieving the list of doctors. Please try again."
```

**Request Start:**
- You can leave as "Default" or set to "None" since this is quick

### Step 10: Save

Click the green **"Save"** button at the top right

## Testing the Tool

### Test Payload

In the test interface, use this JSON:

```json
{
  "message": {
    "type": "tool-calls",
    "toolCallList": [
      {
        "id": "test_doctors_123",
        "name": "get_available_doctors",
        "arguments": {}
      }
    ]
  }
}
```

### Expected Response

```json
{
  "results": [
    {
      "toolCallId": "test_doctors_123",
      "result": "Available doctors: Dr. Smith (General Dentistry), Dr. Johnson (Orthodontics), ..."
    }
  ]
}
```

## Attaching to Assistant

1. Go to **Assistants** → Your Assistant
2. Open the **Tools** tab
3. Click **"Add Tool"**
4. Select both:
   - `book_appointment` ✅
   - `get_available_doctors` ✅
5. Save your assistant

## When Will This Tool Be Used?

The AI assistant will automatically call this tool when:
- User asks "What doctors are available?"
- User says "I don't know which doctor to choose"
- User asks "Who can I book with?"
- User needs help selecting a dentist

The assistant will use the list to guide the user's booking decision.

## Summary

| Setting | Value |
|---------|-------|
| Tool Name | `get_available_doctors` |
| Type | Function |
| Parameters | Empty `{}` |
| Server URL | `https://dentify37.vercel.app/api/vapi-get-doctors` |
| Timeout | 10 seconds |
| Authorization | No authentication |
| HTTP Headers | None |
| Messages | Optional (Request Complete recommended) |

## Quick Checklist

- [ ] Tool created with name `get_available_doctors`
- [ ] Server URL configured
- [ ] Parameters set to empty object `{}`
- [ ] Tool saved successfully
- [ ] Tested with sample payload
- [ ] Attached to assistant along with `book_appointment`
- [ ] Both tools are active in assistant

That's it! This tool is much simpler than the booking tool since it doesn't need any input parameters.

