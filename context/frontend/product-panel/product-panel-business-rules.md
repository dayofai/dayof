# Product Panel Business Rules

**Purpose:** Validate that these business behaviors match what we want customers to experience  
**Audience:** Business stakeholders, product owners, non-technical reviewers  
**Source:** Product Panel Spec 0.4

---

## 🎯 What This Document Is

This document describes **every customer-facing behavior** in the ticket buying experience. Each behavior is numbered for easy reference during review discussions.

**How to Read This:**

- Start with "Customer Experience Overview" to understand the big picture
- Follow the "Happy Path" to see the standard flow
- Review "Alternative Paths" for sold-out, waitlist, and pre-sale scenarios
- Check "Special Features" for advanced functionality
- Use the "Validation Checklist" to identify decisions that need review

**Total Business Rules:** 148  
**Last Updated:** Based on Product Panel Spec 0.4 (with compact layout enhancements)

---

## 📱 Customer Experience Overview

### The Big Picture: What Customers See

When a customer arrives at an event page, they see one of two layouts:

1. **Streamlined Layout (Simple Events)**

   - Single ticket type, clean focused design
   - Welcome message at top
   - Ticket card with name and price
   - One main button: "Get Ticket" or "Get Tickets"
   - Used for: Single admission events, workshops, simple registrations

2. **Full Layout (Complex Events)**
   - Multiple ticket types in a list
   - Each row shows different options
   - Grouped into sections (Tickets, Add-ons, Merchandise)
   - Used for: Events with GA + VIP, events with add-ons, merchandise

### The Customer Journey

```
Arrive at page
    ↓
See welcome message + available options
    ↓
Select tickets (if multiple quantities available)
    ↓
See price breakdown update
    ↓
Click "Get Tickets" / "Join Waitlist" / "Notify Me"
    ↓
Proceed to next step
```

---

## ✅ The Happy Path: Available Ticket

This is the standard flow when everything is working normally—tickets are on sale, in stock, and ready to purchase.

### What Products Can Be Shown

1. Each ticket or product has a unique identifier
2. Products can be tickets, digital items (vouchers, downloads), or physical goods (merchandise)
3. Every product must have a name
4. Products are grouped into sections (e.g., "Tickets", "Add-ons", "Merchandise")

### How Available Tickets Appear

