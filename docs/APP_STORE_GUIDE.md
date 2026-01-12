# DealKit - App Store Submission Guide

## App Information

### Basic Info
- **App Name**: DealKit
- **Subtitle**: Deal Manager for Creators
- **Category**: Business / Finance
- **Bundle ID**: com.dealkit.app

### Description

**Short Description** (80 chars):
```
Track deals, manage payments, and calculate rates - built for content creators.
```

**Full Description**:
```
DealKit is the ultimate deal management app for content creators, influencers, and freelancers. Track your brand deals, manage payments, and use AI-powered tools to negotiate better rates.

KEY FEATURES:

📊 Deal Tracking
• Track all your brand deals in one place
• Monitor deal status from pitch to completion
• Set deadlines and never miss a content delivery

💰 Payment Management
• Track invoices and payment status
• Get reminders before payment due dates
• Know exactly what's owed to you

🧮 Rate Calculator
• Calculate fair rates based on your metrics
• Factor in platform, niche, and engagement
• Never undercharge for your content again

📋 Contract Review
• Scan contracts for red flags
• Identify unfair terms and usage rights
• Get negotiation suggestions

📧 Email Assistant
• Professional email templates
• Negotiation, payment follow-ups, and more
• Customize tone and style

📊 Usage Rights Calculator
• Calculate fees for extended content usage
• Territory, duration, and exclusivity pricing
• Industry-standard rate multipliers

PREMIUM FEATURES:
• Unlimited AI tool usage
• All contract review checks
• Premium email templates
• Data export and backup
• Priority support

Built with privacy in mind - your data stays on your device. No ads, no tracking.

Perfect for:
• Instagram creators
• TikTok influencers
• YouTube content creators
• Freelance marketers
• Brand ambassadors
```

### Keywords
```
creator economy, influencer, deal tracker, brand deals, rate calculator, 
contract review, payment tracker, invoice, content creator, sponsorship,
creator tools, freelance, influencer marketing, UGC
```

### Privacy Policy URL
```
https://dealkit.app/privacy
```

### Support URL
```
https://dealkit.app/support
```

---

## Screenshots Required

### iPhone (6.7" display - iPhone 15 Pro Max)
Size: 1290 x 2796 pixels

1. **Deals Screen** - Show active deals list
2. **Rate Calculator** - Show calculation result
3. **Contract Review** - Show analysis with score
4. **Payment Tracker** - Show payment list
5. **Email Assistant** - Show generated email
6. **Premium Features** - Show upgrade screen

### iPad (12.9" display)
Size: 2048 x 2732 pixels
- Same 6 screens adapted for iPad

### Screenshot Text Overlays

Screen 1: "Track All Your Brand Deals"
Screen 2: "Know Your Worth"
Screen 3: "Spot Red Flags in Contracts"
Screen 4: "Never Miss a Payment"
Screen 5: "Professional Emails in Seconds"
Screen 6: "Unlock Premium Features"

---

## In-App Purchases

### Products to Create in App Store Connect

| Product ID | Type | Price | Description |
|------------|------|-------|-------------|
| dealkit_premium_monthly | Auto-Renewable Subscription | $4.99 | Monthly Premium |
| dealkit_premium_yearly | Auto-Renewable Subscription | $29.99 | Yearly Premium |
| dealkit_premium_lifetime | Non-Consumable | $79.99 | Lifetime Premium |

### Subscription Group
- **Group Name**: DealKit Premium
- **Products**: Monthly, Yearly

---

## Review Notes for Apple

```
Thank you for reviewing DealKit!

TEST ACCOUNT:
No account required - the app works entirely offline with local storage.

IN-APP PURCHASES:
The app offers Premium subscriptions ($4.99/mo, $29.99/yr) and a lifetime option ($79.99).
Premium unlocks unlimited use of AI tools (Rate Calculator, Contract Review, Email Assistant, Usage Calculator).
Free users get limited monthly usage of these features.

DATA PRIVACY:
All user data is stored locally on device using SQLite.
No data is sent to external servers.
No user accounts or authentication required.

DEMO INSTRUCTIONS:
1. Open the app
2. Tap "+" to create a test deal
3. Go to Tools tab and try Rate Calculator
4. The Premium screen can be accessed from Settings

Contact: support@dealkit.app
```

---

## Google Play Submission

### Store Listing

**Title**: DealKit - Creator Deal Manager

**Short Description** (80 chars):
```
Track deals, manage payments & calculate rates for content creators
```

**Full Description**: (Same as iOS)

### Graphic Assets

| Asset | Size |
|-------|------|
| Feature Graphic | 1024 x 500 px |
| Icon | 512 x 512 px |
| Screenshots | 1080 x 1920 px (min 2) |

### Content Rating
- IARC Rating: Everyone
- No violence, no mature content

### Data Safety

**Data Collected**: None
**Data Shared**: None
**Security Practices**: Data encrypted in transit (for notifications)

---

## EAS Build Commands

### Development Build
```bash
eas build --profile development --platform all
```

### Preview Build
```bash
eas build --profile preview --platform all
```

### Production Build
```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

### Submit to Stores
```bash
# iOS App Store
eas submit --platform ios

# Google Play
eas submit --platform android
```

---

## Pre-Submission Checklist

### Code
- [ ] All features tested on real devices
- [ ] No console.log in production
- [ ] Error handling complete
- [ ] Offline mode works

### Assets
- [ ] App icon (1024x1024)
- [ ] Splash screen
- [ ] Screenshots for all sizes
- [ ] Feature graphic (Android)

### Legal
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] EULA (if needed)

### In-App Purchases
- [ ] Products created in App Store Connect
- [ ] Products created in Google Play Console
- [ ] Sandbox testing complete

### Store Listings
- [ ] App description written
- [ ] Keywords optimized
- [ ] Category selected
- [ ] Contact information added
- [ ] Age rating completed
