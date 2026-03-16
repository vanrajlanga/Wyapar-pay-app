# 📥 Official Logo Download Guide

Step-by-step guide to download and integrate official operator logos.

---

## 🎯 Why Official Logos?

Current SVG files are **placeholders** with correct brand colors and text. For production, you should use:
- ✅ Official vector logos from brand press kits
- ✅ High-resolution PNG files (512x512px minimum)
- ✅ Transparent backgrounds
- ✅ Original brand proportions

---

## 📥 Download Instructions

### Method 1: Official Brand Press Kits (Recommended)

#### 1. **Airtel**
```
Website: https://www.airtel.in/press
Steps:
1. Navigate to "Media Resources" or "Brand Assets"
2. Look for "Logo Downloads" or "Media Kit"
3. Download SVG or high-res PNG version
4. Use the standalone logo (not full lockup with tagline)

Direct Links (if available):
- Airtel Thanks: https://www.airtel.in/airtel-thanks
- Corporate: https://www.airtel.in/about-bharti-airtel/company

Brand Color: #ED1C24 (Airtel Red)
File Name: airtel-logo.svg or airtel-logo.png
```

#### 2. **Reliance Jio**
```
Website: https://www.jio.com/press
Steps:
1. Go to "Press & Media" section
2. Find "Brand Assets" or "Media Resources"
3. Download official Jio logo
4. Use the circular "Jio" logo or square variant

Alternative:
- JioMart Media: https://www.jiomart.com/press
- Reliance Industries: https://www.ril.com/media

Brand Color: #0A1172 (Jio Blue)
File Name: jio-logo.svg or jio-logo.png
```

#### 3. **Vi (Vodafone Idea)**
```
Website: https://www.myvi.in/press or https://www.vi.in
Steps:
1. Navigate to "About Us" → "Media"
2. Look for "Brand Guidelines" or "Logo Downloads"
3. Download the new "Vi" rebranded logo (post-2020)
4. Use the circular Vi symbol

Brand Color: #9B1D73 (Vi Magenta/Purple)
File Name: vi-logo.svg or vi-logo.png
```

#### 4. **BSNL**
```
Website: https://www.bsnl.co.in
Steps:
1. Go to "Downloads" or "About BSNL"
2. Look for official logo in media section
3. Download BSNL winged logo

Alternative:
- Ministry of Communications: https://dot.gov.in

Brand Color: #FF9900 (BSNL Orange)
File Name: bsnl-logo.svg or bsnl-logo.png
```

#### 5. **MTNL**
```
Website: https://www.mtnl.in
Steps:
1. Visit "About Us" or "Corporate"
2. Find official MTNL logo
3. Download logo with or without text

Brand Color: #00A651 (MTNL Green)
File Name: mtnl-logo.svg or mtnl-logo.png
```

---

### Method 2: Brandfetch (Automated)

Brandfetch aggregates official brand assets:

```
Website: https://brandfetch.com

Steps:
1. Search for "Airtel India"
2. Click on the result
3. Download logo in preferred format (SVG/PNG)
4. Repeat for: Jio, Vi, BSNL, MTNL

Pros: Quick, multiple formats available
Cons: May not always have latest logos
```

**Direct Links**:
- https://brandfetch.com/airtel.in
- https://brandfetch.com/jio.com
- https://brandfetch.com/myvi.in
- https://brandfetch.com/bsnl.co.in

---

### Method 3: Clearbit Logo API (Programmatic)

```bash
# Download logos via command line
curl -o airtel-logo.png "https://logo.clearbit.com/airtel.in"
curl -o jio-logo.png "https://logo.clearbit.com/jio.com"
curl -o vi-logo.png "https://logo.clearbit.com/myvi.in"
curl -o bsnl-logo.png "https://logo.clearbit.com/bsnl.co.in"

# Then convert to 512x512 if needed
```

**Note**: Clearbit provides favicon-sized logos. May need upscaling.

---

### Method 4: Design Asset Platforms

#### Flaticon
```
Website: https://www.flaticon.com
Search: "telecom operator logos india"

Pros: Clean, consistent style
Cons: May not be official brands (icon versions)
License: Check attribution requirements
```

#### Freepik
```
Website: https://www.freepik.com
Search: "indian mobile operator logos"

Pros: High quality, various styles
Cons: May require attribution
License: Free account with attribution
```

---

## 🔧 Processing Downloaded Logos

### Step 1: Optimize SVG Files

```bash
# Install SVGO
npm install -g svgo

# Optimize SVG
svgo input-logo.svg -o optimized-logo.svg

# Batch optimize
svgo -f ./operators --multipass
```

### Step 2: Resize PNG Files

```bash
# Using ImageMagick
convert input-logo.png -resize 512x512 -background none -gravity center -extent 512x512 output-logo.png

# Using sips (macOS)
sips -z 512 512 input-logo.png --out output-logo.png

# Batch resize all PNGs
for file in *.png; do
  convert "$file" -resize 512x512 -background none -gravity center -extent 512x512 "resized-$file"
done
```

### Step 3: Compress PNG Files

```bash
# Online tools (recommended):
- TinyPNG: https://tinypng.com (drag & drop)
- Squoosh: https://squoosh.app (advanced options)

# Command line (using pngquant):
pngquant --quality=85-95 input-logo.png

# Batch compress
for file in *.png; do
  pngquant --quality=85-95 --output "compressed-$file" "$file"
done
```

---

## 📁 File Naming Convention

Use consistent naming:

