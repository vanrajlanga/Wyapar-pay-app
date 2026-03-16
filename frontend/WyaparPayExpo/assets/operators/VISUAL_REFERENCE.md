# 🎨 Visual Reference Guide - Icons & Logos

Quick reference for all available icons and their usage codes.

---

## 📱 Telecom Operator Logos

### Usage: `<OperatorLogo operatorCode="CODE" size={64} />`

| Code | Operator | Brand Color | Preview |
|------|----------|-------------|---------|
| `AIRTEL` | Airtel | #ED1C24 (Red) | ![Red square with "airtel" text] |
| `JIO` | Reliance Jio | #0A1172 (Blue) | ![Blue square with "Jio" text] |
| `VI` | Vi (Vodafone Idea) | #9B1D73 (Purple) | ![Purple square with "Vi" text] |
| `BSNL` | BSNL | #FF9900 (Orange) | ![Orange square with "BSNL" text] |
| `MTNL` | MTNL | #00A651 (Green) | ![Green square with "MTNL" text] |
| `DEFAULT` | Unknown/Generic | #6B7280 (Gray) | ![Gray square with signal icon] |

**Files**: `airtel.svg`, `jio.svg`, `vi.svg`, `bsnl.svg`, `mtnl.svg`, `default.svg`

---

## 🎯 Service Type Icons

### Usage: `<ServiceIcon serviceCode="CODE" size={64} showGradient />`

### Recharge Services (Custom SVG Icons)

