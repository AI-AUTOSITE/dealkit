# DealKit App Icon Design Guide

## Brand Colors
- Primary: #7C3AED (Purple)
- Background: #FFFFFF (Light) or #111827 (Dark)

## Icon Concept
The DealKit icon represents deal management for creators:
- A stylized "D" combined with a checkmark or handshake symbol
- Clean, modern, and professional look
- Easily recognizable at small sizes

## Required Assets

### iOS
| Asset | Size | File |
|-------|------|------|
| App Icon | 1024x1024px | icon.png |
| Notification | 60x60px | notification-icon.png |

### Android
| Asset | Size | File |
|-------|------|------|
| Adaptive Icon Foreground | 1024x1024px (with safe zone) | adaptive-icon.png |
| Notification | 96x96px (white on transparent) | notification-icon.png |

### Web
| Asset | Size | File |
|-------|------|------|
| Favicon | 48x48px | favicon.png |

### Splash Screen
| Asset | Size | File |
|-------|------|------|
| Splash Icon | 200x200px | splash-icon.png |

## SVG Design Reference

```svg
<!-- DealKit Logo Concept -->
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1024" height="1024" rx="224" fill="#7C3AED"/>
  
  <!-- Stylized "D" with checkmark -->
  <g transform="translate(200, 200)">
    <!-- Main D shape -->
    <path 
      d="M150 0 H350 
         Q550 0 550 200 
         Q550 400 350 400 
         H150 
         V0 Z
         M250 100 
         V300 
         H350 
         Q450 300 450 200 
         Q450 100 350 100 
         H250 Z" 
      fill="white"
    />
    
    <!-- Checkmark accent -->
    <path 
      d="M420 250 L480 310 L600 150" 
      stroke="#10B981" 
      stroke-width="50" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
      fill="none"
    />
  </g>
</svg>
```

## Alternative Concept: Dollar/Deal Symbol

```svg
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with rounded corners -->
  <rect width="1024" height="1024" rx="224" fill="#7C3AED"/>
  
  <!-- Handshake symbol representing deals -->
  <g transform="translate(256, 300)" fill="white">
    <!-- Left hand -->
    <path d="M0 200 L100 150 L150 200 L100 250 Z"/>
    <!-- Right hand -->
    <path d="M512 200 L412 150 L362 200 L412 250 Z"/>
    <!-- Handshake -->
    <rect x="150" y="175" width="212" height="50" rx="25"/>
  </g>
  
  <!-- Dollar sign -->
  <text 
    x="512" y="600" 
    font-family="Arial, sans-serif" 
    font-size="300" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle"
  >
    $
  </text>
</svg>
```

## Creating Icons with Figma/Sketch

1. **Create 1024x1024 artboard**
2. **Add rounded rectangle background** (corner radius: 224px for iOS-style)
3. **Fill with #7C3AED**
4. **Add white icon elements** centered with ~20% padding
5. **Export as PNG** at 1x for each required size

## Android Adaptive Icon Notes

For adaptive icons:
- Foreground should be 108dp (1024px at xxxhdpi)
- Use only the center 66dp (66%) as safe zone
- Background is a solid color (#7C3AED) set in app.json

## Quick Generation with AI Tools

You can use AI image generators with this prompt:
```
A modern app icon for "DealKit", a deal management app for content creators. 
Purple (#7C3AED) background with rounded corners. 
White minimalist icon showing either:
- A stylized letter "D" with a checkmark
- A handshake symbol
- A dollar sign with a checkmark
Clean, professional, iOS/Android style app icon.
1024x1024 pixels.
```

## File Checklist

- [ ] assets/icon.png (1024x1024)
- [ ] assets/adaptive-icon.png (1024x1024, foreground only)
- [ ] assets/splash-icon.png (200x200)
- [ ] assets/favicon.png (48x48)
- [ ] assets/notification-icon.png (96x96, Android)