5. **When tickets are available:** They show with price and quantity selector
6. Price is clearly displayed with currency symbol
7. All prices on a panel must be in the same currency (can't mix USD and EUR)
8. Fee inclusion is clearly marked: either "+ fees" or "fees included"

### How Selection Works

A ticket can be purchased when **ALL** of these are true:

9. **Sale is active:** The ticket is currently on sale (not before/after sale window)
10. **In stock:** The ticket is available (not sold out)
11. **Access granted:** No access code is required, OR the user has entered a valid code
12. **Purchase allowed:** The quantity limit is greater than zero

If **any one** of these is false, users cannot purchase.

### Quantity Selection

13. **Maximum per order** is set by the system based on:

    - Current inventory
    - Per-order limits (e.g., "Max 6 tickets per order")
    - Per-user limits (e.g., "Max 4 tickets per person across all orders")
    - Temporary holds (tickets in other users' carts)
    - Anti-fraud rules

14. **The system calculates one final "max selectable" number** for each ticket based on ALL of the above
15. Users can only select up to this maximum; the quantity selector enforces this limit
16. Display messages like "Max 4 per order" are informational; the actual enforced limit comes from the system

### Quantity Selector Behavior

**In streamlined layout (single ticket type):**

17. **Single ticket only (max 1):** No quantity selector shown - clicking "Get Ticket" adds 1 automatically
18. **Multiple tickets allowed:** Quantity stepper (-, count, +) appears on the right side of the ticket card

**In full layout (multiple ticket types):**

19. **All tickets max 1:** Simple "Add" buttons on each row
20. **ANY ticket allows multiple:** ALL tickets show quantity steppers (even those limited to 1)
21. **Why consistent selectors matter:** Users shouldn't see different controls for similar products

### Price Display

22. **Prices are shown** when a user can actually purchase the item (on sale, in stock, access granted)
23. **Prevent false expectations:** We don't show prices for things users can't buy to avoid frustration ("Why show me a price if I can't buy it?")
24. Prices are displayed with proper currency symbols and formatting

### Price Breakdown

25. System calculates all totals, taxes, and fees
26. Price breakdown appears at the bottom: "Tickets", "Fees", "Tax", "Total"
27. Breakdown updates automatically when users change quantities
28. Lines appear in the order the system sends them (typically: Subtotal, Fees, Tax, Total)

### Fee Display

29. Fees can be shown as:
    - **Separate:** "$50.00 + fees"
    - **Included:** "$55.00 (fees included)"
30. This is configured per event and shown consistently

### Discounts & Promo Codes

31. When a discount is applied, it appears as a negative line item: "Promo applied: -$10.00"
32. Total reflects the discount automatically

### Main Action Button

33. **Button text in streamlined layout (single ticket):**

    - Max 1 ticket: "Get Ticket" (singular)
    - Multiple tickets: "Get Tickets" (plural)

34. **Button text in full layout:** Always plural - "Get Tickets" or "Continue"

35. **The system chooses the right label** based on what's available and how many you can buy

36. **What it does:** Starts the checkout process with selected tickets

### Selection Requirements

37. Events can enforce rules like:

    - "Must select at least 1 ticket type"
    - "Must select at least 2 tickets per type"
    - "Can only select tickets from 1 section"
    - "Can mix multiple ticket types"

38. The main action button is disabled until these requirements are met
39. Error messages guide users: "Please select at least 2 tickets"

### Real-Time Pricing Updates

40. As users change quantities, the system recalculates everything
41. Users don't see stale or incorrect totals
42. If there's a delay loading updated prices, the previous total stays visible (no flash of empty pricing)

---

## 🚫 Alternative Path: Sold Out Tickets

When tickets sell out, the experience changes to either offer waitlist signup or simply inform users.

### When Individual Tickets Sell Out

43. The ticket row shows "Sold Out" message
44. Quantity selector is hidden
45. Price is hidden (we don't tease with prices for unavailable items)
46. If waitlist is available, a "Join Waitlist" button appears instead of "Add to Cart"

### When All Public Tickets Are Sold Out

47. **If no hidden access-controlled tickets exist:**

    - Option A: Show a panel-wide "Event Sold Out" message
    - Option B: Keep the sold-out ticket list visible with individual "Sold Out" labels
    - This is controlled by a display preference

48. **If hidden access-controlled tickets DO exist:**
    - The system prompts for an access code
    - We DON'T show "Event Sold Out" (because there might be tickets available with a code)
    - A message like "Enter access code to view tickets" appears

### Waitlist Functionality

49. **When offered:** A "Join Waitlist" button appears on sold-out tickets
50. **Purpose:** Users can sign up to be notified if tickets become available
51. **Access-controlled items:** Waitlist option is NOT shown for locked tickets until the user enters a valid code (prevents revealing secret presales)

### Main Button Waitlist Mode

52. The main button changes to "Join Waitlist" when:

    - NO tickets are currently purchasable (all sold out or not on sale), AND
    - At least one ticket offers waitlist signup

53. Example: Event sells out, main button becomes "Join Waitlist" for the whole event
54. Locked tickets don't trigger waitlist mode (user must unlock first)

### Display Preferences for Sold Out

55. **Show sold-out tickets in list:** Users see what was available (transparency, builds context)
56. **Hide sold-out tickets:** Cleaner view, just shows a sold-out message
57. This is configured per event based on marketing strategy

---

## ⏰ Alternative Path: Not On Sale Yet

When tickets haven't gone on sale yet, customers can sign up to be notified.

### Before Sales Start

58. Users see the ticket name but cannot purchase
59. A message shows when tickets go on sale (e.g., "On sale Friday at 10:00 AM CT")
60. If configured, a "Notify Me" button lets users sign up for alerts
61. Price may or may not be visible (business decision)

### Main Button Notify Me Mode

62. The main button changes to "Notify Me" when:

    - Tickets aren't on sale yet, AND
    - At least one ticket offers pre-sale notifications

63. Example: Pre-sale event shows "On sale Friday at 10 AM" with "Notify Me" button

### During Sale

64. All available tickets are shown with prices and quantity selectors
65. Users can add tickets to their order
66. Countdown timers (if any) show time remaining in sale

### After Sale Ends

67. Tickets show "Sales ended" message
68. No purchase option is available
69. System may offer waitlist or notify-me for future events

---

## 🔐 Special Feature: Access-Controlled Tickets

Access codes enable presales, member-only tickets, and VIP access.

### Two Visibility Modes

**Mode 1: Hidden Until Unlocked (default, most secure)**

70. Access-restricted tickets are completely invisible until a valid code is entered
71. No names, no prices, no hints about what's hidden
72. The ONLY hint shown is a message like "Enter access code to view tickets"
73. An access code input box appears (either subtle below main button, or prominent at top)

**Mode 2: Visible But Locked (tease mode)**

74. The ticket appears in the list but is "locked"
75. Price is masked (shown as "—" or "Locked")
76. Quantity selector is hidden
77. A lock icon and message like "Requires access code" are shown
78. The ticket name IS visible (intentional tease for marketing)

### Access Code Entry & Validation

79. Access code input appears when:

    - Hidden tickets exist, OR
    - Any visible ticket is locked

80. **Subtle entry (standard):** Small link/button below main action button - "Have an access code? You can enter it here."

81. **Prominent entry (gated-only):** When ONLY locked tickets exist and nothing else is available:

    - Large entry form appears at the top in a banner
    - Includes helpful messaging: "Have an access code? Enter it below..."
    - Makes it very clear for code-holders they're in the right place

82. User enters code and clicks "Apply Code"
83. System validates the code on the server (not in the browser)
84. Invalid codes show an error message: "Invalid access code. Please try again."

### After Successful Code Entry

85. **If tickets were hidden:** They now appear in the list (unlocked, purchasable if in stock)
86. **If tickets were visible-locked:** They become unlocked (price shown, quantity selector appears)
87. **If unlocked tickets are sold out:** They still appear but show "Sold Out" - this confirms the code worked
88. A confirmation message may appear: "Unlocked with your code"

### Security & Privacy

89. Access codes are never logged or exposed in browser debugging
90. Even if you inspect the page source, you cannot see hidden tickets
91. Codes are validated by the system, not the browser (prevents bypassing security)
92. **Security:** For access-controlled tickets, we don't reveal pricing until the user proves they should see it

---

## 🎁 Special Feature: Add-ons & Extras

Add-ons let customers purchase parking, meals, or upgrades alongside their tickets.

### What Are Add-ons

93. Add-ons are products that require purchasing a "parent" ticket first
94. Examples: parking passes, meal vouchers, VIP upgrades, merchandise bundles
95. Add-ons are NOT a separate product type; they're linked to parent products

### How Add-ons Work

96. **Parent ticket required:** You can't buy an add-on without first selecting its parent ticket
97. **Per-ticket add-ons:** Example - meal voucher. If you buy 3 tickets, you can buy up to 3 meal vouchers
98. **Per-order add-ons:** Example - parking pass. You can buy 1 parking pass per order, regardless of how many tickets

### Add-on Behavior

99. **Before parent selected:** Add-on shows "Add at least one ticket to select this add-on"
100. **After parent selected:** Add-on becomes available; quantity limit adjusts based on parent quantity
101. **If parent quantity decreases:** Add-on quantity is automatically reduced to match
102. **If all parents are access-controlled:** The add-on is also hidden until access granted (prevents revealing hidden tickets)

---

## 💬 Special Feature: Welcome Messages & Communication

The panel uses smart messaging to guide customers and set expectations.

### Panel Welcome Text

103. Events can show a custom welcome message at the top of the ticket panel
104. If no custom message is set, the system shows smart defaults based on what's happening:
     - Tickets available: "Welcome! To join the event, please get your ticket below."
     - Everything sold out with waitlist: "This event is sold out. Join the waitlist to be notified if tickets become available."
     - Not on sale yet: "Tickets aren't on sale yet. Get notified when they're available."

### Status Messages on Tickets

105. Each ticket can show status messages like:

     - "Only 3 left!" (low inventory urgency)
     - "On sale Friday at 10 AM CT" (pre-sale timing)
     - "Sold Out" (no inventory)
     - "Requires access code" (locked ticket)
     - "Includes VIP lounge access" (perks included)

106. Messages have priority levels; important messages (sold out, access required) appear first
107. Messages can have different styles: neutral (info), informational (standard), warning (urgent), error (problem)

### Panel-Wide Banners

108. Banners appear at the top of the ticket panel for event-wide announcements:

     - "Enter access code to view tickets"
     - "Payment plans available at checkout"
     - "All tickets sold out"
     - "Event canceled - refunds processing"

109. Banners can include:

     - Icon (visual indicator)
     - Title (heading)
     - Text (main message)
     - Description (additional details)
     - Optional action button (e.g., "Learn More")

110. Multiple banners can stack on top of each other
111. Most important banners appear first (determined by the system)
112. Banners are never auto-generated by the interface; they come from the system based on business rules

### Error Messages

113. When users try to checkout without meeting requirements:

     - "Please select at least one ticket"
     - "Maximum 4 tickets per order"
     - "Minimum 2 tickets required for this type"

114. All error messages come from the system; the interface never invents its own wording

### Payment Plans

115. **When available:** A panel-wide banner states "Payment plans available at checkout"
116. **Never shown per-ticket:** We don't put "Payment Plan" badges on individual tickets
117. **Why:** Payment plans are an order-level option, not a per-product feature

---

## 🎨 Display Preferences & Urgency

### Low Inventory Urgency

118. When tickets are running low, they may show:
     - Red/orange styling
     - "Only X left!" message
     - Pulsing or highlighted appearance
119. The threshold for "low" is set by the system (e.g., 10 or fewer)

---

## 🔄 Real-Time Updates

### When Things Change

120. **Inventory changes:** If tickets sell out while you're browsing, the system updates automatically
121. **Sale starts/ends:** When sale window opens/closes, available tickets update
122. **Access code entered:** New tickets appear or unlock immediately
123. **Quantity changes:** Pricing updates automatically

### What Users See

124. Updates happen smoothly without page reload
125. Previous information stays visible during updates (no jarring empty states)
126. If an update fails, users see their previous state and can retry

---

## 🚨 Edge Cases & Recovery Scenarios

These are less common situations that the system handles gracefully.

### User Enters Valid Code But Tickets Are Sold Out

127. The system confirms the code worked
128. Unlocked tickets appear in the list as "Sold Out" (not hidden)
129. This confirms to the user "your code was valid, but they sold out"
130. May offer waitlist if available

### Public Tickets Sold Out + Hidden Presale In Stock

131. System prompts for access code (may show prominent entry form if this is the only action available)
132. Does NOT show "Event Sold Out" message (misleading if presale tickets exist)
133. After valid code, presale tickets appear

### Sale Ends While User Is Selecting

134. Tickets become unavailable
135. System updates to show "Sales ended"
136. User sees clear messaging about what happened

### Inventory Runs Out While User Is Selecting

137. Tickets become "Sold Out"
138. System updates quantity limits
139. If user had 5 selected but only 2 remain, their selection is reduced to 2
140. Clear messaging explains the change

---

## ✅ What You Need to Validate

### Critical Decisions to Review

These decisions affect the customer experience and require business stakeholder approval.

**Pricing & Transparency:**

- [ ] Do we want to show prices for sold-out tickets? (Currently: No)
- [ ] Do we want to show prices before sales start? (Currently: Configurable)
- [ ] Should fees be shown separately or included? (Currently: Configurable per event)

**Access Control:**

- [ ] Should presale tickets be completely hidden or visible-but-locked? (Currently: Configurable per presale)
- [ ] What message should appear when access code is required? (Currently: Customizable)
- [ ] Should we show waitlist for locked tickets? (Currently: No, until unlocked)
- [ ] Should access code entry be subtle or prominent when it's the only available action? (Currently: Prominent inline form when gated-only)

**Sold Out Behavior:**

- [ ] When everything sells out, show ticket list or just banner? (Currently: Configurable)
- [ ] What should waitlist messaging say? (Currently: Customizable)
- [ ] If user unlocks sold-out presale, still show the sold-out tickets? (Currently: Yes, for confirmation)

**Layout & Presentation:**

- [ ] Should simple single-ticket events use the streamlined layout? (Currently: Automatic based on complexity)
- [ ] What welcome message should appear for different event states? (Currently: Smart defaults with custom override option)
- [ ] When multiple ticket types exist with different quantity limits, should they all use the same selector style? (Currently: Yes, for visual consistency)

**Purchase Limits:**

- [ ] What are typical max per order limits? (Currently: Configurable per ticket type)
- [ ] How do we communicate limits to users? (Currently: Messages like "Max 4 per order")
- [ ] Should add-ons be limited per-ticket or per-order? (Currently: Configurable per add-on)

**Messaging:**

- [ ] What should low inventory message say? (Currently: Customizable, e.g. "Only 3 left!")
- [ ] When should we show low inventory warnings? (Currently: Threshold configurable)
- [ ] Should payment plan messaging appear on all events? (Currently: Only when explicitly configured)

**User Experience:**

- [ ] If all tickets in one section sell out, hide that section? (Currently: Configurable)
- [ ] Should we show "Notify Me" before sale starts? (Currently: Configurable per event)
- [ ] What happens if user tries to checkout without meeting requirements? (Currently: Button disabled + error message)

---

## 📊 Business Metrics Impact

Understanding how these rules affect business goals:

**Conversion Rate:**

- Hiding prices vs showing them for unavailable items
- Streamlined layout for simple events reduces friction
- Clear CTAs ("Get Ticket" vs "Get Tickets") set expectations

**User Clarity:**

- Clear sold-out vs access-code messaging
- Consistent quantity selectors across ticket types
- Smart welcome messages adapt to event state

**Marketing & Sales:**

- Presale secrecy: Hidden vs visible-locked presale tickets
- Prominent entry for code-holders increases conversion
- Urgency/FOMO: Low inventory messaging and display

**Operations:**

- Support load: Clear error messages reduce support tickets
- Upsell effectiveness: Add-on visibility and messaging
- Mobile UX: Streamlined layout works better on small screens

---

## 📚 Complete Reference

This section contains the complete enumerated list of all 148 business rules for detailed reference.

### Layout & Display (Rules 141-142)

141. **Streamlined layout** is automatically used when there's only ONE ticket type available
142. **Full layout** is automatically used when there are MULTIPLE ticket types or products

### Button States (Rules 143-148)

143. The main button can perform three different actions: **Start Checkout**, **Join Waitlist**, or **Notify Me**
144. Button text adapts to singular ("Get Ticket") or plural ("Get Tickets") based on context
145. Button is disabled/grayed when there's no valid action, but text stays the same
146. Disabled happens when tickets are locked, sold out with no waitlist, or other blocking conditions exist
147. When button is disabled, users see it visually but cannot click it
148. The system determines button state and label based on what's available

---

## 📝 How to Review This Document

**For Your Review Session:**

1. **Start with "Customer Experience Overview"** - Understand the big picture first
2. **Walk through "The Happy Path"** - This is what 90% of customers will see
3. **Review "Alternative Paths"** - Sold out and pre-sale flows
4. **Examine "Special Features"** - Access codes, add-ons, messaging
5. **Check "Edge Cases"** - Make sure recovery scenarios make sense
6. **Use the "Validation Checklist"** - These are the key decisions that need your approval

**During Review:**

- Note rule numbers for any behavior that doesn't match business goals
- Identify missing scenarios not covered here
- Validate messaging - do the example messages match our brand voice?
- Check edge cases - are there customer scenarios we haven't addressed?

**After Review:**

- Discuss any rules that don't match business intent
- Identify rules that need customization per event
- Document any new scenarios or edge cases discovered
