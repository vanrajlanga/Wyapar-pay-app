# WyaparPay Logo Assets

## Current Logo Files

### Main Logo
- **File**: `wyaparpay-logo-horizontal.jpeg`
- **Location**: `assets/logos/variants/`
- **Format**: JPEG
- **Size**: 19.5 KB
- **Usage**: Primary brand logo for horizontal layouts

### Expo Integration
- **File**: `wyaparpay-logo.jpeg`
- **Location**: `frontend/WyaparPayExpo/assets/`
- **Format**: JPEG
- **Usage**: Integrated into React Native app

## Logo Usage in Application

### Landing Screen
- **Size**: 200x80 pixels
- **Style**: `styles.logo`
- **Animation**: Slide-in animation with fade effect
- **Position**: Top of screen, above subtitle

### Login Screen
- **Size**: 150x60 pixels
- **Style**: `styles.loginLogo`
- **Position**: Top of form, above "Login" title

### Register Screen
- **Size**: 150x60 pixels
- **Style**: `styles.loginLogo`
- **Position**: Top of form, above "Register" title

## Logo Guidelines

### Usage Rules
- **Consistent Sizing**: Use defined styles for consistent appearance
- **Proper Scaling**: Use `resizeMode="contain"` to maintain aspect ratio
- **Quality**: Ensure logo remains crisp at all sizes
- **Placement**: Position prominently but not overwhelming

### Technical Specifications
- **Format**: JPEG (optimized for mobile)
- **Aspect Ratio**: Maintain original proportions
- **Background**: Works on both light and dark backgrounds
- **Responsive**: Scales appropriately for different screen sizes

### Brand Compliance
- **Consistency**: Use same logo across all screens
- **Quality**: Maintain high resolution for crisp display
- **Placement**: Follow brand guidelines for positioning
- **Context**: Appropriate sizing for each screen context

## Future Enhancements

### Additional Formats
- **SVG**: For scalable vector version
- **PNG**: For transparency support
- **Variants**: Different orientations and styles
- **Sizes**: Multiple resolutions for different use cases

### Logo Variations
- **Icon Only**: Symbol without text
- **Vertical**: Stacked text layout
- **Monochrome**: Single color versions
- **Reversed**: Light versions for dark backgrounds

## Integration Notes

### React Native
- **Import**: Using `require('./assets/wyaparpay-logo.jpeg')`
- **Styling**: Defined in StyleSheet for consistency
- **Performance**: Optimized JPEG for mobile performance
- **Caching**: Expo handles asset caching automatically

### Asset Management
- **Source**: Main logo stored in `assets/logos/variants/`
- **Copy**: Copied to Expo assets for app integration
- **Version Control**: Both locations tracked in git
- **Updates**: Update both locations when logo changes
