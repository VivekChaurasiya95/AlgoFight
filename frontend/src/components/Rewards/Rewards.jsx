import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBolt,
    faCheckCircle,
    faCircleInfo,
    faCode,
    faGift,
    faMedal,
    faRotate,
    faStopwatch,
    faFire,
    faLayerGroup,
    faChartPie,
    faPalette,
    faLock,
    faCheck,
    faShieldHalved,
    faUserCircle,
    faCrown,
    faGem,
    faCoins,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchUserProfile, requestJson } from '../../services/api';
import {
    calculateArenaPointBreakdown,
    getRankProgressByRating,
    normalizeUserStats,
    RANK_TIERS,
} from '../../utils/playerMetrics';
import {
    AVATARS,
    FRAMES,
    AVATAR_TIERS,
    FRAME_TIERS,
    getFrameById,
    getAvatarById,
} from '../../data/avatarConfig';
import RankEmblem from '../Common/gamification/RankEmblem';
import BackgroundPaths from '../BackgroundPaths/BackgroundPaths';
import '../BackgroundPaths/BackgroundPaths.css';
import Footer from '../Common/Footer/Footer';
import './Rewards.css';

// Exact theme catalog matching user specifications
const themeRewards = [
    {
        id: 'theme-regular',
        themeId: 'regular',
        themeName: 'Regular',
        isTheme: true,
        title: 'Regular HUD',
        tagline: 'Classic multi-accent arena & stadium ambiance',
        category: 'Free HUD',
        cost: 0,
        isFree: true,
        icon: faPalette,
        tone: 'cyan',
        swatches: ['#050811', '#00E5FF', '#8B5CF6'],
        accentColor: '#00E5FF',
    },
    {
        id: 'theme-light',
        themeId: 'light',
        themeName: 'Horizon Studio',
        isTheme: true,
        title: 'Horizon Studio',
        tagline: 'Futuristic high-key white tournament cockpit',
        category: 'Free HUD',
        cost: 0,
        isFree: true,
        icon: faPalette,
        tone: 'blue',
        swatches: ['#F8FAFC', '#2563EB', '#3B82F6'],
        accentColor: '#2563EB',
    },
    {
        id: 'theme-crimson',
        themeId: 'crimson',
        themeName: 'Overdrive Crimson Red',
        isTheme: true,
        title: 'Overdrive Crimson Red',
        tagline: 'High-intensity adrenaline battle red cockpit',
        category: '5,000 PTS Tier',
        cost: 5000,
        isFree: false,
        icon: faPalette,
        tone: 'pink',
        swatches: ['#120407', '#FF2A55', '#DC2626'],
        accentColor: '#FF2A55',
    },
    {
        id: 'theme-amethyst',
        themeId: 'amethyst',
        themeName: 'Synthwave Neon',
        isTheme: true,
        title: 'Synthwave Neon',
        tagline: 'Neon violet & ultraviolet retro synthwave dusk',
        category: '5,000 PTS Tier',
        cost: 5000,
        isFree: false,
        icon: faPalette,
        tone: 'purple',
        swatches: ['#0C061A', '#A855F7', '#7C3AED'],
        accentColor: '#A855F7',
    },
    {
        id: 'theme-original',
        themeId: 'original',
        themeName: 'Pulse Cyan',
        isTheme: true,
        title: 'Pulse Cyan',
        tagline: 'Kinetic electric cyan & cyber grid HUD',
        category: '8,000 PTS Tier',
        cost: 8000,
        isFree: false,
        icon: faPalette,
        tone: 'cyan',
        swatches: ['#040914', '#00F2FE', '#0284C7'],
        accentColor: '#00F2FE',
    },
    {
        id: 'theme-emerald',
        themeId: 'emerald',
        themeName: 'Terminal Emerald',
        isTheme: true,
        title: 'Terminal Emerald',
        tagline: 'Hacker console & quantum matrix green',
        category: '8,000 PTS Tier',
        cost: 8000,
        isFree: false,
        icon: faPalette,
        tone: 'teal',
        swatches: ['#02120C', '#00F5A0', '#059669'],
        accentColor: '#00F5A0',
    },
    {
        id: 'theme-custom',
        themeId: 'custom',
        themeName: 'Obsidian Black',
        isTheme: true,
        title: 'Obsidian Black',
        tagline: 'Monochromatic stealth cockpit & dark titanium',
        category: '10,000 PTS Tier',
        cost: 10000,
        isFree: false,
        icon: faPalette,
        tone: 'blue',
        swatches: ['#070809', '#1A1D25', '#E3E5ED'],
        accentColor: '#E3E5ED',
    },
    {
        id: 'theme-sunset',
        themeId: 'sunset',
        themeName: 'Solar Sunset',
        isTheme: true,
        title: 'Solar Sunset',
        tagline: 'Warm molten amber glow & solar twilight arena',
        category: '10,000 PTS Tier',
        cost: 10000,
        isFree: false,
        icon: faPalette,
        tone: 'orange',
        swatches: ['#160F08', '#F59E0B', '#D97706'],
        accentColor: '#F59E0B',
    },
];

const numberFormatter = new Intl.NumberFormat('en-US');

