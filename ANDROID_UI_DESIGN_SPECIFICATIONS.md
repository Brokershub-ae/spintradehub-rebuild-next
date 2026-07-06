# SpinTradeHub Android UI Design Specifications
## Complete Material Design 3 Layout & Component Reference

This document captures all the exact UI/UX patterns, measurements, colors, and component styling from the Android source code to enable precise Next.js/React replication.

---

## 1. COLOR PALETTE

### Primary Brand Colors
```
SpinBlue (Primary):       #0056D2  - Professional deep blue for main actions & headers
SpinBlue Dark:            #003E99  - Darker blue for depth & hover states
SpinBlue Light:           #1976D2  - Lighter blue for accents
SpinDarkBlue:             #003366  - Darkest blue for maximum contrast

SpinOrange (Secondary):   #FF8C00  - Vibrant orange for secondary actions
SpinOrange Dark:          #E67700  - Darker orange for pressed states
SpinOrange Light:         #FFA726  - Light orange for highlights
```

### Neutral Colors
```
SpinWhite:                #FFFFFF  - Pure white
SpinLightGray:            #F5F5F5  - Light background gray
SpinMediumGray:           #E0E0E0  - Medium gray for borders
SpinDarkGray:             #424242  - Dark gray for text
```

### Status/Accent Colors
```
SpinSuccess (Green):      #4CAF50  - Success/positive states
SpinWarning (Orange):     #FFA726  - Warnings
SpinError (Red):          #F44336  - Error states
SpinInfo (Light Blue):    #2196F3  - Information

Favorite Icon:            #FF0000  - Red for favorites/likes
Rating Stars:             #FFC107  - Gold/amber for ratings
```

### Card & Surface Colors
```
Card Background:          #FAFAFA  - Very light gray
Card Blue Tint:           #F0F4FF  - Light blue tint for cards
Card Orange Tint:         #FFF4E6  - Light orange tint for cards
```

### Theme Scheme (Light Mode - Default)
```
Background:               #FFFFFF
Surface:                  #FAFAFA
Primary Container:        Blue-based with opacity
Secondary Container:      Orange-based with opacity
onPrimary:                #FFFFFF (white on blue)
onSecondary:              #FFFFFF (white on orange)
onBackground:             #003366 (darkest blue)
onSurface:                #003366 (darkest blue)
```

### Theme Scheme (Dark Mode)
```
Background:               #1e3a8a (navy blue)
Surface:                  #1A2332 (dark navy)
Primary:                  #FF8C00 (orange takes priority in dark)
Secondary:                #0056D2 (blue)
onPrimary:                #FFFFFF
onSecondary:              #FFFFFF
onBackground:             #FFFFFF
onSurface:                #FFFFFF
```

---

## 2. SPACING & PADDING UNITS (All in dp - density-independent pixels)

### Consistent Spacing Scale
```
4.dp   - Minimal gaps between inline elements
8.dp   - Small vertical spacing (icon gaps, minor separation)
12.dp  - Medium-small spacing (button content, small margins)
16.dp  - Standard padding for cards, screens, horizontal edges
24.dp  - Large spacing between major sections
32.dp  - Extra-large spacing (screen headers, major dividers)
```

### Common Padding Patterns
- **Screen/Container Padding**: `padding(horizontal = 16.dp, vertical = 16.dp)` or `padding(16.dp)`
- **Card Interior Padding**: `padding(16.dp)` - all sides uniform
- **Text Inside Elements**: `padding(horizontal = 10.dp, vertical = 6.dp)` for badges/tags
- **Between Items in Lists**: `Arrangement.spacedBy(12.dp)` or `Arrangement.spacedBy(16.dp)`
- **Bottom Navigation Bottom Padding**: `contentPadding = PaddingValues(bottom = 16.dp)` for LazyColumn

### Horizontal Spacing in Rows
- **Between Icon and Text**: `width = 8.dp` or `width = 16.dp` (in row elements)
- **Between Row Elements**: `Arrangement.spacedBy(8.dp)` for compact, `spacedBy(16.dp)` for relaxed

### Vertical Spacing in Columns
- **Between Stacked Elements**: `height = 4.dp` to `height = 24.dp` depending on emphasis
- **After Text Headers**: `height = 4.dp` to `height = 16.dp`

---

## 3. CORNER RADIUS / BORDER RADIUS

### Button Shapes
```
Standard Button:          RoundedCornerShape(12.dp)  - Medium roundness
Animated Button:          RoundedCornerShape(12.dp)  - Orange primary button
Outlined Button:          RoundedCornerShape(default)  - Standard MD3
```

### Card Shapes
```
Post Card (Large):        RoundedCornerShape(16.dp)  - Most prominent cards
User Search Card:         RoundedCornerShape(12.dp)  - Network/discover cards
Product Card:             RoundedCornerShape(default)  - Slight MD3 default rounding
Badge/Tag Labels:         RoundedCornerShape(8.dp)   - Small tags on images
Category Labels:          RoundedCornerShape(default)  - Material defaults
```

### Other Shapes
```
Avatar/Profile Image:     CircleShape              - Perfect circles (100.dp, 60.dp, 64.dp)
Bottom Navigation Bar:    No rounding              - Straight edges
Top App Bar:              No rounding              - Straight edges
Dialog/Modal:             RoundedCornerShape(default)  - Material Design 3 standard
```

---

## 4. ELEVATION / SHADOW DEPTH

### Card Elevations
```
Default Card:             CardDefaults.cardElevation(defaultElevation = 4.dp)
Post Card (featured):     CardDefaults.cardElevation(defaultElevation = 8.dp, hoveredElevation = 12.dp)
User Search Card:         CardDefaults.cardElevation(defaultElevation = 4.dp)
Surface Elevation:        tonalElevation = 4.dp
```

### Button Elevations
```
Animated Button:          ButtonDefaults.elevatedButtonElevation(
                          defaultElevation = 6.dp,
                          pressedElevation = 2.dp)
```

### Top/Bottom App Bar
```
Top App Bar:              No custom elevation (Material default ~4.dp)
Bottom Navigation:        No elevation specified (flat)
```

---

## 5. HOME SCREEN LAYOUT & COMPONENTS

### Top App Bar (TopAppBar)
```kotlin
TopAppBar(
  title = { Text(app_name) },
  colors = TopAppBarDefaults.topAppBarColors(
    containerColor = MaterialTheme.colorScheme.primary,      // Blue
    titleContentColor = MaterialTheme.colorScheme.onPrimary,  // White
    actionIconContentColor = MaterialTheme.colorScheme.onPrimary
  ),
  actions = {
    // Filter Icon
    // AI Chatbot Icon (custom drawable)
    // Profile Icon
  }
)
```

**Specs:**
- Background: `SpinBlue (#0056D2)` 
- Title Text: White, `headlineSmall` style
- Icon Size: 24-28dp
- Status Bar Style: Light content on dark background

