export const INVESTIGATION_GROUPS = [
  {
    title: "Blood / Coagulation",
    fields: [
      { key: "hb", label: "Hb" },
      { key: "pcv", label: "PCV" },
      { key: "plt", label: "Platelets" },
      { key: "tc", label: "TC" },
      { key: "dc", label: "DC" },
      { key: "pt", label: "PT" },
      { key: "inr", label: "INR" },
      { key: "aptt", label: "aPTT" },
    ],
  },
  {
    title: "Biochemistry",
    fields: [
      { key: "rbs", label: "RBS" },
      { key: "tb", label: "T.B" },
      { key: "sgot", label: "SGOT" },
      { key: "sgpt", label: "SGPT" },
      { key: "ldh", label: "LDH" },
      { key: "urea", label: "Urea" },
      { key: "creat", label: "Creat" },
      { key: "na", label: "Na+" },
      { key: "k", label: "K+" },
    ],
  },
  {
    title: "Imaging / Other",
    fields: [
      { key: "usg", label: "USG" },
      { key: "echo", label: "ECHO" },
      { key: "tsh", label: "TSH" },
      { key: "ogct", label: "OGCT" },
    ],
  },
  {
    title: "Glycemic Profile",
    fields: [
      { key: "glyc_3am", label: "3 AM" },
      { key: "glyc_fasting", label: "Fasting" },
      { key: "glyc_post_prandial", label: "Post Prandial" },
      { key: "glyc_pre_lunch", label: "Pre Lunch" },
      { key: "glyc_post_lunch", label: "Post Lunch" },
      { key: "glyc_pre_dinner", label: "Pre Dinner" },
      { key: "glyc_post_dinner", label: "Post Dinner" },
    ],
  },
];

// Flat list, handy for iterating without caring about grouping.
export const ALL_INVESTIGATION_FIELDS = INVESTIGATION_GROUPS.flatMap((g) => g.fields);
