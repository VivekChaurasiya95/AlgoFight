import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_SEO_MAP = {
  '/': {
    title: 'AlgoFight | 1v1 Real-Time Competitive Programming & Algorithmic Battle Arena',
    description: 'Compete in live 1v1 algorithmic duels, solve curated Data Structures & Algorithms (DSA) problems, climb global Elo leaderboards, and redeem Arena Points in the Rewards Vault.',
    keywords: 'competitive programming, 1v1 coding battle, algorithmic duels, real-time code duel, DSA practice, LeetCode alternative, Codeforces alternative, data structures and algorithms, coding interview prep, online judge, multiplayer coding game, Elo rating coding, AlgoFight',
    canonical: 'https://algofight.com/',
  },
  '/home': {
    title: 'AlgoFight Arena | Live Coding Battles & Algorithmic Competition',
    description: 'Join thousands of competitive programmers in real-time 1v1 code duels, fast-paced algorithm tournaments, and comprehensive DSA problem practice.',
    keywords: 'competitive coding, coding arena, live coding duel, DSA practice problems, programming competition, AlgoFight home',
    canonical: 'https://algofight.com/home',
  },
  '/practice': {
    title: 'Practice Algorithmic Problems | Data Structures & Algorithms (DSA) | AlgoFight',
    description: 'Solve hundreds of curated DSA problems across Arrays, Dynamic Programming, Graphs, Trees, Strings, and Greedy algorithms in Python, C++, and Java with an in-browser execution judge.',
    keywords: 'DSA practice questions, data structures and algorithms, online judge, coding practice, LeetCode practice alternative, algorithmic challenges, interview problem solving, AlgoFight practice',
    canonical: 'https://algofight.com/practice',
  },
  '/battle': {
    title: '1v1 Live Algorithmic Duels | Competitive Coding Matches | AlgoFight',
    description: 'Challenge developers worldwide or battle AlgoBot in real-time 1v1 coding duels. Solve test cases faster, maintain your streak, and earn Elo rating points.',
    keywords: '1v1 coding battle, live code duel, real-time multiplayer coding, head-to-head algorithm match, competitive programming battle, AlgoFight battle arena',
    canonical: 'https://algofight.com/battle',
  },
  '/leaderboard': {
    title: 'Global Competitive Coding Leaderboard & Elo Rankings | AlgoFight',
    description: 'Track the top algorithmic competitors worldwide. Explore live Elo ratings, win rates, rank tiers (Rookie to Supreme), and academic institution standings.',
    keywords: 'coding leaderboard, competitive programming ranking, Elo rating ladder, best competitive programmers, DSA leaderboards, AlgoFight rankings',
    canonical: 'https://algofight.com/leaderboard',
  },
  '/rewards': {
    title: 'Rewards Vault | Redeem Arena Points for Avatars, Frames & Themes | AlgoFight',
    description: 'Trade Arena Points earned from rated duels, practice problem solves, and daily streaks for exclusive cyber avatars, prestige frames, and custom HUD cockpit themes.',
    keywords: 'coding rewards, redeem arena points, coding collectibles, gamer avatars, programmer rewards vault, AlgoFight rewards',
    canonical: 'https://algofight.com/rewards',
  },
  '/profile': {
    title: 'Competitor Profile & Battle Statistics | AlgoFight',
    description: 'View personal coding achievements, Elo rating trajectory, daily problem streaks in IST, and claimed vault cosmetic collectibles.',
    keywords: 'coder profile, algorithmic rating trajectory, daily problem streak, competitive coding stats, AlgoFight profile',
    canonical: 'https://algofight.com/profile',
  },
  '/intel': {
    title: 'Cyber Intel & Algorithmic Engineering Insights | AlgoFight',
    description: 'Deep-dive articles on computer science algorithms, competitive programming strategies, optimization techniques, and technical interview guides.',
    keywords: 'computer science articles, algorithm tutorials, competitive programming tips, technical interview insights, AlgoFight intel',
    canonical: 'https://algofight.com/intel',
  },
  '/intel/events': {
    title: 'Competitive Coding Tournaments & Live Hackathons | AlgoFight',
    description: 'Discover upcoming algorithmic hackathons, collegiate tournaments, timed speed coding challenges, and prize events on AlgoFight.',
    keywords: 'coding tournaments, hackathons, collegiate programming contests, timed coding matches, algorithmic competitions',
    canonical: 'https://algofight.com/intel/events',
  },
  '/faculty': {
    title: 'Institutional Faculty Portal & Student Mentorship | AlgoFight',
    description: 'Academic dashboard for institutional faculty and mentors to oversee student coding cohorts, assignment submissions, curriculum quizzes, and test cases.',
    keywords: 'faculty coding portal, academic mentorship, student DSA tracking, curriculum quizzes, institutional coding education, MITS Gwalior faculty',
    canonical: 'https://algofight.com/faculty',
  },
  '/about': {
    title: 'About AlgoFight | The Next-Gen Real-Time Competitive Coding Arena',
    description: 'Learn about AlgoFight mission to gamify algorithmic mastery, bridge competitive programming with real-time esports duels, and empower global engineering talent.',
    keywords: 'about AlgoFight, competitive programming mission, algorithmic esports, software engineering talent',
    canonical: 'https://algofight.com/about',
  },
  '/blog': {
    title: 'AlgoFight Engineering Blog | System Architecture & Algorithms',
    description: 'Official engineering blog sharing updates on distributed code execution sandboxes, real-time WebSocket matchmakers, and algorithm tutorials.',
    keywords: 'engineering blog, distributed judge architecture, WebSocket coding platform, competitive coding tech blog',
    canonical: 'https://algofight.com/blog',
  },
  '/developer': {
    title: 'Developer Portal, API & Architecture | AlgoFight',
    description: 'Explore AlgoFight platform architecture, developer documentation, submission judge sandboxes, and open engineering telemetry.',
    keywords: 'developer documentation, online judge API, competitive programming sandbox, AlgoFight developer',
    canonical: 'https://algofight.com/developer',
  },
  '/help': {
    title: 'Help Center & Frequently Asked Questions (FAQ) | AlgoFight',
    description: 'Find answers about Arena Points, matchmaking rules, Elo rating calculations, supported compilers (Python, C++, Java), and profile settings.',
    keywords: 'AlgoFight help, competitive coding FAQ, Elo rating calculation, compiler support',
    canonical: 'https://algofight.com/help',
  },
  '/contact': {
    title: 'Contact AlgoFight | Support, Partnerships & Academic Inquiries',
    description: 'Get in touch with the AlgoFight team for platform feedback, enterprise campus integrations, collegiate contests, and developer support.',
    keywords: 'contact AlgoFight, campus coding integration, contest partnership, developer support',
    canonical: 'https://algofight.com/contact',
  },
  '/login': {
    title: 'Login to AlgoFight | Access Your Competitive Coding Arena',
    description: 'Sign in to your AlgoFight account to resume 1v1 battle duels, practice DSA questions, and climb the leaderboard.',
    keywords: 'AlgoFight login, competitive coding sign in, developer login',
    canonical: 'https://algofight.com/login',
  },
  '/signup': {
    title: 'Join AlgoFight | Free Competitive Coding & Live 1v1 Battles',
    description: 'Create your free AlgoFight account today. Challenge peers, solve algorithmic problems, and build your competitive coding portfolio.',
    keywords: 'create AlgoFight account, join coding arena, free competitive programming sign up',
    canonical: 'https://algofight.com/signup',
  },
};

