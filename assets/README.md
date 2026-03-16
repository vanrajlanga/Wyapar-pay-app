# WyaparPay Assets Directory

This directory contains all visual assets for the WyaparPay application including images, icons, logos, and branding materials.

## Directory Structure

### 📁 `/images/`
Contains all image assets used throughout the application.

#### Subdirectories:
- **`/ui/`** - UI elements, backgrounds, patterns, decorative images
- **`/screenshots/`** - App screenshots for documentation, marketing, app stores
- **`/placeholders/`** - Placeholder images for development and testing

### 📁 `/icons/`
Contains all icon assets for the application.

#### Subdirectories:
- **`/ui/`** - User interface icons (buttons, navigation, actions)
- **`/business/`** - Business-related icons (payment methods, services, categories)
- **`/social/`** - Social media icons and sharing buttons

### 📁 `/logos/`
Contains all logo variations and formats.

#### Subdirectories:
- **`/variants/`** - Different logo variations (horizontal, vertical, icon-only, full)
- **`/formats/`** - Different file formats (PNG, SVG, PDF, etc.)

### 📁 `/branding/`
Contains brand guidelines and design system assets.

#### Subdirectories:
- **`/colors/`** - Color palettes, swatches, and color guidelines
- **`/fonts/`** - Typography guidelines and font files
- **`/guidelines/`** - Brand guidelines, style guides, and design documentation

## File Naming Conventions

### Images
- Use descriptive names: `hero-background.png`, `user-avatar-placeholder.jpg`
- Include dimensions for UI elements: `button-icon-24x24.png`
- Use lowercase with hyphens: `mobile-recharge-icon.svg`

### Icons
- Use semantic names: `arrow-back.svg`, `payment-success.png`
- Include size in filename: `close-icon-16x16.png`
- Group by function: `nav-home.svg`, `nav-profile.svg`

### Logos
- Include variant type: `wyaparpay-logo-horizontal.svg`
- Include format: `wyaparpay-icon-white.png`
- Include usage context: `wyaparpay-logo-app-store.png`

## Usage Guidelines

### Frontend Integration
- Reference assets from `frontend/WyaparPayExpo/assets/` for Expo-specific assets
- Use this directory for shared assets across different platforms
- Maintain consistency between this directory and Expo assets

### File Formats
- **PNG**: For images with transparency or complex graphics
- **SVG**: For scalable icons and simple graphics
- **JPG**: For photographs and complex images without transparency
- **PDF**: For print-ready logos and documents

### Optimization
- Compress images for web/mobile use
- Provide multiple resolutions for different screen densities
- Use appropriate formats for different use cases

## Maintenance

- Regularly audit unused assets
- Keep file sizes optimized
- Maintain consistent naming conventions
- Update documentation when adding new asset categories

## Integration with Development

### Expo Assets
- Copy necessary assets to `frontend/WyaparPayExpo/assets/` for Expo builds
- Use this directory as the source of truth for all visual assets
- Maintain sync between this directory and Expo assets

### Backend Assets
- Store API-related images (user uploads, documents) in appropriate backend directories
- Use this directory for static assets referenced by the backend