| Code | Service | Gradient | File |
|------|---------|----------|------|
| `MOBILE_RECHARGE` | Mobile Recharge | Purple (#667eea → #764ba2) | mobile-recharge.svg |
| `DTH_RECHARGE` | DTH Recharge | Pink (#f093fb → #f5576c) | dth-recharge.svg |
| `BROADBAND` | Broadband | Blue (#4facfe → #00f2fe) | broadband-recharge.svg |

**Visual Style**: Custom gradient icons with recharge symbol (green arrow circle)

### Bill Payment Services (Material Icons)

| Code | Service | Icon | Gradient |
|------|---------|------|----------|
| `ELECTRICITY` | Electricity Bill | ⚡ bolt | Orange (#FFD700 → #FFA500) |
| `WATER` | Water Bill | 💧 water-drop | Blue (#4FC3F7 → #1E90FF) |
| `GAS` | Gas Bill | 🔥 local-fire-department | Red (#FF7F50 → #FF6347) |
| `CREDIT_CARD` | Credit Card Bill | 💳 credit-card | Green (#66BB6A → #4CAF50) |
| `MUNICIPAL_TAX` | Municipal Tax | 🏛️ location-city | Gray (#78909C → #607D8B) |

### Payment Services (Material Icons)

| Code | Service | Icon | Gradient |
|------|---------|------|----------|
| `LOAN` | Loan Repayment | 🏦 account-balance | Purple (#AB47BC → #9C27B0) |
| `INSURANCE` | Insurance Premium | 🛡️ shield | Blue (#42A5F5 → #2196F3) |

### Transportation Services (Material Icons)

| Code | Service | Icon | Gradient |
|------|---------|------|----------|
| `FASTAG` | FASTag Recharge | 🚗 directions-car | Orange (#FFA726 → #FF9800) |
| `METRO` | Metro Card | 🚇 train | Brown (#8D6E63 → #795548) |

---

## 🎨 Color Palette Reference

### Operator Brand Colors
```css
Airtel:  #ED1C24  /* Bright Red */
Jio:     #0A1172  /* Deep Blue */
Vi:      #9B1D73  /* Magenta Purple */
BSNL:    #FF9900  /* Orange */
MTNL:    #00A651  /* Green */
```

### Service Gradients
```css
Mobile:      linear-gradient(#667eea, #764ba2)  /* Purple */
DTH:         linear-gradient(#f093fb, #f5576c)  /* Pink */
Broadband:   linear-gradient(#4facfe, #00f2fe)  /* Cyan */
Electricity: linear-gradient(#FFD700, #FFA500)  /* Gold-Orange */
Water:       linear-gradient(#4FC3F7, #1E90FF)  /* Light-Blue */
Gas:         linear-gradient(#FF7F50, #FF6347)  /* Coral-Red */
Credit:      linear-gradient(#66BB6A, #4CAF50)  /* Light-Green */
Loan:        linear-gradient(#AB47BC, #9C27B0)  /* Purple */
Insurance:   linear-gradient(#42A5F5, #2196F3)  /* Blue */
FASTag:      linear-gradient(#FFA726, #FF9800)  /* Orange */
Metro:       linear-gradient(#8D6E63, #795548)  /* Brown */
Municipal:   linear-gradient(#78909C, #607D8B)  /* Blue-Gray */
```

---

## 📐 Size Guidelines

### Recommended Sizes
- **Small**: 32-40px (Transaction list items, chips)
- **Medium**: 48-56px (Default, cards, grids)
- **Large**: 64-80px (Featured services, selection screens)
- **Extra Large**: 96-120px (Hero sections, onboarding)

### Border Radius
- Calculated as: `size / 5`
- Example: 60px icon → 12px border radius

---

## 🎯 Usage Examples by Context

### Dashboard Quick Actions
```tsx
<ServiceIcon serviceCode="MOBILE_RECHARGE" size={56} showGradient />
<ServiceIcon serviceCode="DTH_RECHARGE" size={56} showGradient />
<ServiceIcon serviceCode="ELECTRICITY" size={56} showGradient />
```

### Operator Selection Grid
```tsx
<OperatorLogo operatorCode="AIRTEL" size={72} showBorder />
<OperatorLogo operatorCode="JIO" size={72} showBorder />
<OperatorLogo operatorCode="VI" size={72} showBorder />
```

### Transaction History List
```tsx
<OperatorLogo operatorCode="AIRTEL" size={48} />
<ServiceIcon serviceCode="ELECTRICITY" size={48} />
```

### Payment Success Screen
```tsx
<OperatorLogo operatorCode="JIO" size={80} showBorder />
```

### Service Category Headers
```tsx
<ServiceIcon serviceCode="MOBILE_RECHARGE" size={40} showGradient />
```

---

## 🔄 Quick Code Snippets

### Import Statements
```typescript
// Components
import { OperatorLogo, ServiceIcon } from '../components';

// Utilities
import { 
  getOperatorByCode, 
  getServiceByCode,
  detectOperatorFromNumber 
} from '../constants';
```

### Basic Usage
```tsx
// Operator logo with border
<OperatorLogo operatorCode="AIRTEL" size={64} showBorder />

// Service with gradient
<ServiceIcon serviceCode="MOBILE_RECHARGE" size={56} showGradient />

// Custom colors
<ServiceIcon 
  serviceCode="ELECTRICITY" 
  size={48}
  iconColor="#FFA500"
/>
```

### Dynamic Detection
```tsx
const operatorCode = detectOperatorFromNumber('9876543210');
if (operatorCode) {
  <OperatorLogo operatorCode={operatorCode} size={56} />
}
```

---

## 📱 Platform Support

| Platform | SVG Support | Material Icons | Performance |
|----------|-------------|----------------|-------------|
| iOS | ✅ Native | ✅ Full | ⚡ Excellent |
| Android | ✅ Native | ✅ Full | ⚡ Excellent |
| Web | ✅ React-SVGR | ✅ Full | ⚡ Good |

---

## 🎨 Design Principles

1. **Consistency**: All icons follow the same design language
2. **Scalability**: SVG icons scale perfectly at any size
3. **Brand Accuracy**: Operator colors match official brand guidelines
4. **Accessibility**: High contrast ratios for readability
5. **Performance**: Optimized file sizes, efficient rendering

---

## 📦 File Specifications

### Current Files (SVG Placeholders)
- Format: SVG (vector)
- Size: 120x120 viewBox
- File Size: ~1-3 KB each
- Background: Rounded rectangles (rx="12")
- Text: Simple brand names

### Production Requirements
- Format: SVG or PNG (transparent background)
- Size: 512x512px minimum (PNG), vector (SVG)
- File Size: < 50 KB per file
- Quality: High resolution, clean edges
- Colors: Official brand colors

---

## 🚀 Performance Tips

1. **Use SVG when possible**: Smaller file size, scalable
2. **Enable caching**: React Native auto-caches require() images
3. **Use appropriate sizes**: Don't render 120px icon at 32px
4. **Preload critical icons**: Load dashboard icons early
5. **Lazy load others**: Load service icons on demand

---

## 📊 Coverage Matrix

| Service Type | Operator-Specific | Generic Icon | Material Icon |
|--------------|-------------------|--------------|---------------|
| Mobile Recharge | ✅ Yes | ✅ Yes | ❌ No |
| DTH Recharge | ⏳ Future | ✅ Yes | ❌ No |
| Broadband | ⏳ Future | ✅ Yes | ❌ No |
| Electricity | ❌ No | ❌ No | ✅ Yes |
| Water | ❌ No | ❌ No | ✅ Yes |
| Gas | ❌ No | ❌ No | ✅ Yes |
| Credit Card | ✅ Bank logos | ✅ Yes | ✅ Yes |
| Others | ❌ No | ❌ No | ✅ Yes |

**Legend**:
- ✅ Implemented
- ⏳ Planned for future
- ❌ Not applicable

---

This visual reference guide helps developers quickly find the right icon code and understand usage patterns across the app.