```
✅ Correct:
airtel.svg    or    airtel.png
jio.svg       or    jio.png
vi.svg        or    vi.png
bsnl.svg      or    bsnl.svg
mtnl.svg      or    mtnl.png

❌ Incorrect:
Airtel-Logo.png
jio_logo_final.svg
VI-new-logo-2023.png
```

**Rules**:
- Lowercase only
- No spaces or special characters
- Use hyphen for multi-word: `new-operator.svg`
- Extension: `.svg` (preferred) or `.png`

---

## 🔄 Integration Steps

### 1. Replace Logo Files

```bash
# Backup current placeholders
mv assets/operators assets/operators-backup

# Copy downloaded logos
cp ~/Downloads/airtel-logo.svg frontend/WyaparPayExpo/assets/operators/airtel.svg
cp ~/Downloads/jio-logo.svg frontend/WyaparPayExpo/assets/operators/jio.svg
# ... repeat for others
```

### 2. Update Configuration (if needed)

If using PNG instead of SVG:

```typescript
// src/constants/operators.ts

export const OperatorLogos = {
  AIRTEL: require('../../assets/operators/airtel.png'), // Changed from .svg
  JIO: require('../../assets/operators/jio.png'),
  // ... update all extensions
};
```

### 3. Clear Metro Cache

```bash
# Clear React Native/Expo cache
npx expo start --clear

# Or manually delete cache
rm -rf node_modules/.cache
rm -rf .expo
```

### 4. Test on Devices

```bash
# Start development server
npx expo start

# Test on:
- iOS Simulator
- Android Emulator
- Physical devices (iOS + Android)
```

---

## ✅ Quality Checklist

Before integrating, verify each logo:

### Visual Quality
- [ ] Logo is clear and crisp at 512x512px
- [ ] Background is transparent (for PNG)
- [ ] Colors match official brand colors
- [ ] No pixelation or artifacts
- [ ] Proper aspect ratio maintained

### Technical Quality
- [ ] File size < 50 KB (ideally < 20 KB)
- [ ] Format: SVG (preferred) or PNG
- [ ] Dimensions: Square (1:1 ratio) or brand standard
- [ ] Color mode: RGB (for screens)
- [ ] No unnecessary metadata

### Legal Compliance
- [ ] Downloaded from official source OR
- [ ] Licensed for commercial use
- [ ] Attribution added if required
- [ ] No modifications to official logos

---

## 📊 Comparison: Placeholder vs Official

| Aspect | Current Placeholder | Official Logo |
|--------|-------------------|---------------|
| Format | SVG text-based | SVG vector or PNG |
| Size | ~2 KB | 10-50 KB |
| Quality | Basic brand colors | Official artwork |
| Fidelity | Text representation | Exact brand logo |
| Legal | Placeholder use OK | Production-ready |
| Source | Custom created | Official brand asset |

---

## 🚨 Common Issues & Solutions

### Issue 1: Logo Too Large
```bash
# Solution: Optimize/compress
svgo logo.svg -o logo.svg
# or
pngquant --quality=85-95 logo.png
```

### Issue 2: Logo Has White Background
```bash
# Solution: Remove background (Photoshop/GIMP)
# Or use online tool: https://remove.bg
```

### Issue 3: Logo Not Loading
```bash
# Solution: Clear cache and restart
npx expo start --clear
```

### Issue 4: Logo Stretched/Distorted
```typescript
// Solution: Check resizeMode
<Image 
  source={logoSource}
  style={styles.logo}
  resizeMode="contain"  // Use "contain" not "stretch"
/>
```

---

## 📞 Brand Contact Information

If you need official assistance:

| Operator | Email | Phone |
|----------|-------|-------|
| Airtel | corporate.communication@airtel.com | 124-4664831 |
| Jio | pr@ril.com | 022-39027000 |
| Vi | pr@myvi.in | 022-66173500 |
| BSNL | cgm-cc@bsnl.co.in | 011-23710000 |
| MTNL | mtnl@mtnl.net.in | 011-23710000 |

---

## 📚 Additional Resources

- [Brand Guidelines Best Practices](https://www.brandguidelines.co/)
- [Logo Design Principles](https://www.logodesignlove.com/)
- [SVG Optimization Guide](https://jakearchibald.github.io/svgomg/)
- [React Native Image Docs](https://reactnative.dev/docs/image)

---

## ⚖️ Legal Disclaimer

**Important**: Telecom operator logos are protected intellectual property. Usage guidelines:

✅ **Permitted Uses**:
- Identifying operators in payment/recharge applications
- Informational purposes (showing which operator user selected)
- Following official brand guidelines

❌ **Prohibited Uses**:
- Modifying or altering official logos
- Implying endorsement without permission
- Using logos for unrelated products/services
- Creating confusion about brand affiliation

**Best Practice**: Include disclaimer in app:
> "All logos and trademarks are property of their respective owners. Use of these marks does not imply endorsement."

---

## 🎯 Quick Start Commands

```bash
# 1. Create backup
cp -r assets/operators assets/operators-backup

# 2. Download logos (replace URLs with actual sources)
curl -o assets/operators/airtel.svg [AIRTEL_LOGO_URL]
curl -o assets/operators/jio.svg [JIO_LOGO_URL]
curl -o assets/operators/vi.svg [VI_LOGO_URL]
curl -o assets/operators/bsnl.svg [BSNL_LOGO_URL]
curl -o assets/operators/mtnl.svg [MTNL_LOGO_URL]

# 3. Optimize SVGs
svgo -f assets/operators --multipass

# 4. Clear cache and test
npx expo start --clear
```

---

**Next Step**: After downloading, refer to `OPERATOR_AND_SERVICE_ICONS_GUIDE.md` for integration examples.

**Status**: Ready to download official logos ✅

