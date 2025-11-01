# VAPI Tool Messages Setup Guide

This guide provides detailed instructions for configuring messages that your AI assistant will speak during tool execution.

## Overview

Messages make the conversation more natural by letting Riley speak to the user while the booking tool is processing. There are several message types you can configure.

## Step-by-Step Message Configuration

### Step 1: Request Start Message

This message plays **before** the tool call is made to your server.

1. In the **Messages** section, find **"Request Start"**
2. You have three options:

   **Option A: Default (Recommended)**
   - Select: **"Default (server will use default message)"** (currently selected)
   - The AI will use a generic message like "Let me check that for you..."
   - ✅ **This is fine to leave as-is**

   **Option B: Custom Message**
   - Select: **"Custom"**
   - Enter your custom message: `"Let me book that appointment for you..."`
   - Check the box: **"Wait for message to be spoken before triggering tool call"** (optional)
     - ✅ Check this if you want the message to finish before the API call starts
     - ⬜ Leave unchecked if you want the API call to happen immediately

   **Option C: No Message**
   - Select: **"None (no message will be spoken)"**
   - Use this if you want silent processing

   **Recommendation:** Use **"Custom"** with message: `"Let me book that appointment for you..."` and **check** the "Wait for message" box for better user experience.

### Step 2: Request Complete Message

This message plays **after** your server successfully responds.

1. Click the **"+ Add Message"** button (top right)
2. Select **"Request Complete"** from the dropdown
3. Enter your success message:
   ```
   "Perfect! Your appointment has been booked successfully. You'll receive a confirmation email shortly."
   ```

### Step 3: Request Failed Message

This message plays if your server returns an error or the request fails.

1. Click **"+ Add Message"** button again
2. Select **"Request Failed"** from the dropdown
3. Enter your error message:
   ```
   "I encountered an issue booking your appointment. Let me help you try again or find an alternative time."
   ```

### Step 4: Request Response Delayed Message (Optional)

This message plays if your server takes too long to respond.

1. Click **"+ Add Message"** button
2. Select **"Request Response Delayed"** from the dropdown
3. Enter a message like:
   ```
   "This is taking a bit longer than usual. Please hold on..."
   ```
4. Configure the delay threshold (if available):
   - Set it to trigger after 3-5 seconds of waiting

### Step 5: Conditions (Advanced - Optional)

Conditions let you customize messages based on response content.

1. In the **Conditions** section, click **"+ Add Condition"**
2. Configure based on your server response:
   - Example: If the response contains "already booked", show a different message
   - Example: If the response contains "invalid date", show date-specific help

   **For now, you can skip this** - your server already returns helpful error messages in the response text.

## Recommended Message Configuration

Here's what I recommend for the booking tool:

### Request Start
- **Option:** Custom
- **Message:** `"Let me book that appointment for you..."`
- **Wait for message:** ✅ Checked (ensures user hears the message first)

### Request Complete
- **Message:** `"Great! I've successfully booked your appointment. You'll receive a confirmation email with all the details shortly."`

### Request Failed
- **Message:** `"I encountered an issue while booking your appointment. Let me help you find another available time."`

### Request Response Delayed
- **Message:** `"This is taking a moment. Please hold on while I complete your booking..."`

## Testing Your Messages

1. After configuring messages, click **"Save"**
2. Test by clicking the **"▷ Test"** button
3. Make a test call to your assistant
4. Verify that messages play at the right times:
   - Start message before API call
   - Success message after successful booking
   - Error message if something fails

## Message Best Practices

1. **Keep messages short:** 10-15 words maximum
2. **Be conversational:** Match Riley's friendly tone
3. **Provide reassurance:** Let users know what's happening
4. **Handle errors gracefully:** Always suggest next steps
5. **Match your brand:** Use language consistent with your dental practice

## Important Notes

- **Message Priority:** If you configure custom messages, they override the default behavior
- **Timing:** The "Wait for message" option ensures better user experience but adds slight delay
- **Server Responses:** Your server responses (from `/api/vapi-book-appointment`) are also spoken by the AI - messages are additional context
- **Error Handling:** Even with custom failure messages, your server should return helpful error text that the AI will also communicate

## Troubleshooting

**Problem:** Messages not playing
- ✅ Check that messages are saved
- ✅ Verify tool is attached to assistant
- ✅ Test with the "▷ Test" button

**Problem:** Messages play at wrong times
- ✅ Review the message types (Start vs Complete vs Failed)
- ✅ Check server response format matches expectations

**Problem:** Too many messages or confusing flow
- ✅ Simplify to just Complete and Failed messages
- ✅ Let the server response text handle most communication

## Next Steps

After configuring messages:
1. ✅ Click **"Save"** on the tool
2. ✅ Attach the tool to your assistant (Assistants → Your Assistant → Tools tab)
3. ✅ Test with a real voice call
4. ✅ Adjust messages based on user feedback

