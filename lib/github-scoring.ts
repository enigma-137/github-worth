export interface GitHubUser {
  login: string
  avatar_url: string
  name: string | null
  bio: string | null
  public_repos: number
  followers: number
  following: number
  public_gists: number
  created_at: string
  html_url: string
}

export interface GitHubRepo {
  name: string
  stargazers_count: number
  forks_count: number
  language: string | null
  size: number
  updated_at: string
  archived: boolean
  fork: boolean
}

export interface PrivateStats {
  privateRepos: number
  privateContributions: number
  createdAt: string // To verify account age consistency
}

export interface ScoreBreakdown {
  followers: number
  stars: number
  activeRepos: number
  originalRepos: number
  accountAge: number
  languageDiversity: number
  privateActivity: number // New field
  bonuses: number
  penalties: number
}

export interface GitHubWorthResult {
  username: string
  avatarUrl: string
  name: string | null
  bio: string | null
  profileUrl: string
  hustleScore: number
  nairaValue: number
  affordabilityTier: AffordabilityTier
  message: string
  breakdown: ScoreBreakdown
  stats: {
    followers: number
    totalStars: number
    totalForks: number
    publicRepos: number
    originalRepos: number
    activeRepos: number
    languages: string[]
    accountAgeDays: number
    privateRepos?: number // New
    privateContributions?: number // New
  }
  isPrivateMode?: boolean
}

export interface AffordabilityTier {
  label: string
  emoji: string
  description: string
  minValue: number
  maxValue: number
}

const AFFORDABILITY_TIERS: AffordabilityTier[] = [
  {
    label: "Vibes & Data",
    emoji: "📱",
    description: "You don't code at all? Well this is enough for snacks, data bundles, and good vibes only",
    minValue: 0,
    maxValue: 50000,
  },
  {
    label: "Small Bills",
    emoji: "💸",
    description: "Can settle small bills, maybe a nice meal or two",
    minValue: 50000,
    maxValue: 200000,
  },
  {
    label: "Side Hustle Energy",
    emoji: "⚡",
    description: "Serious side hustle energy - gadgets and weekend trips",
    minValue: 200000,
    maxValue: 500000,
  },
  {
    label: "Tech Grind Territory",
    emoji: "🚀",
    description: "Tech grind territory - new laptop or phone upgrade",
    minValue: 500000,
    maxValue: 1000000,
  },
  {
    label: "Recruiter Bait",
    emoji: "👑",
    description: "Recruiter-bait level - they're definitely sliding into your DMs",
    minValue: 1000000,
    maxValue: Number.POSITIVE_INFINITY,
  },
]

const MOTIVATIONAL_MESSAGES = [
  "Your code speaks louder than your commits!",
  "Keep pushing, keep grinding, keep building!",
  "The tech streets recognize your hustle!",
  "From Yaba to the world, your code is fire!",
  "GitHub green squares looking healthy!",
  "Your repo game is strong!",
  "The commits don't lie - you're cooking!",
  "Stack Overflow fears you (in a good way)!",
  "Your GitHub is giving main character energy!",
  "The algorithm respects your grind!",
]

const LOW_SCORE_MESSAGES = [
  "Everyone starts somewhere - keep building!",
  "Your journey is just beginning!",
  "Time to ship more code and level up!",
  "The comeback is always greater than the setback!",
  "Start pushing those commits - you've got this!",
]

