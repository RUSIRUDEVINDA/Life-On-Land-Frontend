export const incidentTypes = [
  "ALL",
  "POACHING",
  "ILLEGAL_LOGGING",
  "WILDLIFE_TRADE",
  "HABITAT_DESTRUCTION",
  "OTHER",
];

export const incidentStatuses = [
  "ALL",
  "REPORTED",
  "VERIFIED",
  "INVESTIGATING",
  "UNVERIFIED",
  "RESOLVED",
];

export const incidentSeverities = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

export const incidents = [
  {
    _id: "69a1c9d293a12883034f6fb2",
    type: "POACHING",
    description: "Gunshots heard near the river boundary and an unregistered vehicle was seen exiting the reserve.",
    zone: { _id: "69976248d112d1320744ef41", name: "Core Zone A" },
    protectedArea: { _id: "69975c61d112d1320744ef20", name: "Sinharaja Forest Reserve" },
    severity: "CRITICAL",
    status: "UNVERIFIED",
    incidentDate: "2026-02-27T17:30:00.000Z",
    reportedBy: { _id: "698b1b1ac6196fdd3f397bac", username: "head_ranger", fullName: "Head Ranger" },
    createdAt: "2026-02-27T17:45:00.123Z",
  },
  {
    _id: "69a2c8f593a12883034f7001",
    type: "ILLEGAL_LOGGING",
    description: "Fresh chainsaw activity was reported by patrol team Bravo near the southern access road.",
    zone: { _id: "69976248d112d1320744ef42", name: "Buffer Zone South" },
    protectedArea: { _id: "69975c61d112d1320744ef20", name: "Sinharaja Forest Reserve" },
    severity: "HIGH",
    status: "INVESTIGATING",
    incidentDate: "2026-02-28T06:50:00.000Z",
    reportedBy: { _id: "698b1b1ac6196fdd3f397bad", username: "bravo_unit", fullName: "Bravo Unit" },
    createdAt: "2026-02-28T07:10:00.000Z",
  },
  {
    _id: "69a31c3f93a12883034f70ac",
    type: "WILDLIFE_TRADE",
    description: "Suspicious wildlife transport activity was observed near the north ridge perimeter checkpoint.",
    zone: { _id: "69976248d112d1320744ef43", name: "North Ridge" },
    protectedArea: { _id: "69975c61d112d1320744ef20", name: "Sinharaja Forest Reserve" },
    severity: "MEDIUM",
    status: "VERIFIED",
    incidentDate: "2026-02-28T09:20:00.000Z",
    reportedBy: { _id: "698b1b1ac6196fdd3f397bae", username: "sensor_node_12", fullName: "Sensor Node 12" },
    createdAt: "2026-02-28T09:21:30.000Z",
  },
  {
    _id: "69a41ff493a12883034f7161",
    type: "HABITAT_DESTRUCTION",
    description: "Unauthorized land clearing was identified near a restricted breeding corridor.",
    zone: { _id: "69976248d112d1320744ef44", name: "Eastern Corridor" },
    protectedArea: { _id: "69975c61d112d1320744ef25", name: "Yala Conservation Park" },
    severity: "LOW",
    status: "RESOLVED",
    incidentDate: "2026-03-01T11:15:00.000Z",
    reportedBy: { _id: "698b1b1ac6196fdd3f397baf", username: "ranger_east", fullName: "Ranger East" },
    createdAt: "2026-03-01T11:18:00.000Z",
  },
];