### Search Bar
```kotlin
OutlinedTextField(
  label = { Text("Search hint") },
  leadingIcon = { Icon(Icons.Default.Search, ...) },
  modifier = Modifier.fillMaxWidth(),
  singleLine = true
)
```

**Specs:**
- Width: Full width of container
- Padding: `horizontal = 16.dp, vertical = 16.dp`
- Border Color: Default MD3 outline (medium gray)
- Focused Border: Blue (#0056D2)
- Height: Standard 56dp (MaterialTheme default)
- Leading Icon: Search icon, 24dp

### Category Filter Chips (Horizontal Scrollable)
```kotlin
Row(
  modifier = Modifier
    .fillMaxWidth()
    .horizontalScroll(rememberScrollState()),
  horizontalArrangement = Arrangement.spacedBy(8.dp)
) {
  categories.forEach { category ->
    FilterChip(
      selected = selectedCategory == category,
      label = { Text(category) },
      leadingIcon = if (selected) { Icon(...) } else null
    )
  }
}
```

**Specs:**
- Spacing Between Chips: 8.dp horizontal gap
- Container Padding: `padding(horizontal = 16.dp, vertical = 12.dp)`
- Selected Chip Background: Primary color (blue)
- Unselected Chip Background: Light gray surface
- Leading Icon Size: 18.dp
- Text Style: `labelMedium`
- Border Radius: Material default

### Section Headers (New Arrivals, Featured Listings)
```kotlin
Text(
  text = "New Arrivals",
  style = MaterialTheme.typography.titleLarge,
  color = MaterialTheme.colorScheme.primary,
  fontWeight = FontWeight.Bold,
  modifier = Modifier.padding(horizontal = 16.dp)
)
```

**Specs:**
- Font Size: 22sp (`titleLarge`)
- Font Weight: Bold
- Color: Primary Blue (#0056D2)
- Padding: 16dp horizontal
- Top Spacing: 16dp above text

### Horizontal Divider
```kotlin
HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
```

**Specs:**
- Color: `onSurfaceVariant` with reduced opacity
- Thickness: 1dp
- Horizontal Padding: 16dp
- Vertical Spacing: 8dp above & below

---

## 6. POST CARD (USER-GENERATED LISTINGS)

### Overall Card Container
```kotlin
Card(
  modifier = Modifier.fillMaxWidth(),
  shape = RoundedCornerShape(16.dp),
  elevation = CardDefaults.cardElevation(
    defaultElevation = 8.dp,
    hoveredElevation = 12.dp
  ),
  colors = CardDefaults.cardColors(
    containerColor = MaterialTheme.colorScheme.surface
  )
)
```

**Specs:**
- Width: Full screen width minus padding
- Corner Radius: 16dp
- Default Elevation: 8dp
- Hover Elevation: 12dp
- Background: Surface color (#FAFAFA light mode)
- Margin: 16dp horizontal

### Image Container (Top Section)
```kotlin
Box(
  modifier = Modifier
    .fillMaxWidth()
    .height(150.dp)
    .clickable { navigate to details }
) {
  Image(
    contentScale = ContentScale.Crop,
    modifier = Modifier.fillMaxSize()
  )
}
```

**Specs:**
- Height: 150dp fixed
- Width: Full card width
- Image Fit: Crop (fills box, clips if needed)
- Clickable: Navigate to product details
- Background: Neutral gray placeholder

### Badges (Top Right of Image)

#### "SELLING" / "BUYING REQUEST" Badge
```kotlin
Surface(
  modifier = Modifier.padding(12.dp).align(Alignment.TopEnd),
  shape = RoundedCornerShape(8.dp),
  color = if (isBuy) secondary else primary,
  shadowElevation = 4.dp
) {
  Text(
    text = if (isBuy) "Buying Request" else "Selling",
    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
    color = Color.White,
    fontWeight = FontWeight.Bold
  )
}
```

**Specs:**
- Position: Top-right corner
- Offset from Edge: 12dp
- Corner Radius: 8dp
- Padding: 10dp horizontal, 6dp vertical (inside badge)
- Font Size: 10sp (labelSmall)
- Font Weight: Bold
- Background (Buy): Orange (#FF8C00)
- Background (Sell): Blue (#0056D2)
- Text Color: White
- Shadow: 4dp elevation

#### Category Label Badge
```kotlin
Surface(
  modifier = Modifier.padding(end = 8.dp, top = 40.dp).align(Alignment.TopEnd),
  shape = MaterialTheme.shapes.small,
  color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.9f)
) {
  Text(
    text = post.category,
    style = MaterialTheme.typography.labelSmall,
    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
    color = MaterialTheme.colorScheme.onSecondaryContainer
  )
}
```

**Specs:**
- Position: Top-right, below selling badge
- Offset: end = 8dp, top = 40dp
- Padding Inside: 8dp horizontal, 4dp vertical
- Font Size: 10sp (labelSmall)
- Background: Secondary container with 0.9 alpha
- Corner Radius: Material small (default 4dp)

### Favorite Icon (Top Left)
```kotlin
IconButton(onClick = onFavoriteToggle) {
  Icon(
    imageVector = if (isFavorite) Filled.Favorite else FavoriteBorder,
    contentDescription = "Favorite",
    tint = if (isFavorite) Color.Red else Color.White,
    modifier = Modifier.size(24.dp)
  )
}
```

**Specs:**
- Position: Top-left corner
- Icon Size: 24dp
- Filled Color: Red (#FF0000)
- Unfilled Color: White
- Background: Transparent
- Hit Area: 48dp standard touch target

### Content Section (Below Image)
```kotlin
Column(modifier = Modifier.padding(16.dp)) {
  // All content inside
}
```

**Specs:**
- Padding: 16dp on all sides
- Width: Full card width
- Content Spacing: Variable between elements

#### Posted By
```kotlin
Text(
  text = "Posted by ${post.creatorName}",
  style = MaterialTheme.typography.labelSmall,
  color = MaterialTheme.colorScheme.primary,
  modifier = Modifier.padding(bottom = 4.dp)
)
```

**Specs:**
- Font Size: 11sp (labelSmall)
- Font Weight: Medium
- Color: Primary Blue
- Padding Below: 4dp

#### Product Title & Price Row
```kotlin
Row(
  modifier = Modifier.fillMaxWidth(),
  horizontalArrangement = Arrangement.SpaceBetween
) {
  Text(
    text = post.productName,
    style = MaterialTheme.typography.titleMedium,
    fontWeight = FontWeight.Bold
  )
  Text(
    text = post.price,
    style = MaterialTheme.typography.bodyMedium,
    color = MaterialTheme.colorScheme.secondary,
    fontWeight = FontWeight.Bold
  )
}
```

**Specs:**
- Title Font Size: 16sp (titleMedium)
- Title Font Weight: Bold
- Title Color: Text default (dark gray/darkest blue)
- Price Font Size: 14sp (bodyMedium)
- Price Font Weight: Bold
- Price Color: Secondary Orange (#FF8C00)
- Space Between: Arrangement.SpaceBetween (full width apart)

#### Rating Bar
```kotlin
Row(verticalAlignment = Alignment.CenterVertically) {
  repeat(5) { index ->
    Icon(
      imageVector = if (isFilled) Filled.Star else OutlinedStarBorder,
      contentDescription = null,
      tint = if (isFilled) Color(0xFFFFC107) else Color.Gray,
      modifier = Modifier.size(16.dp)
    )
  }
  Spacer(modifier = Modifier.width(4.dp))
  Text(
    text = "($reviewCount)",
    style = MaterialTheme.typography.labelSmall,
    color = MaterialTheme.colorScheme.onSurfaceVariant
  )
}
```

**Specs:**
- Star Size: 16dp
- Filled Star Color: Gold/Amber (#FFC107)
- Empty Star Color: Gray
- Star Spacing: 0dp (adjacent)
- Gap After Stars: 4dp
- Review Count Font: 10sp (labelSmall)
- Review Count Color: Variant gray

#### Product Description
```kotlin
Text(
  text = post.description,
  style = MaterialTheme.typography.bodyMedium,
  maxLines = 2
)
```

**Specs:**
- Font Size: 14sp (bodyMedium)
- Font Weight: Normal
- Color: Text default
- Max Lines: 2 (truncated with ellipsis)
- Line Height: 20sp

#### Edit/Delete Buttons (If Owner)
```kotlin
Row(
  modifier = Modifier.fillMaxWidth(),
  horizontalArrangement = Arrangement.End
) {
  IconButton(onClick = onEdit) {
    Icon(Icons.Default.Edit, tint = primary)
  }
  IconButton(onClick = onDelete) {
    Icon(Icons.Default.Delete, tint = error)
  }
}
```

**Specs:**
- Position: Right-aligned
- Icon Size: 24dp
- Edit Icon Color: Primary Blue
- Delete Icon Color: Error Red (#F44336)
- Button Size: 48dp (standard touch target)

#### Action Buttons Section

**Add to Quote List Button**
```kotlin
OutlinedButton(
  modifier = Modifier.weight(1f)
) {
  Text("Add to Quote List")
  IconButton(onClick = { showTooltip = !showTooltip }) {
    Icon(Icons.Default.Info, modifier = Modifier.size(16.dp))
  }
}
```

**Specs:**
- Style: Outlined (border only, no fill)
- Border Color: Primary Blue
- Text Color: Primary Blue
- Width: Flexible with weight(1f)
- Height: 40-48dp standard
- Corner Radius: 4dp (small)
- Spacing Inside: 8dp between text and info icon
- Font Size: 12-14sp

**View Product Details Button (Animated)**
```kotlin
AnimatedButton(text = "View Product Details") {
  navigate(...)
}
```

**Specs:** See AnimatedButton component below

**Request Quote Button (Main Action)**
```kotlin
AnimatedButton(text = "Request Quote") {
  navigate("chat/$encodedName")
}
```

**Specs:** See AnimatedButton component below

#### Tooltip Display
```kotlin
if (showTooltip) {
  Spacer(modifier = Modifier.height(4.dp))
  Tooltip(text = "Tooltip text")
}
```

**Specs:**
- Appears Below Button
- Animation: Fade in/out
- Background: Material surfaceVariant
- Padding: 8dp
- Elevation: 4dp
- Corner Radius: Material small

---

## 7. PRODUCT CARD (FEATURED/STATIC LISTINGS)

Similar to PostCard but simpler:
```kotlin
Card(
  modifier = Modifier.fillMaxWidth(),
  elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
) {
  Column(modifier = Modifier.padding(0.dp)) {
    // Image area with favorite icon
    Box(
      modifier = Modifier
        .fillMaxWidth()
        .height(150.dp)
    ) {
      Image(contentScale = ContentScale.Crop)
      IconButton(onClick = { isFavorite = !isFavorite }) {
        Icon(
          imageVector = if (isFavorite) Filled.Favorite else FavoriteBorder,
          tint = if (isFavorite) Color.Red else Color.White
        )
      }
    }
  }
}
```

**Specs:**
- Corner Radius: Material default (~4dp)
- Elevation: 4dp
- Image Height: 150dp
- Content Padding: 16dp
- Structure: Image at top, content below

---

## 8. FLOATING ACTION BUTTON (FAB)

```kotlin
FloatingActionButton(
  onClick = { navigate("post") },
  containerColor = MaterialTheme.colorScheme.secondaryContainer,
  contentColor = MaterialTheme.colorScheme.onSecondaryContainer
) {
  Icon(Icons.Default.Add, contentDescription = "Post")
}
```

**Specs:**
- Position: Bottom-right corner (Standard Material placement)
- Icon: Add icon
- Icon Size: 24-28dp
- Background: Secondary container (orange-tinted)
- Icon Color: On secondary container (dark)
- Elevation: Material default (~6dp)
- Size: 56dp or 64dp (standard Material)
- Shape: Circular (MaterialTheme.shapes.large)

---

## 9. BOTTOM NAVIGATION BAR

```kotlin
NavigationBar(
  containerColor = MaterialTheme.colorScheme.background,
  contentColor = MaterialTheme.colorScheme.onBackground
) {
  NavigationBarItem(
    icon = { Icon(Icons.Default.Home, modifier = Modifier.size(24.dp)) },
    label = { Text("Home", style = MaterialTheme.typography.labelSmall) },
    selected = currentRoute == "home",
    onClick = { ... }
  )
  NavigationBarItem(
    icon = { Icon(Icons.Default.Add, modifier = Modifier.size(24.dp)) },
    label = { Text("Post", style = MaterialTheme.typography.labelSmall) },
    selected = currentRoute == "post",
    onClick = { ... }
  )
  NavigationBarItem(
    icon = { Icon(Icons.Default.People, modifier = Modifier.size(24.dp)) },
    label = { Text("Network", style = MaterialTheme.typography.labelSmall) },
    selected = currentRoute == "network",
    onClick = { ... }
  )
  NavigationBarItem(
    icon = { Icon(Icons.Default.Person, modifier = Modifier.size(24.dp)) },
    label = { Text("Profile", style = MaterialTheme.typography.labelSmall) },
    selected = currentRoute == "profile",
    onClick = { ... }
  )
}
```

**Specs:**
- Background: Primary background color (blue/white)
- Item Count: 4 items (Home, Post, Network, Profile)
- Item Height: 56-64dp
- Icon Size: 24dp
- Label Font: 11-12sp (labelSmall)
- Selected State: Primary blue background on item
- Unselected State: Gray/transparent
- Animation: Smooth transition between states
- Position: Bottom of screen (fixed)
- Shadow: 1dp top shadow only
- Divider: Optional light divider at top

---

## 10. LOGIN SCREEN DESIGN

### Background Gradient
```kotlin
background(
  brush = Brush.verticalGradient(
    colors = listOf(
      Color(0xFF1e3a8a),  // Navy at top
      Color(0xFF3b82f6)   // Blue at bottom
    )
  )
)
```

**Specs:**
- Type: Vertical linear gradient
- Color 1 (Top): Navy (#1e3a8a)
- Color 2 (Bottom): Bright Blue (#3b82f6)
- Direction: Top to Bottom
- Coverage: Full screen

### Logo
```kotlin
Image(
  painter = painterResource(id = R.drawable.logo),
  contentDescription = "Logo",
  modifier = Modifier.size(150.dp)
)
```

**Specs:**
- Size: 150dp × 150dp (square)
- Content Scale: Default (fit within bounds)

### Heading Text
```kotlin
Text(
  text = "Login to your Account",
  style = MaterialTheme.typography.headlineMedium,
  color = Color.White
)
```

**Specs:**
- Font Size: 28sp (headlineMedium)
- Font Weight: Normal (can be Bold for impact)
- Color: White
- Padding: 32dp above logo, 24dp below

### Input Fields (Email & Password)
```kotlin
OutlinedTextField(
  value = email,
  onValueChange = { email = it },
  label = { Text(stringResource(R.string.email), color = Color.White) },
  modifier = Modifier.fillMaxWidth(),
  keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
  textStyle = androidx.compose.ui.text.TextStyle(color = Color.White),
  colors = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Color.White,
    unfocusedBorderColor = Color.White.copy(alpha = 0.7f),
    focusedLabelColor = Color.White,
    unfocusedLabelColor = Color.White.copy(alpha = 0.7f)
  )
)
```

**Specs:**
- Width: Full screen width minus padding
- Height: 56dp (standard Material)
- Border Color (Unfocused): White with 0.7 alpha (~70% opacity)
- Border Color (Focused): White (100%)
- Label Color: White with alpha
- Text Color: White
- Label Position: Floating above field when focused
- Border Width: 1-2dp
- Corner Radius: Material default (~4dp)
- Padding Between Fields: 16dp vertical
- Content Padding: 16.dp horizontal, 16.dp vertical from container

### Password Visibility Toggle Icon
```kotlin
trailingIcon = {
  IconButton(onClick = { passwordVisible = !passwordVisible }) {
    Icon(
      imageVector = if (passwordVisible) Filled.Visibility else Filled.VisibilityOff,
      contentDescription = "Toggle password",
      tint = Color.White
    )
  }
}
```

**Specs:**
- Position: Right side of input field
- Icon Color: White
- Icon Size: 24dp
- Clickable Area: 48dp standard touch target

### Forgot Password Button
```kotlin
TextButton(
  onClick = { /* Reset password */ },
  modifier = Modifier.align(Alignment.CenterEnd)
) {
  Text("Forgot Password?", color = Color.White)
}
```

**Specs:**
- Text Color: White
- Font Size: 14sp (bodyMedium)
- Alignment: Right-aligned
- Padding: Minimal (padding around text)
- Background: Transparent
- Underline: Optional (typically visible on press/hover)

### Login Button
```kotlin
Button(
  onClick = { /* Login logic */ },
  modifier = Modifier
    .fillMaxWidth()
    .height(50.dp),
  enabled = !isLoading
) {
  if (isLoading) {
    CircularProgressIndicator(...)
  } else {
    Text("Login", fontWeight = FontWeight.Bold)
  }
}
```

**Specs:**
- Width: Full screen width
- Height: 50dp
- Background Color: Primary Blue (or Material default button color)
- Text Color: White
- Text Font: Bold, 16sp
- Corner Radius: Material default (~4dp) or custom 12dp
- Elevation: 4-6dp
- Loading State: CircularProgressIndicator replaces text
- Disabled State: Reduced opacity (~0.5)

### Signup Link
```kotlin
Row(horizontalArrangement = Arrangement.Center) {
  Text("Don't have an account? ", color = Color.White)
  TextButton(onClick = { navigate("signup") }) {
    Text("Sign Up", color = Color.White, fontWeight = FontWeight.Bold)
  }
}
```

**Specs:**
- Text Color: White
- Link Color: White (bold for distinction)
- Padding: 16dp vertical spacing

---

## 11. SIGNUP SCREEN DESIGN

Very similar to Login with additional fields:

### Additional Fields

#### Full Name
```kotlin
OutlinedTextField(
  label = { Text("Full Name", color = Color.White) },
  // ... same styling as email field
)
```

#### Country Dropdown
```kotlin
ExposedDropdownMenuBox(
  expanded = expandedCountry,
  onExpandedChange = { expandedCountry = !expandedCountry },
  modifier = Modifier.fillMaxWidth()
) {
  OutlinedTextField(
    value = country,
    readOnly = true,
    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(...) },
    // ... white text styling like login
  )
  ExposedDropdownMenu(
    expanded = expandedCountry,
    onDismissRequest = { expandedCountry = false }
  ) {
    countries.forEach { option ->
      DropdownMenuItem(
        text = { Text(option) },
        onClick = { country = option; expandedCountry = false }
      )
    }
  }
}
```

**Specs:**
- Dropdown Width: Full width
- Menu Max Height: ~300dp (scrollable if needed)
- Dropdown Item Height: 48-56dp
- Selected Item Highlight: Primary blue background
- Padding: Standard 16dp
- Arrow Icon: Material default chevron (24dp)

#### Role Field
```kotlin
OutlinedTextField(
  label = { Text("Role", color = Color.White) },
  // ... same styling as email field
)
```

### Signup Button
```kotlin
Button(
  onClick = { /* Signup logic */ },
  modifier = Modifier
    .fillMaxWidth()
    .height(50.dp),
  enabled = !isLoading
) {
  Text("Create Account", fontWeight = FontWeight.Bold)
}
```

**Specs:**
- Same as Login Button
- Text: "Create Account" or "Sign Up"
- Spacing Above: 32dp
- Spacing Below: 16dp
- Height: 50dp
- Corner Radius: 12dp (custom for consistency)

### Validation Error Display
```kotlin
Toast.makeText(context, "Error message", Toast.LENGTH_SHORT).show()
```

**Specs:**
- Duration: Short (2 seconds) or Long (3.5 seconds)
- Position: Bottom center
- Background: Dark gray/black
- Text Color: White
- Font Size: 14sp
- Padding: 16dp horizontal, 12dp vertical

---

## 12. PROFILE SCREEN DESIGN

### Profile Header Section
```kotlin
Column(
  modifier = Modifier
    .fillMaxWidth()
    .background(MaterialTheme.colorScheme.surfaceVariant)
    .padding(vertical = 32.dp),
  horizontalAlignment = Alignment.CenterHorizontally
) {
  Image(
    painter = rememberAsyncImagePainter(userProfile?.profileImageUri),
    contentDescription = "Profile Picture",
    contentScale = ContentScale.Crop,
    modifier = Modifier
      .size(100.dp)
      .clip(CircleShape)
      .background(MaterialTheme.colorScheme.surface)
  )
  
  Spacer(modifier = Modifier.height(16.dp))
  
  Text(
    text = displayName,
    style = MaterialTheme.typography.headlineSmall,
    fontWeight = FontWeight.Bold
  )
  
  Text(
    text = "@${userProfile?.username}",
    style = MaterialTheme.typography.bodyMedium,
    color = MaterialTheme.colorScheme.primary
  )
  
  Text(
    text = "${userProfile?.role ?: "Buyer"} | Industrial Products",
    style = MaterialTheme.typography.bodyMedium,
    color = MaterialTheme.colorScheme.onSurfaceVariant
  )
}
```

**Specs:**
- Background Color: surfaceVariant (light tint)
- Avatar Size: 100dp × 100dp
- Avatar Border: CircleShape (perfect circle)
- Avatar Border Padding: 2-4dp (subtle border)
- Name Font Size: 24sp (headlineSmall)
- Name Font Weight: Bold
- Username Font Size: 14sp (bodyMedium)
- Username Color: Primary Blue
- Username Prefix: "@" symbol
- Role Font Size: 14sp (bodyMedium)
- Role Color: onSurfaceVariant (gray)
- Vertical Padding: 32dp (top & bottom)
- Spacing Between Elements: 16dp

### Account Details Section
```kotlin
Column(modifier = Modifier.padding(16.dp)) {
  Text(
    text = "Account Details",
    style = MaterialTheme.typography.titleLarge,
    fontWeight = FontWeight.Bold,
    color = MaterialTheme.colorScheme.primary
  )
  
  Spacer(modifier = Modifier.height(16.dp))
  
  ProfileItem(label = "Email", value = firebaseAuth.currentUser?.email)
  ProfileItem(label = "Username", value = "@${userProfile?.username}")
  ProfileItem(label = "Phone", value = userProfile?.phone ?: "+1 (Not set)")
  ProfileItem(label = "Region", value = userProfile?.region ?: "Global")
  ProfileItem(label = "Member Since", value = "January 2024")
}
```

**Specs:**
- Section Title Font Size: 22sp (titleLarge)
- Section Title Font Weight: Bold
- Section Title Color: Primary Blue
- Section Padding: 16dp

### ProfileItem Component
```kotlin
@Composable
fun ProfileItem(label: String, value: String) {
  Column(modifier = Modifier.padding(vertical = 8.dp)) {
    Text(
      text = label,
      style = MaterialTheme.typography.labelMedium,
      color = MaterialTheme.colorScheme.onSurfaceVariant
    )
    Text(
      text = value,
      style = MaterialTheme.typography.bodyLarge
    )
  }
}
```

**Specs:**
- Label Font Size: 12sp (labelMedium)
- Label Color: onSurfaceVariant (gray)
- Label Font Weight: Medium
- Value Font Size: 16sp (bodyLarge)
- Value Color: Text default (dark)
- Vertical Spacing: 8dp between items
- Vertical Spacing Inside: 0-2dp between label and value

### Menu Options
```kotlin
MenuOption(icon = Icons.Default.Edit, title = "Edit Profile") { ... }
MenuOption(icon = Icons.Default.Favorite, title = "Saved Items") { ... }
MenuOption(icon = Icons.Default.History, title = "Order History") { ... }
MenuOption(icon = Icons.Default.People, title = "Connections & Messages") { ... }
MenuOption(icon = Icons.Default.Settings, title = "App Settings") { ... }
```

#### MenuOption Component
```kotlin
@Composable
fun MenuOption(icon: ImageVector, title: String, onClick: () -> Unit) {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .clickable { onClick() }
      .padding(vertical = 12.dp),
    verticalAlignment = Alignment.CenterVertically
  ) {
    Icon(
      imageVector = icon,
      contentDescription = null,
      tint = MaterialTheme.colorScheme.primary,
      modifier = Modifier.size(24.dp)
    )
    Spacer(modifier = Modifier.width(16.dp))
    Text(
      text = title,
      style = MaterialTheme.typography.bodyLarge,
      modifier = Modifier.weight(1f)
    )
  }
}
```

**Specs:**
- Icon Size: 24dp
- Icon Color: Primary Blue
- Icon to Text Gap: 16dp
- Text Font Size: 16sp (bodyLarge)
- Text Color: Text default (dark)
- Row Padding: 12dp vertical, 0dp horizontal
- Full Width: Clickable on entire row
- Ripple Effect: Standard Material ripple on click

### Logout Button
```kotlin
Button(
  onClick = { /* Logout */ },
  colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
  modifier = Modifier.fillMaxWidth()
) {
  Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null)
  Spacer(modifier = Modifier.width(8.dp))
  Text("Logout")
}
```

**Specs:**
- Width: Full width
- Height: 50dp
- Background Color: Error Red (#F44336)
- Text Color: White
- Icon Size: 24dp
- Icon to Text Gap: 8dp
- Font Size: 14-16sp
- Corner Radius: Material default (~4dp) or 12dp
- Margin: 16dp horizontal, 32dp bottom

---

## 13. NETWORK SCREEN DESIGN

### Tabbed Navigation
```kotlin
TabRow(selectedTabIndex = selectedTabIndex) {
  tabs.forEachIndexed { index, title ->
    Tab(
      selected = selectedTabIndex == index,
      onClick = { selectedTabIndex = index },
      text = { Text(title) }
    )
  }
}
```

**Specs:**
- Tab Count: 2 ("Discover", "My Network & Messages")
- Tab Height: 48-56dp
- Selected Tab Indicator: Bottom border (primary blue)
- Indicator Height: 2-3dp
- Indicator Animation: Smooth slide
- Text Font Size: 14sp
- Text Color (Selected): Primary Blue
- Text Color (Unselected): onSurfaceVariant gray
- Background: Surface white

### User Search Card (Discover Tab)
```kotlin
Card(
  modifier = Modifier.fillMaxWidth(),
  elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
  colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
  shape = RoundedCornerShape(12.dp)
) {
  Row(
    modifier = Modifier.padding(16.dp).fillMaxWidth(),
    verticalAlignment = Alignment.CenterVertically
  ) {
    // Avatar
    Box(
      modifier = Modifier
        .size(60.dp)
        .clip(CircleShape)
        .background(MaterialTheme.colorScheme.primaryContainer),
      contentAlignment = Alignment.Center
    ) {
      if (!user.profileImageUri.isNullOrBlank()) {
        Image(
          painter = rememberAsyncImagePainter(user.profileImageUri),
          contentDescription = null,
          contentScale = ContentScale.Crop,
          modifier = Modifier.fillMaxSize()
        )
      } else {
        Text(
          text = user.name.take(1).uppercase(),
          style = MaterialTheme.typography.headlineSmall,
          color = MaterialTheme.colorScheme.onPrimaryContainer
        )
      }
    }
    
    Spacer(modifier = Modifier.width(16.dp))
    
    Column(modifier = Modifier.weight(1f)) {
      Text(text = user.name, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
      Text(text = "@${user.username}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
      Spacer(modifier = Modifier.height(4.dp))
      Text(text = user.role, style = MaterialTheme.typography.bodySmall)
      Text(text = user.region, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
    }
    
    Button(
      onClick = { /* Connect */ },
      shape = RoundedCornerShape(8.dp),
      contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
    ) {
      Text("Connect", style = MaterialTheme.typography.labelLarge)
    }
  }
}
```

**Specs:**
- Width: Full width
- Padding: 16dp
- Corner Radius: 12dp
- Elevation: 4dp
- Avatar Size: 60dp × 60dp
- Avatar Shape: CircleShape
- Avatar Background: primaryContainer (light tint)
- Avatar Initial Font Size: 24sp (headlineSmall)
- Name Font Size: 16sp (titleMedium)
- Name Font Weight: Bold
- Username Font Size: 12sp (bodySmall)
- Username Color: Primary Blue
- Role Font Size: 12sp (bodySmall)
- Region Font Size: 12sp (bodySmall)
- Region Color: Gray
- Avatar to Content Gap: 16dp
- Connect Button Corner Radius: 8dp
- Connect Button Padding: 16dp horizontal, 8dp vertical
- Between Cards: 12dp gap (Arrangement.spacedBy(12.dp))

---

## 14. SETTINGS SCREEN DESIGN

### Profile Header Section
```kotlin
Row(
  modifier = Modifier
    .fillMaxWidth()
    .padding(16.dp),
  verticalAlignment = Alignment.CenterVertically
) {
  Image(
    painter = rememberAsyncImagePainter(userProfile?.profileImageUri),
    contentDescription = "Profile Picture",
    contentScale = ContentScale.Crop,
    modifier = Modifier
      .size(64.dp)
      .clip(CircleShape)
      .background(MaterialTheme.colorScheme.surfaceVariant)
  )
  
  Spacer(modifier = Modifier.width(16.dp))
  
  Column {
    Text(displayName, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
    Text("${userProfile?.role ?: "Trader"} | Industrial Products", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
  }
}
```

**Specs:**
- Row Padding: 16dp
- Avatar Size: 64dp × 64dp
- Avatar Shape: CircleShape
- Avatar Background: surfaceVariant
- Avatar to Text Gap: 16dp
- Name Font Size: 20sp (titleLarge)
- Name Font Weight: SemiBold (600)
- Subtitle Font Size: 14sp (bodyMedium)
- Subtitle Color: onSurfaceVariant (gray)

### Settings Item
```kotlin
@Composable
fun SettingsItem(icon: ImageVector, title: String, subtitle: String? = null, onClick: () -> Unit) {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .clickable { onClick() }
      .padding(horizontal = 16.dp, vertical = 20.dp),
    verticalAlignment = Alignment.CenterVertically
  ) {
    Icon(
      imageVector = icon,
      contentDescription = null,
      tint = MaterialTheme.colorScheme.onSurfaceVariant,
      modifier = Modifier.size(28.dp)
    )
    Spacer(modifier = Modifier.width(24.dp))
    Column(modifier = Modifier.weight(1f)) {
      Text(text = title, style = MaterialTheme.typography.bodyLarge)
      if (subtitle != null) {
        Spacer(modifier = Modifier.height(2.dp))
        Text(text = subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
      }
    }
  }
}
```

**Specs:**
- Row Padding: 16dp horizontal, 20dp vertical
- Icon Size: 28dp
- Icon Color: onSurfaceVariant (gray)
- Icon to Text Gap: 24dp
- Title Font Size: 16sp (bodyLarge)
- Title Color: Text default (dark)
- Subtitle Font Size: 13sp (bodySmall)
- Subtitle Color: onSurfaceVariant (gray)
- Subtitle Spacing: 2dp above
- Full Row Clickable: Yes, with ripple effect

### Settings Items List
```
1. Account (Key icon) - "Sign in & security"
2. Privacy (Lock icon) - "Visibility"
3. Chats (Chat icon) - "Chats"
4. Notifications (Bell icon) - "Notifications"
5. Storage & Data (Storage icon) - "Storage & data usage"
6. App Language (Language icon) - "Current: [Language]"
7. Help Center (Help icon) - "Help centre, contact us, privacy policy"
8. Invite Friends (Group icon) - "Invite friends via WhatsApp or Email"
```

**Icon Sizes:** 28dp all
**Spacing Between Items:** 0dp (no gap, borderless list)
**Dividers:** Optional (HorizontalDivider between some sections)

### Copyright Footer
```kotlin
Text(
  text = "© 2026 SpinTradeHub. All rights reserved.",
  style = MaterialTheme.typography.bodySmall,
  color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
  modifier = Modifier
    .fillMaxWidth()
    .padding(bottom = 24.dp),
  textAlign = TextAlign.Center
)
```

**Specs:**
- Font Size: 12sp (bodySmall)
- Color: onSurfaceVariant with 0.6 alpha (~60% opacity)
- Text Alignment: Center
- Padding: 24dp bottom
- Position: At bottom of scrollable content

---

## 15. INPUT FIELD STYLING (Global)

### Text Field States

#### Unfocused
```
Border Color: #E0E0E0 (SpinMediumGray) or white with alpha 0.7
Border Width: 1dp
Label Color: rgba(255, 255, 255, 0.7) or #424242 (dark mode)
Text Color: Text color matching theme
Background: Transparent
Corner Radius: 4dp (Material default)
Height: 56dp
Padding: 16dp horizontal, 8dp vertical (inside the field)
```

#### Focused
```
Border Color: #0056D2 (SpinBlue) or #FF8C00 (Secondary)
Border Width: 2dp (thicker when focused)
Label Color: Solid color (no alpha)
Label Position: Floats above input
Text Color: Solid, full opacity
Background: Transparent or very light tint
Cursor Color: Primary Blue
```

#### Disabled
```
Opacity: 0.5 or 0.38
Border Color: Reduced opacity gray
Text Color: Reduced opacity
Background: Very light gray overlay
Cursor: Not visible
```

#### Error State
```
Border Color: #F44336 (Error Red)
Label Color: #F44336
Helper Text: "Error message" in red below field
Font Size (error text): 12sp (labelSmall)
```

### OutlinedTextField Defaults
```kotlin
OutlinedTextFieldDefaults.colors(
  focusedBorderColor = Color.White,
  unfocusedBorderColor = Color.White.copy(alpha = 0.7f),
  focusedLabelColor = Color.White,
  unfocusedLabelColor = Color.White.copy(alpha = 0.7f)
)
```

---

## 16. BUTTON STYLES

### Primary Button (Filled)
```kotlin
Button(
  modifier = Modifier
    .fillMaxWidth()
    .height(50.dp),
  shape = RoundedCornerShape(12.dp),
  colors = ButtonDefaults.buttonColors(
    containerColor = MaterialTheme.colorScheme.primary,  // Blue
    contentColor = Color.White
  )
) {
  Text("Label", fontWeight = FontWeight.Bold, fontSize = 16.sp)
}
```

**Specs:**
- Background: Primary Blue (#0056D2)
- Text Color: White
- Height: 50dp (can be 40-56dp)
- Corner Radius: 12dp
- Font Size: 14-16sp
- Font Weight: Bold or SemiBold
- Padding: 16dp horizontal, variable vertical
- Elevation: 4-6dp
- Pressed State: Darker blue (#003E99) or scale 0.95
- Disabled State: Opacity 0.5

### Outlined Button
```kotlin
OutlinedButton(
  modifier = Modifier
    .fillMaxWidth()
    .height(40.dp),
  shape = RoundedCornerShape(8.dp),
  border = BorderStroke(2.dp, MaterialTheme.colorScheme.primary),
  colors = ButtonDefaults.outlinedButtonColors(
    contentColor = MaterialTheme.colorScheme.primary
  )
) {
  Text("Label", fontWeight = FontWeight.Bold)
}
```

**Specs:**
- Background: Transparent
- Border: 2dp, Primary Blue
- Text Color: Primary Blue
- Height: 40-48dp
- Corner Radius: 8dp or Material default 4dp
- Font Size: 12-14sp
- Font Weight: Normal or SemiBold
- Padding: 16dp horizontal, 8-12dp vertical
- Ripple: Material ripple (blue overlay on press)

### Text Button (Flat)
```kotlin
TextButton(
  onClick = { },
  colors = ButtonDefaults.textButtonColors(contentColor = Color.White)
) {
  Text("Label", color = Color.White)
}
```

**Specs:**
- Background: Transparent
- Border: None
- Text Color: Varies (white on dark, blue on light)
- Height: Variable based on text
- Padding: 16dp horizontal, 8-12dp vertical
- No visible elevation
- Ripple: Faint overlay

### Icon Button
```kotlin
IconButton(onClick = { }) {
  Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(24.dp))
}
```

**Specs:**
- Size: 48dp × 48dp (standard touch target)
- Icon Size: 24dp
- Background: Transparent, ripple on press
- Padding: 12dp (to center icon at 48dp total)
- Ripple Shape: Circle

### Floating Action Button (FAB)
```kotlin
FloatingActionButton(
  onClick = { },
  containerColor = MaterialTheme.colorScheme.secondaryContainer,
  contentColor = MaterialTheme.colorScheme.onSecondaryContainer
) {
  Icon(Icons.Default.Add, contentDescription = null)
}
```

**Specs:**
- Size: 56dp or 64dp diameter
- Shape: Circular (MaterialTheme.shapes.large)
- Background: Secondary container (orange tint)
- Icon Size: 24-28dp
- Icon Color: onSecondaryContainer (dark)
- Elevation: 6-12dp
- Position: Fixed bottom-right (Scaffold.floatingActionButton)
- Padding: None (circular, centered icon)

---

## 17. ANIMATED BUTTON COMPONENT

```kotlin
@Composable
fun AnimatedButton(text: String, onClick: () -> Unit) {
    val interactionSource = remember { MutableInteractionSource() }
    var isPressed by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(if (isPressed) 0.95f else 1f, label = "buttonScale")
    val view = LocalView.current

    LaunchedEffect(interactionSource) {
        interactionSource.interactions.collect { interaction ->
            when (interaction) {
                is PressInteraction.Press -> {
                    isPressed = true
                    view.playSoundEffect(SoundEffectConstants.CLICK)
                }
                is PressInteraction.Release, is PressInteraction.Cancel -> {
                    isPressed = false
                }
            }
        }
    }

    Button(
        onClick = onClick,
        interactionSource = interactionSource,
        modifier = Modifier
            .fillMaxWidth()
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            },
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = SpinOrange,
            contentColor = SpinWhite
        ),
        elevation = ButtonDefaults.elevatedButtonElevation(
            defaultElevation = 6.dp,
            pressedElevation = 2.dp
        )
    ) {
        Text(
            text = text,
            fontWeight = FontWeight.Bold,
            fontSize = 16.sp,
            letterSpacing = 0.5.sp
        )
    }
}
```

**Specs:**
- Background: Orange (#FF8C00)
- Text Color: White
- Text Font Size: 16sp
- Text Font Weight: Bold
- Letter Spacing: 0.5sp
- Corner Radius: 12dp
- Height: 48-56dp (implicit from button defaults)
- Width: Full width
- Default Elevation: 6dp
- Pressed Elevation: 2dp (decreases when pressed)
- Scale Animation: 0.95 on press (5% reduction)
- Animation Duration: ~200-300ms (default)
- Sound Effect: Click sound on press
- Disabled State: Opacity reduction, no animation

---

## 18. TYPOGRAPHY HIERARCHY

### Font Family
- Default: System sans-serif (Roboto on Android)
- All text uses Material Design 3 typography system

### Text Styles

```
headlineLarge   - 32sp, Bold/700      - NOT COMMONLY USED
headlineMedium  - 28sp, Normal/400    - Login/Signup page titles
headlineSmall   - 24sp, Normal/400    - Profile name, modal titles

titleLarge      - 22sp, Bold/700      - Section headers, card titles
titleMedium     - 16sp, Bold/700      - Card product names, subtitles
titleSmall      - 14sp, Medium/500    - Minor headers

bodyLarge       - 16sp, Normal/400    - Main body text, menu items
bodyMedium      - 14sp, Normal/400    - Card descriptions, secondary text
bodySmall       - 12sp, Normal/400    - Helper text, captions

labelLarge      - 14sp, Medium/500    - Button text, strong emphasis
labelMedium     - 12sp, Medium/500    - Tags, badges, labels
labelSmall      - 11sp, Medium/500    - Smallest labels, timestamps

displayLarge    - 57sp, Normal/400    - NOT USED
displayMedium   - 45sp, Normal/400    - NOT USED
displaySmall    - 36sp, Normal/400    - NOT USED
```

### Font Weights Used
```
Normal / 400  - Body text, regular content
Medium / 500  - Labels, slightly emphasized
Bold / 700    - Titles, headers, emphasis
SemiBold/ 600 - Profile names, important text (sometimes)
```

### Line Height (Default Material)
```
headlineMedium  - 36sp
titleLarge      - 28sp
bodyLarge       - 24sp
bodyMedium      - 20sp
bodySmall       - 16sp
labelMedium     - 16sp
labelSmall      - 16sp
```

### Letter Spacing
```
Most text:      0.5sp (default)
Bold text:      0sp (no additional spacing)
Labels:         0.5sp
```

---

## 19. COMPONENT SIZING

### Avatar Sizes
```
Large Profile Avatar:     100dp × 100dp
Medium Settings Avatar:   64dp × 64dp
Small Network Avatar:     60dp × 60dp
Minimal Inline Avatar:    48dp × 48dp (for list items)
```

### Image Container Heights
```
Post/Product Card Image:  150dp (fixed)
Full Screen Image Viewer: Screen height - topbar - navigation
Thumbnail Images:         40-48dp (in lists)
```

### Icon Sizes
```
Standard Icon:            24dp (most common)
Small Icon:               16dp or 18dp (in badges, ratings)
Large Icon:               28dp (settings icons)
Navigation Bar Icon:      24dp
Top App Bar Icon:         24-28dp
```

### Touch Target Sizes
```
Minimum Standard:         48dp × 48dp
Icon Buttons:             48dp × 48dp
FAB:                      56dp or 64dp diameter
Bottom Navigation Item:   56-64dp height
```

---

## 20. DIALOG & MODAL STYLING

### Alert Dialog
```kotlin
AlertDialog(
  onDismissRequest = { showDialog = false },
  title = { Text("Sort & Filter") },
  text = {
    Column {
      // Radio button options
      // Checkboxes, etc.
    }
  },
  confirmButton = {
    TextButton(onClick = { showDialog = false }) {
      Text("Apply")
    }
  },
  dismissButton = {
    TextButton(onClick = { showDialog = false }) {
      Text("Cancel")
    }
  }
)
```

**Specs:**
- Background: Surface color (white/light)
- Title Font Size: 20sp (headlineSmall)
- Title Font Weight: Bold
- Content Padding: 24dp
- Button Padding: 8dp horizontal
- Border Radius: Material default (~12dp)
- Elevation/Shadow: 24dp (prominent shadow)
- Max Width: ~90% of screen (auto-constrained)
- Animation: Fade in/out, slight scale from center

---

## 21. LIST ITEM SEPARATORS

### HorizontalDivider
```kotlin
HorizontalDivider(
  modifier = Modifier.padding(horizontal = 16.dp),
  thickness = 1.dp,
  color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.2f)
)
```

**Specs:**
- Height/Thickness: 1dp
- Color: onSurfaceVariant with 0.2 alpha (~20% opacity)
- Horizontal Padding: 16dp (usually)
- Vertical Spacing: 8dp above & below
- Full Width: Optional (can be inset with padding)

---

## 22. LAZY LISTS & GRID LAYOUTS

### Vertical List with Spacing
```kotlin
LazyColumn(
  verticalArrangement = Arrangement.spacedBy(16.dp),
  modifier = Modifier.fillMaxSize(),
  contentPadding = PaddingValues(bottom = 16.dp)
) {
  items(itemList) { item ->
    // Item composable
  }
}
```

**Specs:**
- Spacing Between Items: 12dp (compact) to 16dp (standard) to 24dp (spacious)
- Content Padding: 16dp top/bottom or variable
- Scroll Direction: Vertical (default)
- Lazy Loading: Items render as needed

### Horizontal Scrollable List
```kotlin
Row(
  modifier = Modifier
    .fillMaxWidth()
    .horizontalScroll(rememberScrollState()),
  horizontalArrangement = Arrangement.spacedBy(8.dp)
) {
  // Items in row
}
```

**Specs:**
- Spacing Between Items: 8dp (horizontal)
- No padding at edges (scrolls beyond screen)
- Scroll Behavior: Smooth, momentum
- Can Add contentPadding if needed

---

## 23. NAVIGATION & ROUTING

### Screen Transitions
- Material Design 3: Fade transitions by default
- Navigation: Pop-up stack animation (slide from bottom)
- No custom page transitions defined in code

### Back Navigation
- Uses `navController.popBackStack()`
- Arrow icon in top-left of app bar
- System back button support

---

## 24. SPACING & PADDING SUMMARY TABLE

| Element | Horizontal | Vertical | Internal |
|---------|-----------|----------|----------|
| Screen/Container | 16dp | 16dp | N/A |
| Card Content | 16dp | 16dp | N/A |
| Form Fields | 0dp | 16dp | 16dp padding inside |
| List Items | 0dp | 12-20dp | 16dp padding inside |
| Icon + Text | 8-16dp | 0dp | N/A |
| Badge/Tag | N/A | N/A | 10×6 or 8×4 dp |
| Top/Bottom App Bar | 0dp | 0dp | 12-16dp icon area |
| Section Headers | 16dp | 16dp above | N/A |
| Between Sections | 24dp | 24dp | N/A |

---

## 25. COLOR APPLICATION QUICK REFERENCE

| Component | Color | Opacity |
|-----------|-------|---------|
| Primary Button | SpinBlue (#0056D2) | 100% |
| Secondary Button | SpinOrange (#FF8C00) | 100% |
| Primary Text | SpinDarkBlue (#003366) | 100% |
| Secondary Text | SpinDarkGray (#424242) | 100% |
| Disabled Text | onSurfaceVariant | 38% |
| Hint/Placeholder | onSurfaceVariant | 70% |
| Divider | onSurfaceVariant | 20% |
| Icon (Active) | SpinBlue | 100% |
| Icon (Inactive) | onSurfaceVariant | 60% |
| Favorite | Red (#FF0000) | 100% |
| Rating Stars | Gold (#FFC107) | 100% |
| Card Background | #FAFAFA | 100% |
| Top Bar Background | SpinBlue | 100% |
| Bottom Bar Background | Background color | 100% |

---

## IMPLEMENTATION NOTES FOR NEXT.JS/REACT

1. **CSS Units**: Convert `dp` to `px` (usually 1dp = 1px on web, but adjust for DPI)
2. **Colors**: Use hex values directly in Tailwind or CSS-in-JS
3. **Border Radius**: Use Tailwind's `rounded-[Xpx]` or CSS `border-radius: Xpx`
4. **Shadows**: Map Material elevation to box-shadow (use Tailwind's shadow utilities)
5. **Typography**: Use CSS variables or Tailwind's typography scale
6. **Spacing**: Use Tailwind's spacing scale (4=16px, 6=24px, etc.)
7. **Responsive**: Ensure mobile-first, bottom nav fixed on mobile, top on desktop
8. **Animations**: Use Framer Motion or CSS keyframes for button scale/press effects
9. **State Colors**: Use CSS variables for theme switching (light/dark mode)
10. **Icons**: Match Material Design icons library (use React Icons or Material UI)

---

## FILE REFERENCES

- **Theme Colors**: `ui/theme/Color.kt`
- **Typography**: `ui/theme/Type.kt`
- **Theme System**: `ui/theme/Theme.kt`
- **Components**: `ui/components/AnimatedButton.kt`
- **Screens**:
  - `HomeScreen.kt` (product listings, cards)
  - `LoginScreen.kt` (auth flow)
  - `SignupScreen.kt` (registration)
  - `ProfileScreen.kt` (user profile)
  - `NetworkScreen.kt` (user discovery)
  - `SettingsScreen.kt` (app settings)
  - `MainScreen.kt` (bottom navigation)

