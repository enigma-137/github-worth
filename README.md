# GitHub Worth Calculator 🚀

A fun and interactive web application that calculates the "worth" of your GitHub profile in Nigerian Naira (NGN). Discover your GitHub value based on your contributions, followers, stars, and other metrics!

![GitHub Worth Calculator](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## ✨ Features

- 🔍 **Real-time GitHub Profile Search** - Instantly search any public GitHub username
- 💰 **Intelligent Scoring Algorithm** - Comprehensive scoring based on:
  - Followers count
  - Total stars received
  - Number of active repositories
  - Original vs forked repositories
  - Account age
  - Programming language diversity
  - Bonus and penalty calculations

- 📊 **Detailed Score Breakdown** - See exactly how your GitHub score is calculated
- 🎨 **Beautiful Dark/Light Theme** - Toggle between dark and light modes
- 📱 **Fully Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 🔗 **Share Your Worth** - Share your GitHub worth on social media or copy to clipboard
- 🏷️ **Affordability Tiers** - Humorous categorization of your GitHub value with relevant descriptions

## 🎯 Affordability Tiers

Your calculated value falls into one of these fun categories:

- **📱 Vibes & Data** (₦0 - ₦50,000) - Snacks and good vibes
- **💸 Small Bills** (₦50,000 - ₦200,000) - Nice meals and utilities
- **🍽️ Medium Chops** (₦200,000 - ₦500,000) - Proper restaurant vibes
- **💎 Big Boy Energy** (₦500,000 - ₦1,000,000) - Luxury items
- **👑 Billionaire Status** (₦1,000,000+) - Your GitHub is worth serious money!

## 🛠️ Tech Stack

- **Framework**: [Next.js 16.0](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Form Management**: [React Hook Form](https://react-hook-form.com/)
- **Data Fetching**: [SWR](https://swr.vercel.app/)
- **Theme Support**: [Next Themes](https://github.com/pacocoursey/next-themes)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm/yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/github-worth-calculator.git
   cd github-worth-calculator
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Build for Production

```bash
pnpm build
pnpm start
```

## 📁 Project Structure

```
.
├── app/                          # Next.js app directory
│   ├── api/github-worth/         # API endpoint for GitHub calculations
│   │   └── route.ts
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── github-search-form.tsx    # Search input form
│   ├── github-worth-result.tsx   # Results display card
│   ├── theme-provider.tsx        # Theme context provider
│   ├── theme-toggle.tsx          # Dark/light mode toggle
│   └── ui/                       # Reusable UI components (Radix UI based)
│
├── lib/                          # Utility functions
│   ├── github-scoring.ts         # Core scoring algorithm
│   └── utils.ts                  # Helper utilities
│
├── hooks/                        # Custom React hooks
│   ├── use-mobile.ts             # Mobile detection hook
│   └── use-toast.ts              # Toast notification hook
│
├── public/                       # Static assets
├── styles/                       # Additional stylesheets
├── package.json                  # Project dependencies
└── tsconfig.json                 # TypeScript configuration
```

## 🔧 API Endpoint

### `/api/github-worth`

**Method**: GET

**Query Parameters**:
- `username` (string, required) - GitHub username to calculate worth for

**Response**:
```json
{
  "username": "octocat",
  "avatarUrl": "https://...",
  "name": "The Octocat",
  "hustleScore": 1250,
  "nairaValue": 312500,
  "affordabilityTier": {
    "label": "Small Bills",
    "emoji": "💸",
    "description": "Can settle small bills..."
  },
  "message": "You're a solid contributor!",
  "breakdown": {
    "followers": 100,
    "stars": 500,
    "activeRepos": 50,
    "originalRepos": 35,
    "accountAge": 200,
    "languageDiversity": 150,
    "bonuses": 50,
    "penalties": 0
  },
  "stats": {
    "followers": 100,
    "totalStars": 500,
    "totalForks": 250,
    "publicRepos": 50,
    "originalRepos": 35,
    "activeRepos": 40,
    "languages": ["JavaScript", "TypeScript", "Python"],
    "accountAgeDays": 2500
  }
}
```

## 📊 Scoring Algorithm

The GitHub Worth Calculator uses a sophisticated algorithm that considers:

1. **Followers** - Direct metric of community recognition
2. **Stars** - Quality and value of your repositories
3. **Active Repositories** - Repositories updated in the last 6 months
4. **Original Repositories** - Created vs forked repositories
5. **Account Age** - Years and months of GitHub presence
6. **Language Diversity** - Number of different programming languages used
7. **Bonuses** - Additional points for milestones (e.g., 100+ followers)
8. **Penalties** - Deductions for archived or inactive accounts

Each metric is converted to a Hustle Score (0-5000), which is then multiplied by ₦250 to get the final Naira value.

## 🎨 Customization

### Theme Colors

Modify the theme in `components/theme-provider.tsx` to change the color scheme:

```tsx
const THEMES = {
  light: {
    primary: "#YOUR_COLOR",
    // ...
  },
  dark: {
    // ...
  }
}
```

### Scoring Weights

Adjust scoring weights in `lib/github-scoring.ts`:

```typescript
const SCORING_WEIGHTS = {
  followersWeight: 10,
  starsWeight: 5,
  // ...
}
```

### Affordability Tiers

Add or modify affordability tiers in `lib/github-scoring.ts`:

```typescript
const AFFORDABILITY_TIERS: AffordabilityTier[] = [
  {
    label: "Your Tier",
    emoji: "🎉",
    description: "Description here",
    minValue: 0,
    maxValue: 50000,
  },
  // ...
]
```

## 📝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [GitHub API](https://docs.github.com/en/rest) for providing comprehensive GitHub data
- [Radix UI](https://www.radix-ui.com/) for beautiful, accessible components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- All contributors and users of this project

## 💬 Disclaimer

This application calculates "GitHub worth" for entertainment purposes only. The Naira values are **not** based on real market valuations or professional assessments. It's a fun way to celebrate your GitHub contributions!

## 📞 Contact

Have questions or suggestions? Feel free to reach out:

- 📧 Email: [rune.notstatic2gmaill.com]
- 🐦 Twitter: [@nigmaQx]

---

⭐ If you enjoy this project, please consider giving it a star! ⭐