function updateMetaTag(attribute, key, content) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function updateCanonicalTag(url) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', url);
}

export default function SEOManager() {
  const location = useLocation();

  useEffect(() => {
    try {
      const pathname = location.pathname || '/';

      // Match exact route or clean base path
      let seo = ROUTE_SEO_MAP[pathname];

      if (!seo) {
        if (pathname.startsWith('/practice/')) {
          seo = {
            title: 'Solve DSA Problem | Interactive Workspace | AlgoFight',
            description: 'Write, debug, and submit algorithm code in real-time with comprehensive test cases and automated judge verdicts on AlgoFight.',
            keywords: 'code problem workspace, online IDE, algorithm solution, automated test cases, AlgoFight practice workspace',
            canonical: `https://algofight.com${pathname}`,
          };
        } else if (pathname.startsWith('/battle/live')) {
          seo = {
            title: 'Live 1v1 Battle Arena | Real-Time Code Duel | AlgoFight',
            description: 'Active 1v1 real-time competitive programming duel. Race against your opponent to pass all test cases first.',
            keywords: 'live coding match, real-time code duel, 1v1 coding arena, AlgoFight live battle',
            canonical: `https://algofight.com${pathname}`,
          };
        } else if (pathname.startsWith('/intel/')) {
          seo = {
            title: 'Cyber Intel Article | AlgoFight',
            description: 'Algorithmic engineering knowledge, contest strategies, and data structure walkthroughs on AlgoFight.',
            keywords: 'computer science article, algorithm analysis, competitive programming strategies',
            canonical: `https://algofight.com${pathname}`,
          };
        } else if (pathname.startsWith('/profile/')) {
          seo = {
            title: 'Competitor Profile | AlgoFight',
            description: 'View competitor algorithmic statistics, duel ratings, and achievements on AlgoFight.',
            keywords: 'competitor profile, coding stats, Elo rating',
            canonical: `https://algofight.com${pathname}`,
          };
        } else {
          seo = ROUTE_SEO_MAP['/'];
        }
      }

      if (seo) {
        // Document Title
        document.title = seo.title;

        // Meta Tags
        updateMetaTag('name', 'description', seo.description);
        updateMetaTag('name', 'keywords', seo.keywords);
        updateCanonicalTag(seo.canonical);

        // Open Graph Tags
        updateMetaTag('property', 'og:title', seo.title);
        updateMetaTag('property', 'og:description', seo.description);
        updateMetaTag('property', 'og:url', seo.canonical);

        // Twitter Tags
        updateMetaTag('name', 'twitter:title', seo.title);
        updateMetaTag('name', 'twitter:description', seo.description);
      }
    } catch {
      // Safe fallback
    }
  }, [location.pathname]);

  return null;
}