export function calculateHustleScore(
  user: GitHubUser,
  repos: GitHubRepo[],
  privateStats?: PrivateStats
): { score: number; breakdown: ScoreBreakdown } {
  const now = new Date()
  const createdAt = new Date(user.created_at)
  const accountAgeDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  const yearsOnGitHub = accountAgeDays / 365

  // Calculate repo stats
  const originalRepos = repos.filter((r) => !r.fork && !r.archived)
  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0)
  
  // Active repos (updated in last 90 days)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  const activeRepos = repos.filter((r) => new Date(r.updated_at) > ninetyDaysAgo && !r.archived)
  
  // Language diversity
  const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))]

  // Public Score Components
  const followerScore = Math.min(user.followers * 5, 2500) // Cap at 500 followers
  const starScore = Math.min(totalStars * 3, 3000) // Cap at 1000 stars
  
  // Public Active Repos: 4 points each
  const activeRepoScore = Math.min(activeRepos.length * 4, 300) 
  
  // Public Original Repos: 2 points each
  const originalRepoScore = Math.min(originalRepos.length * 2, 200) 
  
  const accountAgeScore = Math.min(yearsOnGitHub * 25, 250) // Increased weight for age
  const languageScore = Math.min(languages.length * 10, 100) 

  // Private Activity Score (Weighted 50%)
  let privateActivityScore = 0
  if (privateStats) {
      // Private repos worth 2 points each (vs 4 for public active)
      // We assume private repos are somewhat active if they exist in count, 
      // but without timestamps we can't be sure, so we lower the weight.
      const privateRepoPoints = Math.min(privateStats.privateRepos * 2, 400) // Max 200 private repos
      
      // Contributions: 0.1 point per contribution?
      // Typical active dev has ~1000-2000 contribs a year.
      // 1000 * 0.1 = 100 points.
      // Cap at 500 points.
      const contributionPoints = Math.min(privateStats.privateContributions * 0.2, 800)
      
      privateActivityScore = privateRepoPoints + contributionPoints
  }

  // Bonuses
  let bonuses = 0
  
  // Repo updated in last 30 days bonus (Public)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const recentlyActive = repos.some((r) => new Date(r.updated_at) > thirtyDaysAgo)
  if (recentlyActive) bonuses += 50
  
  // More than 3 languages bonus
  if (languages.length > 3) bonuses += 30
  
  // High follower to following ratio (organic growth)
  if (user.followers > user.following * 2 && user.followers > 10) bonuses += 40
  
  // Has bio (profile completeness)
  if (user.bio) bonuses += 20

  // Penalties
  let penalties = 0
  
  // No activity in 6+ months (only check public if private is not present)
  // If private stats exist and show contributions, ignore this penalty
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
  const hasRecentPublicActivity = repos.some((r) => new Date(r.updated_at) > sixMonthsAgo)
  const hasPrivateActivity = privateStats && privateStats.privateContributions > 10
  
  if (!hasRecentPublicActivity && !hasPrivateActivity && repos.length > 0) {
      penalties += 100
  }
  
  // Only forked repos
  if (originalRepos.length === 0 && repos.length > 0 && (!privateStats || privateStats.privateRepos === 0)) {
      penalties += 150
  }
  
  // Empty profile
  if (repos.length === 0 && (!privateStats || privateStats.privateRepos === 0)) {
      penalties += 200
  }

  const breakdown: ScoreBreakdown = {
    followers: followerScore,
    stars: starScore,
    activeRepos: activeRepoScore,
    originalRepos: originalRepoScore,
    accountAge: accountAgeScore,
    languageDiversity: languageScore,
    privateActivity: privateActivityScore,
    bonuses,
    penalties,
  }

  const totalScore = Math.max(
    0,
    followerScore +
      starScore +
      activeRepoScore +
      originalRepoScore +
      accountAgeScore +
      languageScore +
      privateActivityScore +
      bonuses -
      penalties
  )

  // Cap the score. Increase cap for private mode users potentially?
  // Let's keep a unified scale but maybe higher cap.
  // Old cap was 5000. Let's make it 10000 for power users.
  const cappedScore = Math.min(totalScore, 10000)

  return { score: cappedScore, breakdown }
}

export function scoreToNaira(score: number): number {
  // Inflation update: multiplier increased
  const rawValue = score * 2500 
  // Round to nearest 1000
  return Math.round(rawValue / 1000) * 1000
}

export function getAffordabilityTier(nairaValue: number): AffordabilityTier {
  for (const tier of AFFORDABILITY_TIERS) {
    if (nairaValue >= tier.minValue && nairaValue < tier.maxValue) {
      return tier
    }
  }
  return AFFORDABILITY_TIERS[AFFORDABILITY_TIERS.length - 1]
}

export function getMessage(score: number): string {
  if (score < 50) {
    return LOW_SCORE_MESSAGES[Math.floor(Math.random() * LOW_SCORE_MESSAGES.length)]
  }
  return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]
}

export function formatNaira(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