export default function Rewards() {
    const { user, loading: authLoading, updateAvatarAndFrame, refreshUser } = useAuth();
    const { notify } = useNotification();
    const {
        theme: currentTheme,
        setTheme,
        isThemeUnlocked,
        unlockTheme,
        previewTheme,
        clearPreviewTheme,
    } = useTheme();

    const [hoveredThemeId, setHoveredThemeId] = useState(null);
    const [profile, setProfile] = useState(null);
    const [weeklyStatus, setWeeklyStatus] = useState(null);
    const [historyTransactions, setHistoryTransactions] = useState([]);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [isRedeemingId, setIsRedeemingId] = useState(null);
    const [spentPoints, setSpentPoints] = useState(0);

    // Active Vault Navigation Tab
    const [activeVaultTab, setActiveVaultTab] = useState('avatars'); // 'avatars' | 'frames' | 'themes' | 'all'

    // Subcategory Filters
    const [avatarCategoryFilter, setAvatarCategoryFilter] = useState('All');
    const [frameCategoryFilter, setFrameCategoryFilter] = useState('All');
    const [themeCategoryFilter, setThemeCategoryFilter] = useState('All');

    // Admin Detection
    const isAdmin = Boolean(
        user?.role === 'ADMIN' ||
        user?.userType === 'ADMIN' ||
        profile?.role === 'ADMIN' ||
        profile?.userType === 'ADMIN'
    );

    // Local Unlocked Sets (persisted to localStorage as backup cache)
    const [localUnlockedAvatars, setLocalUnlockedAvatars] = useState(() => {
        try {
            const saved = localStorage.getItem('algofight_unlocked_avatars');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [localUnlockedFrames, setLocalUnlockedFrames] = useState(() => {
        try {
            const saved = localStorage.getItem('algofight_unlocked_frames');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [localUnlockedThemes, setLocalUnlockedThemes] = useState(() => {
        try {
            const saved = localStorage.getItem('algofight_unlocked_themes');
            return saved ? JSON.parse(saved) : ['regular', 'light'];
        } catch {
            return ['regular', 'light'];
        }
    });

    const loadWeeklyAndHistory = async () => {
        try {
            const wStatus = await requestJson('/api/rewards/weekly-status', { includeAuth: true });
            if (wStatus) setWeeklyStatus(wStatus);
        } catch {}

        try {
            const hData = await requestJson('/api/rewards/history?limit=10', { includeAuth: true });
            if (hData && Array.isArray(hData.transactions)) {
                setHistoryTransactions(hData.transactions);
            }
        } catch {}
    };

    useEffect(() => {
        let active = true;

        const loadProfile = async () => {
            if (!user?.uid) {
                setProfile(null);
                setIsLoadingProfile(false);
                return;
            }

            setIsLoadingProfile(true);
            setProfileError('');

            try {
                const data = await fetchUserProfile(user.uid);
                if (!active) return;
                setProfile(data || null);

                // Synchronize unlocked inventories from backend profile
                if (data?.unlockedAvatars && Array.isArray(data.unlockedAvatars)) {
                    setLocalUnlockedAvatars((prev) => {
                        const merged = Array.from(new Set([...prev, ...data.unlockedAvatars]));
                        try {
                            localStorage.setItem('algofight_unlocked_avatars', JSON.stringify(merged));
                        } catch {}
                        return merged;
                    });
                }
                if (data?.unlockedFrames && Array.isArray(data.unlockedFrames)) {
                    setLocalUnlockedFrames((prev) => {
                        const merged = Array.from(new Set([...prev, ...data.unlockedFrames]));
                        try {
                            localStorage.setItem('algofight_unlocked_frames', JSON.stringify(merged));
                        } catch {}
                        return merged;
                    });
                }
                if (data?.unlockedThemes && Array.isArray(data.unlockedThemes)) {
                    setLocalUnlockedThemes((prev) => {
                        const merged = Array.from(new Set([...prev, ...data.unlockedThemes]));
                        try {
                            localStorage.setItem('algofight_unlocked_themes', JSON.stringify(merged));
                        } catch {}
                        return merged;
                    });
                }

                loadWeeklyAndHistory();
            } catch {
                if (!active) return;
                setProfileError('Could not sync reward metrics. Showing computed defaults.');
                setProfile(null);
            } finally {
                if (active) setIsLoadingProfile(false);
            }
        };

        loadProfile();

        return () => {
            active = false;
        };
    }, [user?.uid]);

    const stats = useMemo(() => normalizeUserStats(profile || {}), [profile]);
    const pointBreakdown = useMemo(
        () =>
            calculateArenaPointBreakdown({
                rating: stats.rating,
                matchesWon: stats.matchesWon,
                matchesPlayed: stats.matchesPlayed,
                practiceSolved: stats.practiceSolved,
            }),
        [stats.rating, stats.matchesWon, stats.matchesPlayed, stats.practiceSolved]
    );

    // Live points balance after any redemptions in current session
    const arenaPoints = Math.max(0, (profile?.arenaPoints ?? pointBreakdown.total) - spentPoints);

    const {
        currentTier,
        nextTier,
        currentTierIndex,
        progressToNext,
        ratingToNextTier,
    } = getRankProgressByRating(stats.rating);

    // Equipped Appearance
    const equippedPhotoURL = profile?.photoURL || user?.photoURL || '';
    const equippedFrameId = profile?.avatarFrame || user?.avatarFrame || 'none';

    // Helper: is avatar unlocked
    const checkAvatarUnlocked = (av) => {
        if (isAdmin) return true;
        const allUnlocked = [
            ...(profile?.unlockedAvatars || []),
            ...(user?.unlockedAvatars || []),
            ...localUnlockedAvatars,
        ];
        return allUnlocked.includes(av.id) || allUnlocked.includes(av.url);
    };

    // Helper: is frame unlocked
    const checkFrameUnlocked = (fr) => {
        if (fr.id === 'none') return true;
        if (isAdmin) return true;
        const allUnlocked = [
            ...(profile?.unlockedFrames || []),
            ...(user?.unlockedFrames || []),
            ...localUnlockedFrames,
        ];
        return allUnlocked.includes(fr.id) || allUnlocked.includes(fr.url);
    };

    // Helper: is theme unlocked
    const checkThemeUnlocked = (th) => {
        if (isAdmin) return true;
        if (th.isFree || th.cost === 0) return true;
        if (isThemeUnlocked && isThemeUnlocked(th.themeId)) return true;
        const allUnlocked = [
            ...(profile?.unlockedThemes || []),
            ...(user?.unlockedThemes || []),
            ...localUnlockedThemes,
        ];
        return allUnlocked.includes(th.themeId) || allUnlocked.includes(th.id);
    };

    // Claim / Buy Avatar
    const handleClaimAvatar = async (av) => {
        if (checkAvatarUnlocked(av)) {
            // Already unlocked -> Equip immediately
            await handleEquipAvatar(av);
            return;
        }

        const cost = isAdmin ? 0 : av.cost;
        if (!isAdmin && arenaPoints < cost) {
            notify({
                type: 'error',
                title: 'Insufficient Arena Points',
                message: `You need ${numberFormatter.format(cost - arenaPoints)} more points to claim "${av.name}".`,
                duration: 4000,
            });
            return;
        }

        try {
            setIsRedeemingId(av.id);
            const res = await requestJson('/api/rewards/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cost,
                    rewardTitle: av.name,
                    itemType: 'avatar',
                    itemId: av.id,
                }),
                includeAuth: true,
            });

            // Update local unlocks
            const nextUnlocked = Array.from(new Set([...localUnlockedAvatars, av.id, av.url]));
            setLocalUnlockedAvatars(nextUnlocked);
            try {
                localStorage.setItem('algofight_unlocked_avatars', JSON.stringify(nextUnlocked));
            } catch {}

            if (!isAdmin) {
                setSpentPoints((prev) => prev + cost);
            }

            notify({
                type: 'success',
                title: 'Avatar Unlocked! 🎮',
                message: `"${av.name}" has been permanently acquired to your profile! Click Equip to set it now.`,
                duration: 4000,
            });

            // Auto reload history and profile in background
            loadWeeklyAndHistory();
            if (refreshUser) refreshUser();
        } catch (err) {
            notify({
                type: 'error',
                title: 'Claim Failed',
                message: err.message || 'Could not claim avatar. Please try again.',
                duration: 4000,
            });
        } finally {
            setIsRedeemingId(null);
        }
    };

    // Equip Avatar
    const handleEquipAvatar = async (av) => {
        try {
            setIsRedeemingId(av.id);
            if (updateAvatarAndFrame) {
                await updateAvatarAndFrame({
                    photoURL: av.url,
                    avatarFrame: equippedFrameId === 'none' ? '' : equippedFrameId,
                });
            }
            setProfile((prev) => ({
                ...(prev || {}),
                photoURL: av.url,
            }));
            notify({
                type: 'success',
                title: 'Avatar Equipped! ⚡',
                message: `"${av.name}" is now your active battle identity!`,
                duration: 3500,
            });
        } catch (err) {
            notify({
                type: 'error',
                title: 'Equip Failed',
                message: err.message || 'Could not equip avatar.',
                duration: 3500,
            });
        } finally {
            setIsRedeemingId(null);
        }
    };

    // Claim / Buy Frame
    const handleClaimFrame = async (fr) => {
        if (checkFrameUnlocked(fr)) {
            // Already unlocked -> Equip immediately
            await handleEquipFrame(fr);
            return;
        }

        const cost = isAdmin ? 0 : fr.cost;
        if (!isAdmin && arenaPoints < cost) {
            notify({
                type: 'error',
                title: 'Insufficient Arena Points',
                message: `You need ${numberFormatter.format(cost - arenaPoints)} more points to claim "${fr.name}".`,
                duration: 4000,
            });
            return;
        }

        try {
            setIsRedeemingId(fr.id);
            const res = await requestJson('/api/rewards/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cost,
                    rewardTitle: fr.name,
                    itemType: 'frame',
                    itemId: fr.id,
                }),
                includeAuth: true,
            });

            // Update local unlocks
            const nextUnlocked = Array.from(new Set([...localUnlockedFrames, fr.id, fr.url]));
            setLocalUnlockedFrames(nextUnlocked);
            try {
                localStorage.setItem('algofight_unlocked_frames', JSON.stringify(nextUnlocked));
            } catch {}

            if (!isAdmin) {
                setSpentPoints((prev) => prev + cost);
            }

            notify({
                type: 'success',
                title: 'Frame Unlocked! 🛡️',
                message: `"${fr.name}" has been permanently acquired to your profile! Click Equip to set it now.`,
                duration: 4000,
            });

            loadWeeklyAndHistory();
            if (refreshUser) refreshUser();
        } catch (err) {
            notify({
                type: 'error',
                title: 'Claim Failed',
                message: err.message || 'Could not claim frame. Please try again.',
                duration: 4000,
            });
        } finally {
            setIsRedeemingId(null);
        }
    };

    // Equip Frame
    const handleEquipFrame = async (fr) => {
        try {
            setIsRedeemingId(fr.id);
            const newFrameVal = fr.id === 'none' ? '' : fr.id;
            if (updateAvatarAndFrame) {
                await updateAvatarAndFrame({
                    photoURL: equippedPhotoURL || '/avatars/avatar_1.png',
                    avatarFrame: newFrameVal,
                });
            }
            setProfile((prev) => ({
                ...(prev || {}),
                avatarFrame: newFrameVal,
            }));
            notify({
                type: 'success',
                title: 'Frame Equipped! ⚡',
                message: `"${fr.name}" halo is now active around your avatar!`,
                duration: 3500,
            });
        } catch (err) {
            notify({
                type: 'error',
                title: 'Equip Failed',
                message: err.message || 'Could not equip frame.',
                duration: 3500,
            });
        } finally {
            setIsRedeemingId(null);
        }
    };

    // Theme hover preview
    const handleThemeHoverEnter = (th) => {
        setHoveredThemeId(th.themeId);
        if (previewTheme) {
            previewTheme(th.themeId);
        }
    };

    const handleThemeHoverLeave = () => {
        setHoveredThemeId(null);
        if (clearPreviewTheme) {
            clearPreviewTheme();
        }
    };

    // Theme Click (Equip or Buy)
    const handleThemeClick = async (th) => {
        const unlocked = checkThemeUnlocked(th);

        if (unlocked) {
            setTheme(th.themeId, false);
            notify({
                type: 'success',
                title: 'Theme Applied! ⚡',
                message: `${th.title} is now your active arena cockpit visual.`,
                duration: 3500,
            });
            return;
        }

        const cost = isAdmin ? 0 : th.cost;
        if (!isAdmin && arenaPoints < cost) {
            notify({
                type: 'error',
                title: '🔒 Theme Not Unlocked!',
                message: `${th.title} is locked! You need ${numberFormatter.format(cost - arenaPoints)} more Arena Points to unlock it (${numberFormatter.format(th.cost)} PTS total).`,
                duration: 4500,
            });
            return;
        }

        try {
            setIsRedeemingId(th.themeId);
            await requestJson('/api/rewards/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cost,
                    rewardTitle: th.title,
                    itemType: 'theme',
                    itemId: th.themeId,
                }),
                includeAuth: true,
            });

            // Unlock in ThemeContext
            if (unlockTheme) unlockTheme(th.themeId);

            const nextUnlocked = Array.from(new Set([...localUnlockedThemes, th.themeId]));
            setLocalUnlockedThemes(nextUnlocked);
            try {
                localStorage.setItem('algofight_unlocked_themes', JSON.stringify(nextUnlocked));
            } catch {}

            if (!isAdmin) {
                setSpentPoints((prev) => prev + cost);
            }

            setTheme(th.themeId, false);

            notify({
                type: 'success',
                title: 'Theme Unlocked & Applied! 🎨',
                message: `${th.title} has been unlocked permanently and set as your active HUD.`,
                duration: 4000,
            });

            loadWeeklyAndHistory();
            if (refreshUser) refreshUser();
        } catch (err) {
            notify({
                type: 'error',
                title: 'Theme Unlock Failed',
                message: err.message || 'Could not unlock theme.',
                duration: 4000,
            });
        } finally {
            setIsRedeemingId(null);
        }
    };

    // Filtered lists
    const filteredAvatars = useMemo(() => {
        if (avatarCategoryFilter === 'All') return AVATARS;
        return AVATARS.filter((av) => av.category === avatarCategoryFilter);
    }, [avatarCategoryFilter]);

    const filteredFrames = useMemo(() => {
        if (frameCategoryFilter === 'All') return FRAMES;
        return FRAMES.filter((fr) => fr.category === frameCategoryFilter);
    }, [frameCategoryFilter]);

    const filteredThemes = useMemo(() => {
        if (themeCategoryFilter === 'All') return themeRewards;
        if (themeCategoryFilter === 'Free') return themeRewards.filter((t) => t.isFree);
        if (themeCategoryFilter === '5000') return themeRewards.filter((t) => t.cost === 5000);
        if (themeCategoryFilter === '8000') return themeRewards.filter((t) => t.cost === 8000);
        if (themeCategoryFilter === '10000') return themeRewards.filter((t) => t.cost === 10000);
        return themeRewards;
    }, [themeCategoryFilter]);

    // Breakdown rows
    const pointSourceRows = useMemo(
        () => [
            { label: 'Rating contribution', value: pointBreakdown.ratingPoints, icon: faMedal, color: '#ffd500' },
            { label: 'Battle wins contribution', value: pointBreakdown.battleWinPoints, icon: faBolt, color: '#00e5ff' },
            { label: 'Speed & Efficiency bonus', value: pointBreakdown.speedEfficiencyPoints, icon: faStopwatch, color: '#ff2a7a' },
            { label: 'Practice solved contribution', value: pointBreakdown.practiceSolvedPoints, icon: faCode, color: '#c084fc' },
            { label: 'Participation contribution', value: pointBreakdown.participationPoints, icon: faRotate, color: '#38bdf8' },
        ],
        [pointBreakdown]
    );

    // Unlocked totals
    const totalUnlockedAvatars = AVATARS.filter((a) => checkAvatarUnlocked(a)).length;
    const totalUnlockedFrames = FRAMES.filter((f) => checkFrameUnlocked(f)).length;
    const totalUnlockedThemes = themeRewards.filter((t) => checkThemeUnlocked(t)).length;
    const totalItemsUnlocked = totalUnlockedAvatars + totalUnlockedFrames + totalUnlockedThemes;

    if (authLoading || isLoadingProfile) {
        return (
            <BackgroundPaths>
                <div className="rewards-page">
                    <div className="rewards-loading-container">
                        <div className="rewards-spinner" />
                        <p>Syncing vault & reward metrics...</p>
                    </div>
                </div>
                <Footer />
            </BackgroundPaths>
        );
    }

    return (
        <BackgroundPaths>
            <div className="rewards-page">
                {/* Hero Header */}
                <motion.section
                    className="rewards-hero-header"
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="rewards-hero-kicker-row">
                        <span className="rewards-hero-kicker">
                            <FontAwesomeIcon icon={faCoins} /> ARENA REWARDS VAULT
                        </span>
                        {isAdmin && (
                            <span className="rewards-admin-tag">
                                <FontAwesomeIcon icon={faCrown} /> ADMIN PRIVILEGE UNLOCKED · ALL FREE
                            </span>
                        )}
                    </div>

                    <h1 className="rewards-hero-title">
                        CLAIM AVATARS, FRAMES & <span className="word-glow-cyan">CYBER HUD THEMES</span>
                    </h1>

                    <p className="rewards-hero-desc">
                        Spend your earned Arena Points and Coins on exclusive gaming avatars, glowing prestige frames, and custom battle HUDs. Acquired items are permanently added to your profile inventory and can be equipped anytime.
                    </p>

                    {profileError ? (
                        <div className="rewards-warning-banner">
                            <FontAwesomeIcon icon={faCircleInfo} />
                            <span>{profileError}</span>
                        </div>
                    ) : null}
                </motion.section>

                {/* KPI Metrics Dashboard Grid */}
                <motion.section
                    className="rewards-kpi-grid"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {/* Card 1: Arena Points Balance */}
                    <article className="dash-card rewards-dash-kpi">
                        <div className="dash-card-header">
                            <div className="dash-card-title-group">
                                <div className="dash-icon-box icon-cyan">
                                    <FontAwesomeIcon icon={faBolt} />
                                </div>
                                <span className="dash-card-title">Arena Points</span>
                            </div>
                            <span className="dash-pill-tag tag-cyan">BALANCE</span>
                        </div>
                        <div className="dash-stat-big stat-cyan">
                            {numberFormatter.format(arenaPoints)}
                        </div>
                        <div className="kpi-subtext">
                            Available coins to claim avatars & frames
                        </div>
                    </article>

                    {/* Card 2: Current Rating Tier */}
                    <article className="dash-card rewards-dash-kpi">
                        <div className="dash-card-header">
                            <div className="dash-card-title-group">
                                <div className="dash-icon-box icon-trophy">
                                    <FontAwesomeIcon icon={faMedal} />
                                </div>
                                <span className="dash-card-title">Rating Tier</span>
                            </div>
                            <span className="dash-pill-tag tag-gold">ACTIVE</span>
                        </div>
                        <div className="dash-stat-big kpi-rank-stat">
                            <RankEmblem rating={stats.rating} size={28} glow={false} />
                            <span>{currentTier.label}</span>
                        </div>
                        <div className="kpi-subtext">
                            {ratingToNextTier > 0
                                ? `${ratingToNextTier} rating to reach ${nextTier.label}`
                                : 'Top Grandmaster Tier Unlocked'}
                        </div>
                    </article>

                    {/* Card 3: Efficiency Surge */}
                    <article className="dash-card rewards-dash-kpi">
                        <div className="dash-card-header">
                            <div className="dash-card-title-group">
                                <div className="dash-icon-box icon-pink">
                                    <FontAwesomeIcon icon={faFire} />
                                </div>
                                <span className="dash-card-title">Efficiency Surge</span>
                            </div>
                            <span className="dash-pill-tag tag-pink">SPEED BONUS</span>
                        </div>
                        <div className="dash-stat-big stat-pink">
                            +{numberFormatter.format(pointBreakdown.speedEfficiencyPoints)}
                        </div>
                        <div className="kpi-subtext">
                            Earned from rapid & clean execution
                        </div>
                    </article>

                    {/* Card 4: Items Acquired */}
                    <article className="dash-card rewards-dash-kpi">
                        <div className="dash-card-header">
                            <div className="dash-card-title-group">
                                <div className="dash-icon-box icon-purple">
                                    <FontAwesomeIcon icon={faGift} />
                                </div>
                                <span className="dash-card-title">Vault Inventory</span>
                            </div>
                            <span className="dash-pill-tag tag-purple">ACQUIRED</span>
                        </div>
                        <div className="dash-stat-big stat-purple">
                            {totalItemsUnlocked}
                        </div>
                        <div className="kpi-subtext">
                            {totalUnlockedAvatars} Avatars · {totalUnlockedFrames} Frames · {totalUnlockedThemes} Themes
                        </div>
                    </article>
                </motion.section>

                {/* Main Content Layout */}
                <div className="rewards-layout">
                    {/* Left Main Vault Column */}
                    <motion.section
                        className="dash-card rewards-main-panel"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {/* Top Vault Tabs Navigation */}
                        <div className="vault-nav-tabs">
                            <button
                                type="button"
                                className={`vault-tab-btn ${activeVaultTab === 'avatars' ? 'is-active' : ''}`}
                                onClick={() => setActiveVaultTab('avatars')}
                            >
                                <FontAwesomeIcon icon={faUserCircle} />
                                <span>Avatars Vault</span>
                                <span className="vault-tab-count">{AVATARS.length}</span>
                            </button>
                            <button
                                type="button"
                                className={`vault-tab-btn ${activeVaultTab === 'frames' ? 'is-active' : ''}`}
                                onClick={() => setActiveVaultTab('frames')}
                            >
                                <FontAwesomeIcon icon={faShieldHalved} />
                                <span>Frames Vault</span>
                                <span className="vault-tab-count">{FRAMES.length}</span>
                            </button>
                            <button
                                type="button"
                                className={`vault-tab-btn ${activeVaultTab === 'themes' ? 'is-active' : ''}`}
                                onClick={() => setActiveVaultTab('themes')}
                            >
                                <FontAwesomeIcon icon={faPalette} />
                                <span>HUD Themes</span>
                                <span className="vault-tab-count">{themeRewards.length}</span>
                            </button>
                            <button
                                type="button"
                                className={`vault-tab-btn ${activeVaultTab === 'all' ? 'is-active' : ''}`}
                                onClick={() => setActiveVaultTab('all')}
                            >
                                <FontAwesomeIcon icon={faLayerGroup} />
                                <span>All Vaults</span>
                            </button>
                        </div>

                        {/* ================= SECTION 1: AVATARS VAULT ================= */}
                        {(activeVaultTab === 'avatars' || activeVaultTab === 'all') && (
                            <div className="vault-section-wrapper">
                                <div className="vault-section-header">
                                    <div className="vault-section-title-wrap">
                                        <div className="dash-icon-box icon-cyan">
                                            <FontAwesomeIcon icon={faUserCircle} />
                                        </div>
                                        <div>
                                            <h2 className="vault-section-title">Avatars Vault</h2>
                                            <p className="vault-section-subtitle">
                                                3 Gaming Categories · Recruit Protocol (200 PTS), Vanguard Syndicate (500 PTS) & Apex Mythic (1,000 PTS).
                                            </p>
                                        </div>
                                    </div>

                                    {/* Category Sub-Filters */}
                                    <div className="vault-filter-pills">
                                        <button
                                            type="button"
                                            className={`category-pill ${avatarCategoryFilter === 'All' ? 'is-active' : ''}`}
                                            onClick={() => setAvatarCategoryFilter('All')}
                                        >
                                            All ({AVATARS.length})
                                        </button>
                                        <button
                                            type="button"
                                            className={`category-pill ${avatarCategoryFilter === 'Recruit Protocol' ? 'is-active' : ''}`}
                                            onClick={() => setAvatarCategoryFilter('Recruit Protocol')}
                                        >
                                            Recruit Protocol · 200 PTS
                                        </button>
                                        <button
                                            type="button"
                                            className={`category-pill ${avatarCategoryFilter === 'Vanguard Syndicate' ? 'is-active' : ''}`}
                                            onClick={() => setAvatarCategoryFilter('Vanguard Syndicate')}
                                        >
                                            Vanguard Syndicate · 500 PTS
                                        </button>
                                        <button
                                            type="button"
                                            className={`category-pill ${avatarCategoryFilter === 'Apex Mythic' ? 'is-active' : ''}`}
                                            onClick={() => setAvatarCategoryFilter('Apex Mythic')}
                                        >
                                            Apex Mythic · 1,000 PTS
                                        </button>
                                    </div>
                                </div>

                                {/* Avatars Grid */}
                                <div className="rewards-items-grid avatars-rewards-grid">
                                    {filteredAvatars.map((av) => {
                                        const isUnlocked = checkAvatarUnlocked(av);
                                        const isEquipped = equippedPhotoURL === av.url;
                                        const canAfford = isAdmin || arenaPoints >= av.cost;
                                        const isProcessing = isRedeemingId === av.id;

                                        return (
                                            <article
                                                key={av.id}
                                                className={`reward-item-card avatar-reward-card ${isEquipped ? 'is-equipped' : ''} ${isUnlocked ? 'is-unlocked' : 'is-locked'}`}
                                            >
                                                <div className="item-card-top-bar">
                                                    <span className={`item-tier-badge tier-${av.categoryTier}`}>
                                                        {av.category}
                                                    </span>
                                                    <div className="item-cost-chip">
                                                        {isAdmin ? (
                                                            <span className="admin-chip">FREE</span>
                                                        ) : (
                                                            <>
                                                                <FontAwesomeIcon icon={faCoins} className="cost-coin-icon" />
                                                                <span>{numberFormatter.format(av.cost)} PTS</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Visual Preview */}
                                                <div className="avatar-preview-card-wrap">
                                                    <div className="avatar-thumb-halo">
                                                        <img
                                                            src={av.url}
                                                            alt={av.name}
                                                            className="avatar-thumb-img"
                                                            loading="lazy"
                                                        />
                                                        {!isUnlocked && (
                                                            <div className="locked-card-overlay">
                                                                <FontAwesomeIcon icon={faLock} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <h3 className="item-card-name">{av.name}</h3>
                                                <div className="item-status-row">
                                                    {isEquipped ? (
                                                        <span className="status-label equipped">
                                                            <FontAwesomeIcon icon={faCheck} /> Currently Equipped
                                                        </span>
                                                    ) : isUnlocked ? (
                                                        <span className="status-label unlocked">
                                                            <FontAwesomeIcon icon={faCheckCircle} /> In Profile Vault
                                                        </span>
                                                    ) : (
                                                        <span className="status-label locked">
                                                            <FontAwesomeIcon icon={faLock} /> {isAdmin ? 'Admin Free Pass' : `Requires ${numberFormatter.format(av.cost)} PTS`}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Action Button */}
                                                <button
                                                    type="button"
                                                    className={`item-action-btn ${isEquipped ? 'btn-equipped' : isUnlocked ? 'btn-equip' : canAfford ? 'btn-claim' : 'btn-disabled'}`}
                                                    disabled={isEquipped || isProcessing || (!isUnlocked && !canAfford)}
                                                    onClick={() => (isUnlocked ? handleEquipAvatar(av) : handleClaimAvatar(av))}
                                                >
                                                    {isProcessing ? (
                                                        <span className="btn-spinner" />
                                                    ) : isEquipped ? (
                                                        <>Equipped ✓</>
                                                    ) : isUnlocked ? (
                                                        <>Equip Avatar ⚡</>
                                                    ) : canAfford ? (
                                                        <>Claim {isAdmin ? 'Free' : `(${numberFormatter.format(av.cost)} PTS)`}</>
                                                    ) : (
                                                        <>Need {numberFormatter.format(av.cost - arenaPoints)} PTS</>
                                                    )}
                                                </button>
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ================= SECTION 2: FRAMES VAULT ================= */}
                        {(activeVaultTab === 'frames' || activeVaultTab === 'all') && (
                            <div className="vault-section-wrapper">
                                <div className="vault-section-header">
                                    <div className="vault-section-title-wrap">
                                        <div className="dash-icon-box icon-purple">
                                            <FontAwesomeIcon icon={faShieldHalved} />
                                        </div>
                                        <div>
                                            <h2 className="vault-section-title">Frames Vault</h2>
                                            <p className="vault-section-subtitle">
                                                3 Gaming Halos · Neon Edge (500 PTS), Quantum Surge (1,000 PTS) & Cosmic Singularity (2,000 PTS).
                                            </p>
                                        </div>
                                    </div>

                                    {/* Sub-Filters */}
                                    <div className="vault-filter-pills">
                                        <button
                                            type="button"
                                            className={`category-pill ${frameCategoryFilter === 'All' ? 'is-active' : ''}`}
                                            onClick={() => setFrameCategoryFilter('All')}
                                        >
                                            All ({FRAMES.length})
                                        </button>
                                        <button
                                            type="button"
                                            className={`category-pill ${frameCategoryFilter === 'Neon Edge' ? 'is-active' : ''}`}
                                            onClick={() => setFrameCategoryFilter('Neon Edge')}
                                        >
                                            Neon Edge · 500 PTS
                                        </button>
                                        <button
                                            type="button"
                                            className={`category-pill ${frameCategoryFilter === 'Quantum Surge' ? 'is-active' : ''}`}
                                            onClick={() => setFrameCategoryFilter('Quantum Surge')}
                                        >
                                            Quantum Surge · 1,000 PTS
                                        </button>
                                        <button
                                            type="button"
                                            className={`category-pill ${frameCategoryFilter === 'Cosmic Singularity' ? 'is-active' : ''}`}
                                            onClick={() => setFrameCategoryFilter('Cosmic Singularity')}
                                        >
                                            Cosmic Singularity · 2,000 PTS
                                        </button>
                                    </div>
                                </div>

                                {/* Frames Grid */}
                                <div className="rewards-items-grid frames-rewards-grid">
                                    {filteredFrames.map((fr) => {
                                        const isUnlocked = checkFrameUnlocked(fr);
                                        const isEquipped = (equippedFrameId === fr.id || equippedFrameId === fr.url);
                                        const canAfford = isAdmin || arenaPoints >= fr.cost;
                                        const isProcessing = isRedeemingId === fr.id;

                                        return (
                                            <article
                                                key={fr.id}
                                                className={`reward-item-card frame-reward-card ${isEquipped ? 'is-equipped' : ''} ${isUnlocked ? 'is-unlocked' : 'is-locked'}`}
                                                style={{ '--frame-glow-color': fr.glowColor }}
                                            >
                                                <div className="item-card-top-bar">
                                                    <span className={`item-tier-badge tier-${fr.categoryTier}`}>
                                                        {fr.category}
                                                    </span>
                                                    <div className="item-cost-chip">
                                                        {isAdmin ? (
                                                            <span className="admin-chip">FREE</span>
                                                        ) : (
                                                            <>
                                                                <FontAwesomeIcon icon={faCoins} className="cost-coin-icon" />
                                                                <span>{numberFormatter.format(fr.cost)} PTS</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Visual Preview */}
                                                <div className="frame-preview-card-wrap">
                                                    <div className="frame-thumb-showcase">
                                                        <img
                                                            src={fr.url}
                                                            alt={fr.name}
                                                            className="frame-thumb-img"
                                                            loading="lazy"
                                                        />
                                                        {!isUnlocked && (
                                                            <div className="locked-card-overlay">
                                                                <FontAwesomeIcon icon={faLock} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <h3 className="item-card-name">{fr.name}</h3>
                                                <div className="item-status-row">
                                                    {isEquipped ? (
                                                        <span className="status-label equipped">
                                                            <FontAwesomeIcon icon={faCheck} /> Currently Equipped
                                                        </span>
                                                    ) : isUnlocked ? (
                                                        <span className="status-label unlocked">
                                                            <FontAwesomeIcon icon={faCheckCircle} /> In Profile Vault
                                                        </span>
                                                    ) : (
                                                        <span className="status-label locked">
                                                            <FontAwesomeIcon icon={faLock} /> {isAdmin ? 'Admin Free Pass' : `Requires ${numberFormatter.format(fr.cost)} PTS`}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Action Button */}
                                                <button
                                                    type="button"
                                                    className={`item-action-btn ${isEquipped ? 'btn-equipped' : isUnlocked ? 'btn-equip' : canAfford ? 'btn-claim' : 'btn-disabled'}`}
                                                    disabled={isEquipped || isProcessing || (!isUnlocked && !canAfford)}
                                                    onClick={() => (isUnlocked ? handleEquipFrame(fr) : handleClaimFrame(fr))}
                                                >
                                                    {isProcessing ? (
                                                        <span className="btn-spinner" />
                                                    ) : isEquipped ? (
                                                        <>Equipped ✓</>
                                                    ) : isUnlocked ? (
                                                        <>Equip Frame ⚡</>
                                                    ) : canAfford ? (
                                                        <>Claim {isAdmin ? 'Free' : `(${numberFormatter.format(fr.cost)} PTS)`}</>
                                                    ) : (
                                                        <>Need {numberFormatter.format(fr.cost - arenaPoints)} PTS</>
                                                    )}
                                                </button>
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ================= SECTION 3: HUD THEMES VAULT ================= */}
                        {(activeVaultTab === 'themes' || activeVaultTab === 'all') && (
                            <div className="vault-section-wrapper">
                                <div className="vault-section-header">
                                    <div className="vault-section-title-wrap">
                                        <div className="dash-icon-box icon-pink">
                                            <FontAwesomeIcon icon={faPalette} />
                                        </div>
                                        <div>
                                            <h2 className="vault-section-title">Cyber HUD Themes</h2>
                                            <p className="vault-section-subtitle">
                                                2 Free Forever (Regular & Horizon Studio) + 6 Paid High-Spec Skins (5,000 to 10,000 PTS). Hover to live-preview.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Sub-Filters */}
                                    <div className="vault-filter-pills">
                                        <button
                                            type="button"
                                            className={`category-pill ${themeCategoryFilter === 'All' ? 'is-active' : ''}`}
                                            onClick={() => setThemeCategoryFilter('All')}
                                        >
                                            All (8)
                                        </button>
                                        <button
                                            type="button"
                                            className={`category-pill ${themeCategoryFilter === 'Free' ? 'is-active' : ''}`}
                                            onClick={() => setThemeCategoryFilter('Free')}
                                        >
                                            Free (2)
                                        </button>
                                        <button
                                            type="button"
                                            className={`category-pill ${themeCategoryFilter === '5000' ? 'is-active' : ''}`}
                                            onClick={() => setThemeCategoryFilter('5000')}
                                        >
                                            5,000 PTS (2)
                                        </button>
                                        <button
                                            type="button"
                                            className={`category-pill ${themeCategoryFilter === '8000' ? 'is-active' : ''}`}
                                            onClick={() => setThemeCategoryFilter('8000')}
                                        >
                                            8,000 PTS (2)
                                        </button>
                                        <button
                                            type="button"
                                            className={`category-pill ${themeCategoryFilter === '10000' ? 'is-active' : ''}`}
                                            onClick={() => setThemeCategoryFilter('10000')}
                                        >
                                            10,000 PTS (2)
                                        </button>
                                    </div>
                                </div>

                                {/* Themes Compact Grid */}
                                <div className="themes-compact-grid">
                                    {filteredThemes.map((reward) => {
                                        const isCurrentlyEquipped = currentTheme === reward.themeId;
                                        const isHovered = hoveredThemeId === reward.themeId;
                                        const isUnlocked = checkThemeUnlocked(reward);
                                        const canAfford = isAdmin || reward.isFree || arenaPoints >= reward.cost;
                                        const isProcessing = isRedeemingId === reward.themeId;

                                        return (
                                            <article
                                                key={reward.id || reward.themeId}
                                                className={`theme-compact-card ${isCurrentlyEquipped ? 'is-active-theme' : ''} ${isUnlocked ? 'is-unlocked-theme' : 'is-locked-theme'} ${isHovered ? 'is-previewing-theme' : ''}`}
                                                style={{
                                                    '--theme-accent-color': reward.accentColor,
                                                }}
                                                onMouseEnter={() => handleThemeHoverEnter(reward)}
                                                onMouseLeave={handleThemeHoverLeave}
                                            >
                                                <div className="theme-compact-top">
                                                    <div className="theme-compact-ident">
                                                        <div
                                                            className="theme-compact-icon"
                                                            style={{
                                                                color: reward.accentColor,
                                                                backgroundColor: `${reward.accentColor}18`,
                                                                borderColor: `${reward.accentColor}40`,
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={reward.icon} />
                                                        </div>
                                                        <div className="theme-compact-name-block">
                                                            <h4 className="theme-compact-title" title={reward.title}>{reward.title}</h4>
                                                            <p className="theme-compact-tagline" title={reward.tagline}>{reward.tagline}</p>
                                                        </div>
                                                    </div>

                                                    <div className="theme-compact-badge-slot">
                                                        {reward.isFree ? (
                                                            <span className="theme-compact-status-pill tag-free">FREE</span>
                                                        ) : isAdmin ? (
                                                            <span className="theme-compact-status-pill tag-admin">ADMIN</span>
                                                        ) : (
                                                            <span className="theme-compact-status-pill tag-locked">
                                                                <FontAwesomeIcon icon={faCoins} style={{ marginRight: '3px' }} />
                                                                {numberFormatter.format(reward.cost)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Palette Swatches Strip */}
                                                <div className="theme-compact-swatches-strip">
                                                    <div className="theme-compact-swatches">
                                                        {reward.swatches.map((color, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="theme-compact-swatch-dot"
                                                                style={{
                                                                    backgroundColor: color,
                                                                    boxShadow: idx === 1 ? `0 0 6px ${reward.accentColor}` : 'none',
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span
                                                        className="theme-compact-accent-label"
                                                        style={{
                                                            '--tag-accent': reward.accentColor,
                                                        }}
                                                    >
                                                        {isCurrentlyEquipped
                                                            ? 'Active Cockpit'
                                                            : isHovered
                                                            ? 'Live Preview'
                                                            : 'Hover to Test'}
                                                    </span>
                                                </div>

                                                {/* Button */}
                                                <button
                                                    type="button"
                                                    className={`theme-compact-action-btn ${isCurrentlyEquipped ? 'btn-active' : isUnlocked ? 'btn-apply' : canAfford ? 'btn-unlock' : 'btn-locked'}`}
                                                    disabled={isCurrentlyEquipped || isProcessing || (!isUnlocked && !canAfford)}
                                                    onClick={() => handleThemeClick(reward)}
                                                >
                                                    {isProcessing ? (
                                                        <span className="btn-spinner" />
                                                    ) : isCurrentlyEquipped ? (
                                                        <>Equipped HUD ✓</>
                                                    ) : isUnlocked ? (
                                                        <>Apply HUD ⚡</>
                                                    ) : canAfford ? (
                                                        <>Unlock Theme {isAdmin ? '(Free)' : `(${numberFormatter.format(reward.cost)} PTS)`}</>
                                                    ) : (
                                                        <>
                                                            <FontAwesomeIcon icon={faLock} style={{ marginRight: '6px' }} />
                                                            Need {numberFormatter.format(reward.cost - arenaPoints)} PTS
                                                        </>
                                                    )}
                                                </button>
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.section>

                    {/* Right Side Column: Rank Progress & Points Breakdown */}
                    <aside className="rewards-side-column">
                        {/* Rank Tier Progress */}
                        <motion.section
                            className="dash-card rewards-side-card"
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.25 }}
                        >
                            <div className="side-card-header">
                                <div className="dash-card-title-group">
                                    <div className="dash-icon-box icon-cyan">
                                        <FontAwesomeIcon icon={faMedal} />
                                    </div>
                                    <h2 className="side-card-title">Rank Progress</h2>
                                </div>
                                <span className="progress-percent-badge">{Math.round(progressToNext)}%</span>
                            </div>

                            <div className="tier-rail">
                                <span className="tier-rail-current">{currentTier.label}</span>
                                <span className="tier-rail-next">{nextTier.label}</span>
                            </div>

                            <div className="tier-progress-track">
                                <div className="tier-progress-fill" style={{ width: `${progressToNext}%` }} />
                            </div>

                            <p className="tier-progress-copy">
                                {ratingToNextTier > 0
                                    ? `${ratingToNextTier} rating needed to reach ${nextTier.label}`
                                    : 'Maximum competitive tier unlocked'}
                            </p>

                            <ul className="tier-list">
                                {RANK_TIERS.map((tier, index) => {
                                    const isComplete = stats.rating >= tier.minRating;
                                    const isCurrent = index === currentTierIndex;

                                    return (
                                        <li key={tier.label} className={`tier-list-item ${isCurrent ? 'tier-current' : ''}`}>
                                            <div className="tier-left">
                                                <RankEmblem rating={tier.minRating} size={20} glow={false} />
                                                <span className="tier-label-name">{tier.label}</span>
                                                {isComplete && (
                                                    <FontAwesomeIcon icon={faCheckCircle} className="tier-check-icon" />
                                                )}
                                            </div>
                                            <span className="tier-points-tag">{numberFormatter.format(tier.minRating)} Elo</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </motion.section>

                        {/* Points Breakdown */}
                        <motion.section
                            className="dash-card rewards-side-card"
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <div className="side-card-header">
                                <div className="dash-card-title-group">
                                    <div className="dash-icon-box icon-purple">
                                        <FontAwesomeIcon icon={faChartPie} />
                                    </div>
                                    <h2 className="side-card-title">Points Breakdown</h2>
                                </div>
                            </div>

                            <ul className="earn-list">
                                {pointSourceRows.map((source) => (
                                    <li key={source.label} className="earn-list-item">
                                        <div className="earn-left">
                                            <span className="earn-icon-bullet" style={{ color: source.color }}>
                                                <FontAwesomeIcon icon={source.icon} />
                                            </span>
                                            <span>{source.label}</span>
                                        </div>
                                        <span className="earn-points-badge">+{numberFormatter.format(source.value)}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.section>

                        {/* Weekly Consistency Activity Tracker */}
                        <motion.section
                            className="dash-card rewards-side-card"
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <div className="side-card-header">
                                <div className="dash-card-title-group">
                                    <div className="dash-icon-box icon-pink">
                                        <FontAwesomeIcon icon={faFire} />
                                    </div>
                                    <h2 className="side-card-title">Weekly Consistency</h2>
                                </div>
                                <span className="dash-pill-tag tag-pink">
                                    {weeklyStatus?.activeDaysCount || 0} / 7 Active Days
                                </span>
                            </div>

                            {/* Mon-Sun Day Bullets */}
                            <div className="weekly-consistency-grid">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, index) => {
                                    const isActive = weeklyStatus?.activeDays?.includes(index);
                                    return (
                                        <div
                                            key={dayName}
                                            className={`weekly-day-box ${isActive ? 'is-active' : ''}`}
                                        >
                                            <div className="weekly-day-name">{dayName}</div>
                                            <div className="weekly-day-status">
                                                {isActive ? '✓' : '·'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.section>
                    </aside>
                </div>
            </div>
            <Footer />
        </BackgroundPaths>
    );
}