# Telecom Operator Logos

This directory contains logos for major Indian telecom operators used in the recharge functionality.

## Current Logos (Hybrid: SVG + PNG)

The project uses a combination of SVG and PNG logos:

### SVG Logos (Text + Brand Colors)
- ✅ `airtel.svg` - Airtel (Red #ED1C24, 358B)
- ✅ `vi.svg` - Vi (Vodafone Idea) (Purple #9B1D73, 360B)
- ✅ `bsnl.svg` - BSNL (Orange #FF9900, 348B)
- ✅ `mtnl.svg` - MTNL (Green #00A651, 340B)
- ✅ `default.svg` - Default/Generic operator (530B)

### Official PNG Logo
- ✅ `jio.png` - Reliance Jio official logo (512x512px, ~136KB)

### Service Icons (SVG)
- ✅ `mobile-recharge.svg` - Mobile service icon with gradient
- ✅ `dth-recharge.svg` - DTH service icon with gradient
- ✅ `broadband-recharge.svg` - Broadband service icon with gradient

**Total Size**: SVG logos (~2KB) + Jio PNG (136KB) = ~138KB

## Recommended: High-Quality Official Logos

For production use, replace these placeholders with official high-resolution logos.

### Where to Get Official Logos

#### Option 1: Company Press Kits (Recommended)
1. **Airtel**: https://www.airtel.in/press (Look for "Media Assets" or "Brand Guidelines")
2. **Jio**: https://www.jio.com/press (Corporate Communications section)
3. **Vi**: https://www.myvi.in/press (Brand Resources)
4. **BSNL**: https://www.bsnl.co.in (Download section)
5. **MTNL**: https://www.mtnl.in (Media Resources)

#### Option 2: Icon/Logo Services
- **Brandfetch**: https://brandfetch.com (Search for operator names)
- **Clearbit Logo API**: https://logo.clearbit.com/{domain}
- **LogoSearch**: https://logosear.ch

#### Option 3: Design Assets Platforms
- **Flaticon**: https://www.flaticon.com (Search "telecom operator logos india")
- **Freepik**: https://www.freepik.com (Look for "indian mobile operator logos")

### Logo Specifications

For best results, use logos with these specifications:

- **Format**: SVG (vector) or PNG with transparent background
- **Size**: 512x512px minimum (for PNG)
- **Aspect Ratio**: Square (1:1) or original brand ratio
- **Background**: Transparent preferred
- **Color**: Original brand colors
- **Quality**: High resolution, clean edges

### Naming Convention

Keep the file names consistent:
```
airtel.svg / airtel.png
jio.svg / jio.png
vi.svg / vi.png
bsnl.svg / bsnl.png
mtnl.svg / mtnl.png
default.svg / default.png
```

### Adding New Operators

To add a new operator:

1. Add the logo file to this directory
2. Update `src/constants/operators.ts`:
   ```typescript
   export const OperatorLogos = {
     // ... existing logos
     NEW_OPERATOR: require('../../assets/operators/new-operator.svg'),
   };

   export const OPERATORS: Record<string, OperatorInfo> = {
     // ... existing operators
     NEW_OPERATOR: {
       code: 'NEW_OPERATOR',
       name: 'NewOperator',
       displayName: 'New Operator Name',
       logo: OperatorLogos.NEW_OPERATOR,
       brandColor: '#HEXCODE',
       category: 'both',
       active: true,
       sortOrder: 6,
     },
   };
   ```

### Legal Considerations

**Important**: Telecom operator logos are trademarked intellectual property. Usage guidelines:

- ✅ **Allowed**: Using logos to identify operators in a payment/recharge app (informational use)
- ✅ **Allowed**: Following official brand guidelines when available
- ❌ **Not Allowed**: Modifying official logos
- ❌ **Not Allowed**: Implying endorsement without permission
- ❌ **Not Allowed**: Using logos for purposes other than operator identification

Always:
1. Use official versions from brand guidelines when available
2. Maintain brand colors and proportions
3. Don't alter or distort logos
4. Include appropriate disclaimers (e.g., "Logos are trademarks of their respective owners")

### Image Optimization

Before adding PNG files, optimize them:

```bash
# Using ImageMagick
convert input.png -resize 512x512 -quality 85 output.png

# Using online tools
- TinyPNG: https://tinypng.com
- Squoosh: https://squoosh.app
```

For SVG files, optimize with:
```bash
# Using SVGO
npx svgo input.svg -o output.svg
```

### Testing

After adding/updating logos:

1. Clear Metro bundler cache:
   ```bash
   npx expo start --clear
   ```

2. Test in all screens:
   - Operator selection
   - Plan selection
   - Transaction history
   - Payment success screen

3. Verify on both iOS and Android

### Brand Colors Reference

```typescript
const BRAND_COLORS = {
  AIRTEL: '#ED1C24',      // Airtel Red
  JIO: '#0A1172',         // Jio Blue
  VI: '#9B1D73',          // Vi Purple/Magenta
  BSNL: '#FF9900',        // BSNL Orange
  MTNL: '#00A651',        // MTNL Green
};
```

## Current Status

✅ **Hybrid Approach - Production Ready**

**Configuration**:
- **Airtel, Vi, BSNL, MTNL**: SVG logos (text + brand colors) - Small, fast, legally safe
- **Jio**: Official PNG logo (high-quality) - Better visual appearance
- **Default**: SVG fallback for unknown operators

**Benefits**:
- ✅ Small total file size (~138KB vs ~468KB)
- ✅ Fast loading with mostly vector graphics
- ✅ Legally safe (SVG text representations)
- ✅ Professional appearance (Jio PNG is high-quality)
- ✅ Best of both worlds approach

This hybrid configuration is optimized for production use in a recharge/payment application.

## Future Enhancements

- [ ] Add DTH operator logos (Tata Sky, Dish TV, etc.)
- [ ] Add regional operator logos
- [ ] Implement dynamic logo loading from CDN
- [ ] Add logo fallback system
- [ ] Implement logo caching strategy

