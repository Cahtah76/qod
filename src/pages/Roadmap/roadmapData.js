export const SEED_PROJECTS = [
  {
    id: 'p1',
    name: 'AR Platform v3',
    color: '#2563eb',
    notes: [
      { id: 'pn1', text: 'Kicked off Q2 planning. AR Foundation sprint completed on schedule. Platform Stability sprint tracking well — RBAC overhaul is the main risk item to watch.', createdAt: '2026-03-28T14:30:00Z', source: 'standup' },
    ],
    sprints: [
      {
        id: 's1', name: 'Sprint 1 — AR Foundation',
        startDate: '2026-03-01', endDate: '2026-03-14',
        notes: [{ id: 'sn1', text: 'Sprint delivered on time. All core AR anchoring work complete.', createdAt: '2026-03-14T17:00:00Z', source: 'manual' }],
        tasks: [
          { id: 't1', title: 'AR anchor calibration pipeline', status: 'Done', assignee: 'JC', priority: 'High', tag: 'AR Engine', notes: [] },
          { id: 't2', title: 'SDK v3.1 bundle size audit', status: 'Done', assignee: 'MR', priority: 'Med', tag: 'SDK', notes: [] },
          { id: 't3', title: 'Venue marker sync latency fix', status: 'Done', assignee: 'AP', priority: 'High', tag: 'Platform', notes: [] },
          { id: 't4', title: 'iOS rendering regression tests', status: 'In Review', assignee: 'JC', priority: 'Med', tag: 'QA', notes: [
            { id: 'tn1', text: 'Found 2 edge cases with ARKit session resume. PR up for review.', createdAt: '2026-03-12T10:00:00Z', source: 'manual' },
          ]},
        ],
      },
      {
        id: 's2', name: 'Sprint 2 — Platform Stability',
        startDate: '2026-03-15', endDate: '2026-03-28',
        notes: [],
        tasks: [
          { id: 't5', title: 'Real-time asset streaming v2', status: 'In Progress', assignee: 'MR', priority: 'High', tag: 'Streaming', notes: [] },
          { id: 't6', title: 'Admin dashboard RBAC overhaul', status: 'In Progress', assignee: 'BC', priority: 'High', tag: 'Platform', notes: [] },
          { id: 't7', title: 'SDK documentation refresh', status: 'Backlog', assignee: 'AP', priority: 'Low', tag: 'SDK', notes: [] },
          { id: 't8', title: 'WebSocket reconnect resilience', status: 'In Review', assignee: 'JC', priority: 'Med', tag: 'Platform', notes: [] },
        ],
      },
      {
        id: 's3', name: 'Sprint 3 — Fan Experience',
        startDate: '2026-04-01', endDate: '2026-04-18',
        notes: [],
        tasks: [
          { id: 't9', title: 'AR overlay personalization API', status: 'In Progress', assignee: 'MR', priority: 'High', tag: 'AR Engine', notes: [] },
          { id: 't10', title: 'Stats feed integration (NFL)', status: 'Backlog', assignee: 'BC', priority: 'Med', tag: 'Data', notes: [] },
          { id: 't11', title: 'Low-latency video sync prototype', status: 'Backlog', assignee: 'AP', priority: 'High', tag: 'Streaming', notes: [] },
        ],
      },
      {
        id: 's4', name: 'Sprint 4 — Scale & Launch',
        startDate: '2026-04-21', endDate: '2026-05-09',
        notes: [],
        tasks: [
          { id: 't13', title: 'CDN edge caching for AR assets', status: 'Backlog', assignee: 'MR', priority: 'High', tag: 'Infra', notes: [] },
          { id: 't14', title: 'Load test: 50k concurrent users', status: 'Backlog', assignee: 'BC', priority: 'High', tag: 'QA', notes: [] },
          { id: 't15', title: 'SDK v3.2 public release', status: 'Backlog', assignee: 'AP', priority: 'Med', tag: 'SDK', notes: [] },
        ],
      },
    ],
  },
  {
    id: 'p2',
    name: 'Fan Mobile App',
    color: '#7c3aed',
    notes: [],
    sprints: [
      {
        id: 'ms1', name: 'Sprint 1 — Auth & Onboarding',
        startDate: '2026-03-10', endDate: '2026-03-24',
        notes: [],
        tasks: [
          { id: 'mt1', title: 'SSO login flow (Apple/Google)', status: 'Done', assignee: 'AP', priority: 'High', tag: 'Auth', notes: [] },
          { id: 'mt2', title: 'Onboarding carousel UI', status: 'In Review', assignee: 'JC', priority: 'Med', tag: 'UI', notes: [] },
        ],
      },
      {
        id: 'ms2', name: 'Sprint 2 — AR Features',
        startDate: '2026-03-25', endDate: '2026-04-11',
        notes: [],
        tasks: [
          { id: 'mt3', title: 'AR camera permission flow', status: 'In Progress', assignee: 'MR', priority: 'High', tag: 'AR', notes: [] },
          { id: 'mt4', title: 'Player card overlay component', status: 'Backlog', assignee: 'BC', priority: 'Med', tag: 'UI', notes: [] },
          { id: 'mt5', title: 'Push notification integration', status: 'Backlog', assignee: 'AP', priority: 'Low', tag: 'Infra', notes: [] },
        ],
      },
    ],
  },
]

export const UNASSIGNED_TASKS = [
  { id: 'u1', title: 'Investigate Bluetooth beacon interference', status: 'Backlog', assignee: 'TBD', priority: 'Low', tag: 'Hardware', notes: [] },
  { id: 'u2', title: 'Accessibility audit — screen reader support', status: 'Backlog', assignee: 'TBD', priority: 'Med', tag: 'Platform', notes: [] },
]
