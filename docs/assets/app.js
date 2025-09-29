'use strict';
(function () {
      const state = {
        rootIndex: null,
        leagues: [],
        league: null,
        index: null,
        week: null,
        assistant: null,
        bracket: null,
        sim: null,
        teamFilter: '',
        waiverPosition: 'ALL',
        riskThreshold: 0.4,
        sandbox: {
          ready: false,
          rules: { slots: {}, flexEligible: [] },
          teams: {},
          baselineStrengths: {},
          currentStrengths: {},
          baselineOdds: {},
          activeTeam: null,
          trade: { teamA: null, teamB: null, send: new Set(), receive: new Set() },
          lastChanges: [],
          message: '',
          appliedTrades: [],
        },
        startSit: {
          ready: false,
          matchups: [],
          selectedMatchup: null,
          teamStates: {},
          rules: { slots: {}, flexEligible: [] },
          message: '',
          results: null,
        },
        bracketSim: {
          seeds: [],
          defaultSeeds: [],
          odds: [],
          runs: 0,
        },
        scenarios: {
          saved: {},
          active: null,
        },
        scenario: {
          trades: [],
          lineup_swaps: {},
          seeds_override: [],
          history: [],
        },
        remoteScenarios: [],
        remoteScenarioIndex: {},
        remoteScenario: null,
        tradeFinder: {
          packages: [],
          filters: {
            teamA: 'ALL',
            teamB: 'ALL',
            pos: 'ALL',
            minFairness: 0.8,
          },
          modal: null,
        },
        rostersByTeam: {},
        changelog: {
          ready: false,
          available: false,
          data: null,
          error: null,
        },
        compare: {
          ready: false,
          data: null,
          error: null,
        },
        managers: {
          ready: false,
          data: null,
          error: null,
        },
        ops: {
          ready: false,
          data: null,
          error: null,
        },
        path: {
          ready: false,
          error: null,
          sos: null,
          targets: null,
          path: null,
          tweaks: [],
          clientSim: null,
          week: null,
        },
        notifications: [],
        activeTab: 'power',
        language: 'en',
        translations: {},
        theme: 'light',
      };

      const config = {
        basePath: '',
        meta: {
          title: 'FF Assistant',
          subtitle: '',
          version: '',
          built_at: '',
          theme: 'light',
          weeks: [],
          downloads: {},
          changelog: null,
          default_league: null,
          leagues: [],
        },
      };

      const LEAGUE_STORAGE_KEY = 'ff_dashboard_league';
      const DEFAULT_LEAGUE_KEY = '__default__';
      const SCENARIO_STORAGE_KEY = 'ff_dashboard_scenarios';
      const TAB_IDS = ['power', 'lineups', 'startsit', 'waivers', 'managers', 'ops', 'matchups', 'bracket', 'playoffs', 'tradefinder', 'changelog', 'path', 'compare', 'sandbox'];
      const SHARE_LABEL_DEFAULT = 'Share link';
      const SCENARIO_HASH_PARAM = 'scn';
      const LANGUAGE_STORAGE_KEY = 'ff_dashboard_language';
      const THEME_STORAGE_KEY = 'ff_dashboard_theme';
      const DEFAULT_LANGUAGE = 'en';
      const SUPPORTED_LANGUAGES = [
        { value: 'en', labelKey: 'lang.en' },
        { value: 'fr', labelKey: 'lang.fr' },
      ];
      const THEME_OPTIONS = [
        { value: 'light', labelKey: 'theme.light' },
        { value: 'dark', labelKey: 'theme.dark' },
        { value: 'hc', labelKey: 'theme.highContrast' },
      ];
      const I18N_DEFAULTS = {
        'site.title': 'FF Assistant',
        'btn.share': 'Share link',
        'link.emailDrafts': 'Open All Email Drafts',
        'link.slackPack': 'Slack Text Pack',
        'link.skip': 'Skip to content',
        'badge.scenarioModified': 'Scenario: modified',
        'label.search': 'Search players or teams',
        'placeholder.search': 'Search players/teams',
        'label.league': 'League',
        'label.week': 'Week',
        'label.teamFilter': 'Team Filter',
        'placeholder.teamFilter': 'All teams',
        'label.language': 'Language',
        'label.theme': 'Theme',
        'lang.en': 'English',
        'lang.fr': 'Français',
        'theme.light': 'Light',
        'theme.dark': 'Dark',
        'theme.highContrast': 'High Contrast',
        'tab.power': 'Power',
        'tab.lineups': 'Lineups',
        'tab.startsit': 'Start/Sit',
        'tab.waivers': 'Waivers',
        'tab.managers': 'Managers',
        'tab.ops': 'Ops',
        'tab.matchups': 'Matchups',
        'tab.bracket': 'Bracket',
        'tab.playoffs': 'Playoff Odds',
        'tab.tradefinder': 'Trade Finder',
        'tab.changelog': 'Changelog',
        'tab.path': 'Path',
        'tab.compare': 'Compare',
        'tab.sandbox': 'Sandbox',
        'heading.power': 'Power Rankings',
        'heading.lineups': 'Optimal Lineups',
        'heading.startsit': 'Start/Sit Focus',
        'heading.waivers': 'Waiver / FAAB Suggestions',
        'heading.managers': 'Manager Leaderboard',
        'heading.ops': 'Ops Analytics',
        'heading.matchups': 'Matchup Preview',
        'heading.bracket': 'Playoff Bracket Simulator',
        'heading.playoffs': 'Season Simulation — Playoff Odds',
        'heading.changelog': 'What Changed',
        'heading.path': 'Path to Playoffs',
        'heading.compare': 'Cross-League Snapshot',
        'heading.tradefinder': 'Trade Finder',
        'btn.bracketReset': 'Reset Seeds',
        'btn.bracketSimulate': 'Simulate Bracket (5k)',
        'placeholder.scenarioName': 'Scenario name',
        'btn.scenarioSave': 'Save Scenario',
        'btn.scenarioLoad': 'Load',
        'btn.scenarioDelete': 'Delete',
        'btn.scenarioClear': 'Clear',
        'label.remoteScenarios': 'My Scenarios',
        'status.remoteScenarioLoaded': 'Scenario applied.',
        'status.remoteScenarioCleared': 'Scenario cleared.',
        'status.remoteScenarioFailed': 'Unable to load scenario.',
        'status.remoteScenarioEmpty': 'No remote scenarios available.',
        'status.remoteScenarioSelect': 'Select scenario',
        'table.trade.fairness': 'Fairness',
        'table.trade.teamAGives': 'Team A Gives',
        'table.trade.teamBGives': 'Team B Gives',
        'table.trade.deltaA': 'ΔA',
        'table.trade.deltaB': 'ΔB',
        'table.trade.rationale': 'Rationale',
        'btn.tradeCustomOpen': 'Build custom trade',
        'heading.trade.currentScenario': 'Current Scenario',
        'badge.trade.lineupSwaps': '+ line-up swaps active',
        'btn.tradeUndo': 'Undo Last',
        'btn.tradeReset': 'Reset Scenario',
        'btn.tradeExport': 'Export Scenario JSON',
        'btn.tradeImport': 'Import Scenario JSON',
        'btn.tradeShare': 'Share scenario link',
        'btn.tradeClearShare': 'Clear share hash',
        'heading.sandbox.teamSelector': 'Team Selector',
        'label.team': 'Team',
        'metric.overall': 'Overall',
        'metric.top3': 'Top-3',
        'metric.depth': 'Depth',
        'btn.sandbox.resetTeam': 'Reset Team',
        'heading.sandbox.lineup': 'Current Lineup & Bench',
        'btn.sandbox.applySwaps': 'Apply Swaps',
        'heading.sandbox.trade': 'Trade Simulator',
        'btn.sandbox.applyTrade': 'Apply Trade',
        'heading.startsit.simulator': 'Start/Sit Simulator',
        'label.matchup': 'Matchup',
        'btn.startsit.reset': 'Reset to Defaults',
        'label.away': 'Away',
        'label.home': 'Home',
        'label.starters': 'Starters',
        'label.bench': 'Bench',
        'btn.startsit.simulate': 'Simulate 1000 runs',
        'heading.notifications': 'Notifications',
        'heading.trade.custom': 'Build Custom Trade',
        'btn.close': 'Close',
        'placeholder.searchPlayers': 'Search players',
        'label.fairness': 'Fairness',
        'option.all': 'All',
        'label.trade.teamA': 'Team A',
        'label.trade.teamB': 'Team B',
        'label.trade.position': 'Position',
        'label.trade.minFairness': 'Min Fairness',
        'label.rank': 'Rank',
        'label.unknownTeam': 'Unknown',
        'status.selectWeek': 'Select a week',
        'status.linkCopied': 'Link copied!',
        'status.linkReady': 'Link ready',
        'empty.power': 'Power rankings unavailable for this week.',
        'empty.sandboxUnavailable': 'Sandbox unavailable.',
        'empty.sandboxSelectTeam': 'Select a team to view lineup.',
        'empty.sandboxSelectTeamA': 'Select Team A',
        'empty.sandboxSelectTeamB': 'Select Team B',
        'empty.sandboxImpact': 'Make a swap or trade to see the impact.',
        'empty.seasonSimUnavailable': 'Season simulation data unavailable.',
        'empty.scenarioData': 'Scenario tools require assistant JSON with roster data.',
        'empty.scenarioNone': 'No scenario changes applied.',
        'empty.changelogLoading': 'Loading changelog…',
        'empty.targetsUnavailable': 'Win targets not available for this week.',
        'empty.sosUnavailable': 'Remaining strength of schedule not available.',
        'empty.swingsUnavailable': 'No swing games identified yet.',
        'empty.playoffOdds': 'Playoff odds unavailable for this week.',
        'empty.scheduleTweaks': 'Season schedule not available for tweaks.',
        'empty.compareLoading': 'Loading cross-league snapshot…',
        'empty.compareUnavailable': 'Cross-league comparison unavailable.',
        'empty.compareNone': 'No comparison data available.',
        'empty.noPlayers': 'No players found.',
        'empty.noMatchupData': 'No matchup data available.',
        'empty.teamUnavailable': 'Team data unavailable.',
        'empty.startSitInstructions': 'Adjust starters and simulate 1000 runs to view win probabilities.',
        'empty.noSamples': 'No samples recorded.',
        'empty.lineupUnavailable': 'No lineup data for this selection.',
        'empty.startsitFilter': 'No start/sit notes for this filter.',
        'empty.waiversNone': 'No waiver recommendations this week.',
        'empty.managersLoading': 'Loading manager metrics…',
        'empty.managersUnavailable': 'Manager leaderboard unavailable.',
        'empty.managersNone': 'No manager metrics computed yet.',
        'empty.analyticsLoading': 'Loading recent runs…',
        'empty.analyticsUnavailable': 'Ops analytics unavailable.',
        'empty.analyticsNone': 'No historical run data found.',
        'empty.matchupsUnavailable': 'No matchup data for this week.',
        'empty.playoffSimPrompt': 'Run the simulation to view updated advancement odds.',
        'empty.bracketSeeds': 'No bracket seeds available. Run the assistant bracket simulation or add seeds manually.',
        'empty.notifications': 'No notifications right now.',
        'empty.seasonSimMissing': 'Season simulation not available.',
        'heading.dashboardError': 'Dashboard Error',
        'status.bracket.lastTradeRemoved': 'Last trade removed from scenario.',
        'status.bracket.resetBaseline': 'Scenario reset to baseline.',
        'status.bracket.noDefaultSeeds': 'No default seeds available to reset.',
        'status.bracket.reset': 'Seeds reset to default order.',
        'status.bracket.updated': 'Seeds updated. Run the simulation to refresh odds.',
        'status.bracket.noStrength': 'Strengths unavailable; cannot simulate bracket.',
        'status.bracket.addSeeds': 'Add seeds before running a simulation.',
        'status.bracket.noChangesShare': 'No scenario changes to share.',
        'status.bracket.encodeFailed': 'Unable to encode scenario for sharing.',
        'status.bracket.linkCopied': 'Scenario link copied to clipboard.',
        'status.bracket.linkReady': 'Scenario link ready. Copy from address bar.',
        'status.bracket.hashRemoved': 'Scenario hash removed from URL.',
        'status.bracket.enterName': 'Enter a scenario name to save.',
        'status.bracket.nothingToSave': 'No trades, lineup swaps, or seed changes to save.',
        'status.bracket.selectScenario': 'Select a saved scenario to load.',
        'status.bracket.notFound': 'Scenario not found.',
        'status.bracket.selectToDelete': 'Select a scenario to delete.',
        'table.bracket.team': 'Team',
        'table.bracket.seed': 'Seed',
        'table.bracket.semis': 'Semis',
        'table.bracket.final': 'Final',
        'table.bracket.title': 'Title',
        'heading.bracket.advancement': 'Advancement Probabilities',
        'text.lastSimulation': 'Last simulation: {runs} runs',
        'bracket.ascii.prompt': 'Add seeds to visualize the bracket.',
        'bracket.ascii.final': 'Final',
        'bracket.ascii.semifinals': 'Semifinals',
        'bracket.ascii.roundOf': 'Round of {count}',
        'bracket.ascii.winnersTitle': '  Winners advance → Title',
        'bracket.ascii.winnersChampion': 'Winners advance each round → Champion',
        'label.tbd': 'TBD',
        'label.vs': 'vs',
        'label.slot': 'Slot',
        'label.player': 'Player',
        'label.pos': 'Pos',
        'label.score': 'Score',
        'label.teamName': 'Team',
        'label.startQ': 'Start?',
        'label.benchQ': 'Bench?',
        'table.playoffs.meanWins': 'Mean Wins',
        'table.playoffs.medianWins': 'Median Wins',
        'table.playoffs.playoffOdds': 'Playoff Odds',
        'table.playoffs.titleOdds': 'Title Odds',
        'table.compare.deltaOverall': 'ΔOverall',
        'table.compare.deltaTop3': 'ΔTop-3',
        'table.compare.deltaDepth': 'ΔDepth',
        'table.targets.deltaPlayoff': 'ΔPlayoff %',
        'table.targets.deltaWins': 'ΔMean Wins',
        'table.matchups.away': 'Away',
        'table.matchups.home': 'Home',
        'table.matchups.awayScore': 'Away Score',
        'table.matchups.homeScore': 'Home Score',
        'table.matchups.favored': 'Favored',
        'table.matchups.delta': 'Δ',
        'table.startsit.hitRate': 'Start/Sit Hit %',
        'table.startsit.waiverRoi': 'Waiver ROI',
        'table.startsit.tradeVa': 'Trade VA',
        'label.faab': 'FAAB',
        'table.waivers.rationale': 'Rationale',
        'label.alt': 'Alt',
        'label.deltaScore': 'Δ Score',
        'label.bucket': 'Bucket',
        'label.anyTeam': 'any team',
        'status.loadWeekFailed': 'Failed to load week',
        'status.loadLeagueFailed': 'Failed to load league',
        'label.even': 'Even',
        'badge.scenario.modified': 'Scenario modified',
        'badge.scenario.shared': 'Scenario shared link',
        'badge.scenario.imported': 'Scenario imported',
        'table.path.baseOdds': 'Base Odds',
        'table.path.tweakedOdds': 'Tweaked Odds',
        'table.path.delta': 'Δ',
        'table.path.meanWins': 'Mean Wins',
        'heading.path.mustWins': 'Must-win Games',
        'heading.path.topSwings': 'Top Swing Games',
        'heading.opsFailures': 'Failure signals',
        'heading.opsRecent': 'Recent runs',
        'heading.opsRegistry': 'Run registry',
        'label.starter': 'Starter',
        'text.mustWinEntry': 'Week {week}: {team} vs {opponent}',
        'badge.version': 'Version {value}',
        'badge.league': 'League {value}',
        'badge.week': 'Week {value}',
        'badge.built': 'Built {value}',
        'status.selectScenarioPrompt': 'Select scenario',
        'status.noSavedScenarios': 'No saved scenarios',
        'label.generatedAt': 'Generated at',
        'label.avgDuration': 'Avg duration (logs)',
        'label.signal': 'Signal',
        'label.count': 'Count',
        'label.start': 'Start',
        'label.target': 'Target',
        'label.exit': 'Exit',
        'label.duration': 'Duration (s)',
        'label.timestamp': 'Timestamp',
        'label.outputs': 'Outputs',
      };
      let suppressHashUpdate = false;
      let pendingScenarioFromHash = null;
      let lastEncodedScenarioHash = null;
      let searchIndex = [];
      let shareResetTimer = null;
      let userThemePreferred = false;
      let liveRegionTimer = null;

      const els = {};

      function _setBasePath(base) {
        if (!base) {
          config.basePath = '';
          return;
        }
        let value = String(base).trim();
        if (!value.startsWith('/')) {
          value = `/${value}`;
        }
        if (!value.endsWith('/')) {
          value = `${value}/`;
        }
        config.basePath = value;
      }

      async function loadBasePath() {
        try {
          const res = await fetch('BASE.json', { cache: 'no-cache' });
          if (res && res.ok) {
            const payload = await res.json();
            if (payload && typeof payload.base === 'string') {
              _setBasePath(payload.base);
            }
          }
        } catch (err) {
          console.warn('base path load failed', err);
        }
      }

      function $(selector) {
        return document.querySelector(selector);
      }

      function create(tag, options = {}) {
        const el = document.createElement(tag);
        if (options.className) el.className = options.className;
        if (options.text) el.textContent = options.text;
        if (options.html) el.innerHTML = options.html;
        if (options.attrs) {
          for (const [key, value] of Object.entries(options.attrs)) {
            el.setAttribute(key, value);
          }
        }
        return el;
      }

      function announceLive(message) {
        if (!els.liveRegion || !message) {
          return;
        }
        if (liveRegionTimer) {
          window.clearTimeout(liveRegionTimer);
        }
        els.liveRegion.textContent = '';
        liveRegionTimer = window.setTimeout(() => {
          els.liveRegion.textContent = message;
        }, 60);
      }

      function buildHeaderRow(cells) {
        const thead = create('thead');
        const row = create('tr');
        cells.forEach(([key, fallback]) => {
          row.appendChild(create('th', { text: t(key, fallback) }));
        });
        thead.appendChild(row);
        return thead;
      }

      function t(key, fallback) {
        if (!key) return fallback || '';
        const translations = state.translations || {};
        if (Object.prototype.hasOwnProperty.call(translations, key)) {
          const value = translations[key];
          if (typeof value === 'string') {
            return value;
          }
        }
        if (Object.prototype.hasOwnProperty.call(I18N_DEFAULTS, key)) {
          return I18N_DEFAULTS[key];
        }
        return fallback !== undefined ? fallback : key;
      }

      function applyTranslations(root = document) {
        const scope = root instanceof Element ? root : document;
        scope.querySelectorAll('[data-i18n]').forEach((el) => {
          const key = el.getAttribute('data-i18n');
          if (!key) return;
          const fallback = el.textContent || '';
          el.textContent = t(key, fallback);
        });
        scope.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
          const key = el.getAttribute('data-i18n-placeholder');
          if (!key) return;
          const fallback = el.getAttribute('placeholder') || '';
          el.setAttribute('placeholder', t(key, fallback));
        });
      }

      function populateLanguageSelect() {
        if (!els.languageSelect) return;
        const current = state.language || DEFAULT_LANGUAGE;
        const options = SUPPORTED_LANGUAGES.map(({ value, labelKey }) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = t(labelKey, I18N_DEFAULTS[labelKey] || value);
          return option;
        });
        els.languageSelect.innerHTML = '';
        options.forEach((option) => els.languageSelect.appendChild(option));
        els.languageSelect.value = options.some((opt) => opt.value === current) ? current : DEFAULT_LANGUAGE;
      }

      function populateThemeSelect() {
        if (!els.themeSelect) return;
        const current = state.theme || 'light';
        const options = THEME_OPTIONS.map(({ value, labelKey }) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = t(labelKey, I18N_DEFAULTS[labelKey] || value);
          return option;
        });
        els.themeSelect.innerHTML = '';
        options.forEach((option) => els.themeSelect.appendChild(option));
        els.themeSelect.value = options.some((opt) => opt.value === current) ? current : 'light';
      }

      async function setLanguage(lang, { persist = true } = {}) {
        const supported = SUPPORTED_LANGUAGES.map(({ value }) => value);
        const normalized = supported.includes(lang) ? lang : DEFAULT_LANGUAGE;
        let translations = {};
        try {
          const response = await fetch(`${config.basePath || ''}assets/i18n/${normalized}.json`, { cache: 'no-cache' });
          if (response.ok) {
            translations = await response.json();
          } else {
            console.warn('i18n load failed for', normalized, response.status);
          }
        } catch (err) {
          console.warn('i18n fetch error for', normalized, err);
        }
        if (!translations || typeof translations !== 'object') {
          if (normalized !== DEFAULT_LANGUAGE) {
            return setLanguage(DEFAULT_LANGUAGE, { persist });
          }
          translations = {};
        }
        state.language = normalized;
        state.translations = translations;
        document.documentElement.lang = normalized;
        if (persist) {
          try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
          } catch (err) {
            console.warn('language persist failed', err);
          }
        }
        populateLanguageSelect();
        populateThemeSelect();
        applyTranslations();
        setShareLabel(t('btn.share', SHARE_LABEL_DEFAULT), false);
      }

      function setTheme(theme, { persist = true } = {}) {
        const supported = THEME_OPTIONS.map(({ value }) => value);
        const normalized = supported.includes(theme) ? theme : 'light';
        state.theme = normalized;
        document.body.dataset.theme = normalized;
        if (persist) {
          try {
            localStorage.setItem(THEME_STORAGE_KEY, normalized);
          } catch (err) {
            console.warn('theme persist failed', err);
          }
          userThemePreferred = true;
        }
        populateThemeSelect();
      }

      function getHashParams() {
        const hash = (window.location.hash || '').replace(/^#/, '');
        if (!hash) return {};
        return hash.split('&').reduce((acc, part) => {
          if (!part) return acc;
          const [rawKey, rawValue] = part.split('=');
          if (!rawKey) return acc;
          const key = decodeURIComponent(rawKey);
          const value = rawValue ? decodeURIComponent(rawValue) : '';
          acc[key] = value;
          return acc;
        }, {});
      }

      function buildHashString(params) {
        const entries = Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '');
        if (!entries.length) return '';
        return entries
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
      }

      function writeHashParams(params) {
        const hashString = buildHashString(params);
        const newUrl = window.location.pathname + window.location.search + (hashString ? `#${hashString}` : '');
        if (newUrl !== window.location.pathname + window.location.search + window.location.hash) {
          history.replaceState(null, '', newUrl);
        }
      }

      function getQueryParams() {
        return new URLSearchParams(window.location.search);
      }

      function updateQueryParams(updates = {}) {
        const params = getQueryParams();
        if (Object.prototype.hasOwnProperty.call(updates, 'league')) {
          const leagueValue = updates.league;
          if (leagueValue) {
            params.set('league', leagueValue);
          } else {
            params.delete('league');
          }
        }
        if (Object.prototype.hasOwnProperty.call(updates, 'week')) {
          const weekValue = updates.week;
          if (Number.isInteger(weekValue) && weekValue > 0) {
            params.set('week', String(weekValue));
          } else if (typeof weekValue === 'string' && weekValue.trim()) {
            params.set('week', weekValue.trim());
          } else {
            params.delete('week');
          }
        }
        const queryString = params.toString();
        const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}${window.location.hash}`;
        if (newUrl !== window.location.href) {
          history.replaceState(null, '', newUrl);
        }
      }

      function getLeagueEntry(slug) {
        if (!slug) return null;
        return (state.leagues || []).find((entry) => entry.slug === slug) || null;
      }

      function getCurrentLeagueEntry() {
        return getLeagueEntry(state.league);
      }

      function getLeagueName(slug) {
        const entry = getLeagueEntry(slug);
        if (!entry) return slug || '';
        return entry.name || entry.slug;
      }

      function formatPercent(value, digits = 1) {
        if (value === null || value === undefined || Number.isNaN(value)) {
          return '–';
        }
        return (Number(value) * 100).toFixed(digits) + '%';
      }

      function formatNumber(value, digits = 2) {
        if (value === null || value === undefined || Number.isNaN(value)) {
          return '–';
        }
        return Number(value).toFixed(digits);
      }

      function formatTimestamp(value) {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
          return String(value);
        }
        return `${date.toLocaleString()}`;
      }

      async function loadMeta() {
        const candidates = ['meta.json', '../meta.json'];
        for (const candidate of candidates) {
          try {
            const res = await fetch(candidate, { cache: 'no-cache' });
            if (!res.ok) {
              continue;
            }
            const payload = await res.json();
            if (payload && typeof payload === 'object') {
              const merged = {
                ...config.meta,
                ...payload,
              };
              if (Array.isArray(payload.weeks)) {
                merged.weeks = payload.weeks;
              }
              if (Array.isArray(payload.leagues)) {
                merged.leagues = payload.leagues;
              }
              if (payload.default_league) {
                merged.default_league = payload.default_league;
              }
              if (payload.downloads && typeof payload.downloads === 'object' && !Array.isArray(payload.downloads)) {
                merged.downloads = payload.downloads;
              } else if (Array.isArray(payload.downloads)) {
                const defaultKey = payload.default_league || DEFAULT_LEAGUE_KEY;
                merged.downloads = { [defaultKey]: payload.downloads };
              }
              config.meta = merged;
            }
            break;
          } catch (err) {
            console.warn('meta.json load failed', err);
          }
        }
      }

      function applyMeta() {
        const meta = config.meta || {};
        const title = meta.title || 'FF Assistant';
        if (els.siteTitle) {
          els.siteTitle.textContent = title;
        }
        const leagueEntry = getCurrentLeagueEntry();
        const subtitleValue = leagueEntry ? leagueEntry.name : meta.subtitle;
        if (els.siteSubtitle) {
          if (subtitleValue) {
            els.siteSubtitle.textContent = subtitleValue;
            els.siteSubtitle.style.display = '';
          } else {
            els.siteSubtitle.textContent = '';
            els.siteSubtitle.style.display = 'none';
          }
        }
        const docTitle = subtitleValue ? `${title} — ${subtitleValue}` : title;
        document.title = docTitle;
        const metaThemeRaw = (meta.theme || '').toString().toLowerCase();
        if (!userThemePreferred && metaThemeRaw) {
          setTheme(metaThemeRaw, { persist: false });
        }
        setShareLabel(t('btn.share', SHARE_LABEL_DEFAULT), false);
        updateDeliveryLinks();
      }

      function determineInitialWeek() {
        const weeks = Array.isArray(state.index?.weeks)
          ? state.index.weeks
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value))
            .sort((a, b) => a - b)
          : [];
        const params = new URLSearchParams(window.location.search);
        const requested = params.get('week');
        if (requested && requested.toLowerCase() !== 'auto') {
          const asNumber = Number(requested);
          if (Number.isInteger(asNumber) && weeks.includes(asNumber)) {
            return asNumber;
          }
        }
        const latestRaw = state.index?.latest;
        const latest = Number(latestRaw);
        if (Number.isInteger(latest) && weeks.includes(latest)) {
          return latest;
        }
        return weeks.length ? weeks[weeks.length - 1] : null;
      }

      function spark(value) {
        const wrapper = create('div', { className: 'spark' });
        const bar = create('div', { className: 'spark-bar' });
        const pct = Math.max(0, Math.min(1, Number(value) || 0));
        bar.style.setProperty('--value', (pct * 100).toFixed(1) + '%');
        const label = create('span', { text: formatPercent(pct, 1) });
        wrapper.append(bar, label);
        return wrapper;
      }

      function clearNode(node) {
        while (node.firstChild) {
          node.removeChild(node.firstChild);
        }
      }

      function clamp(value, min, max) {
        const num = Number.isFinite(value) ? Number(value) : min;
        if (num < min) return min;
        if (num > max) return max;
        return num;
      }

      function toNumber(value, fallback = 0) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
      }

      function comparePlayers(a, b) {
        const scoreA = toNumber(a.score, 0);
        const scoreB = toNumber(b.score, 0);
        if (scoreA !== scoreB) return scoreB - scoreA;
        const rankA = a.rank === null || a.rank === undefined ? Number.POSITIVE_INFINITY : toNumber(a.rank, Number.POSITIVE_INFINITY);
        const rankB = b.rank === null || b.rank === undefined ? Number.POSITIVE_INFINITY : toNumber(b.rank, Number.POSITIVE_INFINITY);
        if (rankA !== rankB) return rankA - rankB;
        return String(a.player_name || '').localeCompare(String(b.player_name || ''));
      }

      function setShareLabel(text, revert = true) {
        if (!els.shareLink) return;
        const resolved = text || t('btn.share', SHARE_LABEL_DEFAULT);
        els.shareLink.textContent = resolved;
        if (shareResetTimer) {
          window.clearTimeout(shareResetTimer);
          shareResetTimer = null;
        }
        if (revert) {
          shareResetTimer = window.setTimeout(() => {
            if (els.shareLink) {
              els.shareLink.textContent = t('btn.share', SHARE_LABEL_DEFAULT);
            }
            shareResetTimer = null;
          }, 2400);
        }
      }

      function setDeliveryLink(element, href, title, disabled) {
        if (!element) return;
        if (disabled) {
          element.setAttribute('aria-disabled', 'true');
          element.setAttribute('tabindex', '-1');
          element.setAttribute('href', '#');
        } else {
          element.setAttribute('aria-disabled', 'false');
          element.removeAttribute('tabindex');
          element.setAttribute('href', href);
        }
        if (title) {
          element.setAttribute('title', title);
        }
      }

      function updateDeliveryLinks() {
        const league = state.league;
        const week = state.week;
        const weekReady = Number.isInteger(week) && week > 0;
        const emailLink = els.shareEmailDrafts;
        const slackLink = els.shareSlackPack;
        const tooltip = 'Run make deliver after selecting a league/week to generate drafts.';
        if (!league || !weekReady) {
          setDeliveryLink(emailLink, '#', tooltip, true);
          setDeliveryLink(slackLink, '#', tooltip, true);
          return;
        }
        const weekSuffix = `week_${week}`;
        const emailPath = `../dist/emails/${league}/${weekSuffix}/`;
        const slackPath = `../dist/slack_out/${league}/${weekSuffix}/`;
        setDeliveryLink(emailLink, emailPath, `Open drafts at ${emailPath}`, false);
        setDeliveryLink(slackLink, slackPath, `Open staged Slack text at ${slackPath}`, false);
      }

      function normalizeTeamName(name) {
        return String(name || '').trim().toLowerCase();
      }

      function matchupKey(week, away, home) {
        const parts = [normalizeTeamName(away), normalizeTeamName(home)].sort(
          (a, b) => (a > b ? 1 : a < b ? -1 : 0)
        );
        return `${week}|${parts.join('|')}`;
      }

      function classifySosCell(strength) {
        if (!Number.isFinite(strength)) return 'sos-missing';
        if (strength >= 0.75) return 'sos-hard-3';
        if (strength >= 0.65) return 'sos-hard-2';
        if (strength >= 0.55) return 'sos-hard-1';
        if (strength <= 0.35) return 'sos-easy-3';
        if (strength <= 0.45) return 'sos-easy-2';
        if (strength <= 0.55) return 'sos-easy-1';
        return 'sos-neutral';
      }

      function setActiveTab(tab, options = {}) {
        const desired = TAB_IDS.includes(tab) ? tab : TAB_IDS[0];
        state.activeTab = desired;
        document.querySelectorAll('.tab-btn').forEach((node) => {
          if (!node) return;
          const isActive = node.dataset.tab === desired;
          node.classList.toggle('active', isActive);
          node.setAttribute('aria-selected', String(isActive));
          node.setAttribute('tabindex', isActive ? '0' : '-1');
        });
        document.querySelectorAll('.panel').forEach((panel) => {
          if (!panel) return;
          panel.classList.toggle('active', panel.id === desired);
        });
        if (options.focus) {
          const activeButton = document.querySelector(`.tab-btn[data-tab="${desired}"]`);
          if (activeButton) {
            activeButton.focus();
          }
        }
        if (options.updateHash) {
          const params = getHashParams();
          params.tab = desired;
          writeHashParams(params);
        }
      }

      function getTabFromHash() {
        const params = getHashParams();
        const candidate = params.tab;
        if (candidate && TAB_IDS.includes(candidate)) {
          return candidate;
        }
        return null;
      }

      function handleHashChange() {
        const params = getHashParams();
        const tab = params.tab;
        if (tab && tab !== state.activeTab) {
          setActiveTab(tab, { updateHash: false });
        }
        const encodedScenario = params[SCENARIO_HASH_PARAM];
        if (encodedScenario && encodedScenario !== lastEncodedScenarioHash) {
          const decoded = decodeScenarioFromHash(encodedScenario);
          if (decoded) {
            suppressHashUpdate = true;
            importScenarioPayload(decoded, { source: 'hash', silent: true, preserveActive: true, silentStatus: true });
            suppressHashUpdate = false;
            lastEncodedScenarioHash = encodedScenario;
            updateScenarioBadge();
          }
        }
        if (!encodedScenario) {
          lastEncodedScenarioHash = null;
        }
      }

      function formatDelta(after, before, digits = 3) {
        const delta = toNumber(after, 0) - toNumber(before, 0);
        const sign = delta >= 0 ? '+' : '';
        return `${sign}${delta.toFixed(digits)}`;
      }

      function formatDeltaCell(value, isPercent = false) {
        const delta = toNumber(value, 0);
        const className = delta > 0 ? 'delta-positive' : delta < 0 ? 'delta-negative' : 'delta-neutral';
        const suffix = isPercent ? '%' : '';
        const formatted = `${delta >= 0 ? '+' : ''}${delta.toFixed(isPercent ? 2 : 2)}${suffix}`;
        return `<span class="${className}">${formatted}</span>`;
      }

      function cloneLineup(lineup) {
        if (!lineup) return { starters: [], bench: [], strength: { overall: 0, top3: 0, depth: 0, lineup_total: 0 } };
        const starters = Array.isArray(lineup.starters) ? lineup.starters.map((player) => ({ ...player })) : [];
        const bench = Array.isArray(lineup.bench) ? lineup.bench.map((player) => ({ ...player })) : [];
        const strength = { ...(lineup.strength || {}) };
        return { starters, bench, strength };
      }

      function randomNormal(mean, sd) {
        const mu = Number(mean) || 0;
        const sigma = Math.max(0, Number(sd) || 0);
        if (sigma === 0) {
          return mu;
        }
        let u1 = 0;
        let u2 = 0;
        while (u1 === 0) u1 = Math.random();
        while (u2 === 0) u2 = Math.random();
        const mag = Math.sqrt(-2.0 * Math.log(u1));
        const z0 = mag * Math.cos(2 * Math.PI * u2);
        return mu + sigma * z0;
      }

      function buildHistogram(values, bins = 12) {
        if (!Array.isArray(values) || !values.length) {
          return [];
        }
        const min = Math.min(...values);
        const max = Math.max(...values);
        if (!Number.isFinite(min) || !Number.isFinite(max)) {
          return [];
        }
        if (Math.abs(max - min) < 1e-9) {
          return [
            {
              label: `${formatNumber(min, 1)}-${formatNumber(max, 1)}`,
              start: min,
              end: max,
              count: values.length,
              pct: 1,
            },
          ];
        }
        const bucketCount = Math.max(3, Math.min(24, bins));
        const span = max - min;
        const step = span / bucketCount;
        const counts = new Array(bucketCount).fill(0);
        values.forEach((value) => {
          const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor((value - min) / step)));
          counts[idx] += 1;
        });
        return counts.map((count, idx) => {
          const start = min + idx * step;
          const end = idx === bucketCount - 1 ? max : start + step;
          return {
            label: `${formatNumber(start, 1)}-${formatNumber(end, 1)}`,
            start,
            end,
            count,
            pct: count / values.length,
          };
        });
      }

      function recomputeStrength(context, rules) {
        const starters = Array.isArray(context?.starters) ? context.starters : [];
        const roster = Array.isArray(context?.roster) ? context.roster : Array.isArray(context?.players) ? context.players : starters;
        const starterScores = starters
          .map((player) => toNumber(player.score, 0))
          .filter((value) => value > 0)
          .sort((a, b) => b - a);
        const rosterScores = roster
          .map((player) => toNumber(player.score, 0))
          .filter((value) => value >= 0)
          .sort((a, b) => b - a);

        const topSlice = starterScores.length >= 3 ? starterScores.slice(0, 3) : rosterScores.slice(0, 3);
        const top3 = topSlice.length ? topSlice.reduce((sum, value) => sum + value, 0) / topSlice.length : 0;

        const depthSlice = rosterScores.slice(0, Math.max(3, Math.min(7, rosterScores.length)));
        const depth = depthSlice.length ? depthSlice.reduce((sum, value) => sum + value, 0) / depthSlice.length : top3;

        const overall = 0.7 * top3 + 0.3 * depth;
        const lineupTotal = starters.reduce((sum, player) => sum + toNumber(player.score, 0), 0);

        return {
          overall,
          top3,
          depth,
          lineup_total: lineupTotal,
        };
      }

      function recomputeLineup(roster, rules, overrides = {}) {
        const players = Array.isArray(roster) ? roster : [];
        const slots = Object.entries(rules?.slots || {}).reduce((acc, [slot, count]) => {
          acc[slot.toUpperCase()] = Math.max(0, Number(count) || 0);
          return acc;
        }, {});
        const flexEligible = new Set((rules?.flex_eligible || rules?.flexEligible || []).map((pos) => String(pos || '').toUpperCase()));
        const remaining = { ...slots };
        const forceStart = overrides.forceStart instanceof Set ? overrides.forceStart : new Set(overrides.forceStart || []);
        const forceBench = overrides.forceBench instanceof Set ? overrides.forceBench : new Set(overrides.forceBench || []);

        const available = players.filter((player) => !forceBench.has(player.id));
        const used = new Set();
        const starters = [];

        function useSlot(slot, player) {
          const key = slot.toUpperCase();
          if (!remaining[key]) return false;
          remaining[key] -= 1;
          starters.push({ ...player, slot: key });
          used.add(player.id);
          return true;
        }

        function slotMatches(player, slot) {
          const pos = String(player.pos || '').toUpperCase();
          const name = slot.toUpperCase();
          if (name === 'FLEX') return flexEligible.has(pos);
          if (name.includes('/')) {
            return name.split('/').some((part) => part.trim() === pos);
          }
          return name === pos;
        }

        function pickBest(predicate) {
          let best = null;
          for (const player of available) {
            if (used.has(player.id)) continue;
            if (!predicate(player)) continue;
            if (!best || comparePlayers(player, best) < 0) {
              best = player;
            }
          }
          if (best) {
            used.add(best.id);
          }
          return best;
        }

        function assignForcedPlayer(player) {
          if (player == null) return;
          const pos = String(player.pos || '').toUpperCase();
          if (useSlot(pos, player)) return;
          const flexFallback = Array.from(Object.keys(remaining)).filter((slot) => slot !== 'FLEX' && slotMatches(player, slot));
          for (const candidate of flexFallback) {
            if (useSlot(candidate, player)) return;
          }
          if (flexEligible.has(pos)) {
            useSlot('FLEX', player);
          }
        }

        const forcedPlayers = available.filter((player) => forceStart.has(player.id)).sort(comparePlayers);
        forcedPlayers.forEach(assignForcedPlayer);

        const orderedSlots = Object.entries(remaining)
          .filter(([slot]) => slot !== 'FLEX')
          .sort((a, b) => a[0].localeCompare(b[0]));

        for (const [slot, count] of orderedSlots) {
          for (let i = 0; i < count; i += 1) {
            const picked = pickBest((player) => slotMatches(player, slot));
            if (!picked) break;
            useSlot(slot, picked);
          }
        }

        const flexCount = remaining.FLEX || 0;
        for (let i = 0; i < flexCount; i += 1) {
          const picked = pickBest((player) => flexEligible.has(String(player.pos || '').toUpperCase()));
          if (!picked) break;
          useSlot('FLEX', picked);
        }

        const bench = players.filter((player) => !used.has(player.id)).sort(comparePlayers);
        const strength = recomputeStrength({ starters, bench, roster: players }, rules);

        return { starters, bench, strength };
      }

      async function loadData(week) {
        const weekKey = String(week);
        const assistantPath = state.index?.assistant?.[weekKey];
        if (!assistantPath) {
          throw new Error(`Assistant JSON missing for week ${week}`);
        }

        const bracketPath = state.index?.bracket?.[weekKey];
        const simPath = state.index?.sim?.[weekKey];

        const base = config.basePath || '';
        const makeFetch = (path) => fetch(`${base}${path}`, { cache: 'no-cache' });

        const [assistantRes, bracketRes, simRes] = await Promise.all([
        makeFetch(assistantPath),
        bracketPath ? makeFetch(bracketPath) : Promise.resolve(null),
        simPath ? makeFetch(simPath) : Promise.resolve(null),
        ]);

        if (!assistantRes?.ok) {
          throw new Error(`Failed to load ${assistantPath}`);
        }

        const assistant = await assistantRes.json();
        const bracket = bracketRes && bracketRes.ok ? await bracketRes.json() : null;
        const sim = simRes && simRes.ok ? await simRes.json() : null;
        return { assistant, bracket, sim };
      }

      async function loadRootManifest() {
        const prefixes = config.basePath ? [config.basePath] : ['', './', '../'];
        let lastError = null;
        for (const rawPrefix of prefixes) {
          const prefix = rawPrefix && !rawPrefix.endsWith('/') ? `${rawPrefix}/` : rawPrefix;
          const url = `${prefix || ''}index.json`;
          try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (!res.ok) {
              lastError = new Error(`Failed to load ${url} (${res.status})`);
              continue;
            }
            const payload = await res.json();
            state.rootIndex = payload;
            config.basePath = prefix === './' ? '' : (prefix || '');
            const leagues = Array.isArray(payload?.leagues) ? payload.leagues : [];
            state.leagues = leagues.map((entry) => ({
              slug: entry.slug,
              name: entry.name || entry.slug,
              latest_week: entry.latest_week ?? entry.latest,
              weeks: Array.isArray(entry.weeks) ? entry.weeks : [],
              index: entry.index || (entry.slug ? `reports/${entry.slug}/index.json` : null),
            })).filter((entry) => entry.slug);
            if (!state.leagues.length && payload?.assistant) {
              // Fallback: treat existing structure as single league
              const fallbackSlug = (config.meta.default_league || config.meta.subtitle || 'league').toString().trim() || 'league';
              state.leagues = [
                {
                  slug: fallbackSlug,
                  name: config.meta.subtitle || fallbackSlug,
                  latest_week: payload.latest,
                  weeks: Array.isArray(payload.weeks) ? payload.weeks : [],
                  index: 'reports/index.json',
                },
              ];
            }
            return;
          } catch (err) {
            lastError = err;
          }
        }
        throw lastError || new Error('Failed to load index.json');
      }

      async function loadLeagueManifest(slug) {
        if (!slug) {
          throw new Error('League slug missing');
        }
        const base = config.basePath || '';
        const entry = getLeagueEntry(slug);
        let relativePath = entry && typeof entry.index === 'string' && entry.index.trim()
          ? entry.index.trim()
          : `reports/${slug}/index.json`;
        if (relativePath.startsWith('/')) {
          relativePath = relativePath.slice(1);
        }
        const url = /^https?:/i.test(relativePath) ? relativePath : `${base}${relativePath}`;
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) {
          throw new Error(`Failed to load league index ${url} (${res.status})`);
        }
        const payload = await res.json();
        if (!payload || typeof payload !== 'object') {
          throw new Error(`Invalid league index for ${slug}`);
        }
        payload.slug = slug;
        state.index = payload;
        if (Array.isArray(payload.weeks)) {
          config.meta.weeks = payload.weeks;
        }
        return payload;
      }

      async function loadManagersSummary() {
        const slug = state.league;
        if (!slug) {
          state.managers = {
            ready: true,
            data: null,
            error: 'no_league',
          };
          return;
        }
        state.managers = {
          ready: false,
          data: null,
          error: null,
        };
        state.ops = {
          ready: false,
          data: null,
          error: null,
        };
        state.ops = {
          ready: false,
          data: null,
          error: null,
        };
        const base = config.basePath || '';
        let relPath = `reports/${slug}/managers_summary.json`;
        if (relPath.startsWith('/')) {
          relPath = relPath.slice(1);
        }
        const url = /^https?:/i.test(relPath) ? relPath : `${base}${relPath}`;
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res.ok) {
            state.managers = {
              ready: true,
              data: null,
              error: res.status,
            };
            return;
          }
          const payload = await res.json();
          state.managers = {
            ready: true,
            data: payload,
            error: null,
          };
        } catch (err) {
          state.managers = {
            ready: true,
            data: null,
            error: err?.message || 'fetch_failed',
          };
        }
      }

      async function loadOpsAnalytics(week) {
        const slug = state.league;
        if (!slug || !Number.isInteger(week)) {
          state.ops = {
            ready: true,
            data: null,
            error: slug ? 'no_week' : 'no_league',
          };
          return;
        }

        state.ops = {
          ready: false,
          data: null,
          error: null,
        };

        const base = config.basePath || '';
        let relPath = `reports/${slug}/analytics_week_${week}.json`;
        if (relPath.startsWith('/')) {
          relPath = relPath.slice(1);
        }
        const url = /^https?:/i.test(relPath) ? relPath : `${base}${relPath}`;
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res.ok) {
            state.ops = {
              ready: true,
              data: null,
              error: res.status,
            };
            return;
          }
          const payload = await res.json();
          state.ops = {
            ready: true,
            data: payload,
            error: null,
          };
        } catch (err) {
          state.ops = {
            ready: true,
            data: null,
            error: err?.message || 'fetch_failed',
          };
        }
      }

      function populateWeeks(preferredWeek = null) {
        const select = els.weekSelect;
        if (!select) {
          return null;
        }
        clearNode(select);
        const weeks = Array.isArray(state.index?.weeks)
          ? state.index.weeks
              .map((value) => Number(value))
              .filter((value) => Number.isInteger(value) && value > 0)
              .sort((a, b) => a - b)
          : [];
        if (!weeks.length) {
          const opt = create('option', { text: 'No weeks found', attrs: { value: '' } });
          select.appendChild(opt);
          select.disabled = true;
          return null;
        }
        select.disabled = false;
        weeks.forEach((week) => {
          const opt = create('option', { text: `Week ${week}`, attrs: { value: week } });
          select.appendChild(opt);
        });
        const latestRaw = Number(state.index?.latest);
        const latest = Number.isInteger(latestRaw) && weeks.includes(latestRaw) ? latestRaw : weeks[weeks.length - 1];
        const preferred = Number.isInteger(preferredWeek) && weeks.includes(preferredWeek) ? preferredWeek : latest;
        select.value = String(preferred);
        return preferred;
      }

      function populateLeagues(preferredSlug = null) {
        const select = els.leagueSelect;
        if (!select) {
          return null;
        }
        clearNode(select);
        const leagues = Array.isArray(state.leagues) ? state.leagues : [];
        if (!leagues.length) {
          select.disabled = true;
          return null;
        }
        select.disabled = leagues.length <= 1;
        leagues.forEach((entry) => {
          const option = create('option', {
            text: entry.name || entry.slug,
            attrs: { value: entry.slug },
          });
          select.appendChild(option);
        });
        const availableSlugs = leagues.map((entry) => entry.slug);
        const firstSlug = leagues[0].slug;
        const desired = preferredSlug && availableSlugs.includes(preferredSlug) ? preferredSlug : firstSlug;
        select.value = desired;
        if (select.parentElement) {
          select.parentElement.style.display = leagues.length > 1 ? '' : 'none';
        }
        return desired;
      }

      function resolveInitialLeague() {
        const availableSlugs = (state.leagues || []).map((entry) => entry.slug);
        if (!availableSlugs.length) {
          return null;
        }
        const params = getQueryParams();
        const queryLeagueRaw = params.get('league');
        const normalize = (value) => (value || '').trim();
        const queryLeague = normalize(queryLeagueRaw);
        if (queryLeague) {
          if (queryLeague.toLowerCase() === 'auto') {
            const autoSlug = config.meta.default_league && availableSlugs.includes(config.meta.default_league)
              ? config.meta.default_league
              : null;
            if (autoSlug) {
              return autoSlug;
            }
          } else if (availableSlugs.includes(queryLeague)) {
            return queryLeague;
          }
        }
        const stored = normalize(localStorage.getItem(LEAGUE_STORAGE_KEY));
        if (stored && availableSlugs.includes(stored)) {
          return stored;
        }
        const metaDefault = normalize(config.meta.default_league);
        if (metaDefault && availableSlugs.includes(metaDefault)) {
          return metaDefault;
        }
        return availableSlugs[0];
      }

      async function changeLeague(slug, options = {}) {
        const availableSlugs = (state.leagues || []).map((entry) => entry.slug);
        if (!availableSlugs.length) {
          throw new Error('No leagues available to load.');
        }
        const targetSlug = availableSlugs.includes(slug) ? slug : availableSlugs[0];
        if (els.leagueSelect) {
          populateLeagues(targetSlug);
        }
        if (state.league === targetSlug && !options.force) {
          const preferredWeek = Number.isInteger(options.week) ? options.week : state.week;
          const selectedWeek = populateWeeks(preferredWeek);
          if (Number.isInteger(selectedWeek) && selectedWeek !== state.week) {
            await loadWeek(selectedWeek);
          }
          return;
        }

        state.league = targetSlug;
        state.path = {
          ready: false,
          error: null,
          sos: null,
          targets: null,
          path: null,
          tweaks: [],
          clientSim: null,
          week: null,
        };
        state.managers = {
          ready: false,
          data: null,
          error: null,
        };
        updateDeliveryLinks();
        if (targetSlug) {
          try {
            localStorage.setItem(LEAGUE_STORAGE_KEY, targetSlug);
          } catch (err) {
            console.warn('Unable to persist league selection', err);
          }
        }

        await loadLeagueManifest(targetSlug);
        await loadManagersSummary();
        applyMeta();

        const preferredWeek = Number.isInteger(options.week) ? options.week : state.week;
        const selectedWeek = populateWeeks(preferredWeek);
        if (els.weekSelect && Number.isInteger(selectedWeek)) {
          els.weekSelect.value = String(selectedWeek);
        }
        state.week = Number.isInteger(selectedWeek) ? selectedWeek : null;
        updateQueryParams({ league: targetSlug, week: selectedWeek });
        if (Number.isInteger(selectedWeek)) {
          await loadWeek(selectedWeek);
        } else {
          renderFooter();
        }
      }

      async function loadWeek(week) {
        state.week = week;
        updateQueryParams({ week, league: state.league });
        const data = await loadData(week);
        state.assistant = data.assistant;
        state.bracket = data.bracket;
        state.sim = data.sim;
        state.riskThreshold = Number(state.assistant?.risk_threshold ?? state.riskThreshold ?? 0.4);

        state.scenario = defaultScenarioState();
        state.tradeFinder = state.tradeFinder || {};
        const finderList = Array.isArray(state.assistant?.trade_finder) ? state.assistant.trade_finder : [];
        state.tradeFinder.packages = finderList.map((entry, idx) => normalizeTradePackage(entry, idx));
        state.tradeFinder.filters = {
          teamA: 'ALL',
          teamB: 'ALL',
          pos: 'ALL',
          minFairness: 0.8,
        };
        state.tradeFinder.modal = null;
        state.remoteScenario = null;
        state.remoteScenarios = [];
        state.remoteScenarioIndex = {};

        const teams = Object.keys(state.assistant.lineups || {}).sort((a, b) => a.localeCompare(b));
        const datalist = els.teamOptions;
        clearNode(datalist);
        teams.forEach((team) => {
          datalist.appendChild(create('option', { attrs: { value: team } }));
        });

        populateTradeFilters(teams);

        if (els.tradeFilterTeamA) {
          els.tradeFilterTeamA.value = state.tradeFinder.filters.teamA;
        }
        if (els.tradeFilterTeamB) {
          els.tradeFilterTeamB.value = state.tradeFinder.filters.teamB;
        }

        if (els.tradeFilterFairness) {
          els.tradeFilterFairness.value = state.tradeFinder.filters.minFairness.toFixed(2);
        }
        if (els.tradeFilterFairnessValue) {
          els.tradeFilterFairnessValue.textContent = state.tradeFinder.filters.minFairness.toFixed(2);
        }

        initializeSandbox();
        initializeStartSit();
        initializeBracket();
        await loadScenariosForWeek();
        state.notifications = computeNotifications();
        await loadChangelog(week);
        await loadOpsAnalytics(week);
        await loadPathArtifacts(week);
        renderPath();
        buildSearchIndex();
        hideSearchResults();
        if (els.globalSearch) {
          els.globalSearch.value = '';
        }
        if (pendingScenarioFromHash) {
          const decodedScenario = pendingScenarioFromHash;
          pendingScenarioFromHash = null;
          suppressHashUpdate = true;
          importScenarioPayload(decodedScenario, { source: 'hash', preserveActive: true, silent: true, silentStatus: true });
          suppressHashUpdate = false;
          lastEncodedScenarioHash = getHashParams()[SCENARIO_HASH_PARAM] || lastEncodedScenarioHash;
          updateScenarioBadge();
        }
        setShareLabel(SHARE_LABEL_DEFAULT, false);
      }

      async function loadChangelog(week) {
        state.changelog = {
          ready: false,
          available: false,
          data: null,
          error: null,
        };
        const weekKey = String(week);
        const mapping = state.index?.changelog || {};
        const relPath = mapping[weekKey];
        if (!relPath) {
          state.changelog = {
            ready: true,
            available: false,
            data: null,
            error: 'not_found',
          };
          return;
        }
        const base = config.basePath || '';
        const url = `${base}${relPath}`;
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res || !res.ok) {
            state.changelog = {
              ready: true,
              available: false,
              data: null,
              error: res ? res.status : 'fetch_failed',
            };
            return;
          }
          const payload = await res.json();
          state.changelog = {
            ready: true,
            available: payload?.available !== false,
            data: payload,
            error: null,
          };
        } catch (err) {
          state.changelog = {
            ready: true,
            available: false,
            data: null,
            error: err,
          };
        }
      }

      async function loadPathArtifacts(week) {
        const prevState = state.path || {};
        const preserveTweaks = prevState.week === week ? prevState.tweaks || [] : [];
        state.path = {
          ready: false,
          error: null,
          sos: null,
          targets: null,
          path: null,
          tweaks: preserveTweaks.slice(),
          clientSim: null,
          week,
        };

        const key = String(week);
        const base = config.basePath || '';
        const leagueIndex = state.index || {};
        const sources = [
          { name: 'sos', mapping: leagueIndex.sos },
          { name: 'targets', mapping: leagueIndex.targets },
          { name: 'path', mapping: leagueIndex.path },
        ];
        const errors = [];

        await Promise.all(
          sources.map(async (source) => {
            const mapping = source.mapping || {};
            const relPath = mapping[key];
            if (!relPath) {
              return;
            }
            const url = `${base}${relPath}`;
            try {
              const res = await fetch(url, { cache: 'no-cache' });
              if (!res || !res.ok) {
                errors.push(`${source.name}:${res ? res.status : 'fetch_failed'}`);
                return;
              }
              const payload = await res.json();
              state.path[source.name] = payload;
            } catch (err) {
              errors.push(`${source.name}:error`);
            }
          })
        );

        state.path.ready = true;
        state.path.error = errors.length ? errors.join(', ') : null;
      }

      async function loadCompare() {
        const base = config.basePath || '';
        const url = `${base}compare.json`;
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res || !res.ok) {
            state.compare = {
              ready: true,
              data: null,
              error: res ? res.status : 'fetch_failed',
            };
            return;
          }
          const payload = await res.json();
          state.compare = {
            ready: true,
            data: {
              entries: Array.isArray(payload?.entries) ? payload.entries : [],
              requested_week: payload?.requested_week ?? null,
              shared_weeks: Array.isArray(payload?.shared_weeks) ? payload.shared_weeks : [],
              generated_at: payload?.generated_at || null,
              notes: Array.isArray(payload?.notes) ? payload.notes : [],
            },
            error: null,
          };
        } catch (err) {
          state.compare = {
            ready: true,
            data: null,
            error: err,
          };
        }
      }

      function initializeSandbox() {
        const assistant = state.assistant || {};
        const players = Array.isArray(assistant.players) ? assistant.players : [];
        const lineupRules = assistant.lineup_rules || {};
        const slots = Object.entries(lineupRules.slots || {}).reduce((acc, [slot, count]) => {
          acc[slot.toUpperCase()] = Math.max(0, Number(count) || 0);
          return acc;
        }, {});
        const flexEligible = (lineupRules.flex_eligible || lineupRules.flexEligible || []).map((pos) => String(pos || '').toUpperCase());

        if (!players.length || Object.keys(slots).length === 0) {
          state.sandbox = {
            ready: false,
            rules: { slots: {}, flexEligible: [] },
            teams: {},
            baselineStrengths: {},
            currentStrengths: {},
            baselineOdds: {},
            activeTeam: null,
            trade: { teamA: null, teamB: null, send: new Set(), receive: new Set() },
            lastChanges: [],
            message: 'Sandbox requires assistant JSON with players and lineup rules.',
            appliedTrades: [],
          };
          return;
        }

        const rosterMap = new Map();
        let idCounter = 0;
        players.forEach((playerRaw) => {
          const teamName = String(playerRaw.fantasy_team_name || 'Unknown');
          if (!rosterMap.has(teamName)) {
            rosterMap.set(teamName, []);
          }
          const playerId = playerRaw.player_id || `p${idCounter += 1}`;
          rosterMap.get(teamName).push({
            id: String(playerId),
            fantasy_team_name: teamName,
            player_name: playerRaw.player_name || 'Unknown',
            pos: String(playerRaw.pos || '').toUpperCase(),
            team: playerRaw.team || '',
            score: toNumber(playerRaw.score, 0),
            proj_points: toNumber(playerRaw.proj_points ?? playerRaw.score, 0),
            rank: playerRaw.rank === null || playerRaw.rank === undefined ? null : toNumber(playerRaw.rank, null),
          });
        });

        const teamNames = Array.from(rosterMap.keys()).sort((a, b) => a.localeCompare(b));
        const rules = { slots, flexEligible };
        const teams = {};
        const baselineStrengths = {};
        const currentStrengths = {};

        teamNames.forEach((teamName) => {
          const roster = rosterMap.get(teamName) || [];
          roster.sort(comparePlayers);
          const lineup = recomputeLineup(roster, rules, {});
          teams[teamName] = {
            players: roster,
            lineup,
            selections: {
              starters: new Set(),
              bench: new Set(),
            },
          };
          baselineStrengths[teamName] = lineup.strength;
          currentStrengths[teamName] = lineup.strength;
        });

        const baselineOdds = {};
        if (state.sim && Array.isArray(state.sim.summary)) {
          state.sim.summary.forEach((row) => {
            const teamName = row.team || row.fantasy_team_name;
            if (!teamName) return;
            baselineOdds[teamName] = {
              playoff: toNumber(row.playoff_odds, 0),
              title: toNumber(row.title_odds, 0),
              mean: toNumber(row.mean_wins ?? row.mean_remaining_wins, 0),
              median: toNumber(row.median_wins, 0),
            };
          });
        }

        const defaultTeam = state.sandbox?.activeTeam && teams[state.sandbox.activeTeam] ? state.sandbox.activeTeam : teamNames[0] || null;
        const tradeA = state.sandbox?.trade?.teamA && teams[state.sandbox.trade.teamA] ? state.sandbox.trade.teamA : teamNames[0] || null;
        let tradeB = state.sandbox?.trade?.teamB && teams[state.sandbox.trade.teamB] ? state.sandbox.trade.teamB : (teamNames[1] || teamNames[0] || null);
        if (tradeA && tradeB && tradeA === tradeB && teamNames.length > 1) {
          tradeB = teamNames.find((name) => name !== tradeA) || tradeB;
        }

        state.sandbox = {
          ready: teamNames.length > 0,
          rules,
          teams,
          baselineStrengths,
          currentStrengths,
          baselineOdds,
          activeTeam: defaultTeam,
          trade: {
            teamA: tradeA,
            teamB: tradeB,
            send: new Set(),
            receive: new Set(),
          },
          lastChanges: [],
          message: teamNames.length ? '' : 'No teams available for sandbox simulation.',
          appliedTrades: state.scenario?.trades || [],
        };
        state.rostersByTeam = {};
        teamNames.forEach((teamName) => {
          state.rostersByTeam[teamName] = teams[teamName].players;
        });
        if (!state.scenario) {
          state.scenario = defaultScenarioState();
        }
        state.scenario.trades = Array.isArray(state.scenario.trades) ? state.scenario.trades : [];
        state.sandbox.appliedTrades = state.scenario.trades;
      }

      function initializeStartSit() {
        const sandbox = state.sandbox || {};
        const assistant = state.assistant || {};
        const matchupsRaw = Array.isArray(assistant.matchups) ? assistant.matchups : [];

        if (!sandbox.ready) {
          state.startSit = {
            ready: false,
            matchups: [],
            selectedMatchup: null,
            teamStates: {},
            rules: { slots: {}, flexEligible: [] },
            message: 'Sandbox data unavailable; run the assistant export first.',
            results: null,
          };
          return;
        }

        const rules = sandbox.rules || { slots: {}, flexEligible: [] };
        const sandboxTeams = sandbox.teams || {};
        const teamStates = {};

        Object.entries(sandboxTeams).forEach(([teamName, teamData]) => {
          const players = (teamData.players || []).map((player) => ({
            ...player,
            proj_points: toNumber(player.proj_points ?? player.score, 0),
          }));
          const playerIndex = players.reduce((acc, player) => {
            acc[String(player.id)] = player;
            return acc;
          }, {});
          const baseline = recomputeLineup(players, rules, {});
          teamStates[teamName] = {
            players,
            baseline: cloneLineup(baseline),
            lineup: cloneLineup(baseline),
            forceStart: new Set(),
            forceBench: new Set(),
            playerIndex,
          };
        });

        const validMatchups = matchupsRaw
          .map((match, idx) => {
            if (!match || !match.away || !match.home) {
              return null;
            }
            const away = String(match.away);
            const home = String(match.home);
            if (!teamStates[away] || !teamStates[home]) {
              return null;
            }
            const rosterInfo = match.team_rosters || {};
            let rosterAway = Array.isArray(rosterInfo.away) ? rosterInfo.away.map(String) : [];
            let rosterHome = Array.isArray(rosterInfo.home) ? rosterInfo.home.map(String) : [];
            rosterAway = rosterAway.filter((id) => teamStates[away].playerIndex[id]);
            rosterHome = rosterHome.filter((id) => teamStates[home].playerIndex[id]);
            if (!rosterAway.length) {
              rosterAway = teamStates[away].players.map((player) => player.id);
            }
            if (!rosterHome.length) {
              rosterHome = teamStates[home].players.map((player) => player.id);
            }
            return {
              id: String(idx),
              label: `${away} @ ${home}`,
              away,
              home,
              team_rosters: {
                away: rosterAway.map(String),
                home: rosterHome.map(String),
              },
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.label.localeCompare(b.label));

        const ready = validMatchups.length > 0;
        state.startSit = {
          ready,
          matchups: validMatchups,
          selectedMatchup: ready ? validMatchups[0].id : null,
          teamStates,
          rules,
          message: ready
            ? ''
            : matchupsRaw.length
              ? 'Matchup roster details unavailable for this week.'
              : 'No matchup data available for this week.',
          results: null,
        };

        if (ready) {
          const matchup = getSelectedStartSitMatchup();
          buildSimulator(matchup);
        }
      }

      function getSelectedStartSitMatchup() {
        const startSit = state.startSit || {};
        if (!startSit.ready || !Array.isArray(startSit.matchups) || !startSit.matchups.length) {
          return null;
        }
        const selected = startSit.selectedMatchup;
        return startSit.matchups.find((match) => match.id === selected) || startSit.matchups[0];
      }

      function getRequiredStarterCount() {
        const slots = state.startSit?.rules?.slots || {};
        return Object.values(slots).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
      }

      function resetStartSitTeam(teamName) {
        const startSit = state.startSit || {};
        const teamState = startSit.teamStates?.[teamName];
        if (!teamState) {
          return;
        }
        teamState.forceStart = new Set();
        teamState.forceBench = new Set();
        const baseline = teamState.baseline || recomputeLineup(teamState.players, startSit.rules, {});
        teamState.lineup = cloneLineup(baseline);
      }

      function applyStartSitOverrides(teamName) {
        const startSit = state.startSit || {};
        const teamState = startSit.teamStates?.[teamName];
        if (!teamState) {
          return;
        }
        const lineup = recomputeLineup(teamState.players, startSit.rules, {
          forceStart: teamState.forceStart,
          forceBench: teamState.forceBench,
        });
        teamState.lineup = cloneLineup(lineup);
      }

      function buildSimulator(matchup) {
        if (!matchup || !state.startSit.ready) {
          return;
        }
        resetStartSitTeam(matchup.away);
        resetStartSitTeam(matchup.home);
        state.startSit.results = null;
      }

      function getSandboxTeamNames() {
        return Object.keys(state.sandbox?.teams || {}).sort((a, b) => a.localeCompare(b));
      }

      function renderSandbox() {
        if (!els.sandboxLineup) return;
        const sandbox = state.sandbox || {};
        if (!sandbox.ready) {
          if (els.sandboxTeam) clearNode(els.sandboxTeam);
          if (els.sandboxLineup) clearNode(els.sandboxLineup);
          if (els.sandboxBench) clearNode(els.sandboxBench);
          if (els.sandboxTradeSend) clearNode(els.sandboxTradeSend);
          if (els.sandboxTradeReceive) clearNode(els.sandboxTradeReceive);
          if (els.sandboxResults) {
            clearNode(els.sandboxResults);
            els.sandboxResults.appendChild(create('div', { className: 'empty-state', text: sandbox.message || t('empty.sandboxUnavailable', 'Sandbox unavailable.') }));
          }
          if (els.sandboxApplySwap) els.sandboxApplySwap.disabled = true;
          if (els.sandboxApplyTrade) els.sandboxApplyTrade.disabled = true;
          return;
        }

        renderSandboxTeamControls();
        renderSandboxLineup();
        renderSandboxTrade();

        if (!Array.isArray(sandbox.lastChanges) || !sandbox.lastChanges.length) {
          const active = sandbox.activeTeam;
          if (active) {
            const baseline = sandbox.baselineStrengths[active] || sandbox.currentStrengths[active];
            const current = sandbox.currentStrengths[active] || baseline;
            showResults([{ team: active, before: baseline, after: current }]);
          } else {
            showResults([]);
          }
        }
      }

      function updateSandboxMetrics(teamName) {
        if (!els.sandboxMetricOverall) return;
        const metrics = state.sandbox?.currentStrengths?.[teamName];
        if (!metrics) {
          els.sandboxMetricOverall.textContent = '–';
          els.sandboxMetricTop3.textContent = '–';
          els.sandboxMetricDepth.textContent = '–';
          return;
        }
        els.sandboxMetricOverall.textContent = formatNumber(metrics.overall, 3);
        els.sandboxMetricTop3.textContent = formatNumber(metrics.top3, 3);
        els.sandboxMetricDepth.textContent = formatNumber(metrics.depth, 3);
      }

      function renderSandboxTeamControls() {
        const sandbox = state.sandbox;
        const teamNames = getSandboxTeamNames();
        if (!els.sandboxTeam) return;
        clearNode(els.sandboxTeam);
        teamNames.forEach((team) => {
          els.sandboxTeam.appendChild(create('option', { text: team, attrs: { value: team } }));
        });
        if (sandbox.activeTeam && sandbox.teams[sandbox.activeTeam]) {
          els.sandboxTeam.value = sandbox.activeTeam;
        } else if (teamNames.length) {
          sandbox.activeTeam = teamNames[0];
          els.sandboxTeam.value = sandbox.activeTeam;
        }
        updateSandboxMetrics(sandbox.activeTeam);
      }

      function renderSandboxLineup() {
        const sandbox = state.sandbox;
        const teamName = sandbox.activeTeam;
        const teamState = teamName ? sandbox.teams[teamName] : null;

        if (els.sandboxLineup) clearNode(els.sandboxLineup);
        if (els.sandboxBench) clearNode(els.sandboxBench);

        if (!teamState) {
          els.sandboxLineup.appendChild(create('div', { className: 'empty-state', text: t('empty.sandboxSelectTeam', 'Select a team to view lineup.') }));
          if (els.sandboxApplySwap) els.sandboxApplySwap.disabled = true;
          return;
        }

        const startersTable = create('table');
        startersTable.appendChild(buildHeaderRow([
          ['label.benchQ', 'Bench?'],
          ['label.slot', 'Slot'],
          ['label.player', 'Player'],
          ['label.pos', 'Pos'],
          ['label.score', 'Score'],
        ]));
        const startersBody = create('tbody');
        teamState.lineup.starters.forEach((starter) => {
          const tr = create('tr');
          const checkbox = create('input', {
            attrs: {
              type: 'checkbox',
              'data-player-id': starter.id,
              'data-selection': 'starters',
            },
          });
          checkbox.checked = teamState.selections.starters.has(starter.id);
          const selectCell = create('td');
          selectCell.appendChild(checkbox);
          tr.appendChild(selectCell);
          tr.appendChild(create('td', { text: starter.slot || starter.pos || '' }));
          tr.appendChild(create('td', { text: starter.player_name || '' }));
          tr.appendChild(create('td', { text: starter.pos || '' }));
          tr.appendChild(create('td', { text: formatNumber(starter.score, 3) }));
          startersBody.appendChild(tr);
        });
        startersTable.appendChild(startersBody);
        els.sandboxLineup.appendChild(startersTable);

        const benchTable = create('table');
        benchTable.appendChild(buildHeaderRow([
          ['label.startQ', 'Start?'],
          ['label.player', 'Player'],
          ['label.pos', 'Pos'],
          ['label.score', 'Score'],
          ['label.rank', 'Rank'],
        ]));
        const benchBody = create('tbody');
        teamState.lineup.bench.forEach((player) => {
          const tr = create('tr');
          const checkbox = create('input', {
            attrs: {
              type: 'checkbox',
              'data-player-id': player.id,
              'data-selection': 'bench',
            },
          });
          checkbox.checked = teamState.selections.bench.has(player.id);
          const selectCell = create('td');
          selectCell.appendChild(checkbox);
          tr.appendChild(selectCell);
          tr.appendChild(create('td', { text: player.player_name || '' }));
          tr.appendChild(create('td', { text: player.pos || '' }));
          tr.appendChild(create('td', { text: formatNumber(player.score, 3) }));
          tr.appendChild(create('td', { text: player.rank === null || player.rank === undefined ? '–' : String(player.rank) }));
          benchBody.appendChild(tr);
        });
        benchTable.appendChild(benchBody);
        els.sandboxBench.appendChild(benchTable);

        updateSandboxSwapButton();
        updateSandboxMetrics(teamName);
      }

      function updateSandboxSwapButton() {
        if (!els.sandboxApplySwap) return;
        const sandbox = state.sandbox;
        const teamState = sandbox?.teams?.[sandbox.activeTeam];
        if (!teamState) {
          els.sandboxApplySwap.disabled = true;
          return;
        }
        const hasSelection = teamState.selections.starters.size > 0 || teamState.selections.bench.size > 0;
        els.sandboxApplySwap.disabled = !hasSelection;
      }

      function renderSandboxTrade() {
        const sandbox = state.sandbox;
        const teamNames = getSandboxTeamNames();
        const trade = sandbox.trade;

        if (els.sandboxTradeTeamA) {
          clearNode(els.sandboxTradeTeamA);
          teamNames.forEach((team) => {
            els.sandboxTradeTeamA.appendChild(create('option', { text: team, attrs: { value: team } }));
          });
          if (trade.teamA && sandbox.teams[trade.teamA]) {
            els.sandboxTradeTeamA.value = trade.teamA;
          } else if (teamNames.length) {
            trade.teamA = teamNames[0];
            els.sandboxTradeTeamA.value = trade.teamA;
          }
        }

        if (els.sandboxTradeTeamB) {
          clearNode(els.sandboxTradeTeamB);
          teamNames.forEach((team) => {
            els.sandboxTradeTeamB.appendChild(create('option', { text: team, attrs: { value: team } }));
          });
          if (trade.teamB && sandbox.teams[trade.teamB]) {
            els.sandboxTradeTeamB.value = trade.teamB;
          } else if (teamNames.length) {
            trade.teamB = teamNames[Math.min(1, teamNames.length - 1)];
            els.sandboxTradeTeamB.value = trade.teamB;
          }
          if (trade.teamA && trade.teamB && trade.teamA === trade.teamB && teamNames.length > 1) {
            const alt = teamNames.find((name) => name !== trade.teamA);
            if (alt) {
              trade.teamB = alt;
              els.sandboxTradeTeamB.value = alt;
            }
          }
        }

        if (els.sandboxTradeSend) clearNode(els.sandboxTradeSend);
        if (els.sandboxTradeReceive) clearNode(els.sandboxTradeReceive);

        const teamAState = trade.teamA ? sandbox.teams[trade.teamA] : null;
        const teamBState = trade.teamB ? sandbox.teams[trade.teamB] : null;

        if (teamAState && els.sandboxTradeSend) {
          teamAState.players.forEach((player) => {
            const label = create('label');
            const checkbox = create('input', {
              attrs: {
                type: 'checkbox',
                'data-player-id': player.id,
                'data-trade-type': 'send',
              },
            });
            checkbox.checked = trade.send.has(player.id);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(`${player.player_name || ''} (${player.pos || ''})`));
            label.appendChild(create('small', { text: formatNumber(player.score, 3) }));
            els.sandboxTradeSend.appendChild(label);
          });
        } else if (els.sandboxTradeSend) {
          els.sandboxTradeSend.appendChild(create('div', { className: 'empty-state', text: t('empty.sandboxSelectTeamA', 'Select Team A') }));
        }

        if (teamBState && els.sandboxTradeReceive) {
          teamBState.players.forEach((player) => {
            const label = create('label');
            const checkbox = create('input', {
              attrs: {
                type: 'checkbox',
                'data-player-id': player.id,
                'data-trade-type': 'receive',
              },
            });
            checkbox.checked = trade.receive.has(player.id);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(`${player.player_name || ''} (${player.pos || ''})`));
            label.appendChild(create('small', { text: formatNumber(player.score, 3) }));
            els.sandboxTradeReceive.appendChild(label);
          });
        } else if (els.sandboxTradeReceive) {
          els.sandboxTradeReceive.appendChild(create('div', { className: 'empty-state', text: t('empty.sandboxSelectTeamB', 'Select Team B') }));
        }

        updateTradeButtonState();
      }

      function updateTradeButtonState() {
        if (!els.sandboxApplyTrade) return;
        const trade = state.sandbox?.trade;
        if (!trade || !trade.teamA || !trade.teamB || trade.teamA === trade.teamB) {
          els.sandboxApplyTrade.disabled = true;
          return;
        }
        const hasSelection = trade.send.size > 0 || trade.receive.size > 0;
        els.sandboxApplyTrade.disabled = !hasSelection;
      }

      function handleSandboxSelection(event) {
        const target = event.target;
        if (!target || !target.matches('input[type="checkbox"][data-player-id]')) return;
        const selectionType = target.dataset.selection;
        const playerId = target.dataset.playerId;
        const team = state.sandbox?.activeTeam;
        const teamState = team ? state.sandbox?.teams?.[team] : null;
        if (!teamState || !selectionType || !playerId) return;
        const set = teamState.selections[selectionType];
        if (!set) return;
        if (target.checked) {
          set.add(playerId);
        } else {
          set.delete(playerId);
        }
        updateSandboxSwapButton();
      }

      function handleTradeSelection(event) {
        const target = event.target;
        if (!target || !target.matches('input[type="checkbox"][data-player-id]')) return;
        const tradeType = target.dataset.tradeType;
        const playerId = target.dataset.playerId;
        const trade = state.sandbox?.trade;
        if (!trade || !tradeType || !playerId) return;
        const set = tradeType === 'send' ? trade.send : trade.receive;
        if (target.checked) {
          set.add(playerId);
        } else {
          set.delete(playerId);
        }
        updateTradeButtonState();
      }

      function resetSandboxTeam() {
        const sandbox = state.sandbox;
        const team = sandbox.activeTeam;
        const teamState = team ? sandbox.teams[team] : null;
      if (!teamState) return;
      const before = sandbox.currentStrengths[team];
      teamState.selections.starters.clear();
      teamState.selections.bench.clear();
      teamState.lineup = recomputeLineup(teamState.players, sandbox.rules, {});
      sandbox.currentStrengths[team] = teamState.lineup.strength;
      showResults([{ team, before, after: teamState.lineup.strength }]);
      renderSandboxLineup();
    }

      function getTeamState(teamName) {
        const sandbox = state.sandbox || {};
        if (!sandbox.ready || !sandbox.teams) return null;
        return sandbox.teams[teamName] || null;
      }

      function findPlayerInTeam(teamName, playerId) {
        const teamState = getTeamState(teamName);
        if (!teamState) return null;
        const id = String(playerId);
        return teamState.players.find((player) => String(player.id) === id) || null;
      }

      function positionShortage(teamState, position) {
        if (!teamState || !position) return false;
        const sandbox = state.sandbox || {};
        const rules = sandbox.rules || { slots: {}, flexEligible: [] };
        const slots = rules.slots || {};
        const posKey = String(position || '').toUpperCase();
        const required = Number(slots[posKey] || 0);
        const starters = Array.isArray(teamState.lineup?.starters) ? teamState.lineup.starters : [];
        let current = 0;
        starters.forEach((player) => {
          const slot = String(player.slot || player.pos || '').toUpperCase();
          if (slot === posKey) {
            current += 1;
          }
        });
        if (current < required) {
          return true;
        }
        const flexSlots = Number(slots.FLEX || 0);
        if (flexSlots <= 0) {
          return false;
        }
        const flexEligible = new Set((rules.flexEligible || []).map((pos) => String(pos).toUpperCase()));
        if (!flexEligible.has(posKey)) {
          return false;
        }
        const flexStarters = starters.filter((player) => {
          const slot = String(player.slot || '').toUpperCase();
          if (slot === posKey) return false;
          return slot === 'FLEX' && flexEligible.has(String(player.pos || '').toUpperCase());
        });
        return flexStarters.length < flexSlots;
      }

      function normalizeTradePackage(entry, idx = 0) {
        if (!entry || typeof entry !== 'object') {
          return {
            id: `trade-${idx}`,
            teamA: '',
            teamB: '',
            teams: { A: '', B: '' },
            A_players: [],
            B_players: [],
            fairness: 0,
            deltaA: 0,
            deltaB: 0,
            rationale: '',
          };
        }
        const teamA = entry.teamA || entry.teams?.A || '';
        const teamB = entry.teamB || entry.teams?.B || '';
        const cleanPlayers = (players, prefix) => (players || []).map((player, index) => {
          const idValue = player?.player_id ?? player?.id ?? `${idx}-${prefix}-${index}`;
          return {
            id: String(idValue),
            player_id: String(idValue),
            name: player?.player_name || player?.name || '',
            pos: String(player?.pos || '').toUpperCase(),
            team: player?.team || '',
            score: toNumber(player?.score, 0),
            raw: player || {},
          };
        });
        return {
          id: `trade-${idx}`,
          teamA: String(teamA || ''),
          teamB: String(teamB || ''),
          teams: {
            A: String(teamA || ''),
            B: String(teamB || ''),
          },
          A_players: cleanPlayers(entry.A_sends, 'A'),
          B_players: cleanPlayers(entry.B_sends, 'B'),
          fairness: toNumber(entry.fairness, 0),
          deltaA: toNumber(entry.deltaA, 0),
          deltaB: toNumber(entry.deltaB, 0),
          rationale: entry.rationale || '',
        };
      }

      function populateTradeFilters(teams) {
        const options = ['ALL', ...teams];
        const populate = (select) => {
          if (!select) return;
          clearNode(select);
          options.forEach((team) => {
            const label = team === 'ALL' ? 'All teams' : team;
            const option = create('option', { text: label, attrs: { value: team } });
            if (team === 'ALL') {
              option.selected = true;
            }
            select.appendChild(option);
          });
        };
        populate(els.tradeFilterTeamA);
        populate(els.tradeFilterTeamB);
        if (els.tradeFilterPos) {
          els.tradeFilterPos.value = 'ALL';
        }
      }

      function onSwap() {
        const sandbox = state.sandbox;
        const team = sandbox.activeTeam;
        const teamState = team ? sandbox.teams[team] : null;
        if (!teamState) return;
        const before = sandbox.currentStrengths[team];
        const overrides = {
          forceStart: new Set(teamState.selections.bench),
          forceBench: new Set(teamState.selections.starters),
        };
        teamState.lineup = recomputeLineup(teamState.players, sandbox.rules, overrides);
        teamState.selections = {
          starters: new Set(),
          bench: new Set(),
        };
        sandbox.currentStrengths[team] = teamState.lineup.strength;
        state.scenario.source = 'manual';
        showResults([{ team, before, after: teamState.lineup.strength }]);
        refreshScenarioOutputs();
      }

      function applyTradeToState(pkg, options = {}) {
        const sandbox = state.sandbox;
        if (!sandbox || !sandbox.ready) {
          return { success: false, reason: 'Sandbox unavailable' };
        }
        const teamA = pkg?.teamA;
        const teamB = pkg?.teamB;
        if (!teamA || !teamB || teamA === teamB) {
          return { success: false, reason: 'Select two different teams' };
        }

        const teamAState = getTeamState(teamA);
        const teamBState = getTeamState(teamB);
        if (!teamAState || !teamBState) {
          return { success: false, reason: 'Team data missing' };
        }

        const normalizeIds = (items) =>
          (items || [])
            .map((item) => {
              if (!item) return null;
              if (typeof item === 'object') {
                if (item.id !== undefined) return String(item.id);
                if (item.player_id !== undefined) return String(item.player_id);
              }
              return String(item);
            })
            .filter(Boolean);

        const sendAIds = normalizeIds(pkg.sendA || pkg.A_sends || []);
        const sendBIds = normalizeIds(pkg.sendB || pkg.B_sends || []);

        const sendAPlayers = sendAIds.map((id) => findPlayerInTeam(teamA, id));
        const sendBPlayers = sendBIds.map((id) => findPlayerInTeam(teamB, id));

        if (sendAPlayers.some((player) => !player) || sendBPlayers.some((player) => !player)) {
          return { success: false, reason: 'Players unavailable for trade' };
        }

        const beforeA = sandbox.currentStrengths[teamA];
        const beforeB = sandbox.currentStrengths[teamB];

        const sendASet = new Set(sendAIds);
        const sendBSet = new Set(sendBIds);

        teamAState.players = teamAState.players.filter((player) => !sendASet.has(String(player.id)));
        teamBState.players = teamBState.players.filter((player) => !sendBSet.has(String(player.id)));

        sendAPlayers.forEach((player) => {
          player.fantasy_team_name = teamB;
          teamBState.players.push(player);
        });
        sendBPlayers.forEach((player) => {
          player.fantasy_team_name = teamA;
          teamAState.players.push(player);
        });

        teamAState.players.sort(comparePlayers);
        teamBState.players.sort(comparePlayers);

        teamAState.selections = { starters: new Set(), bench: new Set() };
        teamBState.selections = { starters: new Set(), bench: new Set() };

        teamAState.lineup = recomputeLineup(teamAState.players, sandbox.rules, {});
        teamBState.lineup = recomputeLineup(teamBState.players, sandbox.rules, {});

        sandbox.currentStrengths[teamA] = teamAState.lineup.strength;
        sandbox.currentStrengths[teamB] = teamBState.lineup.strength;

        state.rostersByTeam[teamA] = teamAState.players;
        state.rostersByTeam[teamB] = teamBState.players;

        const record = options.record || {
          teamA,
          outA: sendAIds.slice(),
          teamB,
          outB: sendBIds.slice(),
        };

        if (options.appendRecord !== false) {
          state.scenario.trades.push(record);
        }
        if (options.recordHistory !== false) {
          state.scenario.history.push({ type: 'trade', record });
        }
        state.scenario.source = options.source || state.scenario.source || 'manual';
        sandbox.appliedTrades = state.scenario.trades;

        syncScenarioState();

        const summary = [
          { team: teamA, before: beforeA, after: teamAState.lineup.strength },
          { team: teamB, before: beforeB, after: teamBState.lineup.strength },
        ];

        if (!options.silent) {
          showResults(summary);
          refreshScenarioOutputs();
        }

        return { success: true, summary, record };
      }

      function onApplyTrade() {
        const sandbox = state.sandbox;
        const trade = sandbox.trade;
        const teamA = trade.teamA;
        const teamB = trade.teamB;
        if (!teamA || !teamB || teamA === teamB) return;
        const teamAState = sandbox.teams[teamA];
        const teamBState = sandbox.teams[teamB];
        if (!teamAState || !teamBState) return;

        const sendPlayers = teamAState.players.filter((player) => trade.send.has(player.id));
        const receivePlayers = teamBState.players.filter((player) => trade.receive.has(player.id));
        if (!sendPlayers.length && !receivePlayers.length) return;
        const result = applyTradeToState({
          teamA,
          teamB,
          sendA: sendPlayers.map((player) => player.id),
          sendB: receivePlayers.map((player) => player.id),
        });

        trade.send = new Set();
        trade.receive = new Set();

        sandbox.activeTeam = teamA;

        renderSandboxTeamControls();
        renderSandboxLineup();
        renderSandboxTrade();
        if (!result.success) {
          updateTradeButtonState();
        }
      }

      function computeAdjustedOdds() {
        const sandbox = state.sandbox;
        if (!sandbox || !sandbox.baselineOdds || !state.sim || !Array.isArray(state.sim.summary)) {
          return [];
        }
        const baselineStrengths = sandbox.baselineStrengths || {};
        const currentStrengths = sandbox.currentStrengths || {};
        const rows = state.sim.summary
          .map((row) => {
            const team = row.team || row.fantasy_team_name;
            if (!team) return null;
            const baselineStrength = baselineStrengths[team]?.overall ?? 0.0001;
            const currentStrength = currentStrengths[team]?.overall ?? baselineStrength;
            const ratio = baselineStrength > 0 ? currentStrength / baselineStrength : 1;
            const odds = sandbox.baselineOdds[team] || { playoff: 0, title: 0, mean: 0, median: 0 };
            return {
              team,
              playoff_odds: clamp(odds.playoff * ratio, 0, 1),
              title_odds: clamp(odds.title * Math.pow(ratio, 1.1), 0, 1),
              mean_wins: odds.mean * ratio,
              median_wins: odds.median * ratio,
            };
          })
          .filter(Boolean);

        const baselinePlayoffTotal = state.sim.summary.reduce((sum, entry) => sum + toNumber(entry.playoff_odds, 0), 0);
        const adjustedPlayoffTotal = rows.reduce((sum, entry) => sum + entry.playoff_odds, 0);
        if (adjustedPlayoffTotal > 0 && baselinePlayoffTotal > 0) {
          const scale = baselinePlayoffTotal / adjustedPlayoffTotal;
          rows.forEach((entry) => {
            entry.playoff_odds = clamp(entry.playoff_odds * scale, 0, 1);
          });
        }

        const baselineTitleTotal = state.sim.summary.reduce((sum, entry) => sum + toNumber(entry.title_odds, 0), 0);
        const adjustedTitleTotal = rows.reduce((sum, entry) => sum + entry.title_odds, 0);
        if (adjustedTitleTotal > 0 && baselineTitleTotal > 0) {
          const scale = baselineTitleTotal / adjustedTitleTotal;
          rows.forEach((entry) => {
            entry.title_odds = clamp(entry.title_odds * scale, 0, 1);
          });
        }

        return rows.sort((a, b) => b.playoff_odds - a.playoff_odds);
      }

      function showResults(changes) {
        if (!els.sandboxResults) return;
        const sandbox = state.sandbox;
        sandbox.lastChanges = Array.isArray(changes) ? changes.filter((change) => change && change.team) : [];
        clearNode(els.sandboxResults);

        if (!sandbox.lastChanges.length) {
          els.sandboxResults.appendChild(create('div', { className: 'empty-state', text: t('empty.sandboxImpact', 'Make a swap or trade to see the impact.') }));
          return;
        }

        const teamHeader = create('h3', { text: 'Team Impact' });
        const teamList = create('div', { className: 'sandbox-result-teams' });
        sandbox.lastChanges.forEach((change) => {
          const before = change.before || { overall: 0, top3: 0, depth: 0 };
          const after = change.after || before;
          const card = create('div', { className: 'sandbox-team-card' });
          card.appendChild(create('strong', { text: change.team }));
          card.appendChild(create('span', { text: `Overall: ${formatNumber(before.overall, 3)} → ${formatNumber(after.overall, 3)} (${formatDelta(after.overall, before.overall, 3)})` }));
          card.appendChild(create('span', { text: `Top-3: ${formatNumber(before.top3, 3)} → ${formatNumber(after.top3, 3)} (${formatDelta(after.top3, before.top3, 3)})` }));
          card.appendChild(create('span', { text: `Depth: ${formatNumber(before.depth, 3)} → ${formatNumber(after.depth, 3)} (${formatDelta(after.depth, before.depth, 3)})` }));
          teamList.appendChild(card);
        });
        els.sandboxResults.appendChild(teamHeader);
        els.sandboxResults.appendChild(teamList);

        const powerHeader = create('h3', { text: 'Updated Power Top 5' });
        const powerList = create('ol', { className: 'sandbox-power-list' });
        const powerRanks = Object.entries(state.sandbox.currentStrengths || {})
          .map(([team, strength]) => ({ team, overall: strength.overall }))
          .sort((a, b) => b.overall - a.overall)
          .slice(0, 5);
        powerRanks.forEach((rank, idx) => {
          const item = create('li');
          item.appendChild(create('span', { text: `${idx + 1}. ${rank.team}` }));
          item.appendChild(create('span', { text: formatNumber(rank.overall, 3) }));
          powerList.appendChild(item);
        });
        if (!powerRanks.length) {
          powerList.appendChild(create('li', { text: 'No strength data available.' }));
        }
        els.sandboxResults.appendChild(powerHeader);
        els.sandboxResults.appendChild(powerList);

        const playoffHeader = create('h3', { text: 'Adjusted Playoff Odds' });
        const odds = computeAdjustedOdds();
        if (!odds.length) {
          els.sandboxResults.appendChild(playoffHeader);
          els.sandboxResults.appendChild(create('div', { className: 'empty-state', text: t('empty.seasonSimUnavailable', 'Season simulation data unavailable.') }));
        } else {
          const table = create('table', { className: 'sandbox-playoff-table' });
          table.appendChild(buildHeaderRow([
            ['label.teamName', 'Team'],
            ['table.playoffs.meanWins', 'Mean Wins'],
            ['table.playoffs.medianWins', 'Median Wins'],
            ['table.playoffs.playoffOdds', 'Playoff Odds'],
            ['table.playoffs.titleOdds', 'Title Odds'],
          ]));
          const tbody = create('tbody');
          odds.forEach((row) => {
            const tr = create('tr');
            tr.appendChild(create('td', { text: row.team }));
            tr.appendChild(create('td', { text: formatNumber(row.mean_wins, 2) }));
            tr.appendChild(create('td', { text: formatNumber(row.median_wins, 2) }));
            tr.appendChild(create('td', { text: formatPercent(row.playoff_odds, 1) }));
            tr.appendChild(create('td', { text: formatPercent(row.title_odds, 2) }));
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          els.sandboxResults.appendChild(playoffHeader);
          els.sandboxResults.appendChild(table);
        }
      }

      function defaultScenarioState() {
        return {
          trades: [],
          lineup_swaps: {},
          seeds_override: [],
          history: [],
          source: 'baseline',
        };
      }

      function syncScenarioState() {
        if (!state.scenario) {
          state.scenario = defaultScenarioState();
        }
        state.scenario.lineup_swaps = collectLineupSwaps();
        const seeds = Array.isArray(state.bracketSim?.seeds) ? state.bracketSim.seeds : [];
        const defaults = Array.isArray(state.bracketSim?.defaultSeeds) ? state.bracketSim.defaultSeeds : [];
        state.scenario.seeds_override = arraysEqual(seeds, defaults) ? [] : seeds.slice();
      }

      function scenarioHasChanges() {
        const scenario = state.scenario || defaultScenarioState();
        if (Array.isArray(scenario.trades) && scenario.trades.length) return true;
        if (scenario.lineup_swaps && Object.keys(scenario.lineup_swaps).length) return true;
        if (Array.isArray(scenario.seeds_override) && scenario.seeds_override.length) return true;
        return false;
      }

      function updateScenarioBadge() {
        if (!els.scenarioStatus) return;
        const modified = scenarioHasChanges();
        if (modified) {
          const scenario = state.scenario || defaultScenarioState();
          let label = 'Scenario: modified';
          if (scenario.source === 'hash') {
            label = 'Scenario: shared link';
          } else if (scenario.source === 'imported') {
            label = 'Scenario: imported';
          }
          els.scenarioStatus.textContent = label;
          els.scenarioStatus.hidden = false;
        } else {
          els.scenarioStatus.textContent = 'Scenario: modified';
          els.scenarioStatus.hidden = true;
        }
      }

      function refreshScenarioOutputs() {
        syncScenarioState();
        if (state.tradeFinder?.modal && els.tradeModal && !els.tradeModal.hidden) {
          closeCustomTradeModal();
        }
        initializeStartSit();
        renderSandbox();
        renderStartSit();
        renderStartSitSimulator();
        renderLineups();
        renderTradeFinder();
        renderScenarioSummary();
        renderBracket();
        renderPlayoffs();
        state.notifications = computeNotifications();
        renderNotifications();
        renderPower();
        renderWaivers();
        renderManagers();
        renderMatchups();
        updateScenarioBadge();
        updateScenarioHash();
        renderFooter();
      }

      function passesTeamFilter(team) {
        if (!state.teamFilter) return true;
        return team.toLowerCase().includes(state.teamFilter.toLowerCase());
      }

      function evalTradePkg(pkg) {
        if (!pkg) {
          return { deltaA: 0, deltaB: 0, fairness: 0, available: false };
        }
        const teamAState = getTeamState(pkg.teamA);
        const teamBState = getTeamState(pkg.teamB);
        if (!teamAState || !teamBState) {
          return {
            deltaA: toNumber(pkg.deltaA, 0),
            deltaB: toNumber(pkg.deltaB, 0),
            fairness: toNumber(pkg.fairness, 0),
            available: false,
          };
        }

        const receivedByA = pkg.B_players || [];
        const receivedByB = pkg.A_players || [];
        const sentByA = pkg.A_players || [];
        const sentByB = pkg.B_players || [];

        const missing = sentByA.some((player) => !findPlayerInTeam(pkg.teamA, player.id))
          || sentByB.some((player) => !findPlayerInTeam(pkg.teamB, player.id));

        const bonusScore = (player, receivingTeam) => {
          const base = toNumber(player.score, 0);
          if (positionShortage(receivingTeam, player.pos)) {
            return base * 1.2;
          }
          return base;
        };

        const scoreAOut = sentByA.reduce((sum, player) => sum + toNumber(player.score, 0), 0);
        const scoreBOut = sentByB.reduce((sum, player) => sum + toNumber(player.score, 0), 0);
        const scoreAIn = receivedByA.reduce((sum, player) => sum + bonusScore(player, teamAState), 0);
        const scoreBIn = receivedByB.reduce((sum, player) => sum + bonusScore(player, teamBState), 0);

        const deltaA = scoreAIn - scoreAOut;
        const deltaB = scoreBIn - scoreBOut;
        const denominator = Math.abs(scoreAIn) + Math.abs(scoreBIn) + Math.abs(scoreAOut) + Math.abs(scoreBOut) + 1e-6;
        const fairness = clamp(1 - Math.abs(deltaA - deltaB) / denominator, 0, 1);

        return {
          deltaA,
          deltaB,
          fairness,
          available: !missing,
        };
      }

      function renderTradeFinder() {
        if (!els.tradeTableBody) return;
        const packages = state.tradeFinder?.packages || [];
        const filters = state.tradeFinder?.filters || { teamA: 'ALL', teamB: 'ALL', pos: 'ALL', minFairness: 0.8 };
        clearNode(els.tradeTableBody);

        if (els.tradeFilterFairness && Number(els.tradeFilterFairness.value) !== Number(filters.minFairness)) {
          els.tradeFilterFairness.value = Number(filters.minFairness).toFixed(2);
        }
        if (els.tradeFilterFairnessValue) {
          els.tradeFilterFairnessValue.textContent = Number(filters.minFairness).toFixed(2);
        }

        if (!packages.length) {
          const row = create('tr');
          const cell = create('td', { text: 'No trade ideas available for this week.', attrs: { colspan: '7' } });
          row.appendChild(cell);
          els.tradeTableBody.appendChild(row);
          if (els.tradeCustomOpen) {
            els.tradeCustomOpen.disabled = !state.sandbox?.ready;
          }
          return;
        }

        const matcher = (pkg) => {
          if (filters.teamA && filters.teamA !== 'ALL' && pkg.teamA !== filters.teamA) return false;
          if (filters.teamB && filters.teamB !== 'ALL' && pkg.teamB !== filters.teamB) return false;
          if (filters.pos && filters.pos !== 'ALL') {
            const posKey = String(filters.pos).toUpperCase();
            const matches = [...pkg.A_players, ...pkg.B_players].some((player) => String(player.pos).toUpperCase() === posKey);
            if (!matches) return false;
          }
          return true;
        };

        const evaluated = packages
          .map((pkg) => {
            const scores = evalTradePkg(pkg);
            return { pkg, scores };
          })
          .filter(({ pkg }) => matcher(pkg))
          .filter(({ scores }) => scores.fairness >= (filters.minFairness || 0));

        evaluated.sort((a, b) => b.scores.fairness - a.scores.fairness);

        if (!evaluated.length) {
          const row = create('tr');
          const message = filters.teamA !== 'ALL' || filters.teamB !== 'ALL' || (filters.pos && filters.pos !== 'ALL')
            ? 'No trades match the current filters.'
            : 'No trades meet the fairness threshold.';
          row.appendChild(create('td', { text: message, attrs: { colspan: '7' } }));
          els.tradeTableBody.appendChild(row);
          if (els.tradeCustomOpen) {
            els.tradeCustomOpen.disabled = !state.sandbox?.ready;
          }
          return;
        }

        evaluated.forEach(({ pkg, scores }) => {
          const row = create('tr');
          row.appendChild(create('td', { text: formatNumber(scores.fairness, 2) }));
          row.appendChild(create('td', { html: renderTradeSide(pkg.A_players) }));
          row.appendChild(create('td', { html: renderTradeSide(pkg.B_players) }));
          row.appendChild(create('td', { text: formatNumber(scores.deltaA, 2) }));
          row.appendChild(create('td', { text: formatNumber(scores.deltaB, 2) }));
          row.appendChild(create('td', { text: pkg.rationale || '—' }));

          const actionCell = create('td');
          const button = create('button', { className: 'primary', text: 'Apply' });
          if (!scores.available || !state.sandbox?.ready) {
            button.disabled = true;
            if (!scores.available) {
              button.textContent = 'Unavailable';
            }
          }
          button.addEventListener('click', () => {
            const outcome = applyTradeToState({
              teamA: pkg.teamA,
              teamB: pkg.teamB,
              sendA: pkg.A_players.map((player) => player.id),
              sendB: pkg.B_players.map((player) => player.id),
            });
            if (!outcome.success) {
              alert(outcome.reason || 'Unable to apply this trade.');
            }
          });
          actionCell.appendChild(button);
          row.appendChild(actionCell);
          els.tradeTableBody.appendChild(row);
        });

        if (els.tradeCustomOpen) {
          els.tradeCustomOpen.disabled = !state.sandbox?.ready;
        }
      }

      function renderTradeSide(players) {
        if (!players || !players.length) {
          return '<span class="muted">—</span>';
        }
        return players
          .map((player) => `${player.name || player.player_name || 'Unknown'} <span class="muted">(${player.pos || '?'})</span>`)
          .join('<br>');
      }

      function renderScenarioSummary() {
        if (!els.tradeScenarioSummary) return;
        if (!state.sandbox || !state.sandbox.ready) {
          clearNode(els.tradeScenarioSummary);
          els.tradeScenarioSummary.appendChild(create('div', { className: 'empty-state', text: t('empty.scenarioData', 'Scenario tools require assistant JSON with roster data.') }));
          if (els.tradeScenarioStats) {
            clearNode(els.tradeScenarioStats);
          }
          if (els.tradeLineupBadge) {
            els.tradeLineupBadge.hidden = true;
          }
          updateScenarioBadge();
          return;
        }
        const scenario = state.scenario || defaultScenarioState();
        const tradesCount = Array.isArray(scenario.trades) ? scenario.trades.length : 0;
        const swaps = collectLineupSwaps();
        const swapCount = Object.keys(swaps).length;
        const seedsCount = Array.isArray(scenario.seeds_override) ? scenario.seeds_override.length : 0;

        if (els.tradeScenarioStats) {
          clearNode(els.tradeScenarioStats);
          els.tradeScenarioStats.appendChild(create('div', { text: `Trades applied: ${tradesCount}` }));
          els.tradeScenarioStats.appendChild(create('div', { text: `Lineup swaps: ${swapCount}` }));
          els.tradeScenarioStats.appendChild(create('div', { text: `Seed overrides: ${seedsCount}` }));
        }

        if (els.tradeLineupBadge) {
          els.tradeLineupBadge.hidden = swapCount === 0;
        }

        clearNode(els.tradeScenarioSummary);

        const deltaEntries = computeScenarioDeltas();
        if (!tradesCount && !swapCount && !seedsCount && !deltaEntries.length) {
          els.tradeScenarioSummary.appendChild(create('div', { className: 'empty-state', text: t('empty.scenarioNone', 'No scenario changes applied.') }));
        } else if (!deltaEntries.length) {
          els.tradeScenarioSummary.appendChild(create('div', { text: 'No strength deltas yet. Apply trades or swaps to see changes.' }));
        } else {
          deltaEntries.forEach((entry) => {
            const row = create('div', { html: `<strong>${entry.team}</strong> · ΔOverall ${formatNumber(entry.delta, 3)} (baseline ${formatNumber(entry.before, 3)} → ${formatNumber(entry.after, 3)})` });
            els.tradeScenarioSummary.appendChild(row);
          });
        }
        updateScenarioBadge();
      }

      function renderChangelog() {
        if (!els.changelogBody) return;
        clearNode(els.changelogBody);
        const changelogState = state.changelog || {};
        if (!changelogState.ready) {
          els.changelogBody.appendChild(create('div', { className: 'empty-state', text: t('empty.changelogLoading', 'Loading changelog…') }));
          return;
        }
        if (!changelogState.available || !changelogState.data) {
          let message = 'No prior week to compare yet.';
          if (changelogState.error === 'not_found') {
            message = 'Changelog not available for this league/week.';
          } else if (changelogState.error) {
            message = 'Unable to load changelog.';
          } else if (!state.week || state.week <= 1) {
            message = 'Run a second week to see changes.';
          }
          els.changelogBody.appendChild(create('div', { className: 'empty-state', text: message }));
          return;
        }

        const data = changelogState.data;
        const prevWeek = data.prev_week;

        const teamRows = Array.isArray(data.team_strength_deltas) ? data.team_strength_deltas : [];
        if (teamRows.length) {
          const section = create('div');
          section.appendChild(create('h3', { text: 'Team Strength Deltas' }));
          const table = create('table');
          table.appendChild(buildHeaderRow([
            ['label.teamName', 'Team'],
            ['table.compare.deltaOverall', 'ΔOverall'],
            ['table.compare.deltaTop3', 'ΔTop-3'],
            ['table.compare.deltaDepth', 'ΔDepth'],
          ]));
          const tbody = create('tbody');
          teamRows.slice(0, 20).forEach((row) => {
            const tr = create('tr');
            tr.appendChild(create('td', { text: row.team }));
            tr.appendChild(create('td', { html: formatDeltaCell(row.delta_overall) }));
            tr.appendChild(create('td', { html: formatDeltaCell(row.delta_top3) }));
            tr.appendChild(create('td', { html: formatDeltaCell(row.delta_depth) }));
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          section.appendChild(table);
          els.changelogBody.appendChild(section);
        }

        const playoffRows = Array.isArray(data.playoff_odds_deltas) ? data.playoff_odds_deltas : [];
        if (playoffRows.length) {
          const section = create('div');
          section.appendChild(create('h3', { text: 'Playoff Odds Deltas' }));
          const table = create('table');
          table.appendChild(buildHeaderRow([
            ['label.teamName', 'Team'],
            ['table.targets.deltaPlayoff', 'ΔPlayoff %'],
            ['table.targets.deltaWins', 'ΔMean Wins'],
          ]));
          const tbody = create('tbody');
          playoffRows.slice(0, 20).forEach((row) => {
            const tr = create('tr');
            tr.appendChild(create('td', { text: row.team }));
            tr.appendChild(create('td', { html: formatDeltaCell(row.delta_playoff_odds * 100, true) }));
            tr.appendChild(create('td', { html: formatDeltaCell(row.delta_mean_wins) }));
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          section.appendChild(table);
          els.changelogBody.appendChild(section);
        }

        const lineupChanges = data.lineup_changes || {};
        const teamsWithLineupChanges = Object.keys(lineupChanges);
        if (teamsWithLineupChanges.length) {
          const section = create('div');
          section.appendChild(create('h3', { text: 'Lineup Changes' }));
          teamsWithLineupChanges.forEach((team) => {
            const changes = lineupChanges[team] || [];
            if (!Array.isArray(changes) || !changes.length) return;
            const teamBlock = create('div');
            teamBlock.appendChild(create('h4', { text: team }));
            const list = create('ul');
            changes.forEach((change) => {
              const prev = change.previous || '—';
              const cur = change.current || '—';
              list.appendChild(create('li', { html: `<strong>${change.slot}</strong>: ${prev} → ${cur}` }));
            });
            teamBlock.appendChild(list);
            section.appendChild(teamBlock);
          });
          els.changelogBody.appendChild(section);
        }

        const rosterChanges = data.roster_changes || {};
        const teamsWithRosterChanges = Object.keys(rosterChanges);
        if (teamsWithRosterChanges.length) {
          const section = create('div');
          section.appendChild(create('h3', { text: 'Roster Adds & Drops' }));
          teamsWithRosterChanges.forEach((team) => {
            const payload = rosterChanges[team] || {};
            const added = Array.isArray(payload.added) ? payload.added : [];
            const dropped = Array.isArray(payload.dropped) ? payload.dropped : [];
            const slotChangesRaw = Array.isArray(payload.slot_changes) ? payload.slot_changes : [];
            const starterSwaps = Array.isArray(payload.starter_swaps)
              ? payload.starter_swaps
              : payload.starter_swaps
              ? [payload.starter_swaps]
              : [];
            const formattedSlotChanges = slotChangesRaw.map((change) => {
              const player = change && (change.player || change.name) ? String(change.player || change.name) : 'Player';
              const from = change && change.from ? String(change.from) : '—';
              const to = change && change.to ? String(change.to) : '—';
              return `${player}: ${from} → ${to}`;
            });
            const slotChanges = formattedSlotChanges.length ? formattedSlotChanges : starterSwaps.map((entry) => String(entry));
            if (!added.length && !dropped.length && !slotChanges.length) {
              return;
            }
            const wrapper = create('div');
            wrapper.appendChild(create('h4', { text: team }));
            const list = create('ul');
            if (added.length) {
              list.appendChild(create('li', { html: `<strong>Added:</strong> ${added.join(', ')}` }));
            }
            if (dropped.length) {
              list.appendChild(create('li', { html: `<strong>Dropped:</strong> ${dropped.join(', ')}` }));
            }
            if (slotChanges.length) {
              const swapsList = slotChanges
                .map((entry) => `<li>${entry}</li>`)
                .join('');
              const swapsWrapper = create('li');
              swapsWrapper.innerHTML = `<strong>Starter changes:</strong><ul>${swapsList}</ul>`;
              list.appendChild(swapsWrapper);
            }
            wrapper.appendChild(list);
            section.appendChild(wrapper);
          });
          els.changelogBody.appendChild(section);
        }

        const highlights = Array.isArray(data.waiver_highlights) ? data.waiver_highlights : [];
        if (highlights.length) {
          const section = create('div');
          section.appendChild(create('h3', { text: 'Waiver Highlights' }));
          const list = create('ul');
          highlights.forEach((entry) => {
            const pos = entry.pos ? ` (${entry.pos})` : '';
            const score = Number.isFinite(entry.score) ? ` — score ${formatNumber(entry.score, 2)}` : '';
            list.appendChild(create('li', { text: `${entry.player}${pos} → ${entry.team}${score}` }));
          });
          section.appendChild(list);
          els.changelogBody.appendChild(section);
        }

        if (prevWeek !== undefined && prevWeek !== null) {
          els.changelogBody.appendChild(create('div', { className: 'changelog-note', text: `Compared vs week ${prevWeek}` }));
        }
      }

      function renderPath() {
        if (!els.pathTargets || !els.pathSos || !els.pathSwings || !els.pathSimulator) return;
        const targetsContainer = els.pathTargets;
        const sosContainer = els.pathSos;
        const swingsContainer = els.pathSwings;
        const simulatorContainer = els.pathSimulator;
        [targetsContainer, sosContainer, swingsContainer, simulatorContainer].forEach((node) => clearNode(node));

        const appendPlaceholder = (container, text) => {
          container.appendChild(create('div', { className: 'empty-state', text }));
        };

        const pathState = state.path || {};
        if (!pathState.ready) {
          appendPlaceholder(targetsContainer, 'Loading path data…');
          appendPlaceholder(sosContainer, 'Loading path data…');
          appendPlaceholder(swingsContainer, 'Loading path data…');
          appendPlaceholder(simulatorContainer, 'Loading path data…');
          return;
        }

        if (pathState.error && !pathState.sos && !pathState.targets && !pathState.path) {
          appendPlaceholder(targetsContainer, `Path data unavailable (${pathState.error})`);
          appendPlaceholder(sosContainer, 'Strength of schedule unavailable.');
          appendPlaceholder(swingsContainer, 'Impact games unavailable.');
          appendPlaceholder(simulatorContainer, 'Playoff simulator unavailable.');
          return;
        }

        renderPathTargets(targetsContainer, pathState);
        renderPathSos(sosContainer, pathState);
        renderPathSwings(swingsContainer, pathState);
        renderPathSimulator(simulatorContainer, pathState);
      }

      function renderPathTargets(container, pathState) {
        const targetsPayload = Array.isArray(pathState.targets?.targets) ? pathState.targets.targets : [];
        if (!targetsPayload.length) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.targetsUnavailable', 'Win targets not available for this week.') }));
          return;
        }

        const table = create('table', { className: 'path-table' });
        table.appendChild(create('thead', {
          html: '<tr><th>Team</th><th>On Pace</th><th>Wins Needed</th><th>Safe Target</th><th>Bubble</th><th>Wins So Far</th><th>Mean Wins</th></tr>',
        }));
        const tbody = create('tbody');
        targetsPayload
          .slice()
          .sort((a, b) => (a.team || '').localeCompare(b.team || ''))
          .forEach((row) => {
            const tr = create('tr');
            const onPace = Boolean(row.on_pace);
            const winsNeeded = Number(row.wins_needed ?? 0);
            tr.appendChild(create('td', { text: row.team || '' }));
            const paceCell = create('td', { text: onPace ? 'Yes' : 'No' });
            paceCell.classList.add(onPace ? 'path-ok' : 'path-warn');
            tr.appendChild(paceCell);
            const needCell = create('td', { text: String(winsNeeded) });
            if (winsNeeded > 0) {
              needCell.classList.add('path-warn');
            }
            tr.appendChild(needCell);
            tr.appendChild(create('td', { text: String(Number(row.target_safe ?? 0)) }));
            tr.appendChild(create('td', { text: String(Number(row.target_bubble ?? 0)) }));
            tr.appendChild(create('td', { text: formatNumber(Number(row.wins_so_far ?? 0), 1) }));
            tr.appendChild(create('td', { text: formatNumber(Number(row.mean_wins ?? 0), 1) }));
            tbody.appendChild(tr);
          });
        table.appendChild(tbody);
        container.appendChild(table);

        const mustWins = Array.isArray(pathState.targets?.must_wins) ? pathState.targets.must_wins : [];
        if (mustWins.length) {
          const list = create('ul', { className: 'path-list' });
          mustWins
            .slice()
            .sort((a, b) => (a.week ?? 0) - (b.week ?? 0) || String(a.team || '').localeCompare(String(b.team || '')))
            .forEach((item) => {
              const opponent = item.opponent || '';
              const text = t('text.mustWinEntry', 'Week {week}: {team} vs {opponent}')
                .replace('{week}', String(item.week))
                .replace('{team}', item.team || '')
                .replace('{opponent}', opponent);
              list.appendChild(create('li', { text }));
            });
          container.appendChild(create('h3', { text: t('heading.path.mustWins', 'Must-win Games'), className: 'path-subhead' }));
          container.appendChild(list);
        }
      }

      function renderPathSos(container, pathState) {
        const rows = Array.isArray(pathState.sos?.rows) ? pathState.sos.rows : [];
        const currentWeek = Number(state.week) || Number(pathState.week) || 1;
        const dataMap = new Map();
        const weekSet = new Set();
        rows.forEach((row) => {
          if (!row) return;
          const week = Number(row.week);
          if (!Number.isFinite(week) || week < currentWeek) return;
          const team = String(row.team || '');
          if (!team) return;
          if (!dataMap.has(team)) {
            dataMap.set(team, {});
          }
          dataMap.get(team)[week] = row;
          weekSet.add(week);
        });

        if (!dataMap.size) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.sosUnavailable', 'Remaining strength of schedule not available.') }));
          return;
        }

        const weeks = Array.from(weekSet).sort((a, b) => a - b);
        const teams = Array.from(dataMap.keys()).sort((a, b) => a.localeCompare(b));

        const table = create('table', { className: 'sos-table' });
        const thead = create('thead');
        const headerRow = create('tr');
        headerRow.appendChild(create('th', { text: t('label.teamName', 'Team') }));
        weeks.forEach((week) => {
          headerRow.appendChild(create('th', { text: `W${week}` }));
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = create('tbody');
        teams.forEach((team) => {
          const tr = create('tr');
          tr.appendChild(create('th', { text: team }));
          const teamWeeks = dataMap.get(team) || {};
          weeks.forEach((week) => {
            const info = teamWeeks[week];
            const td = create('td', { className: 'sos-cell' });
            if (info) {
              const strength = Number(info.opponent_strength ?? info.strength ?? 0);
              const delta = Number(info.delta ?? 0);
              const opponent = info.opponent || '';
              const favored = info.favored === true || info.favored === 'Y';
              const cls = classifySosCell(strength);
              if (cls) td.classList.add(cls);
              td.classList.add(favored ? 'sos-favored' : 'sos-underdog');
              td.setAttribute(
                'title',
                `Week ${week} vs ${opponent}\nOpp strength ${formatNumber(strength, 2)} · Δ ${formatNumber(delta, 2)}`
              );
              td.appendChild(create('div', { className: 'sos-opponent', text: opponent }));
              td.appendChild(create('div', { className: 'sos-value', text: formatNumber(strength, 2) }));
            } else {
              td.classList.add('sos-missing');
              td.textContent = '—';
            }
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);
      }

      function renderPathSwings(container, pathState) {
        const impact = Array.isArray(pathState.path?.impact) ? pathState.path.impact.slice(0, 10) : [];
        if (!impact.length) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.swingsUnavailable', 'No swing games identified yet.') }));
          return;
        }
        const list = create('ol', { className: 'path-impact-list' });
        impact.forEach((item) => {
          const impactText = `${formatNumber(Number(item.impact_pct ?? 0), 1)}% impact`;
          const text = `Week ${item.week}: ${item.away} @ ${item.home} — ${impactText}`;
          list.appendChild(create('li', { text }));
        });
        container.appendChild(create('h3', { text: t('heading.path.topSwings', 'Top Swing Games'), className: 'path-subhead' }));
        container.appendChild(list);
      }

      function renderPathSimulator(container, pathState) {
        const inputs = collectPathInputs();
        const currentWeek = Number(state.week) || Number(pathState.week) || 1;
        if (!Array.isArray(state.path.tweaks)) {
          state.path.tweaks = [];
        }
        const baseOdds = Array.isArray(pathState.path?.playoff_odds) ? pathState.path.playoff_odds : [];
        if (!baseOdds.length) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.playoffOdds', 'Playoff odds unavailable for this week.') }));
          return;
        }

        const baseMap = new Map(baseOdds.map((row) => [row.team, row]));
        const clientSim = pathState.clientSim;
        const clientMap = clientSim && Array.isArray(clientSim.playoff_odds)
          ? new Map(clientSim.playoff_odds.map((row) => [row.team, row]))
          : new Map();
        const teamSet = new Set([...baseMap.keys(), ...clientMap.keys()]);
        const teams = Array.from(teamSet).sort((a, b) => (baseMap.get(b)?.odds || 0) - (baseMap.get(a)?.odds || 0));

        const table = create('table', { className: 'path-odds' });
        const headerCells = clientMap.size
          ? [
              ['label.teamName', 'Team'],
              ['table.path.baseOdds', 'Base Odds'],
              ['table.path.tweakedOdds', 'Tweaked Odds'],
              ['table.path.delta', 'Δ'],
              ['table.path.meanWins', 'Mean Wins'],
            ]
          : [
              ['label.teamName', 'Team'],
              ['table.path.baseOdds', 'Base Odds'],
              ['table.path.meanWins', 'Mean Wins'],
            ];
        table.appendChild(buildHeaderRow(headerCells));
        const tbody = create('tbody');
        teams.forEach((team) => {
          const base = baseMap.get(team) || { odds: 0, mean_wins: 0 };
          const updated = clientMap.get(team);
          const tr = create('tr');
          tr.appendChild(create('td', { text: team }));
          tr.appendChild(create('td', { text: formatPercent(base.odds || 0, 1) }));
          if (clientMap.size) {
            const tweaked = updated ? formatPercent(updated.odds || 0, 1) : '—';
            tr.appendChild(create('td', { text: tweaked }));
            const delta = updated ? updated.odds - (base.odds || 0) : 0;
            const deltaCell = create('td', { text: `${delta >= 0 ? '+' : ''}${formatPercent(delta || 0, 1)}` });
            if (delta > 0.005) {
              deltaCell.classList.add('path-ok');
            } else if (delta < -0.005) {
              deltaCell.classList.add('path-warn');
            }
            tr.appendChild(deltaCell);
          }
          const meanWins = updated ? updated.mean_wins : base.mean_wins;
          tr.appendChild(create('td', { text: formatNumber(meanWins || 0, 2) }));
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(create('h3', { text: 'Playoff Odds', className: 'path-subhead' }));
        container.appendChild(table);

        const schedule = inputs.schedule;
        if (!schedule.length) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.scheduleTweaks', 'Season schedule not available for tweaks.') }));
          return;
        }

        const baseTweaks = enrichTweaks(inputs.baseTweaks || [], schedule);
        if (baseTweaks.length) {
          const baseList = create('ul', { className: 'path-list' });
          baseTweaks.forEach((tweak) => {
            const opponent = normalizeTeamName(tweak.winner) === normalizeTeamName(tweak.away) ? tweak.home : tweak.away;
            baseList.appendChild(create('li', { text: `Week ${tweak.week}: ${tweak.winner} over ${opponent}` }));
          });
          const block = create('div', { className: 'path-tweaks-block' });
          block.appendChild(create('strong', { text: 'Pre-applied tweaks' }));
          block.appendChild(baseList);
          container.appendChild(block);
        }

        const form = create('form', { className: 'path-tweak-form' });
        const matchupSelect = create('select');
        schedule.forEach((game, idx) => {
          const label = `Week ${game.week}: ${game.away} @ ${game.home}`;
          matchupSelect.appendChild(create('option', { text: label, attrs: { value: String(idx) } }));
        });
        const winnerSelect = create('select');

        const updateWinnerOptions = () => {
          const idx = Number(matchupSelect.value);
          const game = schedule[idx];
          clearNode(winnerSelect);
          if (!game) {
            winnerSelect.appendChild(create('option', { text: 'Select matchup first', attrs: { value: '' } }));
            return;
          }
          winnerSelect.appendChild(create('option', { text: game.away, attrs: { value: game.away } }));
          winnerSelect.appendChild(create('option', { text: game.home, attrs: { value: game.home } }));
        };

        updateWinnerOptions();
        matchupSelect.addEventListener('change', updateWinnerOptions);

        const addBtn = create('button', { className: 'primary', text: 'Add tweak' });
        addBtn.addEventListener('click', (event) => {
          event.preventDefault();
          const idx = Number(matchupSelect.value);
          const game = schedule[idx];
          const winner = winnerSelect.value;
          if (!game || !winner) return;
          const tweak = {
            week: Number(game.week),
            winner,
            away: game.away,
            home: game.home,
          };
          const key = matchupKey(tweak.week, tweak.away, tweak.home);
          const existingIndex = state.path.tweaks.findIndex((item) => matchupKey(item.week, item.away, item.home) === key);
          if (existingIndex >= 0) {
            state.path.tweaks.splice(existingIndex, 1, tweak);
          } else {
            state.path.tweaks.push(tweak);
          }
          state.path.clientSim = null;
          renderPath();
        });

        form.appendChild(create('label', { text: 'Matchup' }));
        form.appendChild(matchupSelect);
        form.appendChild(create('label', { text: 'Winner' }));
        form.appendChild(winnerSelect);
        form.appendChild(addBtn);
        container.appendChild(form);

        const userTweaks = state.path.tweaks || [];
        const tweaksList = create('ul', { className: 'path-list' });
        if (!userTweaks.length) {
          tweaksList.appendChild(create('li', { className: 'muted', text: 'No manual tweaks yet.' }));
        } else {
          userTweaks.forEach((tweak, index) => {
            const opponent = normalizeTeamName(tweak.winner) === normalizeTeamName(tweak.away) ? tweak.home : tweak.away;
            const entry = create('li');
            entry.textContent = `Week ${tweak.week}: ${tweak.winner} over ${opponent}`;
            const removeBtn = create('button', { className: 'ghost small', text: 'Remove' });
            removeBtn.addEventListener('click', (event) => {
              event.preventDefault();
              state.path.tweaks.splice(index, 1);
              state.path.clientSim = null;
              renderPath();
            });
            entry.appendChild(removeBtn);
            tweaksList.appendChild(entry);
          });
        }
        container.appendChild(create('h3', { text: 'Manual Tweaks', className: 'path-subhead' }));
        container.appendChild(tweaksList);

        const controls = create('div', { className: 'path-buttons' });
        const simulateBtn = create('button', { className: 'primary', text: 'Recompute odds (client)' });
        simulateBtn.addEventListener('click', (event) => {
          event.preventDefault();
          const enrichedUserTweaks = enrichTweaks(state.path.tweaks || [], schedule);
          const combinedTweaks = combineTweaks(baseTweaks, enrichedUserTweaks);
          const runs = 500;
          const result = simulatePathsLite(
            schedule,
            inputs.strengthMap,
            inputs.baseWins,
            combinedTweaks,
            runs,
            inputs.noiseSd,
            inputs.playoffSlots,
            currentWeek
          );
          state.path.clientSim = result;
          renderPath();
        });
        controls.appendChild(simulateBtn);

        const clearBtn = create('button', { className: 'ghost', text: 'Clear tweaks' });
        clearBtn.disabled = !userTweaks.length;
        clearBtn.addEventListener('click', (event) => {
          event.preventDefault();
          state.path.tweaks = [];
          state.path.clientSim = null;
          renderPath();
        });
        controls.appendChild(clearBtn);
        container.appendChild(controls);

        const clientSim = state.path.clientSim;
        if (clientSim && clientSim.runs) {
          container.appendChild(create('p', {
            className: 'muted',
            text: `Client simulation ran ${clientSim.runs} iterations with σ=${formatNumber(inputs.noiseSd, 2)}.`,
          }));
        }
      }

      function collectPathInputs() {
        const baseParams = state.path?.path?.params || {};
        const playoffSlots = Number(baseParams.playoff_slots ?? 4) || 4;
        const noiseSd = Number(baseParams.noise_sd ?? 0.12) || 0.12;
        const schedule = Array.isArray(state.path?.path?.schedule) ? state.path.path.schedule.slice() : [];
        const targets = Array.isArray(state.path?.targets?.targets) ? state.path.targets.targets : [];
        const baseWins = {};
        targets.forEach((row) => {
          if (!row || !row.team) return;
          baseWins[row.team] = Number(row.wins_so_far ?? 0);
        });
        const strengthEntries = Array.isArray(state.assistant?.strengths) ? state.assistant.strengths : [];
        const strengthMap = {};
        strengthEntries.forEach((entry) => {
          const team = entry.fantasy_team_name || entry.team;
          if (!team) return;
          strengthMap[team] = Number(entry.overall_score ?? entry.overall ?? 0);
        });
        const scheduleFiltered = schedule
          .filter((game) => Number(game.week) >= (state.week || 1))
          .map((game) => ({
            week: Number(game.week),
            away: String(game.away),
            home: String(game.home),
          }));
        const baseTweaks = Array.isArray(state.path?.path?.tweaks) ? state.path.path.tweaks.slice() : [];
        return {
          playoffSlots,
          noiseSd,
          schedule: scheduleFiltered,
          baseWins,
          strengthMap,
          baseTweaks,
        };
      }

      function enrichTweaks(tweaks, schedule) {
        if (!Array.isArray(tweaks)) return [];
        const scheduleMap = schedule.reduce((acc, game) => {
          acc.set(matchupKey(game.week, game.away, game.home), game);
          return acc;
        }, new Map());
        return tweaks.map((tweak) => {
          if (!tweak || typeof tweak !== 'object') return tweak;
          const key = matchupKey(tweak.week, tweak.away || '', tweak.home || '');
          const record = scheduleMap.get(key);
          if (record) {
            return {
              week: Number(record.week),
              winner: tweak.winner,
              away: record.away,
              home: record.home,
            };
          }
          const fallback = schedule.find(
            (game) => Number(game.week) === Number(tweak.week)
              && (normalizeTeamName(game.away) === normalizeTeamName(tweak.winner)
                || normalizeTeamName(game.home) === normalizeTeamName(tweak.winner))
          );
          if (fallback) {
            return {
              week: Number(fallback.week),
              winner: tweak.winner,
              away: fallback.away,
              home: fallback.home,
            };
          }
          return tweak;
        });
      }

      function combineTweaks(baseTweaks, userTweaks) {
        const combined = new Map();
        (baseTweaks || []).forEach((tweak) => {
          if (!tweak) return;
          combined.set(matchupKey(tweak.week, tweak.away, tweak.home), { ...tweak });
        });
        (userTweaks || []).forEach((tweak) => {
          if (!tweak) return;
          combined.set(matchupKey(tweak.week, tweak.away, tweak.home), { ...tweak });
        });
        return Array.from(combined.values());
      }

      function simulatePathsLite(schedule, strengthMap, baseWins, tweaks, runs, noiseSd, playoffSlots, currentWeek) {
        const teams = Object.keys(strengthMap || {});
        if (!teams.length) {
          return { playoff_odds: [], runs: 0 };
        }
        const matchupTweaks = new Map();
        (tweaks || []).forEach((tweak) => {
          if (!tweak || !tweak.winner) return;
          const key = matchupKey(tweak.week, tweak.away, tweak.home);
          matchupTweaks.set(key, normalizeTeamName(tweak.winner));
        });
        const rows = (schedule || []).filter((game) => Number(game.week) >= (currentWeek || 1));
        const winsBase = {};
        teams.forEach((team) => {
          winsBase[team] = Number(baseWins?.[team] ?? 0);
        });

        if (!rows.length || runs <= 0) {
          const odds = teams.map((team) => ({
            team,
            odds: teams.indexOf(team) < playoffSlots ? 1 : 0,
            mean_wins: winsBase[team] || 0,
          }));
          odds.sort((a, b) => b.odds - a.odds);
          return { playoff_odds: odds, runs: 0 };
        }

        const playoffCounts = {};
        const winTotals = {};
        teams.forEach((team) => {
          playoffCounts[team] = 0;
          winTotals[team] = 0;
        });

        const iterations = Math.max(1, runs);
        for (let i = 0; i < iterations; i += 1) {
          const wins = {};
          teams.forEach((team) => {
            wins[team] = winsBase[team];
          });
          rows.forEach((game) => {
            const key = matchupKey(game.week, game.away, game.home);
            const forced = matchupTweaks.get(key);
            let winner;
            if (forced && (forced === normalizeTeamName(game.away) || forced === normalizeTeamName(game.home))) {
              winner = forced === normalizeTeamName(game.away) ? game.away : game.home;
            } else {
              const awayScore = (strengthMap[game.away] || 0) + randomNormal(0, noiseSd);
              const homeScore = (strengthMap[game.home] || 0) + randomNormal(0, noiseSd);
              if (homeScore === awayScore) {
                winner = Math.random() > 0.5 ? game.home : game.away;
              } else {
                winner = homeScore > awayScore ? game.home : game.away;
              }
            }
            wins[winner] = (wins[winner] || 0) + 1;
          });

          const ranked = teams.slice().sort((a, b) => {
            const diff = (wins[b] || 0) - (wins[a] || 0);
            if (Math.abs(diff) > 1e-9) return diff;
            const strengthDiff = (strengthMap[b] || 0) - (strengthMap[a] || 0);
            if (Math.abs(strengthDiff) > 1e-9) return strengthDiff;
            return a.localeCompare(b);
          });
          ranked.slice(0, playoffSlots).forEach((team) => {
            playoffCounts[team] = (playoffCounts[team] || 0) + 1;
          });
          teams.forEach((team) => {
            winTotals[team] = (winTotals[team] || 0) + (wins[team] || 0);
          });
        }

        const results = teams.map((team) => ({
          team,
          odds: playoffCounts[team] / iterations,
          mean_wins: winTotals[team] / iterations,
        }));
        results.sort((a, b) => b.odds - a.odds);
        return { playoff_odds: results, runs: iterations };
      }

      function renderCompare() {
        if (!els.compareBody) return;
        clearNode(els.compareBody);
        const compareState = state.compare || {};
        if (!compareState.ready) {
          els.compareBody.appendChild(create('div', { className: 'empty-state', text: t('empty.compareLoading', 'Loading cross-league snapshot…') }));
          return;
        }
        if (compareState.error) {
          els.compareBody.appendChild(create('div', { className: 'empty-state', text: t('empty.compareUnavailable', 'Cross-league comparison unavailable.') }));
          return;
        }
        const data = compareState.data || {};
        const entries = Array.isArray(data.entries) ? data.entries : [];
        if (!entries.length) {
          els.compareBody.appendChild(create('div', { className: 'empty-state', text: t('empty.compareNone', 'No comparison data available.') }));
          return;
        }

        if (data.requested_week) {
          els.compareBody.appendChild(create('div', { className: 'compare-note', text: `Requested week: ${data.requested_week}` }));
        }

        const table = create('table');
        table.appendChild(create('thead', {
          html: '<tr><th>League</th><th>Week</th><th>Top Team</th><th>Median Overall</th><th>Std Dev</th><th># Teams</th></tr>',
        }));

        const tbody = create('tbody');
        entries.forEach((entry) => {
          const tr = create('tr');
          const slug = entry.league || entry.slug;
          if (slug && slug === state.league) {
            tr.classList.add('active-league-row');
          }
          tr.appendChild(create('td', { text: entry.name || getLeagueName(slug) }));
          tr.appendChild(create('td', { text: entry.week !== undefined ? String(entry.week) : '—' }));
          const topTeam = entry.top_team || entry.topTeam || '';
          const topScore = entry.top_score ?? entry.topScore;
          const topCell = topScore !== undefined ? `${topTeam} (${formatNumber(topScore, 2)})` : topTeam;
          tr.appendChild(create('td', { text: topCell }));
          tr.appendChild(create('td', { text: formatNumber(entry.median_overall ?? entry.medianOverall ?? 0, 3) }));
          tr.appendChild(create('td', { text: formatNumber(entry.std_overall ?? entry.stdOverall ?? 0, 3) }));
          tr.appendChild(create('td', { text: entry.team_count !== undefined ? String(entry.team_count) : '—' }));
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        els.compareBody.appendChild(table);

        if (Array.isArray(data.notes) && data.notes.length) {
          const notes = create('ul', { className: 'compare-notes' });
          data.notes.forEach((note) => {
            notes.appendChild(create('li', { text: String(note) }));
          });
          els.compareBody.appendChild(notes);
        }
      }

      function buildSearchIndex() {
        searchIndex = [];
        const strengths = Array.isArray(state.assistant?.strengths) ? state.assistant.strengths : [];
        strengths.forEach((entry, idx) => {
          const team = entry.fantasy_team_name || entry.team || entry.name;
          if (!team) return;
          const keywords = [String(team).toLowerCase()];
          searchIndex.push({
            type: 'team',
            label: team,
            detail: 'Team',
            keywords,
            data: { team },
            order: idx,
          });
        });

        const players = Array.isArray(state.assistant?.players) ? state.assistant.players : [];
        players.forEach((player, idx) => {
          const name = player.player_name || player.name;
          const team = player.fantasy_team_name || '';
          if (!name) return;
          const pos = player.pos || '';
          const nfl = player.team || '';
          const keywords = [name, pos, nfl, team]
            .map((value) => String(value || '').toLowerCase())
            .filter(Boolean);
          searchIndex.push({
            type: 'player',
            label: name,
            detail: `${team || 'Free agent'} · ${pos || ''}`.trim(),
            keywords,
            data: {
              team,
              player: name,
            },
            order: idx,
          });
        });

        const trades = Array.isArray(state.tradeFinder?.packages) ? state.tradeFinder.packages : [];
        trades.forEach((pkg, idx) => {
          const label = `${pkg.teamA || '?'} ↔ ${pkg.teamB || '?'}`;
          const names = [pkg.teamA, pkg.teamB];
          (pkg.A_players || []).forEach((player) => names.push(player.name || player.player_name));
          (pkg.B_players || []).forEach((player) => names.push(player.name || player.player_name));
          const keywords = names
            .map((value) => String(value || '').toLowerCase())
            .filter(Boolean);
          searchIndex.push({
            type: 'trade',
            label,
            detail: 'Trade idea',
            keywords,
            data: {
              teamA: pkg.teamA,
              teamB: pkg.teamB,
            },
            order: idx,
          });
        });
      }

      let lastSearchResults = [];

      function handleSearchInput(event) {
        const query = String(event.target.value || '').trim().toLowerCase();
        if (!query || query.length < 2) {
          hideSearchResults();
          return;
        }
        const matches = [];
        for (const entry of searchIndex) {
          if (matches.length >= 10) break;
          if (entry.keywords.some((keyword) => keyword.includes(query))) {
            matches.push(entry);
          }
        }
        showSearchResults(matches);
      }

      function handleSearchKeydown(event) {
        if (event.key === 'Escape') {
          hideSearchResults();
          event.target.blur();
          return;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          if (lastSearchResults.length) {
            handleSearchSelect(lastSearchResults[0]);
          }
        }
      }

      function showSearchResults(results) {
        lastSearchResults = results || [];
        if (!els.globalSearchResults) return;
        clearNode(els.globalSearchResults);
        if (!results || !results.length) {
          els.globalSearchResults.hidden = true;
          return;
        }
        results.forEach((entry) => {
          const button = create('button', {
            className: 'search-result',
          });
          button.appendChild(create('span', { text: entry.label }));
          if (entry.detail) {
            button.appendChild(create('small', { text: entry.detail }));
          }
          button.addEventListener('click', () => handleSearchSelect(entry));
          els.globalSearchResults.appendChild(button);
        });
        els.globalSearchResults.hidden = false;
      }

      function hideSearchResults() {
        lastSearchResults = [];
        if (els.globalSearchResults) {
          els.globalSearchResults.hidden = true;
          clearNode(els.globalSearchResults);
        }
      }

      function handleSearchSelect(entry) {
        hideSearchResults();
        if (els.globalSearch) {
          els.globalSearch.value = '';
        }
        if (!entry) return;
        if (entry.type === 'team') {
          state.teamFilter = entry.data.team;
          if (els.teamFilter) {
            els.teamFilter.value = state.teamFilter;
          }
          renderLineups();
          renderStartSit();
          renderMatchups();
          setActiveTab('lineups', { updateHash: true });
          return;
        }
        if (entry.type === 'player') {
          if (entry.data.team) {
            state.teamFilter = entry.data.team;
            if (els.teamFilter) {
              els.teamFilter.value = entry.data.team;
            }
          }
          renderLineups();
          renderStartSit();
          setActiveTab('lineups', { updateHash: true });
          return;
        }
        if (entry.type === 'trade') {
          if (!state.tradeFinder) {
            state.tradeFinder = {
              packages: [],
              filters: {
                teamA: 'ALL',
                teamB: 'ALL',
                pos: 'ALL',
                minFairness: 0.8,
              },
            };
          }
          state.tradeFinder.filters.teamA = entry.data.teamA || 'ALL';
          state.tradeFinder.filters.teamB = entry.data.teamB || 'ALL';
          state.tradeFinder.filters.pos = 'ALL';
          if (els.tradeFilterTeamA) {
            els.tradeFilterTeamA.value = state.tradeFinder.filters.teamA;
          }
          if (els.tradeFilterTeamB) {
            els.tradeFilterTeamB.value = state.tradeFinder.filters.teamB;
          }
          renderTradeFinder();
          setActiveTab('tradefinder', { updateHash: true });
        }
      }

      function handleDocumentClick(event) {
        if (!els.globalSearchResults) return;
        if (els.globalSearchResults.hidden) return;
        if (event.target === els.globalSearch || (els.globalSearchResults.contains(event.target))) {
          return;
        }
        hideSearchResults();
      }

      function computeScenarioDeltas() {
        const sandbox = state.sandbox || {};
        const baseline = sandbox.baselineStrengths || {};
        const current = sandbox.currentStrengths || {};
        return Object.keys(current)
          .map((team) => {
            const baseStrength = baseline[team] || {};
            const currentStrength = current[team] || baseStrength;
            const before = toNumber(baseStrength.overall ?? baseStrength.overall_score ?? baseStrength.top3 ?? 0, 0);
            const after = toNumber(currentStrength.overall ?? currentStrength.overall_score ?? currentStrength.top3 ?? 0, 0);
            const delta = after - before;
            return { team, before, after, delta };
          })
          .filter((entry) => Math.abs(entry.delta) > 0.0001)
          .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
      }

      function handleTradeFilterChange() {
        if (!state.tradeFinder) return;
        state.tradeFinder.filters.teamA = els.tradeFilterTeamA ? els.tradeFilterTeamA.value : 'ALL';
        state.tradeFinder.filters.teamB = els.tradeFilterTeamB ? els.tradeFilterTeamB.value : 'ALL';
        state.tradeFinder.filters.pos = els.tradeFilterPos ? els.tradeFilterPos.value : 'ALL';
        renderTradeFinder();
      }

      function handleFairnessSlider(event) {
        if (!state.tradeFinder) return;
        const value = Number(event?.target?.value || state.tradeFinder.filters.minFairness || 0.8);
        state.tradeFinder.filters.minFairness = clamp(value, 0, 1);
        if (els.tradeFilterFairnessValue) {
          els.tradeFilterFairnessValue.textContent = state.tradeFinder.filters.minFairness.toFixed(2);
        }
        renderTradeFinder();
      }

      function undoLastTrade() {
        if (!state.scenario || !Array.isArray(state.scenario.trades) || !state.scenario.trades.length) {
          return;
        }
        const remaining = state.scenario.trades.slice(0, -1);
        resetScenario({ silent: true, preserveActive: true });
        remaining.forEach((trade) => {
          applyTradeToState({
            teamA: trade.teamA,
            teamB: trade.teamB,
            sendA: trade.outA,
            sendB: trade.outB,
          }, { record: trade, recordHistory: false, silent: true });
        });
        state.scenario.source = 'manual';
        refreshScenarioOutputs();
        showResults([]);
        updateBracketStatus(t('status.bracket.lastTradeRemoved', 'Last trade removed from scenario.'));
      }

      function resetScenario(options = {}) {
        state.scenario = defaultScenarioState();
        initializeSandbox();
        initializeStartSit();
        initializeBracket();
        state.scenario.source = 'baseline';
        syncScenarioState();
        refreshScenarioOutputs();
        if (!options.silent) {
          updateBracketStatus(t('status.bracket.resetBaseline', 'Scenario reset to baseline.'));
          showResults([]);
        }
        if (state.scenarios && !options.preserveActive) {
          state.scenarios.active = null;
          updateScenarioSelect();
        }
      }

      function exportScenario() {
        const scenario = collectScenarioData();
        const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        const weekLabel = state.week ? `week_${state.week}` : 'week_auto';
        link.download = `scenario_${weekLabel}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      function handleScenarioImport(event) {
        const file = event?.target?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          try {
            const payload = JSON.parse(loadEvent.target.result);
            importScenarioPayload(payload);
          } catch (err) {
            console.error('Scenario import failed', err);
            alert('Failed to import scenario: invalid JSON');
          }
        };
        reader.readAsText(file);
      }

      function importScenarioPayload(payload, options = {}) {
        if (!payload || typeof payload !== 'object') {
          alert('Invalid scenario file.');
          return false;
        }
        const sourceLabel = options.source || 'imported';
        const preserveActive = Boolean(options.preserveActive);
        suppressHashUpdate = true;
        resetScenario({ silent: true, preserveActive });
        state.scenario.source = sourceLabel;
        const trades = Array.isArray(payload.trades) ? payload.trades : [];
        trades.forEach((trade) => {
          applyTradeToState({
            teamA: trade.teamA,
            teamB: trade.teamB,
            sendA: trade.outA,
            sendB: trade.outB,
          }, { record: trade, recordHistory: false, silent: true, source: sourceLabel });
        });
        if (payload.lineup_swaps && typeof payload.lineup_swaps === 'object') {
          applyLineupSwaps(payload.lineup_swaps);
        }
        if (Array.isArray(payload.seeds_override) && payload.seeds_override.length) {
          state.bracketSim.seeds = payload.seeds_override.slice();
          state.bracketSim.odds = [];
          state.bracketSim.runs = 0;
        }
        suppressHashUpdate = false;
        refreshScenarioOutputs();
        if (!options.silent) {
          showResults([]);
        }
        if (!options.silentStatus) {
          const message = sourceLabel === 'hash' ? 'Scenario imported from shared link.' : 'Scenario imported from JSON file.';
          updateBracketStatus(message);
        }
        return true;
      }

      function openCustomTradeModal() {
        if (!state.sandbox || !state.sandbox.ready || !els.tradeModal || !els.tradeModalBackdrop) {
          return;
        }
        const teams = Object.keys(state.sandbox.teams || {}).sort((a, b) => a.localeCompare(b));
        if (teams.length < 2) {
          alert('Need at least two teams to build a custom trade.');
          return;
        }
        const filters = state.tradeFinder?.filters || {};
        let teamA = filters.teamA && filters.teamA !== 'ALL' ? filters.teamA : teams[0];
        if (!teams.includes(teamA)) {
          teamA = teams[0];
        }
        let teamB = filters.teamB && filters.teamB !== 'ALL' ? filters.teamB : teams.find((team) => team !== teamA) || teams[0];
        if (teamB === teamA) {
          teamB = teams.find((team) => team !== teamA) || teams[0];
        }

        const populateSelect = (select, selectedTeam) => {
          if (!select) return;
          clearNode(select);
          teams.forEach((team) => {
            const option = create('option', { text: team, attrs: { value: team } });
            if (team === selectedTeam) {
              option.selected = true;
            }
            select.appendChild(option);
          });
        };

        populateSelect(els.tradeModalTeamA, teamA);
        populateSelect(els.tradeModalTeamB, teamB);

        state.tradeFinder.modal = {
          teamA,
          teamB,
          selectedA: new Set(),
          selectedB: new Set(),
          searchA: '',
          searchB: '',
        };

        if (els.tradeModalSearchA) els.tradeModalSearchA.value = '';
        if (els.tradeModalSearchB) els.tradeModalSearchB.value = '';

        updateCustomTradeLists();
        if (els.tradeModalBackdrop) {
          els.tradeModalBackdrop.hidden = false;
        }
        els.tradeModal.hidden = false;
        els.tradeModal.focus();
      }

      function closeCustomTradeModal() {
        if (!els.tradeModal) return;
        els.tradeModal.hidden = true;
        if (els.tradeModalBackdrop) {
          els.tradeModalBackdrop.hidden = true;
        }
        state.tradeFinder.modal = null;
      }

      function updateCustomTradeTeams() {
        const modalState = state.tradeFinder?.modal;
        if (!modalState) return;
        const selectedA = els.tradeModalTeamA ? els.tradeModalTeamA.value : modalState.teamA;
        let selectedB = els.tradeModalTeamB ? els.tradeModalTeamB.value : modalState.teamB;
        if (selectedA === selectedB) {
          const teams = Object.keys(state.sandbox?.teams || {}).sort((a, b) => a.localeCompare(b));
          selectedB = teams.find((team) => team !== selectedA) || selectedB;
          if (els.tradeModalTeamB) {
            els.tradeModalTeamB.value = selectedB;
          }
        }
        modalState.teamA = selectedA;
        modalState.teamB = selectedB;
        modalState.selectedA.clear();
        modalState.selectedB.clear();
        updateCustomTradeLists();
      }

      function updateCustomTradeLists() {
        const modalState = state.tradeFinder?.modal;
        if (!modalState) return;
        if (els.tradeModalSearchA) modalState.searchA = els.tradeModalSearchA.value.trim().toLowerCase();
        if (els.tradeModalSearchB) modalState.searchB = els.tradeModalSearchB.value.trim().toLowerCase();

        const renderList = (container, players, selectedSet, searchTerm) => {
          if (!container) return;
          clearNode(container);
          const filtered = players.filter((player) => {
            if (!searchTerm) return true;
            const name = String(player.player_name || player.name || '').toLowerCase();
            const pos = String(player.pos || '').toLowerCase();
            const team = String(player.team || '').toLowerCase();
            return name.includes(searchTerm) || pos.includes(searchTerm) || team.includes(searchTerm);
          });
          if (!filtered.length) {
            container.appendChild(create('div', { className: 'empty-state', text: t('empty.noPlayers', 'No players found.') }));
            return;
          }
          filtered.forEach((player) => {
            const id = String(player.id);
            const label = create('label');
            const checkbox = create('input', { attrs: { type: 'checkbox', value: id } });
            checkbox.checked = selectedSet.has(id);
            checkbox.addEventListener('change', () => {
              if (checkbox.checked) selectedSet.add(id);
              else selectedSet.delete(id);
              updateCustomTradeSummary();
            });
            const name = player.player_name || player.name || 'Unknown';
            const pos = player.pos || '';
            label.appendChild(checkbox);
            label.appendChild(create('span', { html: `${name} <span class="muted">(${pos})</span>` }));
            container.appendChild(label);
          });
        };

        const teamAState = getTeamState(modalState.teamA) || { players: [] };
        const teamBState = getTeamState(modalState.teamB) || { players: [] };
        renderList(els.tradeModalListA, teamAState.players, modalState.selectedA, modalState.searchA);
        renderList(els.tradeModalListB, teamBState.players, modalState.selectedB, modalState.searchB);
        updateCustomTradeSummary();
      }

      function updateCustomTradeSummary() {
        const modalState = state.tradeFinder?.modal;
        if (!modalState) return;
        const pkg = {
          teamA: modalState.teamA,
          teamB: modalState.teamB,
          A_players: modalState.selectedA ? Array.from(modalState.selectedA).map((id) => {
            const player = findPlayerInTeam(modalState.teamA, id);
            return {
              id,
              player_id: id,
              name: player?.player_name || player?.name || 'Unknown',
              pos: player?.pos || '',
              team: player?.team || '',
              score: toNumber(player?.score, 0),
            };
          }) : [],
          B_players: modalState.selectedB ? Array.from(modalState.selectedB).map((id) => {
            const player = findPlayerInTeam(modalState.teamB, id);
            return {
              id,
              player_id: id,
              name: player?.player_name || player?.name || 'Unknown',
              pos: player?.pos || '',
              team: player?.team || '',
              score: toNumber(player?.score, 0),
            };
          }) : [],
        };
        const summary = evalTradePkg(pkg);
        const hasSelection = modalState.selectedA.size > 0 || modalState.selectedB.size > 0;
        if (els.tradeModalFairness) {
          els.tradeModalFairness.textContent = hasSelection ? formatNumber(summary.fairness, 2) : '–';
        }
        if (els.tradeModalDeltaA) {
          els.tradeModalDeltaA.textContent = hasSelection ? formatNumber(summary.deltaA, 2) : '–';
        }
        if (els.tradeModalDeltaB) {
          els.tradeModalDeltaB.textContent = hasSelection ? formatNumber(summary.deltaB, 2) : '–';
        }
        if (els.tradeModalApply) {
          els.tradeModalApply.disabled = !hasSelection;
        }
      }

      function applyCustomTrade() {
        const modalState = state.tradeFinder?.modal;
        if (!modalState) return;
        if (!modalState.selectedA.size && !modalState.selectedB.size) return;
        const result = applyTradeToState({
          teamA: modalState.teamA,
          teamB: modalState.teamB,
          sendA: Array.from(modalState.selectedA),
          sendB: Array.from(modalState.selectedB),
        });
        if (!result.success) {
          alert(result.reason || 'Failed to apply trade.');
          return;
        }
        closeCustomTradeModal();
      }
      function renderStartSitSimulator() {
        if (!els.startSitMatchup) return;
        const startSit = state.startSit || {};
        const matchup = getSelectedStartSitMatchup();

        clearNode(els.startSitMatchup);

        if (!startSit.ready) {
          els.startSitMatchup.disabled = true;
          if (els.startSitAwayName) els.startSitAwayName.textContent = '—';
          if (els.startSitHomeName) els.startSitHomeName.textContent = '—';
          if (els.startSitSimulate) els.startSitSimulate.disabled = true;
          if (els.startSitReset) els.startSitReset.disabled = true;
          updateStartSitStatus(startSit.message || 'Start/Sit simulator unavailable.');
          if (els.startSitAwayStarters) clearNode(els.startSitAwayStarters);
          if (els.startSitAwayBench) clearNode(els.startSitAwayBench);
          if (els.startSitHomeStarters) clearNode(els.startSitHomeStarters);
          if (els.startSitHomeBench) clearNode(els.startSitHomeBench);
          if (els.startSitResults) {
            clearNode(els.startSitResults);
            els.startSitResults.appendChild(
              create('div', { className: 'empty-state', text: startSit.message || t('empty.noMatchupData', 'No matchup data available.') })
            );
          }
          return;
        }

        els.startSitMatchup.disabled = false;
        if (els.startSitReset) els.startSitReset.disabled = false;

        startSit.matchups.forEach((match) => {
          const option = create('option', { text: match.label, attrs: { value: match.id } });
          if (match.id === startSit.selectedMatchup) {
            option.selected = true;
          }
          els.startSitMatchup.appendChild(option);
        });

        const activeMatchup = matchup || getSelectedStartSitMatchup();
        if (!activeMatchup) {
          if (els.startSitSimulate) els.startSitSimulate.disabled = true;
          updateStartSitStatus('Select a matchup to begin.');
          return;
        }

        state.startSit.selectedMatchup = activeMatchup.id;
        if (els.startSitAwayName) els.startSitAwayName.textContent = activeMatchup.away;
        if (els.startSitHomeName) els.startSitHomeName.textContent = activeMatchup.home;
        renderStartSitTeam(activeMatchup.away, 'away');
        renderStartSitTeam(activeMatchup.home, 'home');
        if (els.startSitSimulate) els.startSitSimulate.disabled = false;
        updateStartSitStatus(startSit.results ? 'Showing latest simulation.' : 'Adjust starters and simulate 1000 runs.');
        renderSimulationResults(startSit.results, activeMatchup);
      }

      function renderStartSitTeam(teamName, side) {
        const startSit = state.startSit || {};
        const teamState = startSit.teamStates?.[teamName];
        const matchup = getSelectedStartSitMatchup();
        const rosterIds = matchup && matchup.team_rosters && Array.isArray(matchup.team_rosters[side])
          ? new Set(matchup.team_rosters[side].map(String))
          : new Set(teamState ? teamState.players.map((player) => String(player.id)) : []);

        const startersContainer = side === 'away' ? els.startSitAwayStarters : els.startSitHomeStarters;
        const benchContainer = side === 'away' ? els.startSitAwayBench : els.startSitHomeBench;
        if (!startersContainer || !benchContainer) {
          return;
        }

        clearNode(startersContainer);
        clearNode(benchContainer);

        if (!teamState) {
          startersContainer.appendChild(create('div', { className: 'empty-state', text: t('empty.teamUnavailable', 'Team data unavailable.') }));
          benchContainer.appendChild(create('div', { className: 'empty-state', text: t('empty.teamUnavailable', 'Team data unavailable.') }));
          return;
        }

        const starters = (teamState.lineup.starters || []).filter((player) => !rosterIds.size || rosterIds.has(String(player.id)));
        const starterIds = new Set(starters.map((player) => String(player.id)));
        const bench = (teamState.lineup.bench || []).filter((player) => {
          const id = String(player.id);
          if (starterIds.has(id)) return false;
          if (!rosterIds.size) return true;
          return rosterIds.has(id);
        });

        startersContainer.appendChild(buildStartSitTable(teamName, side, starters, starterIds, true));
        benchContainer.appendChild(buildStartSitTable(teamName, side, bench, starterIds, false));
      }

      function buildStartSitTable(teamName, side, players, starterIds, isStarter) {
        if (!players.length) {
          return create('div', {
            className: 'empty-state',
            text: isStarter ? 'No starters selected.' : 'Bench players unavailable.',
          });
        }

        const table = create('table');
        table.appendChild(
          create('thead', {
            html: '<tr><th>Start</th><th>Slot</th><th>Player</th><th>Pos</th><th>Proj</th><th>Score</th></tr>',
          })
        );
        const tbody = create('tbody');
        players.forEach((player) => {
          const tr = create('tr');
          const checkboxCell = create('td');
          const checkbox = create('input', {
            attrs: {
              type: 'checkbox',
              'data-team': teamName,
              'data-player-id': player.id,
            },
          });
          checkbox.dataset.side = side;
          checkbox.checked = starterIds.has(String(player.id));
          checkboxCell.appendChild(checkbox);
          tr.appendChild(checkboxCell);

          const slotText = starterIds.has(String(player.id)) ? player.slot || player.pos || '—' : '—';
          tr.appendChild(create('td', { text: slotText }));
          tr.appendChild(create('td', { text: player.player_name || '' }));
          tr.appendChild(create('td', { text: player.pos || '' }));
          tr.appendChild(create('td', { text: formatNumber(player.proj_points ?? player.score ?? 0, 2) }));
          tr.appendChild(create('td', { text: formatNumber(player.score ?? 0, 3) }));
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        return table;
      }

      function collectLineups() {
        const matchup = getSelectedStartSitMatchup();
        if (!matchup) {
          return { error: 'Select a matchup to simulate.' };
        }
        const startSit = state.startSit || {};
        const awayState = startSit.teamStates?.[matchup.away];
        const homeState = startSit.teamStates?.[matchup.home];
        if (!awayState || !homeState) {
          return { error: 'Team lineup data unavailable.', matchup };
        }
        const rosterAway = new Set((matchup.team_rosters?.away || []).map(String));
        const rosterHome = new Set((matchup.team_rosters?.home || []).map(String));
        const awayLineup = (awayState.lineup.starters || []).filter((player) => !rosterAway.size || rosterAway.has(String(player.id)));
        const homeLineup = (homeState.lineup.starters || []).filter((player) => !rosterHome.size || rosterHome.has(String(player.id)));
        const required = getRequiredStarterCount();
        if (required > 0) {
          if (awayLineup.length !== required) {
            return {
              error: `${matchup.away} lineup must have ${required} starters (currently ${awayLineup.length}).`,
              matchup,
            };
          }
          if (homeLineup.length !== required) {
            return {
              error: `${matchup.home} lineup must have ${required} starters (currently ${homeLineup.length}).`,
              matchup,
            };
          }
        }
        if (!awayLineup.length || !homeLineup.length) {
          return { error: 'Unable to build lineups for simulation.', matchup };
        }
        return { matchup, away: awayLineup, home: homeLineup };
      }

      function simulateMatchup(lineupAway, lineupHome, runs = 1000) {
        const iterations = Math.max(1, Math.min(20000, Number(runs) || 0));
        let awayWins = 0;
        let homeWins = 0;
        let ties = 0;
        let awayTotal = 0;
        let homeTotal = 0;
        const awaySamples = [];
        const homeSamples = [];

        for (let i = 0; i < iterations; i += 1) {
          let sumAway = 0;
          let sumHome = 0;
          lineupAway.forEach((player) => {
            const mean = toNumber(player.proj_points ?? player.score ?? 0, 0);
            const sd = Math.abs(mean) * 0.35;
            sumAway += randomNormal(mean, sd);
          });
          lineupHome.forEach((player) => {
            const mean = toNumber(player.proj_points ?? player.score ?? 0, 0);
            const sd = Math.abs(mean) * 0.35;
            sumHome += randomNormal(mean, sd);
          });
          awaySamples.push(sumAway);
          homeSamples.push(sumHome);
          awayTotal += sumAway;
          homeTotal += sumHome;
          if (sumAway > sumHome) {
            awayWins += 1;
          } else if (sumHome > sumAway) {
            homeWins += 1;
          } else {
            ties += 1;
          }
        }

        const avgAway = awayTotal / iterations;
        const avgHome = homeTotal / iterations;
        const tiePct = ties / iterations;
        const winAway = (awayWins + ties * 0.5) / iterations;
        const winHome = (homeWins + ties * 0.5) / iterations;

        return {
          runs: iterations,
          winA: winAway,
          winB: winHome,
          tiePct,
          avgA: avgAway,
          avgB: avgHome,
          histogramA: buildHistogram(awaySamples),
          histogramB: buildHistogram(homeSamples),
        };
      }

      function renderSimulationResults(result, matchup) {
        if (!els.startSitResults) return;
        clearNode(els.startSitResults);

        const activeMatchup = matchup || getSelectedStartSitMatchup();
        if (!result || !activeMatchup) {
          els.startSitResults.appendChild(
            create('div', { className: 'empty-state', text: t('empty.startSitInstructions', 'Adjust starters and simulate 1000 runs to view win probabilities.') })
          );
          return;
        }

        const title = create('h3', { text: `${activeMatchup.away} vs ${activeMatchup.home}` });
        const metrics = create('div', { className: 'startsit-metrics' });
        metrics.appendChild(create('div', { text: `${activeMatchup.away} win %: ${formatPercent(result.winA, 1)}` }));
        metrics.appendChild(create('div', { text: `${activeMatchup.home} win %: ${formatPercent(result.winB, 1)}` }));
        if (result.tiePct && result.tiePct > 0.0005) {
          metrics.appendChild(create('div', { text: `Tie %: ${formatPercent(result.tiePct, 2)}` }));
        }
        metrics.appendChild(create('div', { text: `${activeMatchup.away} avg points: ${formatNumber(result.avgA, 2)}` }));
        metrics.appendChild(create('div', { text: `${activeMatchup.home} avg points: ${formatNumber(result.avgB, 2)}` }));

        const chartAway = renderHistogramBlock(`${activeMatchup.away} distribution`, result.histogramA);
        const chartHome = renderHistogramBlock(`${activeMatchup.home} distribution`, result.histogramB);

        els.startSitResults.appendChild(title);
        els.startSitResults.appendChild(metrics);
        els.startSitResults.appendChild(chartAway);
        els.startSitResults.appendChild(chartHome);
      }

      function renderHistogramBlock(label, histogram) {
        const block = create('div', { className: 'startsit-chart' });
        block.appendChild(create('strong', { text: label }));
        if (!histogram || !histogram.length) {
          block.appendChild(create('div', { className: 'empty-state', text: t('empty.noSamples', 'No samples recorded.') }));
          return block;
        }
        histogram.forEach((bucket) => {
          const row = create('div', { className: 'startsit-chart-row' });
          row.appendChild(create('span', { text: bucket.label }));
          const bar = create('div', { className: 'startsit-chart-bar' });
          const pct = Math.max(0, Math.min(1, bucket.pct || 0));
          bar.style.setProperty('--pct', `${(pct * 100).toFixed(1)}%`);
          row.appendChild(bar);
          row.appendChild(create('span', { text: `${(pct * 100).toFixed(1)}%` }));
          block.appendChild(row);
        });
        return block;
      }

      function updateStartSitStatus(message) {
        if (!els.startSitStatus) return;
        els.startSitStatus.textContent = message || '';
        if (message) {
          announceLive(message);
        }
      }

      function handleStartSitToggle(event) {
        const target = event.target;
        if (!target || !target.matches('input[type="checkbox"][data-player-id]')) {
          return;
        }
        const teamName = target.dataset.team;
        const playerId = target.dataset.playerId;
        const startSit = state.startSit || {};
        const teamState = startSit.teamStates?.[teamName];
        if (!teamState) {
          return;
        }
        if (target.checked) {
          teamState.forceBench.delete(playerId);
          teamState.forceStart.add(playerId);
        } else {
          teamState.forceStart.delete(playerId);
          teamState.forceBench.add(playerId);
        }
        applyStartSitOverrides(teamName);
        const matchup = getSelectedStartSitMatchup();
        const side = matchup && matchup.away === teamName ? 'away' : matchup && matchup.home === teamName ? 'home' : target.dataset.side || 'away';
        renderStartSitTeam(teamName, side);
        state.startSit.results = null;
        renderSimulationResults(null, matchup);
        updateStartSitStatus('Lineups updated. Run the simulation to refresh results.');
      }

      function handleStartSitMatchupChange(event) {
        const value = String(event.target.value || '');
        state.startSit.selectedMatchup = value;
        const matchup = getSelectedStartSitMatchup();
        if (matchup) {
          buildSimulator(matchup);
        }
        renderStartSitSimulator();
      }

      function handleStartSitSimulate(event) {
        event.preventDefault();
        const payload = collectLineups();
        if (!payload || payload.error) {
          updateStartSitStatus(payload?.error || 'Unable to simulate matchup.');
          if (!payload?.error) {
            renderSimulationResults(null);
          }
          return;
        }

        updateStartSitStatus('Running 1000 Monte Carlo simulations…');
        const result = simulateMatchup(payload.away, payload.home, 1000);
        result.matchup = payload.matchup;
        state.startSit.results = result;
        renderSimulationResults(result, payload.matchup);
        updateStartSitStatus('Simulation complete.');
      }

      function handleStartSitReset(event) {
        event.preventDefault();
        const matchup = getSelectedStartSitMatchup();
        if (!matchup) {
          updateStartSitStatus('Select a matchup to reset.');
          return;
        }
        resetStartSitTeam(matchup.away);
        resetStartSitTeam(matchup.home);
        state.startSit.results = null;
        renderStartSitSimulator();
        updateStartSitStatus('Lineups reset to defaults.');
      }

      function renderAll() {
        renderPower();
        renderLineups();
        renderStartSit();
        renderWaivers();
        renderMatchups();
        renderSandbox();
        renderStartSitSimulator();
        renderBracket();
        renderNotifications();
        renderPlayoffs();
        renderTradeFinder();
        renderScenarioSummary();
        renderChangelog();
        renderOps();
        renderPath();
        renderCompare();
        updateScenarioBadge();
        updateScenarioHash();
        renderFooter();
      }

      function renderPower() {
        const container = els.powerBody;
        clearNode(container);
        const strengths = state.assistant?.strengths || [];
        if (!strengths.length) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.power', 'Power rankings unavailable for this week.') }));
          return;
        }
        const rows = strengths
          .map((entry) => ({
            team: entry.fantasy_team_name || entry.team || t('label.unknownTeam', 'Unknown'),
            overall: Number(entry.overall_score) || 0,
            top3: Number(entry.top3 ?? entry.strength_top3 ?? entry.strength) || 0,
            depth: Number(entry.depth ?? entry.depth_score) || 0,
          }))
          .sort((a, b) => b.overall - a.overall);

        const table = create('table');
        const thead = create('thead');
        const headRow = create('tr');
        [
          ['label.rank', 'Rank'],
          ['label.team', 'Team'],
          ['metric.overall', 'Overall'],
          ['metric.top3', 'Top-3'],
          ['metric.depth', 'Depth'],
        ].forEach(([key, fallback]) => {
          headRow.appendChild(create('th', { text: t(key, fallback) }));
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = create('tbody');
        rows.forEach((row, idx) => {
          const tr = create('tr');
          tr.appendChild(create('td', { text: String(idx + 1).padStart(2, '0') }));
          tr.appendChild(create('td', { text: row.team }));
          const overallCell = create('td');
          overallCell.appendChild(spark(row.overall));
          const topCell = create('td');
          topCell.appendChild(spark(row.top3));
          const depthCell = create('td');
          depthCell.appendChild(spark(row.depth));
          tr.append(overallCell, topCell, depthCell);
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);
      }

      function buildRemoteScenarioLineups(remote) {
        if (!remote || !remote.payload || typeof remote.payload !== 'object') return null;
        const lineups = remote.payload.lineups && typeof remote.payload.lineups === 'object' ? remote.payload.lineups : {};
        const entries = Object.entries(lineups);
        const container = create('article', { className: 'scenario-preview' });
        const title = remote.meta?.title || remote.name || 'Scenario';
        container.appendChild(create('h3', { text: `${title}` }));
        const metaParts = [];
        if (remote.meta && typeof remote.meta === 'object') {
          if (remote.meta.focus_team) metaParts.push(`Focus: ${remote.meta.focus_team}`);
          if (remote.meta.kind) metaParts.push(String(remote.meta.kind));
          const stamp = formatScenarioTimestamp(remote.meta.generated_at ?? remote.meta.saved_at ?? remote.meta.timestamp ?? remote.updated);
          if (stamp) metaParts.push(stamp);
        }
        if (metaParts.length) {
          container.appendChild(create('p', { className: 'scenario-meta', text: metaParts.join(' · ') }));
        }

        if (!entries.length) {
          container.appendChild(create('p', { text: 'No lineup data in scenario.' }));
          return container;
        }

        const limit = Math.min(entries.length, 6);
        for (let idx = 0; idx < limit; idx += 1) {
          const [teamName, payload] = entries[idx];
          const block = create('div', { className: 'scenario-team-block' });
          block.appendChild(create('h4', { text: teamName }));
          const starters = Array.isArray(payload?.starters) ? payload.starters : [];
          const list = create('ul');
          if (starters.length) {
            starters.slice(0, 10).forEach((starter) => {
              const slot = starter?.slot || starter?.pos || 'FLEX';
              const name = starter?.player_name || starter?.name || 'Player';
              const text = `${slot}: ${name}`;
              list.appendChild(create('li', { text }));
            });
          } else {
            list.appendChild(create('li', { text: 'No starters captured.' }));
          }
          block.appendChild(list);
          container.appendChild(block);
        }

        if (entries.length > limit) {
          container.appendChild(create('p', { className: 'scenario-note', text: `+ ${entries.length - limit} more team(s) in scenario…` }));
        }
        return container;
      }

      function buildRemoteScenarioWaivers(remote) {
        if (!remote || !remote.payload || typeof remote.payload !== 'object') return null;
        const waivers = Array.isArray(remote.payload.waivers) ? remote.payload.waivers : [];
        if (!waivers.length) return null;
        const container = create('article', { className: 'scenario-waivers-preview' });
        const title = remote.meta?.title || remote.name || 'Scenario';
        container.appendChild(create('h3', { text: `${title} — Waiver Intents` }));
        const table = create('table');
        table.appendChild(buildHeaderRow([
          ['label.player', 'Player'],
          ['label.pos', 'Pos'],
          ['label.teamName', 'Team'],
          ['label.faab', 'FAAB'],
          ['table.waivers.rationale', 'Rationale'],
        ]));
        const tbody = create('tbody');
        waivers.slice(0, 10).forEach((row) => {
          const tr = create('tr');
          tr.appendChild(create('td', { text: row.player_name || row.player || '' }));
          tr.appendChild(create('td', { text: row.pos || row.position || '' }));
          tr.appendChild(create('td', { text: row.team || row.nfl_team || '' }));
          const faab = row.faab_suggest ?? row.faab ?? '';
          tr.appendChild(create('td', { text: faab === '' ? '' : String(faab) }));
          tr.appendChild(create('td', { text: row.faab_why || row.rationale || '' }));
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);
        if (waivers.length > 10) {
          container.appendChild(create('p', { className: 'scenario-note', text: `+ ${waivers.length - 10} more waiver entries…` }));
        }
        return container;
      }

      function renderLineups() {
        const container = els.lineupsBody;
        clearNode(container);
        const remotePreview = buildRemoteScenarioLineups(state.remoteScenario);
        if (remotePreview) {
          container.appendChild(remotePreview);
        }
        const lineups = state.assistant?.lineups || {};
        const teams = Object.keys(lineups).filter(passesTeamFilter).sort((a, b) => a.localeCompare(b));
        if (!teams.length) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.lineupUnavailable', 'No lineup data for this selection.') }));
          return;
        }
        teams.forEach((team) => {
          const payload = lineups[team] || {};
          const details = create('details', { className: 'team-block' });
          details.appendChild(create('summary', { html: `${team}<span>${(payload.starters || []).length} starters</span>` }));
          const wrapper = create('div', { className: 'team-body' });

          const starters = payload.starters || [];
          const startersTable = create('table');
          const startersHead = create('thead');
          startersHead.appendChild(create('tr', { html: '<th>Slot</th><th>Player</th><th>Pos</th><th>Rank</th><th>Score</th>' }));
          startersTable.appendChild(startersHead);
        const startersBody = create('tbody');
        starters.forEach((starter) => {
          const tr = create('tr');
          tr.appendChild(create('td', { text: starter.slot || '' }));
          const risk = Number(starter.risk_score || 0);
          const riskTag = risk >= state.riskThreshold ? `<span class="tag risk">RISK ${(risk * 100).toFixed(0)}%</span>` : '';
          const lockTag = starter.locked ? '<span class="tag lock">LOCK</span>' : '';
          const playerCell = `${starter.player_name || ''} ${riskTag} ${lockTag}`.trim();
          tr.appendChild(create('td', { html: playerCell }));
          tr.appendChild(create('td', { text: starter.pos || starter.position || '' }));
          tr.appendChild(create('td', { text: starter.rank !== undefined ? String(starter.rank) : '–' }));
          tr.appendChild(create('td', { text: formatNumber(starter.score ?? starter.value ?? 0, 3) }));
          startersBody.appendChild(tr);
        });
          startersTable.appendChild(startersBody);
          wrapper.appendChild(startersTable);

          const bench = payload.bench || [];
        if (bench.length) {
          const benchTitle = create('h3', { text: 'Bench Depth', className: 'subhead' });
          benchTitle.style.marginTop = '1rem';
          wrapper.appendChild(benchTitle);
          const benchTable = create('table');
          benchTable.appendChild(buildHeaderRow([
            ['label.player', 'Player'],
            ['label.pos', 'Pos'],
            ['label.rank', 'Rank'],
            ['label.score', 'Score'],
          ]));
          const benchBody = create('tbody');
          bench.forEach((player) => {
            const tr = create('tr');
            const risk = Number(player.risk_score || 0);
            const riskTag = risk >= state.riskThreshold ? `<span class="tag risk">RISK ${(risk * 100).toFixed(0)}%</span>` : '';
            const lockTag = player.locked ? '<span class="tag lock">LOCK</span>' : '';
            tr.appendChild(create('td', { html: `${player.player_name || ''} ${riskTag} ${lockTag}`.trim() }));
            tr.appendChild(create('td', { text: player.pos || player.position || '' }));
            tr.appendChild(create('td', { text: player.rank !== undefined ? String(player.rank) : '–' }));
            tr.appendChild(create('td', { text: formatNumber(player.score ?? player.value ?? 0, 3) }));
            benchBody.appendChild(tr);
          });
            benchTable.appendChild(benchBody);
            wrapper.appendChild(benchTable);
          }

          const notes = payload.notes || [];
          if (notes.length) {
            const noteBox = create('div', { className: 'notes' });
            noteBox.innerHTML = notes.map((note) => `• ${note}`).join('<br>');
            wrapper.appendChild(noteBox);
          }

          details.appendChild(wrapper);
          container.appendChild(details);
        });
      }

      function renderStartSit() {
        const container = els.startsitBody;
        clearNode(container);
        const startsit = state.assistant?.startsit || {};
        const rows = [];
        const riskSummary = state.assistant?.news_summary || {};
        const hasRisk = Object.keys(riskSummary).some((team) => passesTeamFilter(team) && (riskSummary[team] || []).length);
        for (const [team, items] of Object.entries(startsit)) {
          if (!passesTeamFilter(team)) continue;
          (items || []).forEach((item) => {
            if (!item || !item.bucket) return;
            const bucket = String(item.bucket).toUpperCase();
            if (bucket !== 'TOSS-UP' && bucket !== 'LEAN') return;
            rows.push({
              team,
              slot: item.slot || '',
              starter: item.starter || '',
              alt: item.alt || item.bench_option || '',
              delta: Number(item.delta ?? item.rel ?? 0),
              bucket,
            });
          });
        }

        if (rows.length) {
          rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

          const table = create('table');
          table.appendChild(buildHeaderRow([
            ['label.teamName', 'Team'],
            ['label.slot', 'Slot'],
            ['label.starter', 'Starter'],
            ['label.alt', 'Alt'],
            ['label.deltaScore', 'Δ Score'],
            ['label.bucket', 'Bucket'],
          ]));
          const tbody = create('tbody');
          rows.forEach((row) => {
            const tr = create('tr');
            tr.appendChild(create('td', { text: row.team }));
            tr.appendChild(create('td', { text: row.slot }));
            tr.appendChild(create('td', { text: row.starter }));
            tr.appendChild(create('td', { text: row.alt }));
            tr.appendChild(create('td', { text: formatPercent(row.delta, 1) }));
            tr.appendChild(create('td', { text: row.bucket }));
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          container.appendChild(table);
        }

        if (!rows.length && !hasRisk) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.startsitFilter', 'No start/sit notes for this filter.') }));
          return;
        }

        if (hasRisk) {
          const grid = create('div', { className: 'card-grid' });
          Object.keys(riskSummary)
            .sort((a, b) => a.localeCompare(b))
            .forEach((team) => {
              if (!passesTeamFilter(team)) return;
              const entries = riskSummary[team] || [];
              if (!entries.length) return;
              const card = create('article', { className: 'team-risk' });
              card.appendChild(create('h3', { text: team }));
              const ul = create('ul');
              entries.forEach((entry) => {
                const pct = formatPercent(entry.risk_score || 0, 0);
                const meta = [entry.status, entry.practice_status, entry.notes]
                  .filter((part) => part && String(part).trim())
                  .join(' · ');
                ul.appendChild(create('li', { text: `${entry.player_name} (${entry.pos}) — ${pct}${meta ? ` · ${meta}` : ''}` }));
              });
              card.appendChild(ul);
              grid.appendChild(card);
            });
          if (grid.children.length) {
            container.appendChild(create('h3', { text: 'News & Risk Flags', className: 'subhead' }));
            container.appendChild(grid);
          }
        }
      }

      function renderWaivers() {
        const container = els.waiversBody;
        clearNode(container);
        const remoteWaivers = buildRemoteScenarioWaivers(state.remoteScenario);
        if (remoteWaivers) {
          container.appendChild(remoteWaivers);
        }
        const waivers = state.assistant?.waivers || [];
        if (!waivers.length) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.waiversNone', 'No waiver recommendations this week.') }));
          return;
        }

        const positions = ['ALL', ...new Set(waivers.map((w) => w.pos || w.position || ''))].filter(Boolean);
        const filters = create('div', { className: 'filters' });
        const label = create('label', { text: 'Position' });
        label.style.fontWeight = '600';
        label.style.color = 'var(--muted)';
        label.style.fontSize = '0.82rem';
        label.style.letterSpacing = '0.08em';
        label.style.textTransform = 'uppercase';
        const select = create('select');
        positions.forEach((pos) => {
          const opt = create('option', { text: pos, attrs: { value: pos } });
          select.appendChild(opt);
        });
        select.value = positions.includes(state.waiverPosition) ? state.waiverPosition : 'ALL';
        select.addEventListener('change', () => {
          state.waiverPosition = select.value;
          renderWaivers();
        });
        label.appendChild(select);
        filters.appendChild(label);
        container.appendChild(filters);

        let rows = waivers.slice(0, 50);
        if (state.waiverPosition && state.waiverPosition !== 'ALL') {
          rows = rows.filter((row) => (row.pos || row.position || '') === state.waiverPosition);
        }
        rows = rows.slice(0, 15);

        const table = create('table');
        table.appendChild(buildHeaderRow([
          ['label.player', 'Player'],
          ['label.pos', 'Pos'],
          ['label.teamName', 'Team'],
          ['label.score', 'Score'],
          ['label.faab', 'FAAB'],
          ['table.waivers.rationale', 'Rationale'],
        ]));
        const tbody = create('tbody');
        rows.forEach((row) => {
          const tr = create('tr');
          tr.appendChild(create('td', { text: row.player_name || '' }));
          tr.appendChild(create('td', { text: row.pos || row.position || '' }));
          tr.appendChild(create('td', { text: row.team || '' }));
          tr.appendChild(create('td', { text: formatNumber(row.final_score ?? row.score ?? 0, 3) }));
          const faab = row.faab_suggest !== undefined ? `$${Number(row.faab_suggest).toFixed(0)}` : '–';
          tr.appendChild(create('td', { text: faab }));
          const rationale = row.rationale || row.faab_why || '';
          tr.appendChild(create('td', { text: rationale }));
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);
      }

      function renderManagers() {
        const container = els.managersBody;
        if (!container) return;
        clearNode(container);
        const summary = state.managers || {};
        if (!summary.ready) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.managersLoading', 'Loading manager metrics…') }));
          return;
        }
        if (summary.error && summary.error !== 404) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.managersUnavailable', 'Manager leaderboard unavailable.') }));
          return;
        }
        const data = summary.data || {};
        const teams = Array.isArray(data.teams) ? data.teams : [];
        if (!teams.length) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.managersNone', 'No manager metrics computed yet.') }));
          return;
        }

        const table = create('table');
        table.appendChild(buildHeaderRow([
          ['label.rank', 'Rank'],
          ['label.teamName', 'Team'],
          ['table.startsit.hitRate', 'Start/Sit Hit %'],
          ['table.startsit.waiverRoi', 'Waiver ROI'],
          ['table.startsit.tradeVa', 'Trade VA'],
        ]));
        const tbody = create('tbody');
        teams.forEach((team, idx) => {
          const rank = idx + 1;
          const rate = team.start_sit_hit_rate;
          const rateText = rate === null || rate === undefined ? '—' : formatPercent(rate, 1);
          const waiver = team.waiver_roi;
          const waiverText = waiver === null || waiver === undefined ? 'N/A' : String(waiver);
          const trade = team.trade_value_added;
          const tradeText = trade === null || trade === undefined ? 'N/A' : String(trade);
          const tr = create('tr');
          tr.appendChild(create('td', { text: String(rank) }));
          tr.appendChild(create('td', { text: team.team || '' }));
          tr.appendChild(create('td', { text: rateText }));
          tr.appendChild(create('td', { text: waiverText }));
          tr.appendChild(create('td', { text: tradeText }));
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);

        const metaLines = [];
        const weeks = Array.isArray(data.weeks) ? data.weeks : [];
        if (weeks.length) {
          metaLines.push(`Weeks: ${weeks.join(', ')}`);
        }
        if (data.year) {
          metaLines.push(`Season: ${data.year}`);
        }
        if (data.generated_at) {
          metaLines.push(`Updated: ${formatTimestamp(data.generated_at)}`);
        }
        const overall = data.overall || {};
        if (overall.hit_rate !== undefined && overall.hit_rate !== null) {
          const pct = formatPercent(overall.hit_rate, 1);
          metaLines.push(`Overall hit rate ${pct} (${overall.hits || 0} / ${overall.total || 0})`);
        }
        if (metaLines.length) {
          const metaBox = create('div', { className: 'managers-meta' });
          metaBox.innerHTML = metaLines.join('<br>');
          container.appendChild(metaBox);
        }
      }

      function renderOps() {
        const container = els.opsBody;
        if (!container) return;
        clearNode(container);
        const opsState = state.ops || {};
        if (!opsState.ready) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.analyticsLoading', 'Loading recent runs…') }));
          return;
        }
        if (opsState.error) {
          const label = typeof opsState.error === 'number' ? `HTTP ${opsState.error}` : String(opsState.error || 'error');
          container.appendChild(create('div', { className: 'empty-state', text: `${t('empty.analyticsUnavailable', 'Ops analytics unavailable.')} (${label})` }));
          return;
        }
        const data = opsState.data;
        if (!data) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.analyticsNone', 'No historical run data found.') }));
          return;
        }

        const summaryBox = create('div', { className: 'ops-summary' });
        summaryBox.appendChild(create('div', { text: `${t('label.generatedAt', 'Generated at')}: ${data.generated_at || '—'}` }));
        summaryBox.appendChild(create('div', { text: `${t('label.avgDuration', 'Avg duration (logs)')}: ${Number(data.avg_duration_s || 0).toFixed(1)}s` }));
        container.appendChild(summaryBox);

        const failureEntries = data.failures && typeof data.failures === 'object' ? Object.entries(data.failures) : [];
        if (failureEntries.length) {
          const failureTable = create('table');
          failureTable.appendChild(buildHeaderRow([
            ['label.signal', 'Signal'],
            ['label.count', 'Count'],
          ]));
          const tbody = create('tbody');
          failureEntries.forEach(([key, value]) => {
            const tr = create('tr');
            tr.appendChild(create('td', { text: key }));
            tr.appendChild(create('td', { text: String(value) }));
            tbody.appendChild(tr);
          });
          failureTable.appendChild(tbody);
          const failureWrap = create('div', { className: 'ops-failures' });
          failureWrap.appendChild(create('h3', { text: t('heading.opsFailures', 'Failure signals') }));
          failureWrap.appendChild(failureTable);
          container.appendChild(failureWrap);
        }

        const logs = Array.isArray(data.logs) ? data.logs.slice(0, 10) : [];
        if (logs.length) {
          const logTable = create('table');
          logTable.appendChild(buildHeaderRow([
            ['label.start', 'Start'],
            ['label.target', 'Target'],
            ['label.exit', 'Exit'],
            ['label.duration', 'Duration (s)'],
          ]));
          const tbody = create('tbody');
          logs.forEach((entry) => {
            const tr = create('tr');
            tr.appendChild(create('td', { text: entry.start_ts || '—' }));
            tr.appendChild(create('td', { text: entry.log || '—' }));
            tr.appendChild(create('td', { text: entry.exit_code === null || entry.exit_code === undefined ? '—' : String(entry.exit_code) }));
            const duration = Number(entry.duration_s || 0);
            tr.appendChild(create('td', { text: duration.toFixed(1) }));
            tbody.appendChild(tr);
          });
          logTable.appendChild(tbody);
          const wrap = create('div', { className: 'ops-logs' });
          wrap.appendChild(create('h3', { text: t('heading.opsRecent', 'Recent runs') }));
          wrap.appendChild(logTable);
          container.appendChild(wrap);
        }

        const runs = Array.isArray(data.runs) ? data.runs.slice(-10) : [];
        if (runs.length) {
          const runTable = create('table');
          runTable.appendChild(buildHeaderRow([
            ['label.timestamp', 'Timestamp'],
            ['label.week', 'Week'],
            ['label.outputs', 'Outputs'],
          ]));
          const tbody = create('tbody');
          runs.forEach((entry) => {
            const tr = create('tr');
            tr.appendChild(create('td', { text: entry.timestamp || '—' }));
            tr.appendChild(create('td', { text: entry.week === undefined ? '—' : String(entry.week) }));
            const outputs = Array.isArray(entry.outputs) ? entry.outputs.slice(0, 3).join(', ') : '—';
            tr.appendChild(create('td', { text: outputs }));
            tbody.appendChild(tr);
          });
          runTable.appendChild(tbody);
          const runWrap = create('div', { className: 'ops-runs' });
          runWrap.appendChild(create('h3', { text: t('heading.opsRegistry', 'Run registry') }));
          runWrap.appendChild(runTable);
          container.appendChild(runWrap);
        }
      }

      function renderMatchups() {
        const container = els.matchupsBody;
        clearNode(container);
        const matchups = state.assistant?.matchups || [];
        if (!matchups.length) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.matchupsUnavailable', 'No matchup data for this week.') }));
          return;
        }
        const table = create('table');
        table.appendChild(buildHeaderRow([
          ['table.matchups.away', 'Away'],
          ['table.matchups.home', 'Home'],
          ['table.matchups.awayScore', 'Away Score'],
          ['table.matchups.homeScore', 'Home Score'],
          ['table.matchups.favored', 'Favored'],
          ['table.matchups.delta', 'Δ'],
        ]));
        const tbody = create('tbody');
        matchups.forEach((row) => {
          const tr = create('tr');
          tr.appendChild(create('td', { text: row.away || '' }));
          tr.appendChild(create('td', { text: row.home || '' }));
          tr.appendChild(create('td', { text: formatNumber(row.away_score ?? 0, 3) }));
          tr.appendChild(create('td', { text: formatNumber(row.home_score ?? 0, 3) }));
          tr.appendChild(create('td', { text: row.favored || t('label.even', 'Even') }));
          tr.appendChild(create('td', { text: formatNumber(row.delta ?? 0, 3) }));
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);
      }

      function defaultSeedsFromStrengths(strengths, count) {
        if (!Array.isArray(strengths) || !strengths.length) return [];
        const sorted = strengths
          .slice()
          .sort((a, b) => {
            const rankA = Number(a.rank);
            const rankB = Number(b.rank);
            if (Number.isFinite(rankA) && Number.isFinite(rankB) && rankA !== rankB) {
              return rankA - rankB;
            }
            const overallA = Number(a.overall_score ?? a.strength ?? 0) || 0;
            const overallB = Number(b.overall_score ?? b.strength ?? 0) || 0;
            return overallB - overallA;
          });
        const unique = [];
        const seen = new Set();
        for (const row of sorted) {
          const name = row.fantasy_team_name || row.team || row.name;
          if (!name) continue;
          const normalized = String(name);
          if (seen.has(normalized)) continue;
          seen.add(normalized);
          unique.push(normalized);
          if (unique.length >= count) break;
        }
        return unique;
      }

      function initializeBracket() {
        const strengths = state.assistant?.strengths || [];
        if (!strengths.length) {
          state.bracketSim = {
            seeds: [],
            defaultSeeds: [],
            odds: [],
            runs: 0,
            status: 'Strength data unavailable for bracket simulation.',
          };
          return;
        }
        const bracketData = state.bracket || {};
        const seedCount = Array.isArray(bracketData.seeds) && bracketData.seeds.length
          ? bracketData.seeds.length
          : Math.min(4, strengths.length);
        const defaults = defaultSeedsFromStrengths(strengths, seedCount);
        const seeds = Array.isArray(bracketData.seeds) && bracketData.seeds.length
          ? defaults.map((seed, idx) => bracketData.seeds[idx] || seed)
          : defaults.slice();
        const odds = Array.isArray(bracketData.odds) ? bracketData.odds : [];
        state.bracketSim = {
          seeds,
          defaultSeeds: defaults,
          odds,
          runs: odds.length ? bracketData.runs || 0 : 0,
          status: '',
        };
      }

      function updateBracketStatus(message) {
        state.bracketSim.status = message || '';
        if (els.bracketStatus) {
          els.bracketStatus.textContent = state.bracketSim.status;
        }
        if (message) {
          announceLive(message);
        }
      }

      function resetBracketSeeds() {
        const bracketSim = state.bracketSim || {};
        if (!bracketSim.defaultSeeds || !bracketSim.defaultSeeds.length) {
          updateBracketStatus(t('status.bracket.noDefaultSeeds', 'No default seeds available to reset.'));
          return;
        }
        state.bracketSim.seeds = bracketSim.defaultSeeds.slice();
        state.bracketSim.odds = [];
        state.bracketSim.runs = 0;
        updateBracketStatus(t('status.bracket.reset', 'Seeds reset to default order.'));
        renderBracket();
      }

      function renderBracketResults(odds) {
        const container = els.bracketResults;
        if (!container) return;
        clearNode(container);
        if (!Array.isArray(odds) || !odds.length) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.playoffSimPrompt', 'Run the simulation to view updated advancement odds.') }));
          return;
        }
        const table = create('table');
        const thead = create('thead');
        const headerRow = create('tr');
        [
          ['table.bracket.team', 'Team'],
          ['table.bracket.seed', 'Seed'],
          ['table.bracket.semis', 'Semis'],
          ['table.bracket.final', 'Final'],
          ['table.bracket.title', 'Title'],
        ].forEach(([key, fallback]) => {
          headerRow.appendChild(create('th', { text: t(key, fallback) }));
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        const tbody = create('tbody');
        odds.forEach((row) => {
          const tr = create('tr');
          tr.appendChild(create('td', { text: row.team || '' }));
          tr.appendChild(create('td', { text: row.seed !== undefined ? String(row.seed) : '–' }));
          tr.appendChild(create('td', { text: formatPercent(row.semi_odds ?? 0, 1) }));
          tr.appendChild(create('td', { text: formatPercent(row.final_odds ?? 0, 1) }));
          tr.appendChild(create('td', { text: formatPercent(row.title_odds ?? 0, 2) }));
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(create('h3', { text: t('heading.bracket.advancement', 'Advancement Probabilities') }));
        container.appendChild(table);
        if (state.bracketSim.runs) {
          container.appendChild(create('div', {
            className: 'startsit-status',
            text: t('text.lastSimulation', 'Last simulation: {runs} runs').replace('{runs}', state.bracketSim.runs.toLocaleString()),
          }));
        }
      }

      function buildBracketAscii(seeds) {
        if (!Array.isArray(seeds) || !seeds.length) {
          return t('bracket.ascii.prompt', 'Add seeds to visualize the bracket.');
        }
        const lines = [];
        const labelFinal = t('bracket.ascii.final', 'Final');
        const labelSemis = t('bracket.ascii.semifinals', 'Semifinals');
        const labelWinnersTitle = t('bracket.ascii.winnersTitle', '  Winners advance → Title');
        const labelWinnersChampion = t('bracket.ascii.winnersChampion', 'Winners advance each round → Champion');
        const tbd = t('label.tbd', 'TBD');
        const vsLabel = t('label.vs', 'vs');
        if (seeds.length === 2) {
          lines.push(labelFinal);
          lines.push(`(1) ${seeds[0] || tbd} ${vsLabel} (2) ${seeds[1] || tbd}`);
          return lines.join('\n');
        }
        if (seeds.length <= 4) {
          lines.push(labelSemis);
          for (let i = 0; i < seeds.length; i += 2) {
            const seedA = i + 1;
            const seedB = i + 2;
            const teamA = seeds[i] || tbd;
            const teamB = seeds[i + 1] || tbd;
            lines.push(`(${seedA}) ${teamA}`);
            if (teamB) {
              lines.push(`   ${vsLabel} (${seedB}) ${teamB}`);
            }
            lines.push('');
          }
          lines.push(labelFinal);
          lines.push(labelWinnersTitle);
          return lines.join('\n');
        }
        lines.push(t('bracket.ascii.roundOf', 'Round of {count}').replace('{count}', String(seeds.length)));
        for (let i = 0; i < seeds.length; i += 2) {
          const seedA = i + 1;
          const seedB = i + 2;
          const teamA = seeds[i] || tbd;
          const teamB = seeds[i + 1] || tbd;
          lines.push(`(${seedA}) ${teamA} ${vsLabel} (${seedB}) ${teamB}`);
        }
        lines.push('');
        lines.push(labelWinnersChampion);
        return lines.join('\n');
      }

      function renderBracketVisual(seeds) {
        const container = els.bracketVisual;
        if (!container) return;
        const ascii = buildBracketAscii(seeds);
        container.textContent = ascii;
      }

      function renderBracket() {
        const seedGrid = els.bracketSeedGrid;
        if (!seedGrid) return;
        const strengths = state.assistant?.strengths || [];
        const bracketSim = state.bracketSim || { seeds: [] };
        const teamOptions = defaultSeedsFromStrengths(strengths, strengths.length || 0);
        clearNode(seedGrid);

        const seeds = Array.isArray(bracketSim.seeds) ? bracketSim.seeds : [];
        if (!seeds.length) {
          seedGrid.appendChild(create('div', { className: 'empty-state', text: t('empty.bracketSeeds', 'No bracket seeds available. Run the assistant bracket simulation or add seeds manually.') }));
        } else {
          seeds.forEach((seedTeam, index) => {
            const label = create('label', { text: `Seed ${index + 1}` });
            const select = create('select');
            const options = new Set(teamOptions);
            options.add(seedTeam);
            Array.from(options).sort((a, b) => a.localeCompare(b)).forEach((team) => {
              const option = create('option', { text: team, attrs: { value: team } });
              if (team === seedTeam) {
                option.selected = true;
              }
              select.appendChild(option);
            });
            select.addEventListener('change', () => {
              state.bracketSim.seeds[index] = select.value;
              state.bracketSim.odds = [];
              state.bracketSim.runs = 0;
              if (state.scenarios.active) {
                state.scenarios.active = null;
                updateScenarioSelect();
              }
              updateBracketStatus(t('status.bracket.updated', 'Seeds updated. Run the simulation to refresh odds.'));
              renderBracket();
            });
            label.appendChild(select);
            seedGrid.appendChild(label);
          });
        }

        if (els.bracketStatus) {
          els.bracketStatus.textContent = bracketSim.status || '';
        }

        renderBracketResults(bracketSim.odds || []);
        renderBracketVisual(seeds);
      }

      function simulateBracketClient(seeds, strengths, runs = 5000, noise = 0.1) {
        if (!Array.isArray(seeds) || seeds.length < 2) {
          return { runs: 0, odds: [] };
        }
        const iterations = Math.max(1, Math.min(50000, Number(runs) || 0));
        const strengthMap = new Map();
        strengths.forEach((row) => {
          const name = row.fantasy_team_name || row.team || row.name;
          if (!name) return;
          const overall = toNumber(row.overall_score ?? row.strength ?? row.top3, 0.5);
          strengthMap.set(String(name), overall > 0 ? overall : 0.5);
        });
        const stats = {};
        const normalizedSeeds = seeds.map((team) => String(team || '')).filter(Boolean);
        normalizedSeeds.forEach((team, idx) => {
          stats[team] = { seed: idx + 1, semi: 0, final: 0, title: 0 };
        });

        for (let run = 0; run < iterations; run += 1) {
          let roundTeams = normalizedSeeds.slice();
          let currentRound = roundTeams.length;
          while (roundTeams.length > 1) {
            if (roundTeams.length === 4) {
              roundTeams.forEach((team) => {
                if (stats[team]) {
                  stats[team].semi += 1;
                }
              });
            }
            if (roundTeams.length === 2) {
              roundTeams.forEach((team) => {
                if (stats[team]) {
                  stats[team].final += 1;
                }
              });
            }
            const nextRound = [];
            for (let idx = 0; idx < roundTeams.length; idx += 2) {
              const teamA = roundTeams[idx];
              const teamB = roundTeams[idx + 1];
              if (!teamB) {
                nextRound.push(teamA);
                continue;
              }
              const strengthA = strengthMap.get(teamA) ?? 0.5;
              const strengthB = strengthMap.get(teamB) ?? 0.5;
              const sampleA = strengthA * Math.exp(randomNormal(0, noise));
              const sampleB = strengthB * Math.exp(randomNormal(0, noise));
              const winner = sampleA >= sampleB ? teamA : teamB;
              nextRound.push(winner);
            }
            roundTeams = nextRound;
          }
          const champion = roundTeams[0];
          if (champion && stats[champion]) {
            stats[champion].title += 1;
          }
        }

        const odds = normalizedSeeds.map((team, idx) => {
          const entry = stats[team] || { seed: idx + 1, semi: 0, final: 0, title: 0 };
          return {
            team,
            seed: entry.seed,
            semi_odds: entry.semi / iterations,
            final_odds: entry.final / iterations,
            title_odds: entry.title / iterations,
          };
        });

        return { runs: iterations, odds };
      }

      function handleBracketSimulate(event) {
        event.preventDefault();
        const strengths = state.assistant?.strengths || [];
        if (!strengths.length) {
          updateBracketStatus(t('status.bracket.noStrength', 'Strengths unavailable; cannot simulate bracket.'));
          return;
        }
        const seeds = state.bracketSim?.seeds || [];
        if (!seeds.length) {
          updateBracketStatus(t('status.bracket.addSeeds', 'Add seeds before running a simulation.'));
          return;
        }
        const result = simulateBracketClient(seeds, strengths, 5000, 0.1);
        state.bracketSim.odds = result.odds;
        state.bracketSim.runs = result.runs;
        updateBracketStatus(`Simulated ${result.runs.toLocaleString()} bracket runs.`);
        renderBracket();
      }

      function readScenarioStorage() {
        try {
          const raw = localStorage.getItem(SCENARIO_STORAGE_KEY);
          if (!raw) return {};
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const keys = Object.keys(parsed);
            const isLegacy = keys.every((key) => /^\d+$/.test(key));
            if (isLegacy) {
              return { [DEFAULT_LEAGUE_KEY]: parsed };
            }
            return parsed;
          }
        } catch (err) {
          console.warn('Failed to read scenario storage', err);
        }
        return {};
      }

      function writeScenarioStorage(data) {
        try {
          const cleaned = {};
          if (data && typeof data === 'object') {
            Object.entries(data).forEach(([league, payload]) => {
              if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
                return;
              }
              const filtered = Object.fromEntries(
                Object.entries(payload).filter(([, value]) => value && typeof value === 'object' && Object.keys(value).length),
              );
              if (Object.keys(filtered).length) {
                cleaned[league] = filtered;
              }
            });
          }
          localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(cleaned));
        } catch (err) {
          console.warn('Failed to persist scenarios', err);
        }
      }

      async function loadScenariosForWeek() {
        const storage = readScenarioStorage();
        const leagueKey = state.league || DEFAULT_LEAGUE_KEY;
        const leagueScenarios = storage[leagueKey] && typeof storage[leagueKey] === 'object' ? storage[leagueKey] : {};
        const key = String(state.week ?? 'auto');
        const saved = leagueScenarios[key] && typeof leagueScenarios[key] === 'object' ? leagueScenarios[key] : {};
        state.scenarios = {
          saved: { ...saved },
          active: null,
        };
        updateScenarioSelect();
        await refreshRemoteScenarios();
      }

      function persistScenarios() {
        const storage = readScenarioStorage();
        const leagueKey = state.league || DEFAULT_LEAGUE_KEY;
        if (!storage[leagueKey] || typeof storage[leagueKey] !== 'object') {
          storage[leagueKey] = {};
        }
        const key = String(state.week ?? 'auto');
        storage[leagueKey][key] = state.scenarios.saved || {};
        writeScenarioStorage(storage);
      }

      function updateScenarioSelect() {
        if (!els.scenarioSelect) return;
        const saved = state.scenarios.saved || {};
        const names = Object.keys(saved).sort((a, b) => a.localeCompare(b));
        const active = state.scenarios.active || '';
        clearNode(els.scenarioSelect);
        const placeholderText = names.length
          ? t('status.selectScenarioPrompt', 'Select scenario')
          : t('status.noSavedScenarios', 'No saved scenarios');
        const placeholder = create('option', {
          text: placeholderText,
          attrs: { value: '' },
        });
        placeholder.disabled = true;
        placeholder.selected = active === '';
        els.scenarioSelect.appendChild(placeholder);
        names.forEach((name) => {
          const option = create('option', { text: name, attrs: { value: name } });
          if (name === active) {
            option.selected = true;
          }
          els.scenarioSelect.appendChild(option);
        });
      }

      async function refreshRemoteScenarios() {
        const league = state.league || '';
        const week = state.week;
        state.remoteScenarios = [];
        state.remoteScenarioIndex = {};
        updateRemoteScenarioSelect();
        if (!league || week === null || week === undefined) {
          return;
        }
        const weekNumber = Number(week);
        if (!Number.isFinite(weekNumber)) {
          return;
        }
        const base = config.basePath || '';
        const url = `${base}scenarios/${league}/w${weekNumber}/index.json?ts=${Date.now()}`;
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res || !res.ok) {
            updateRemoteScenarioSelect();
            return;
          }
          const items = await res.json();
          if (!Array.isArray(items)) {
            updateRemoteScenarioSelect();
            return;
          }
          state.remoteScenarios = items;
          const index = {};
          items.forEach((item) => {
            if (item && typeof item === 'object' && item.path) {
              index[item.path] = item;
            }
          });
          state.remoteScenarioIndex = index;
        } catch (err) {
          console.warn('remote scenario fetch failed', err);
          state.remoteScenarios = [];
          state.remoteScenarioIndex = {};
        }
        updateRemoteScenarioSelect();
      }

      function formatScenarioTimestamp(value) {
        if (value === null || value === undefined) return '';
        let epoch = Number(value);
        if (!Number.isFinite(epoch)) {
          const parsed = Date.parse(value);
          if (Number.isFinite(parsed)) {
            return new Date(parsed).toLocaleString();
          }
          return '';
        }
        if (epoch > 1e12) {
          return new Date(epoch).toLocaleString();
        }
        return new Date(epoch * 1000).toLocaleString();
      }

      function formatRemoteScenarioLabel(item) {
        if (!item || typeof item !== 'object') return '';
        const meta = item.meta && typeof item.meta === 'object' ? item.meta : {};
        const baseName = meta.title || meta.name || meta.focus_team || item.name || 'Scenario';
        const descriptor = meta.kind ? String(meta.kind).replace(/_/g, ' ') : '';
        const focus = meta.focus_team && meta.focus_team !== baseName ? meta.focus_team : '';
        const timestampSource = meta.generated_at ?? meta.saved_at ?? item.updated;
        const timestamp = formatScenarioTimestamp(timestampSource);
        const parts = [baseName];
        if (focus) parts.push(`Focus: ${focus}`);
        if (descriptor) parts.push(descriptor);
        let label = parts.filter(Boolean).join(' · ');
        if (timestamp) {
          label = `${label} (${timestamp})`;
        }
        return label;
      }

      function updateRemoteScenarioSelect() {
        if (!els.remoteScenarioSelect) return;
        clearNode(els.remoteScenarioSelect);
        const hasItems = Array.isArray(state.remoteScenarios) && state.remoteScenarios.length > 0;
        const placeholder = create('option', {
          text: hasItems
            ? t('status.remoteScenarioSelect', 'Select scenario')
            : t('status.remoteScenarioEmpty', 'No remote scenarios available.'),
          attrs: { value: '' },
        });
        placeholder.disabled = hasItems;
        placeholder.selected = true;
        els.remoteScenarioSelect.appendChild(placeholder);
        if (!hasItems) {
          return;
        }
        state.remoteScenarios.forEach((item) => {
          if (!item || typeof item !== 'object' || !item.path) return;
          const option = create('option', {
            text: formatRemoteScenarioLabel(item),
            attrs: { value: item.path },
          });
          els.remoteScenarioSelect.appendChild(option);
        });
      }

      async function loadRemoteScenario(path) {
        if (!path) return;
        const base = config.basePath || '';
        const url = `${base}${path}`;
        const response = await fetch(url, { cache: 'no-cache' });
        if (!response || !response.ok) {
          throw new Error(`scenario fetch failed (${response ? response.status : 'network'})`);
        }
        const payload = await response.json();
        const indexEntry = state.remoteScenarioIndex?.[path] || {};
        const meta = indexEntry.meta || {};
        const name = indexEntry.name || path.split('/').pop() || 'scenario';
        const updated = indexEntry.updated;
        state.remoteScenario = {
          path,
          name,
          meta,
          payload,
          updated,
        };
        renderLineups();
        renderWaivers();
      }

      async function handleRemoteScenarioLoad() {
        if (!els.remoteScenarioSelect) return;
        const value = els.remoteScenarioSelect.value;
        if (!value) return;
        try {
          await loadRemoteScenario(value);
          announceLive(t('status.remoteScenarioLoaded', 'Scenario applied.'));
        } catch (err) {
          console.error('remote scenario load failed', err);
          alert(t('status.remoteScenarioFailed', 'Unable to load scenario.'));
        }
      }

      function clearRemoteScenario() {
        state.remoteScenario = null;
      }

      function collectLineupSwaps() {
        const startSit = state.startSit || {};
        if (!startSit.ready) {
          return {};
        }
        const result = {};
        Object.entries(startSit.teamStates || {}).forEach(([teamName, teamState]) => {
          const baseline = teamState?.baseline?.starters || [];
          const current = teamState?.lineup?.starters || [];
          if (!baseline.length && !current.length) {
            return;
          }
          const baselineIds = new Set(baseline.map((player) => String(player.id)));
          const currentIds = new Set(current.map((player) => String(player.id)));
          const removed = baseline.filter((player) => !currentIds.has(String(player.id)));
          const added = current.filter((player) => !baselineIds.has(String(player.id)));
          const swaps = [];
          const limit = Math.max(removed.length, added.length);
          for (let idx = 0; idx < limit; idx += 1) {
            const outPlayer = removed[idx];
            const inPlayer = added[idx];
            if (!outPlayer && !inPlayer) continue;
            swaps.push({
              slot: (inPlayer && (inPlayer.slot || inPlayer.pos || 'FLEX')) || (outPlayer && (outPlayer.slot || outPlayer.pos || 'FLEX')) || 'FLEX',
              from_player_id: outPlayer ? outPlayer.id : null,
              to_player_id: inPlayer ? inPlayer.id : null,
            });
          }
          if (swaps.length) {
            result[teamName] = swaps;
          }
        });
        return result;
      }

      function collectScenarioData() {
        syncScenarioState();
        const swaps = collectLineupSwaps();
        const trades = (state.scenario?.trades || []).map((trade) => ({
          teamA: trade.teamA,
          outA: Array.isArray(trade.outA) ? trade.outA.slice() : [],
          teamB: trade.teamB,
          outB: Array.isArray(trade.outB) ? trade.outB.slice() : [],
        }));
        const seedsOverride = Array.isArray(state.scenario?.seeds_override)
          ? state.scenario.seeds_override.slice()
          : [];
        return {
          lineup_swaps: swaps,
          trades,
          seeds_override: seedsOverride,
        };
      }

      function encodeScenarioToHash(scenario) {
        try {
          const json = JSON.stringify(scenario || {});
          const base64 = btoa(unescape(encodeURIComponent(json)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/g, '');
          return base64;
        } catch (err) {
          console.error('Failed to encode scenario for sharing', err);
          return null;
        }
      }

      function decodeScenarioFromHash(encoded) {
        if (!encoded) return null;
        try {
          const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
          const padLength = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
          const padded = normalized + '='.repeat(padLength);
          const json = decodeURIComponent(
            atob(padded)
              .split('')
              .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
              .join(''),
          );
          const payload = JSON.parse(json);
          return typeof payload === 'object' && payload ? payload : null;
        } catch (err) {
          console.error('Failed to decode scenario hash', err);
          return null;
        }
      }

      function shareScenarioLink(event) {
        if (event) event.preventDefault();
        syncScenarioState();
        if (!scenarioHasChanges()) {
          updateBracketStatus(t('status.bracket.noChangesShare', 'No scenario changes to share.'));
          return;
        }
        const scenario = collectScenarioData();
        const encoded = encodeScenarioToHash(scenario);
        if (!encoded) {
          updateBracketStatus(t('status.bracket.encodeFailed', 'Unable to encode scenario for sharing.'));
          return;
        }
        if (encoded.length > 6000) {
          alert('Scenario too large to share via URL. Please export as JSON instead.');
          return;
        }
        const params = { ...getHashParams(), [SCENARIO_HASH_PARAM]: encoded };
        lastEncodedScenarioHash = encoded;
        writeHashParams(params);
        const url = new URL(window.location.href);
        if (state.week) {
          url.searchParams.set('week', state.week);
        } else {
          url.searchParams.delete('week');
        }
        if (state.league) {
          url.searchParams.set('league', state.league);
        } else {
          url.searchParams.delete('league');
        }
        const hashString = buildHashString(params);
        const relativeUrl = url.pathname + url.search + (hashString ? `#${hashString}` : '');
        history.replaceState(null, '', relativeUrl);
        const shareUrl = `${url.origin}${relativeUrl}`;
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(shareUrl).then(
            () => updateBracketStatus(t('status.bracket.linkCopied', 'Scenario link copied to clipboard.')),
            () => updateBracketStatus(t('status.bracket.linkReady', 'Scenario link ready. Copy from address bar.')),
          );
        } else {
          updateBracketStatus(t('status.bracket.linkReady', 'Scenario link ready. Copy from address bar.'));
        }
      }

      function clearScenarioHash(event) {
        if (event) event.preventDefault();
        const params = { ...getHashParams() };
        if (params[SCENARIO_HASH_PARAM]) {
          delete params[SCENARIO_HASH_PARAM];
          writeHashParams(params);
          lastEncodedScenarioHash = null;
          updateBracketStatus(t('status.bracket.hashRemoved', 'Scenario hash removed from URL.'));
        }
      }

      function updateScenarioHash(force = false) {
        if (suppressHashUpdate) {
          return '';
        }
        const params = { ...getHashParams() };
        if (!scenarioHasChanges()) {
          if (params[SCENARIO_HASH_PARAM]) {
            delete params[SCENARIO_HASH_PARAM];
            lastEncodedScenarioHash = null;
            writeHashParams(params);
          }
          return '';
        }
        const scenario = collectScenarioData();
        const encoded = encodeScenarioToHash(scenario);
        if (!encoded) {
          return '';
        }
        if (!force && encoded.length > 6000) {
          const params = { ...getHashParams() };
          if (params[SCENARIO_HASH_PARAM]) {
            delete params[SCENARIO_HASH_PARAM];
            lastEncodedScenarioHash = null;
            writeHashParams(params);
          }
          return '';
        }
        params[SCENARIO_HASH_PARAM] = encoded;
        lastEncodedScenarioHash = encoded;
        const hashString = buildHashString(params);
        writeHashParams(params);
        return `${window.location.pathname}${window.location.search}${hashString ? `#${hashString}` : ''}`;
      }

      function handleScenarioSave(event) {
        event.preventDefault();
        if (!els.scenarioName) {
          return;
        }
        const name = (els.scenarioName.value || '').trim();
        if (!name) {
          updateBracketStatus(t('status.bracket.enterName', 'Enter a scenario name to save.'));
          return;
        }
        const scenario = collectScenarioData();
        const hasSwaps = Object.keys(scenario.lineup_swaps || {}).length > 0;
        const hasTrades = Array.isArray(scenario.trades) && scenario.trades.length > 0;
        const hasSeeds = Array.isArray(scenario.seeds_override) && scenario.seeds_override.length > 0;
        if (!hasSwaps && !hasTrades && !hasSeeds) {
          updateBracketStatus(t('status.bracket.nothingToSave', 'No trades, lineup swaps, or seed changes to save.'));
          return;
        }
        state.scenarios.saved[name] = scenario;
        state.scenarios.active = name;
        persistScenarios();
        updateScenarioSelect();
        updateBracketStatus(`Scenario “${name}” saved.`);
        els.scenarioName.value = '';
      }

      function handleScenarioLoad(event) {
        event.preventDefault();
        if (!els.scenarioSelect) return;
        const name = els.scenarioSelect.value;
        if (!name) {
          updateBracketStatus(t('status.bracket.selectScenario', 'Select a saved scenario to load.'));
          return;
        }
        const scenario = state.scenarios.saved?.[name];
        if (!scenario) {
          updateBracketStatus(t('status.bracket.notFound', 'Scenario not found.'));
          return;
        }
        loadScenarioByName(name, scenario);
      }

      function handleScenarioDelete(event) {
        event.preventDefault();
        if (!els.scenarioSelect) return;
        const name = els.scenarioSelect.value;
        if (!name) {
          updateBracketStatus(t('status.bracket.selectToDelete', 'Select a scenario to delete.'));
          return;
        }
        if (state.scenarios.saved?.[name]) {
          delete state.scenarios.saved[name];
          if (state.scenarios.active === name) {
            state.scenarios.active = null;
          }
          persistScenarios();
          updateScenarioSelect();
          updateBracketStatus(`Scenario “${name}” deleted.`);
        }
      }

      function loadScenarioByName(name, scenario) {
        resetScenario({ silent: true, preserveActive: true });
        state.scenario.source = 'manual';
        if (scenario.trades && Array.isArray(scenario.trades)) {
          scenario.trades.forEach((trade) => applyTradeRecord(trade, { silent: true, source: state.scenario.source }));
        }
        if (scenario.lineup_swaps && typeof scenario.lineup_swaps === 'object') {
          applyLineupSwaps(scenario.lineup_swaps);
        }
        if (Array.isArray(scenario.seeds_override) && scenario.seeds_override.length) {
          state.bracketSim.seeds = scenario.seeds_override.slice();
          state.bracketSim.odds = [];
          state.bracketSim.runs = 0;
        }
        refreshScenarioOutputs();
        showResults([]);
        state.scenarios.active = name;
        persistScenarios();
        updateScenarioSelect();
        updateBracketStatus(`Scenario “${name}” loaded.`);
      }

      function applyTradeRecord(trade, options = {}) {
        if (!trade || !trade.teamA || !trade.teamB) return;
        const silent = options.silent === true;
        applyTradeToState({
          teamA: trade.teamA,
          teamB: trade.teamB,
          sendA: trade.outA,
          sendB: trade.outB,
        }, { record: trade, recordHistory: false, silent, source: options.source || state.scenario.source || 'manual' });
      }

      function applyLineupSwaps(swapsByTeam) {
        const startSit = state.startSit || {};
        if (!startSit.ready) return;
        Object.entries(swapsByTeam || {}).forEach(([teamName, swaps]) => {
          const teamState = startSit.teamStates?.[teamName];
          if (!teamState) return;
          const forceStart = new Set();
          const forceBench = new Set();
          (swaps || []).forEach((swap) => {
            if (swap?.to_player_id) forceStart.add(String(swap.to_player_id));
            if (swap?.from_player_id) forceBench.add(String(swap.from_player_id));
          });
          teamState.forceStart = forceStart;
          teamState.forceBench = forceBench;
          applyStartSitOverrides(teamName);
        });
        startSit.results = null;
      }

      function arraysEqual(a, b) {
        if (!Array.isArray(a) || !Array.isArray(b)) return false;
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i += 1) {
          if (a[i] !== b[i]) return false;
        }
        return true;
      }

      function computeNotifications() {
        const assistant = state.assistant || {};
        const notices = new Set();
        const threshold = Number(state.riskThreshold ?? 0.4);

        const lineups = assistant.lineups || {};
        Object.entries(lineups).forEach(([teamName, payload]) => {
          (payload?.starters || []).forEach((player) => {
            const risk = Number(player?.risk_score);
            if (Number.isFinite(risk) && risk >= threshold) {
              notices.add(`High-risk starter: ${player.player_name || 'Unknown'} (${teamName}) – ${(risk * 100).toFixed(0)}%`);
            }
          });
        });

        const byeCoverage = assistant.bye_coverage || {};
        Object.entries(byeCoverage).forEach(([teamName, entries]) => {
          (entries || []).forEach((entry) => {
            const required = Number(entry?.required) || 0;
            const covered = Number(entry?.covered) || 0;
            const need = Boolean(entry?.need_flag) || covered < required;
            if (need) {
              const slot = entry?.slot || 'Slot';
              const weekLabel = entry?.week !== undefined ? `wk${entry.week}` : 'upcoming';
              notices.add(`Bye gap: ${teamName} needs ${slot} coverage (${covered}/${required}) ${weekLabel}`);
            }
          });
        });

        const waivers = assistant.waivers || [];
        waivers.forEach((row) => {
          const bid = Number(row?.faab_suggest ?? row?.faab_bid ?? row?.faab_budget ?? 0);
          if (Number.isFinite(bid) && bid >= 40) {
            const target = row?.suggested_for || row?.fantasy_team_name || t('label.anyTeam', 'any team');
            notices.add(`FAAB alert: ${row.player_name || 'Player'} suggested at $${bid.toFixed(0)} (${target})`);
          }
        });

        const alerts = assistant.alerts || [];
        alerts.forEach((message) => {
          if (typeof message === 'string' && message.trim()) {
            notices.add(message.trim());
          }
        });

        return Array.from(notices).slice(0, 20);
      }

      function renderNotifications() {
        const container = els.notificationsBody;
        if (!container) return;
        clearNode(container);
        const list = state.notifications || [];
        if (!list.length) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.notifications', 'No notifications right now.') }));
          return;
        }
        list.forEach((item) => {
          container.appendChild(create('div', { className: 'notification-item', text: item }));
        });
      }

      function renderPlayoffs() {
        const container = els.playoffsBody;
        clearNode(container);
        if (!state.sim || !(state.sim.summary || []).length) {
          container.appendChild(create('div', { className: 'empty-state', text: t('empty.seasonSimMissing', 'Season simulation not available.') }));
          return;
        }
        const table = create('table');
        table.appendChild(buildHeaderRow([
          ['label.teamName', 'Team'],
          ['table.playoffs.meanWins', 'Mean Wins'],
          ['table.playoffs.medianWins', 'Median Wins'],
          ['table.playoffs.playoffOdds', 'Playoff Odds'],
          ['table.playoffs.titleOdds', 'Title Odds'],
        ]));
        const tbody = create('tbody');
        (state.sim.summary || []).forEach((row) => {
          const tr = create('tr');
          tr.appendChild(create('td', { text: row.team || '' }));
          tr.appendChild(create('td', { text: formatNumber(row.mean_wins ?? row.mean_remaining_wins ?? 0, 2) }));
          tr.appendChild(create('td', { text: formatNumber(row.median_wins ?? 0, 2) }));
          tr.appendChild(create('td', { text: formatPercent(row.playoff_odds ?? 0) }));
          tr.appendChild(create('td', { text: formatPercent(row.title_odds ?? 0) }));
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);
      }

      function renderFooter() {
        if (els.footerMeta) {
          clearNode(els.footerMeta);
          const badges = [];
          const version = typeof config.meta.version === 'string' ? config.meta.version.trim() : config.meta.version;
          if (version) {
            badges.push({ text: t('badge.version', 'Version {value}').replace('{value}', String(version)) });
          }
          if (state.league) {
            badges.push({ text: t('badge.league', 'League {value}').replace('{value}', getLeagueName(state.league)) });
          }
          if (state.week) {
            badges.push({ text: t('badge.week', 'Week {value}').replace('{value}', String(state.week)) });
          }
          if (config.meta.built_at) {
            const builtText = formatTimestamp(config.meta.built_at);
            if (builtText) {
              badges.push({ text: t('badge.built', 'Built {value}').replace('{value}', builtText) });
            }
          }
          if (scenarioHasChanges()) {
            const source = state.scenario?.source || 'manual';
            let labelKey = 'badge.scenario.modified';
            if (source === 'hash') {
              labelKey = 'badge.scenario.shared';
            } else if (source === 'imported') {
              labelKey = 'badge.scenario.imported';
            }
            badges.push({ text: t(labelKey, I18N_DEFAULTS[labelKey] || 'Scenario modified'), className: 'scenario-badge' });
          }
          badges.forEach((badge) => {
            const data = typeof badge === 'string' ? { text: badge } : badge;
            els.footerMeta.appendChild(create('span', { text: data.text, className: data.className }));
          });
        }

        if (els.footerDownloads) {
          clearNode(els.footerDownloads);
          let downloads = [];
          const metaDownloads = config.meta.downloads;
          if (metaDownloads && typeof metaDownloads === 'object' && !Array.isArray(metaDownloads)) {
            const leagueDownloads = state.league && Array.isArray(metaDownloads[state.league]) ? metaDownloads[state.league] : null;
            const fallbackDownloads = Array.isArray(metaDownloads[DEFAULT_LEAGUE_KEY]) ? metaDownloads[DEFAULT_LEAGUE_KEY] : null;
            downloads = leagueDownloads || fallbackDownloads || [];
          } else if (Array.isArray(metaDownloads)) {
            downloads = metaDownloads;
          }
          if (downloads.length) {
            downloads.forEach((item) => {
              if (!item || !item.path) return;
              const rawPath = String(item.path);
              const href = /^https?:/i.test(rawPath) ? rawPath : `${config.basePath || ''}${rawPath}`;
              const link = create('a', { text: item.name || rawPath, attrs: { href } });
              const li = create('li');
              li.appendChild(link);
              els.footerDownloads.appendChild(li);
            });
          }
        }
      }

      function handleTabClick(event) {
        event.preventDefault();
        const tab = event.currentTarget?.dataset?.tab;
        setActiveTab(tab, { updateHash: true });
      }

      function handleTabKeydown(event) {
        const key = event.key;
        const buttons = Array.from(document.querySelectorAll('.tab-btn'));
        const current = event.currentTarget;
        const currentIndex = buttons.indexOf(current);
        if (currentIndex === -1) {
          return;
        }

        let nextIndex = null;
        if (key === 'ArrowRight' || key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % buttons.length;
        } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
          nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        } else if (key === 'Home') {
          nextIndex = 0;
        } else if (key === 'End') {
          nextIndex = buttons.length - 1;
        } else if (key === ' ' || key === 'Enter') {
          event.preventDefault();
          setActiveTab(current.dataset?.tab, { updateHash: true, focus: true });
          return;
        } else {
          return;
        }

        event.preventDefault();
        const next = buttons[nextIndex];
        if (next) {
          setActiveTab(next.dataset?.tab, { updateHash: true, focus: true });
        }
      }

      async function handleShareClick(event) {
        event.preventDefault();
        if (!state.week) {
          setShareLabel(t('status.selectWeek', 'Select a week'), true);
          return;
        }
        const url = new URL(window.location.href);
        url.searchParams.set('week', state.week);
        const params = getHashParams();
        params.tab = state.activeTab || TAB_IDS[0];
        const hashString = buildHashString(params);
        const relativeUrl = url.pathname + url.search + (hashString ? `#${hashString}` : '');
        history.replaceState(null, '', relativeUrl);
        const shareUrl = `${url.origin}${relativeUrl}`;
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          try {
            await navigator.clipboard.writeText(shareUrl);
            setShareLabel(t('status.linkCopied', 'Link copied!'));
            return;
          } catch (err) {
            console.warn('clipboard copy failed', err);
          }
        }
        setShareLabel(t('status.linkReady', 'Link ready'), true);
      }

      async function init() {
        await loadBasePath();
        els.siteTitle = $('#site-title');
        els.siteSubtitle = $('#site-subtitle');
        els.shareLink = $('#share-link');
        els.shareEmailDrafts = $('#share-email-drafts');
        els.shareSlackPack = $('#share-slack-pack');
        els.releasesLink = $('#releasesLink');
        els.siteFooter = $('#site-footer');
        els.dashBrowseLink = $('#dashBrowseLink');
        els.leagueSelect = $('#league-select');
        els.scenarioStatus = $('#scenario-status');
        els.languageSelect = $('#language-select');
        els.themeSelect = $('#theme-select');
        els.footerMeta = $('#site-footer-meta');
        els.footerDownloads = $('#site-footer-downloads');
        els.weekSelect = $('#week-select');
        els.teamFilter = $('#team-filter');
        els.teamOptions = $('#team-options');
        els.remoteScenarioSelect = $('#remote-scenario-select');
        els.remoteScenarioLoad = $('#remote-scenario-load');
        els.remoteScenarioClear = $('#remote-scenario-clear');
        els.powerBody = $('#power-body');
        els.lineupsBody = $('#lineups-body');
        els.startsitBody = $('#startsit-body');
        els.waiversBody = $('#waivers-body');
        els.managersBody = $('#managers-body');
        els.opsBody = $('#ops-body');
        els.matchupsBody = $('#matchups-body');
        els.bracketSeedGrid = $('#bracket-seed-grid');
        els.bracketResults = $('#bracket-results');
        els.bracketVisual = $('#bracket-visual');
        els.bracketStatus = $('#bracket-status');
        els.bracketReset = $('#bracket-reset');
        els.bracketSimulate = $('#bracket-simulate');
        els.playoffsBody = $('#playoffs-body');
        els.tradeFilterTeamA = $('#trade-filter-team-a');
        els.tradeFilterTeamB = $('#trade-filter-team-b');
        els.tradeFilterPos = $('#trade-filter-pos');
        els.tradeFilterFairness = $('#trade-filter-fairness');
        els.tradeFilterFairnessValue = $('#trade-filter-fairness-value');
        els.tradeTableBody = $('#trade-table-body');
        els.tradeCustomOpen = $('#trade-custom-open');
        els.tradeScenarioStats = $('#trade-scenario-stats');
        els.tradeScenarioSummary = $('#trade-scenario-summary');
        els.tradeLineupBadge = $('#trade-lineup-badge');
        els.tradeUndo = $('#trade-undo');
        els.tradeReset = $('#trade-reset');
        els.tradeExport = $('#trade-export');
        els.tradeImport = $('#trade-import');
        els.tradeImportInput = $('#trade-import-input');
        els.tradeShare = $('#trade-share');
        els.tradeClearShare = $('#trade-clear-share');
        els.tradeModal = $('#trade-modal');
        els.tradeModalBackdrop = $('#trade-modal-backdrop');
        els.tradeModalClose = $('#trade-modal-close');
        els.tradeModalTeamA = $('#trade-modal-team-a');
        els.tradeModalTeamB = $('#trade-modal-team-b');
        els.tradeModalSearchA = $('#trade-modal-search-a');
        els.tradeModalSearchB = $('#trade-modal-search-b');
        els.tradeModalListA = $('#trade-modal-list-a');
        els.tradeModalListB = $('#trade-modal-list-b');
        els.tradeModalFairness = $('#trade-modal-fairness');
        els.tradeModalDeltaA = $('#trade-modal-delta-a');
        els.tradeModalDeltaB = $('#trade-modal-delta-b');
        els.tradeModalApply = $('#trade-modal-apply');
        els.globalSearch = $('#global-search');
        els.globalSearchResults = $('#global-search-results');
        els.changelogBody = $('#changelog-body');
        els.compareBody = $('#compare-body');
        els.pathTargets = $('#path-targets');
        els.pathSos = $('#path-sos');
        els.pathSwings = $('#path-swings');
        els.pathSimulator = $('#path-simulator');
        els.sandboxTeam = $('#sandbox-team');
        els.sandboxLineup = $('#sandbox-lineup');
        els.sandboxBench = $('#sandbox-bench');
        els.sandboxApplySwap = $('#sandbox-apply-swap');
        els.sandboxMetricOverall = $('#sandbox-metric-overall');
        els.sandboxMetricTop3 = $('#sandbox-metric-top3');
        els.sandboxMetricDepth = $('#sandbox-metric-depth');
        els.sandboxReset = $('#sandbox-reset');
        els.sandboxTradeTeamA = $('#sandbox-trade-team-a');
        els.sandboxTradeTeamB = $('#sandbox-trade-team-b');
        els.sandboxTradeSend = $('#sandbox-trade-send');
        els.sandboxTradeReceive = $('#sandbox-trade-receive');
        els.sandboxApplyTrade = $('#sandbox-apply-trade');
        els.sandboxResults = $('#sandbox-results');
        els.startSitMatchup = $('#startsit-matchup');
        els.startSitReset = $('#startsit-reset');
        els.startSitSimulate = $('#startsit-simulate');
        els.startSitStatus = $('#startsit-status');
        els.startSitResults = $('#startsit-results');
        els.startSitAway = $('#startsit-away');
        els.startSitHome = $('#startsit-home');
        els.startSitAwayName = $('#startsit-away-name');
        els.startSitHomeName = $('#startsit-home-name');
        els.startSitAwayStarters = $('#startsit-away-starters');
        els.startSitAwayBench = $('#startsit-away-bench');
        els.startSitHomeStarters = $('#startsit-home-starters');
        els.startSitHomeBench = $('#startsit-home-bench');
        els.scenarioName = $('#scenario-name');
        els.scenarioSave = $('#scenario-save');
        els.scenarioSelect = $('#scenario-select');
        els.scenarioLoad = $('#scenario-load');
        els.scenarioDelete = $('#scenario-delete');
        els.notificationsBody = $('#notifications-body');
        els.liveRegion = $('#live-announcer');

        const initialHashParams = getHashParams();
        if (initialHashParams[SCENARIO_HASH_PARAM]) {
          const decoded = decodeScenarioFromHash(initialHashParams[SCENARIO_HASH_PARAM]);
          if (decoded) {
            pendingScenarioFromHash = decoded;
            lastEncodedScenarioHash = initialHashParams[SCENARIO_HASH_PARAM];
          }
        }

        let storedLanguage = DEFAULT_LANGUAGE;
        try {
          const persistedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
          if (persistedLanguage) {
            storedLanguage = persistedLanguage;
          }
        } catch (err) {
          console.warn('language storage read failed', err);
        }
        await setLanguage(storedLanguage, { persist: false });

        let storedTheme = null;
        try {
          storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        } catch (err) {
          console.warn('theme storage read failed', err);
        }
        if (storedTheme) {
          userThemePreferred = true;
        }
        setTheme(storedTheme || state.theme || 'light', { persist: false });

        setShareLabel(SHARE_LABEL_DEFAULT, false);
        updateDeliveryLinks();

        const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
        tabButtons.forEach((btn) => {
          btn.addEventListener('click', handleTabClick);
          btn.addEventListener('keydown', handleTabKeydown);
          const tabId = btn.dataset?.tab;
          if (tabId) {
            if (!btn.id) {
              btn.id = `tab-${tabId}`;
            }
            if (!btn.getAttribute('aria-controls')) {
              btn.setAttribute('aria-controls', tabId);
            }
            const panel = document.getElementById(tabId);
            if (panel && !panel.getAttribute('aria-labelledby')) {
              panel.setAttribute('aria-labelledby', btn.id);
            }
          }
        });
        window.addEventListener('hashchange', handleHashChange);

        if (els.shareLink) {
          els.shareLink.addEventListener('click', handleShareClick);
        }

        if (els.languageSelect) {
          els.languageSelect.addEventListener('change', async (event) => {
            const value = event.target.value;
            await setLanguage(value);
            if (state.assistant) {
              renderAll();
            } else {
              applyTranslations();
            }
          });
        }

        if (els.themeSelect) {
          els.themeSelect.addEventListener('change', (event) => {
            const value = event.target.value;
            setTheme(value);
          });
        }

        if (els.tradeFilterTeamA) {
          els.tradeFilterTeamA.addEventListener('change', handleTradeFilterChange);
        }
        if (els.tradeFilterTeamB) {
          els.tradeFilterTeamB.addEventListener('change', handleTradeFilterChange);
        }
        if (els.tradeFilterPos) {
          els.tradeFilterPos.addEventListener('change', handleTradeFilterChange);
        }
        if (els.tradeFilterFairness) {
          els.tradeFilterFairness.addEventListener('input', handleFairnessSlider);
        }
        if (els.tradeCustomOpen) {
          els.tradeCustomOpen.addEventListener('click', openCustomTradeModal);
        }
        if (els.tradeUndo) {
          els.tradeUndo.addEventListener('click', (event) => {
            event.preventDefault();
            undoLastTrade();
          });
        }
        if (els.tradeReset) {
          els.tradeReset.addEventListener('click', (event) => {
            event.preventDefault();
            resetScenario();
          });
        }
        if (els.tradeExport) {
          els.tradeExport.addEventListener('click', (event) => {
            event.preventDefault();
            exportScenario();
          });
        }
        if (els.tradeImport) {
          els.tradeImport.addEventListener('click', (event) => {
            event.preventDefault();
            if (els.tradeImportInput) {
              els.tradeImportInput.value = '';
              els.tradeImportInput.click();
            }
          });
        }
        if (els.tradeImportInput) {
          els.tradeImportInput.addEventListener('change', handleScenarioImport);
        }
        if (els.tradeShare) {
          els.tradeShare.addEventListener('click', shareScenarioLink);
        }
        if (els.tradeClearShare) {
          els.tradeClearShare.addEventListener('click', clearScenarioHash);
        }

        if (els.tradeModalClose) {
          els.tradeModalClose.addEventListener('click', closeCustomTradeModal);
        }
        if (els.tradeModalBackdrop) {
          els.tradeModalBackdrop.addEventListener('click', closeCustomTradeModal);
        }
        if (els.tradeModalTeamA) {
          els.tradeModalTeamA.addEventListener('change', updateCustomTradeTeams);
        }
        if (els.tradeModalTeamB) {
          els.tradeModalTeamB.addEventListener('change', updateCustomTradeTeams);
        }
        if (els.tradeModalSearchA) {
          els.tradeModalSearchA.addEventListener('input', updateCustomTradeLists);
        }
        if (els.tradeModalSearchB) {
          els.tradeModalSearchB.addEventListener('input', updateCustomTradeLists);
        }
        if (els.tradeModalApply) {
          els.tradeModalApply.addEventListener('click', applyCustomTrade);
        }

        if (els.globalSearch) {
          els.globalSearch.addEventListener('input', handleSearchInput);
          els.globalSearch.addEventListener('keydown', handleSearchKeydown);
        }
        document.addEventListener('click', handleDocumentClick);

        if (els.tradeModal) {
          els.tradeModal.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              closeCustomTradeModal();
            }
          });
        }

        if (els.weekSelect) {
          els.weekSelect.addEventListener('change', async (event) => {
            const value = Number(event.target.value);
            if (!Number.isFinite(value)) return;
            try {
              await loadWeek(value);
              renderAll();
            } catch (err) {
              console.error(err);
              alert(err.message || t('status.loadWeekFailed', 'Failed to load week'));
            }
          });
        }

        if (els.leagueSelect) {
          els.leagueSelect.addEventListener('change', async (event) => {
            const slug = event.target.value;
            try {
              await changeLeague(slug, { force: true });
              renderAll();
            } catch (err) {
              console.error(err);
              alert(err.message || t('status.loadLeagueFailed', 'Failed to load league'));
            }
          });
        }

        if (els.remoteScenarioLoad) {
          els.remoteScenarioLoad.addEventListener('click', handleRemoteScenarioLoad);
        }
        if (els.remoteScenarioClear) {
          els.remoteScenarioClear.addEventListener('click', () => {
            clearRemoteScenario();
            announceLive(t('status.remoteScenarioCleared', 'Scenario cleared.'));
            if (els.remoteScenarioSelect) {
              els.remoteScenarioSelect.value = '';
            }
            renderLineups();
            renderWaivers();
          });
        }

        if (els.teamFilter) {
          els.teamFilter.addEventListener('input', (event) => {
            state.teamFilter = event.target.value.trim();
            renderLineups();
            renderStartSit();
          });
        }

        if (els.sandboxTeam) {
          els.sandboxTeam.addEventListener('change', (event) => {
            const value = event.target.value;
            state.sandbox.activeTeam = value;
            renderSandboxLineup();
            renderSandboxTrade();
            showResults([{ team: value, before: state.sandbox.baselineStrengths[value], after: state.sandbox.currentStrengths[value] }]);
          });
        }

        if (els.sandboxReset) {
          els.sandboxReset.addEventListener('click', (event) => {
            event.preventDefault();
            resetSandboxTeam();
          });
        }

        if (els.sandboxLineup) {
          els.sandboxLineup.addEventListener('change', handleSandboxSelection);
        }
        if (els.sandboxBench) {
          els.sandboxBench.addEventListener('change', handleSandboxSelection);
        }

        if (els.sandboxApplySwap) {
          els.sandboxApplySwap.addEventListener('click', (event) => {
            event.preventDefault();
            onSwap();
          });
        }

        if (els.sandboxTradeTeamA) {
          els.sandboxTradeTeamA.addEventListener('change', (event) => {
            const value = event.target.value;
            state.sandbox.trade.teamA = value;
            state.sandbox.trade.send = new Set();
            renderSandboxTrade();
          });
        }
        if (els.sandboxTradeTeamB) {
          els.sandboxTradeTeamB.addEventListener('change', (event) => {
            const value = event.target.value;
            state.sandbox.trade.teamB = value;
            state.sandbox.trade.receive = new Set();
            renderSandboxTrade();
          });
        }
        if (els.sandboxTradeSend) {
          els.sandboxTradeSend.addEventListener('change', handleTradeSelection);
        }
        if (els.sandboxTradeReceive) {
          els.sandboxTradeReceive.addEventListener('change', handleTradeSelection);
        }
        if (els.sandboxApplyTrade) {
          els.sandboxApplyTrade.addEventListener('click', (event) => {
            event.preventDefault();
            onApplyTrade();
          });
        }

        if (els.startSitMatchup) {
          els.startSitMatchup.addEventListener('change', handleStartSitMatchupChange);
        }
        if (els.startSitReset) {
          els.startSitReset.addEventListener('click', handleStartSitReset);
        }
        if (els.startSitSimulate) {
          els.startSitSimulate.addEventListener('click', handleStartSitSimulate);
        }
        if (els.startSitAway) {
          els.startSitAway.addEventListener('change', handleStartSitToggle);
        }
        if (els.startSitHome) {
          els.startSitHome.addEventListener('change', handleStartSitToggle);
        }

        if (els.bracketReset) {
          els.bracketReset.addEventListener('click', (event) => {
            event.preventDefault();
            resetBracketSeeds();
          });
        }
        if (els.bracketSimulate) {
          els.bracketSimulate.addEventListener('click', handleBracketSimulate);
        }

        if (els.scenarioSave) {
          els.scenarioSave.addEventListener('click', handleScenarioSave);
        }
        if (els.scenarioLoad) {
          els.scenarioLoad.addEventListener('click', handleScenarioLoad);
        }
        if (els.scenarioDelete) {
          els.scenarioDelete.addEventListener('click', handleScenarioDelete);
        }

        const manifestHref = `${config.basePath || ''}.dash/releases_manifest.html`;
        try {
          const headResp = await fetch(manifestHref, { method: 'HEAD', cache: 'no-cache' });
          if (headResp && headResp.ok) {
            if (els.releasesLink) {
              els.releasesLink.href = manifestHref;
              els.releasesLink.style.display = 'inline-block';
            }
            if (els.dashBrowseLink) {
              const browseHref = `${config.basePath || ''}.dash/`;
              els.dashBrowseLink.href = browseHref;
            }
            if (els.siteFooter) {
              els.siteFooter.style.display = 'block';
            }
          }
        } catch (err) {
          console.warn('releases manifest check failed', err);
        }

        try {
          await loadMeta();
          applyMeta();
          await loadRootManifest();
          const initialLeague = resolveInitialLeague();
          populateLeagues(initialLeague);
          await loadCompare();
          await changeLeague(initialLeague, { force: true });
          renderAll();
          const initialTab = initialHashParams.tab && TAB_IDS.includes(initialHashParams.tab)
            ? initialHashParams.tab
            : getTabFromHash() || state.activeTab || TAB_IDS[0];
          setActiveTab(initialTab, { updateHash: false });
        } catch (err) {
          console.error(err);
          const errorTitle = t('heading.dashboardError', 'Dashboard Error');
          const errorMessage = err && err.message ? err.message : String(err);
          document.body.innerHTML = `<main><section class="panel active"><h2>${errorTitle}</h2><div class="empty-state">${errorMessage}</div></section></main>`;
          applyTranslations(document.body);
        }
      }

      document.addEventListener('DOMContentLoaded', init);

})();
