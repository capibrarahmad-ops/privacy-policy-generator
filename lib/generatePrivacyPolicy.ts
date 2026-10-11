export interface CustomClause {
  id: string;
  title: string;
  content: string;
}

export interface PolicyFormData {
  // 1. Entity & Product Scope
  companyName: string;
  tradingName?: string;
  platform?: string; // "Web & Mobile" | "Mobile App (iOS & Android)" | "Web SaaS" | "E-Commerce"
  websiteUrl: string;
  contactEmail: string;
  dpoEmail?: string;
  physicalAddress?: string;
  country: string;
  stateProvince?: string;
  customSlug?: string;

  // 2. Mandatory App Store & Google Play Account Deletion
  hasUserAccounts?: string; // "Yes" | "No"
  accountDeletionMethod?: string; // "In-App Setting & Email Request" | "In-App Setting Only" | "Dedicated Web URL"
  accountDeletionUrl?: string; // URL or mailto
  dataRetentionPeriod?: string;

  // 3. Mobile Device Permissions & Hardware Sensors
  mobilePermissions?: string[]; // Camera, Microphone, Photo Library, Push Notifications, Bluetooth, Background Location, Contacts

  // 4. Advertising Identifiers & Tracking (Apple ATT / Google AAID)
  usesAdTracking?: string; // "Yes" | "No"
  adNetworks?: string[]; // Google AdMob, Unity Ads, Meta Audience Network, AppLovin, ironSource
  usesIDFA?: string; // "Yes" | "No"

  // 5. Crash Reporting & Diagnostics
  crashReportingServices?: string[]; // Firebase Crashlytics, Sentry, Datadog, Bugsnag

  // 6. Direct Data Collection
  collectsPersonalInfo: string; // "Yes" | "No"
  collectsPhone?: string; // "Yes" | "No"
  collectsAddress?: string; // "Yes" | "No"
  collectsLocation: string; // "Yes" | "No"
  collectsPayment: string; // "Yes" | "No"
  usesCookies: string; // "Yes" | "No"

  // 7. Third-Party Integrations
  usesAnalytics: string; // "Yes" | "No"
  analyticsServices?: string[];

  usesSocialLogin: string; // "Yes" | "No"
  authProviders?: string[];

  paymentProcessors?: string[];

  usesAI?: string; // "Yes" | "No"
  aiServices?: string[];
  aiTrainsOnData?: string; // "No" | "Yes"

  usesMarketing?: string; // "Yes" | "No"
  marketingServices?: string[];

  // 8. Legal Frameworks
  ccpaDoNotSell?: string; // "Yes" | "No"
  internationalTransfers?: string; // "Yes" | "No"

  // 9. Custom Clauses
  customClauses?: CustomClause[];

  // 10. Metadata
  lastUpdated?: string;
}

export interface PolicySection {
  id: string;
  number: number;
  title: string;
  paragraphs: string[];
  bulletPoints?: { title?: string; text: string }[];
}

export interface AppStoreComplianceDeclaration {
  category: string;
  dataTypes: string[];
  collected: boolean;
  linkedToUser: boolean;
  usedForTracking: boolean;
  purpose: string;
}

export interface GeneratedPolicy {
  companyName: string;
  tradingName?: string;
  platform: string;
  websiteUrl: string;
  contactEmail: string;
  country: string;
  slug: string;
  lastUpdated: string;
  sections: PolicySection[];
  plainText: string;
  markdown: string;
  html: string;
  appleNutritionLabels: AppStoreComplianceDeclaration[];
  googlePlayDataSafety: {
    collectedData: string[];
    sharedData: string[];
    encryptedInTransit: boolean;
    deletionMechanism: string;
    deletionUrl: string;
  };
}

export const MOBILE_PERMISSIONS_LIST = [
  "Camera (e.g. photos, video capture, barcode scanning)",
  "Microphone (e.g. voice messages, audio recording)",
  "Photo Library & Files (e.g. media uploads, saving content)",
  "Push Notifications (e.g. alerts, reminders, messages)",
  "Precise / Background Location (e.g. navigation, location matching)",
  "Bluetooth & Local Network (e.g. smart peripherals)",
  "Contacts (e.g. inviting friends, address book syncing)",
];

export const POPULAR_AD_NETWORKS = [
  "Google AdMob",
  "Unity Ads",
  "Meta Audience Network",
  "AppLovin",
  "ironSource",
  "Mintegral",
];

export const POPULAR_CRASH_REPORTING = [
  "Firebase Crashlytics",
  "Sentry",
  "Datadog",
  "Bugsnag",
];

export const POPULAR_ANALYTICS = [
  "Google Analytics 4",
  "Firebase Analytics",
  "PostHog",
  "Mixpanel",
  "Plausible",
  "Hotjar",
  "Amplitude",
];

export const POPULAR_AUTH = [
  "Sign in with Google",
  "Sign in with Apple",
  "GitHub Authentication",
  "Microsoft SSO",
  "Facebook Login",
];

export const POPULAR_PAYMENTS = [
  "Apple In-App Purchases (StoreKit)",
  "Google Play Billing",
  "Stripe",
  "PayPal",
  "Paddle",
  "LemonSqueezy",
];

export const POPULAR_AI = [
  "OpenAI API (ChatGPT)",
  "Anthropic Claude API",
  "Google Gemini API",
  "Custom AI Model Processing",
];

export const POPULAR_MARKETING = [
  "Mailchimp",
  "Resend",
  "SendGrid",
  "Klaviyo",
  "OneSignal",
  "Twilio (SMS)",
];

export const DEFAULT_FORM_DATA: PolicyFormData = {
  companyName: "Acme Innovations LLC",
  tradingName: "Acme App",
  platform: "Web & Mobile",
  websiteUrl: "https://example.com",
  contactEmail: "privacy@example.com",
  dpoEmail: "dpo@example.com",
  physicalAddress: "100 Innovation Way, Suite 400, San Francisco, CA 94105",
  country: "United States",
  stateProvince: "California",
  customSlug: "acme-app",

  hasUserAccounts: "Yes",
  accountDeletionMethod: "In-App Setting & Email Request",
  accountDeletionUrl: "https://example.com/delete-account",
  dataRetentionPeriod: "Account lifetime or 30 days after deletion request",

  mobilePermissions: [
    "Camera (e.g. photos, video capture, barcode scanning)",
    "Photo Library & Files (e.g. media uploads, saving content)",
    "Push Notifications (e.g. alerts, reminders, messages)",
  ],

  usesAdTracking: "No",
  adNetworks: [],
  usesIDFA: "No",

  crashReportingServices: ["Firebase Crashlytics", "Sentry"],

  collectsPersonalInfo: "Yes",
  collectsPhone: "No",
  collectsAddress: "No",
  collectsLocation: "No",
  collectsPayment: "Yes",
  usesCookies: "Yes",

  usesAnalytics: "Yes",
  analyticsServices: ["Google Analytics 4", "Firebase Analytics"],

  usesSocialLogin: "Yes",
  authProviders: ["Sign in with Google", "Sign in with Apple"],

  paymentProcessors: ["Apple In-App Purchases (StoreKit)", "Stripe"],

  usesAI: "Yes",
  aiServices: ["OpenAI API (ChatGPT)"],
  aiTrainsOnData: "No",

  usesMarketing: "Yes",
  marketingServices: ["Resend", "OneSignal"],

  ccpaDoNotSell: "Yes",
  internationalTransfers: "Yes",

  customClauses: [],
};

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    || "policy";
}

export function generatePrivacyPolicy(data: PolicyFormData): GeneratedPolicy {
  const company = data.companyName.trim() || "Your Company";
  const platform = data.platform || "Web & Mobile";
  const entityDisplay = data.tradingName?.trim()
    ? `${data.tradingName.trim()} (operated by ${company})`
    : company;
  const website = data.websiteUrl.trim() || "https://example.com";
  const email = data.contactEmail.trim() || "privacy@example.com";
  const country = data.country.trim() || "United States";
  const jurisdiction = data.stateProvince?.trim()
    ? `${data.stateProvince.trim()}, ${country}`
    : country;
  
  const slug = data.customSlug?.trim()
    ? slugify(data.customSlug)
    : slugify(data.tradingName || company);

  const formattedDate =
    data.lastUpdated ||
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const sections: PolicySection[] = [];
  let sectionIndex = 1;

  // 1. Introduction & Scope
  sections.push({
    id: "introduction",
    number: sectionIndex++,
    title: "Introduction & Scope",
    paragraphs: [
      `Welcome to ${entityDisplay} ("we", "our", or "us"). We respect your privacy and are committed to protecting any personal data and mobile telemetry that you share with us.`,
      `This Privacy Policy governs your use of our application, mobile software (iOS and Android), website at ${website}, and associated cloud services (collectively, the "Services"). By downloading, accessing, or utilizing our Services, you consent to the data practices described in this Privacy Policy under the applicable laws of ${jurisdiction}.`,
    ],
  });

  // 2. Information We Collect
  const infoCollectBullets: { title?: string; text: string }[] = [];
  const infoCollectParagraphs: string[] = [
    `We collect information you directly provide to us, as well as technical, sensor, and telemetry data automatically transmitted when you install or interact with our Services:`,
  ];

  if (data.collectsPersonalInfo === "Yes") {
    let details = `Your name, email address (${email})`;
    if (data.collectsPhone === "Yes") details += `, telephone number`;
    if (data.collectsAddress === "Yes") details += `, billing and physical address`;
    details += `, account credentials, user profiles, and communications you submit to our support desk.`;

    infoCollectBullets.push({
      title: "Personal Identification & Account Data",
      text: details,
    });
  }

  if (data.collectsLocation === "Yes" || (data.mobilePermissions && data.mobilePermissions.some(p => p.includes("Location")))) {
    infoCollectBullets.push({
      title: "Geolocation Data",
      text: `Precise or approximate location data derived from GPS coordinates, IP address, WiFi networks, and mobile cell towers to provide localized search, navigation, or region-specific features.`,
    });
  }

  if (data.collectsPayment === "Yes") {
    const processorsList = data.paymentProcessors && data.paymentProcessors.length > 0
      ? ` (${data.paymentProcessors.join(", ")})`
      : "";
    infoCollectBullets.push({
      title: "Payment, Subscription & In-App Purchase Data",
      text: `Transaction records, subscription status, purchase receipts, and billing verification details handled by PCI-DSS certified payment processors and native store billing${processorsList}. Credit card numbers are never stored on our application servers.`,
    });
  }

  if (data.crashReportingServices && data.crashReportingServices.length > 0) {
    infoCollectBullets.push({
      title: "Diagnostics & Crash Telemetry",
      text: `Application crash logs, stack traces, device model, operating system version, memory utilization, and launch metrics collected via diagnostics tools (${data.crashReportingServices.join(", ")}) to ensure application stability.`,
    });
  }

  if (data.usesCookies === "Yes" || data.usesAnalytics === "Yes") {
    infoCollectBullets.push({
      title: "Automated Device Telemetry & Log Data",
      text: `IP address, device identifiers (IDFV / Android App Set ID), browser type, referring URLs, screen resolution, in-app navigation paths, and timestamped activity logs.`,
    });
  }

  sections.push({
    id: "information-we-collect",
    number: sectionIndex++,
    title: "Information We Collect",
    paragraphs: infoCollectParagraphs,
    bulletPoints: infoCollectBullets,
  });

  // 3. Mobile Device Permissions & Hardware Access (Crucial for App Store / Play Store)
  if (data.mobilePermissions && data.mobilePermissions.length > 0) {
    const permissionBullets = data.mobilePermissions.map(perm => ({
      title: perm.split("(")[0].trim(),
      text: perm.includes("(") ? perm.split("(")[1].replace(")", "").trim() : "Required for corresponding application functionality."
    }));

    sections.push({
      id: "mobile-permissions",
      number: sectionIndex++,
      title: "Mobile Device Permissions & Hardware Access",
      paragraphs: [
        `When accessing our Services via a mobile device (iOS or Android), our application may request explicit runtime permissions to access device sensors and hardware features. You may grant or revoke these permissions at any time in your device's Operating System Settings:`,
      ],
      bulletPoints: permissionBullets,
    });
  }

  // 4. Advertising Identifiers & Tracking (Apple App Tracking Transparency & Google AAID)
  if (data.usesAdTracking === "Yes" || data.usesIDFA === "Yes") {
    const adBullets = (data.adNetworks && data.adNetworks.length > 0)
      ? data.adNetworks.map(net => ({ title: net, text: `Used to deliver relevant in-app advertisements and measure campaign attribution.` }))
      : [{ title: "Ad Networks", text: "Third-party ad networks used to deliver advertising and measure ad performance." }];

    sections.push({
      id: "ad-tracking",
      number: sectionIndex++,
      title: "Advertising Identifiers & Tracking Disclosures (Apple ATT & Google AAID)",
      paragraphs: [
        `In compliance with Apple's App Tracking Transparency (ATT) framework and Google Play Advertising ID policies:`,
        `We may collect or receive advertising identifiers (such as Apple IDFA or Google Advertising ID) solely if you grant permission. These identifiers permit ad networks to deliver personalized advertisements and prevent fraudulent ad clicks.`,
        `Opt-Out: On iOS devices, you can manage or disable tracking via Settings > Privacy & Security > Tracking. On Android devices, you can reset or delete your Advertising ID via Settings > Google > Ads.`,
      ],
      bulletPoints: adBullets,
    });
  }

  // 5. How We Use Information
  const usageBullets: { title?: string; text: string }[] = [
    {
      text: `To provide, operate, maintain, and enhance the ${company} application and cloud infrastructure.`,
    },
    {
      text: `To authenticate user identity, prevent unauthorized access, and manage user accounts.`,
    },
    {
      text: `To handle customer service inquiries, respond to tickets, and provide technical troubleshooting at ${email}.`,
    },
  ];

  if (data.usesAnalytics === "Yes") {
    usageBullets.push({
      text: `To analyze user interaction flows, diagnose bottlenecks, and optimize software performance.`,
    });
  }

  if (data.collectsPayment === "Yes") {
    usageBullets.push({
      text: `To fulfill in-app purchases, process subscriptions, generate invoices, and prevent payment fraud.`,
    });
  }

  if (data.usesAI === "Yes") {
    usageBullets.push({
      text: `To process prompts and deliver automated features using Machine Learning APIs.`,
    });
  }

  if (data.usesMarketing === "Yes") {
    usageBullets.push({
      text: `To transmit transactional notifications, security alerts, and promotional announcements (opt-out available at any time).`,
    });
  }

  usageBullets.push(
    {
      text: `To enforce our terms, prevent malicious or fraudulent exploitation, and maintain network integrity.`,
    },
    {
      text: `To comply with regulatory, legal, and judicial compliance mandates under ${jurisdiction}.`,
    }
  );

  sections.push({
    id: "how-we-use-information",
    number: sectionIndex++,
    title: "How We Use Information & Legal Bases (GDPR Article 6)",
    paragraphs: [
      `Under European and international privacy frameworks (such as GDPR Art. 6), we process your data on specific lawful bases:`,
      `1. Performance of a Contract: To deliver our mobile app and services to you.`,
      `2. Legitimate Interests: To improve software stability, prevent fraud, and secure infrastructure.`,
      `3. Consent: For mobile hardware permissions (camera, location, microphone) and marketing.`,
      `4. Legal Obligation: For tax compliance and statutory data retention.`,
    ],
    bulletPoints: usageBullets,
  });

  // 6. Mandatory Account Deletion & Data Purge (Crucial for Apple 5.1.1(v) & Google Play)
  if (data.hasUserAccounts === "Yes") {
    const deletionUrl = data.accountDeletionUrl?.trim() || `${website}/delete-account`;
    const retentionNote = data.dataRetentionPeriod?.trim() || "Within 30 calendar days of verified request";

    sections.push({
      id: "account-deletion",
      number: sectionIndex++,
      title: "Account Deletion & Data Purge Policy (Apple & Google Play Compliance)",
      paragraphs: [
        `In strict compliance with Apple App Store Review Guideline 5.1.1(v) and Google Play Data Safety requirements, all registered users have the unambiguous right to permanently delete their account and associated personal data:`,
        `How to Initiate Account Deletion:`,
        `1. In-App Deletion: Navigate to Settings > Account > Delete Account inside the mobile application to initiate an automated permanent purge.`,
        `2. Web / Online Request URL: You may submit an instant deletion request online at ${deletionUrl} or by emailing our privacy desk at ${email}.`,
        `Data Purge Timeline: Upon initiation, your account access is immediately suspended. All personal identification, account profiles, and uploaded media are permanently purged from our active databases ${retentionNote}, excepting minimal financial transaction records required by statutory tax laws.`,
      ],
    });
  }

  // 7. Cookies & Local Storage
  if (data.usesCookies === "Yes") {
    sections.push({
      id: "cookies",
      number: sectionIndex++,
      title: "Cookies and Local Cache Technologies",
      paragraphs: [
        `We utilize cookies, session tokens, and local storage on ${website} and inside our web views to maintain authentication sessions, remember user preferences, and safeguard against Cross-Site Request Forgery (CSRF).`,
        `Cookie Controls: You can modify your browser settings to reject or delete cookies. Note that rejecting essential cookies may degrade or block authenticated portions of our Services.`,
      ],
    });
  } else {
    sections.push({
      id: "cookies",
      number: sectionIndex++,
      title: "Cookies",
      paragraphs: [
        `We do not deploy tracking cookies or third-party advertising beacons on ${website} to monitor cross-site behavior.`,
      ],
    });
  }

  // 8. Third-Party Services
  const thirdPartyBullets: { title?: string; text: string }[] = [];

  if (data.usesAnalytics === "Yes" && data.analyticsServices && data.analyticsServices.length > 0) {
    thirdPartyBullets.push({
      title: "Analytics & Telemetry Providers",
      text: `We utilize analytics partners (${data.analyticsServices.join(", ")}) to evaluate in-app screen flows and performance telemetry.`,
    });
  }

  if (data.usesSocialLogin === "Yes" && data.authProviders && data.authProviders.length > 0) {
    thirdPartyBullets.push({
      title: "Identity & Social Authentication",
      text: `When authenticating through (${data.authProviders.join(", ")}), basic identity credentials are exchanged under the privacy terms of the respective identity provider.`,
    });
  }

  if (data.collectsPayment === "Yes" && data.paymentProcessors && data.paymentProcessors.length > 0) {
    thirdPartyBullets.push({
      title: "Payment Processors & App Stores",
      text: `Financial transactions are handled by certified payment partners and native app stores (${data.paymentProcessors.join(", ")}).`,
    });
  }

  if (data.usesMarketing === "Yes" && data.marketingServices && data.marketingServices.length > 0) {
    thirdPartyBullets.push({
      title: "Push Notifications & Email Infrastructure",
      text: `Notification and communication deliveries are managed by specialized delivery services (${data.marketingServices.join(", ")}).`,
    });
  }

  if (thirdPartyBullets.length > 0) {
    sections.push({
      id: "third-party-services",
      number: sectionIndex++,
      title: "Third-Party Service Providers & Subprocessors",
      paragraphs: [
        `We share limited data with specialized third-party subprocessors operating under data processing agreements (DPAs) strictly to perform operational functions on our behalf:`,
      ],
      bulletPoints: thirdPartyBullets,
    });
  }

  // 9. AI & Automated Processing
  if (data.usesAI === "Yes" && data.aiServices && data.aiServices.length > 0) {
    const aiTrainingText = data.aiTrainsOnData === "Yes"
      ? `Data submitted to our AI features may be used in an aggregated format to improve machine learning models.`
      : `We strictly mandate that user prompts, inputs, and uploaded files submitted to our AI integrations (${data.aiServices.join(", ")}) are NOT used by foundation model providers to train or improve public AI models.`;

    sections.push({
      id: "ai-processing",
      number: sectionIndex++,
      title: "Artificial Intelligence & Automated Processing",
      paragraphs: [
        `Certain features utilize third-party Artificial Intelligence (AI) and Large Language Model (LLM) APIs (${data.aiServices.join(", ")}).`,
        aiTrainingText,
        `You retain full ownership of your inputs and generated outputs, subject to our service terms.`,
      ],
    });
  }

  // 10. CCPA / CPRA "Do Not Sell or Share My Personal Information"
  sections.push({
    id: "ccpa-notice",
    number: sectionIndex++,
    title: "California Consumer Privacy Rights (CCPA / CPRA & CalOPPA)",
    paragraphs: [
      `Under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):`,
      `1. We Do NOT Sell Your Personal Information: We have not sold, rented, or monetized personal information to third parties in the preceding 12 months.`,
      `2. We Do NOT Share Personal Information for Cross-Context Behavioral Advertising: We do not share personal data with data brokers.`,
      `3. Right to Opt-Out & Non-Discrimination: California residents may exercise their rights without facing price or service discrimination by contacting us at ${email}.`,
    ],
  });

  // 11. International Data Transfers (SCCs & DPF)
  if (data.internationalTransfers !== "No") {
    sections.push({
      id: "international-transfers",
      number: sectionIndex++,
      title: "Cross-Border Data Transfers (EU-US DPF & SCCs)",
      paragraphs: [
        `Your information may be transferred to, stored, and processed in countries outside your residence where our cloud servers are located.`,
        `When transferring personal data from the European Economic Area (EEA), United Kingdom, or Switzerland to countries without an adequacy decision, we rely on Standard Contractual Clauses (SCCs) approved by the European Commission or equivalent adequacy frameworks to ensure continuous data protection.`,
      ],
    });
  }

  // 12. Data Security
  sections.push({
    id: "data-security",
    number: sectionIndex++,
    title: "Data Security & Encryption",
    paragraphs: [
      `We implement rigorous technical, administrative, and physical safeguards:`,
      `* Encryption in Transit: All client-server communications are encrypted using Transport Layer Security (TLS 1.3 / HTTPS).`,
      `* Encryption at Rest: Sensitive database storage is encrypted using industry-standard AES-256 protocols.`,
      `* Access Control: Principle of least privilege is enforced for all administrative server access.`,
    ],
  });

  // 13. Children's Privacy (COPPA)
  sections.push({
    id: "childrens-privacy",
    number: sectionIndex++,
    title: "Children's Privacy (COPPA & Global Age Thresholds)",
    paragraphs: [
      `${company} is not directed to children under 13 years of age (or under 16 in the EEA / UK). We do not knowingly collect or solicit personal data from children.`,
      `If a parent or guardian discovers that a child has provided us with personal information, please contact us immediately at ${email} so we can promptly delete the records.`,
    ],
  });

  // 14. Custom Clauses (if added)
  if (data.customClauses && data.customClauses.length > 0) {
    data.customClauses.forEach((clause) => {
      if (clause.title.trim() && clause.content.trim()) {
        sections.push({
          id: slugify(clause.title),
          number: sectionIndex++,
          title: clause.title.trim(),
          paragraphs: clause.content
            .split("\n")
            .map((p) => p.trim())
            .filter((p) => p.length > 0),
        });
      }
    });
  }

  // 15. Changes to This Policy
  sections.push({
    id: "changes-to-policy",
    number: sectionIndex++,
    title: "Changes to This Privacy Policy",
    paragraphs: [
      `We reserve the authority to update this Privacy Policy to reflect modifications in software features, store guidelines, or privacy legislation. Material amendments will be notified via in-app banner or email notice to ${email}.`,
      `The "Last Updated" timestamp at the top of this document indicates the effective date of the current revision.`,
    ],
  });

  // 16. Contact Us & Legal Entity
  const contactBullets: { title?: string; text: string }[] = [
    { title: "Legal Entity", text: company },
  ];

  if (data.tradingName?.trim()) {
    contactBullets.push({ title: "Product / App Name", text: data.tradingName.trim() });
  }

  contactBullets.push({ title: "Official Website", text: website });
  contactBullets.push({ title: "Primary Privacy Contact", text: email });

  if (data.dpoEmail?.trim()) {
    contactBullets.push({ title: "Data Protection Officer (DPO)", text: data.dpoEmail.trim() });
  }

  if (data.physicalAddress?.trim()) {
    contactBullets.push({ title: "Registered Address", text: data.physicalAddress.trim() });
  }

  contactBullets.push({ title: "Jurisdiction & Governing Law", text: jurisdiction });

  sections.push({
    id: "contact-us",
    number: sectionIndex++,
    title: "Contact Us & Privacy Officer",
    paragraphs: [
      `For inquiries, data access requests, or regulatory filings, contact our designated privacy department:`,
    ],
    bulletPoints: contactBullets,
  });

  // Plain Text Version
  const plainTextLines: string[] = [
    `PRIVACY POLICY FOR ${company.toUpperCase()}`,
    `Website: ${website}`,
    `Platform: ${platform}`,
    `Last Updated: ${formattedDate}`,
    `Jurisdiction: ${jurisdiction}`,
    `--------------------------------------------------`,
    "",
  ];

  // Markdown Version
  const markdownLines: string[] = [
    `# Privacy Policy for ${company}`,
    "",
    `**Platform:** ${platform}  `,
    `**Website:** [${website}](${website})  `,
    `**Last Updated:** ${formattedDate}  `,
    `**Jurisdiction:** ${jurisdiction}  `,
    "",
    "---",
    "",
  ];

  // HTML Version
  let htmlContent = `<div class="privacy-policy">
  <h1>Privacy Policy for ${escapeHtml(company)}</h1>
  <p class="meta"><strong>Platform:</strong> ${escapeHtml(platform)}<br>
  <strong>Website:</strong> <a href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(website)}</a><br>
  <strong>Last Updated:</strong> ${escapeHtml(formattedDate)}<br>
  <strong>Jurisdiction:</strong> ${escapeHtml(jurisdiction)}</p>
  <hr />
`;

  sections.forEach((sec) => {
    // Plain Text
    plainTextLines.push(`${sec.number}. ${sec.title.toUpperCase()}`);
    sec.paragraphs.forEach((p) => plainTextLines.push(p, ""));
    if (sec.bulletPoints) {
      sec.bulletPoints.forEach((b) => {
        plainTextLines.push(`  * ${b.title ? b.title + ": " : ""}${b.text}`);
      });
      plainTextLines.push("");
    }

    // Markdown
    markdownLines.push(`## ${sec.number}. ${sec.title}`);
    markdownLines.push("");
    sec.paragraphs.forEach((p) => {
      markdownLines.push(p);
      markdownLines.push("");
    });
    if (sec.bulletPoints) {
      sec.bulletPoints.forEach((b) => {
        markdownLines.push(`* ${b.title ? `**${b.title}:** ` : ""}${b.text}`);
      });
      markdownLines.push("");
    }

    // HTML
    htmlContent += `  <section id="${escapeHtml(sec.id)}">\n`;
    htmlContent += `    <h2>${sec.number}. ${escapeHtml(sec.title)}</h2>\n`;
    sec.paragraphs.forEach((p) => {
      htmlContent += `    <p>${escapeHtml(p)}</p>\n`;
    });
    if (sec.bulletPoints && sec.bulletPoints.length > 0) {
      htmlContent += `    <ul>\n`;
      sec.bulletPoints.forEach((b) => {
        htmlContent += `      <li>${b.title ? `<strong>${escapeHtml(b.title)}:</strong> ` : ""}${escapeHtml(b.text)}</li>\n`;
      });
      htmlContent += `    </ul>\n`;
    }
    htmlContent += `  </section>\n`;
  });

  htmlContent += `</div>`;

  // Apple Privacy Nutrition Declaration Report
  const appleNutritionLabels: AppStoreComplianceDeclaration[] = [
    {
      category: "Contact Info",
      dataTypes: ["Name", "Email Address", ...(data.collectsPhone === "Yes" ? ["Phone Number"] : [])],
      collected: data.collectsPersonalInfo === "Yes",
      linkedToUser: true,
      usedForTracking: false,
      purpose: "App Functionality & Account Management",
    },
    {
      category: "User Content",
      dataTypes: ["Photos or Videos", "Customer Support Messages"],
      collected: (data.mobilePermissions && data.mobilePermissions.some(p => p.includes("Photo") || p.includes("Camera"))) || false,
      linkedToUser: true,
      usedForTracking: false,
      purpose: "App Functionality",
    },
    {
      category: "Identifiers",
      dataTypes: ["User ID", "Device ID", ...(data.usesIDFA === "Yes" ? ["IDFA"] : [])],
      collected: true,
      linkedToUser: true,
      usedForTracking: data.usesIDFA === "Yes",
      purpose: data.usesIDFA === "Yes" ? "Third-Party Advertising & Analytics" : "Analytics & Security",
    },
    {
      category: "Usage Data",
      dataTypes: ["Product Interaction", "Advertising Data"],
      collected: data.usesAnalytics === "Yes",
      linkedToUser: false,
      usedForTracking: false,
      purpose: "Analytics & Product Improvement",
    },
    {
      category: "Diagnostics",
      dataTypes: ["Crash Data", "Performance Diagnostics"],
      collected: (data.crashReportingServices && data.crashReportingServices.length > 0) || false,
      linkedToUser: false,
      usedForTracking: false,
      purpose: "App Stability & Diagnostics",
    },
    {
      category: "Location",
      dataTypes: ["Coarse / Precise Location"],
      collected: data.collectsLocation === "Yes",
      linkedToUser: true,
      usedForTracking: false,
      purpose: "App Functionality",
    },
  ];

  // Google Play Data Safety Summary
  const googlePlayDataSafety = {
    collectedData: [
      ...(data.collectsPersonalInfo === "Yes" ? ["Personal Info (Name, Email)"] : []),
      ...(data.collectsLocation === "Yes" ? ["Location (Approximate / Precise)"] : []),
      ...(data.collectsPayment === "Yes" ? ["Financial Info (Purchase history)"] : []),
      ...(data.mobilePermissions && data.mobilePermissions.some(p => p.includes("Photo")) ? ["Photos and Videos"] : []),
      ...(data.crashReportingServices && data.crashReportingServices.length > 0 ? ["App Info and Performance (Crash logs, Diagnostics)"] : []),
      ...(data.usesAnalytics === "Yes" ? ["Device or other IDs"] : []),
    ],
    sharedData: [
      ...(data.usesAnalytics === "Yes" ? ["Analytics Subprocessors"] : []),
      ...(data.collectsPayment === "Yes" ? ["Payment Processors"] : []),
      ...(data.usesAdTracking === "Yes" ? ["Advertising Networks"] : []),
    ],
    encryptedInTransit: true,
    deletionMechanism: data.accountDeletionMethod || "In-App Setting & Email Request",
    deletionUrl: data.accountDeletionUrl || `${website}/delete-account`,
  };

  return {
    companyName: company,
    tradingName: data.tradingName?.trim(),
    platform,
    websiteUrl: website,
    contactEmail: email,
    country,
    slug,
    lastUpdated: formattedDate,
    sections,
    plainText: plainTextLines.join("\n"),
    markdown: markdownLines.join("\n"),
    html: htmlContent,
    appleNutritionLabels,
    googlePlayDataSafety,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface DescriptionGeneratorOptions {
  customSlug?: string;
  lastUpdated?: string;
  appName?: string;
  websiteUrl?: string;
  contactEmail?: string;
}

export function generatePolicyFromDescription(
  rawDescription: string,
  options?: DescriptionGeneratorOptions
): GeneratedPolicy {
  const text = (rawDescription || "").trim();

  // Helper for case-insensitive matching
  const has = (pattern: RegExp | string): boolean => {
    if (typeof pattern === "string") {
      return text.toLowerCase().includes(pattern.toLowerCase());
    }
    return pattern.test(text);
  };

  // 1. Entity Extraction
  let appName = options?.appName?.trim() || "";
  if (!appName) {
    const nameMatch =
      text.match(/(?:app|website|site|platform|service|tool|product)\s+(?:named|called|is\s+called|is\s+named)\s+["']?([A-Za-z0-9\s._-]{2,40}?)["']?(?:[\.,\n]|\s+that|\s+which|\s+is)/i) ||
      text.match(/\bcalled\s+["']?([A-Za-z0-9\s._-]{2,40}?)["']?(?:[\.,\n]|\s+that|\s+which|\s+for)/i) ||
      text.match(/\bnamed\s+["']?([A-Za-z0-9\s._-]{2,40}?)["']?(?:[\.,\n]|\s+that|\s+which|\s+for)/i) ||
      text.match(/for\s+["']?([A-Za-z0-9\s._-]{2,40}?)["']?,\s+(?:a|an)\s+(?:mobile|web|ios|android|saas|app|website)/i) ||
      text.match(/^([A-Za-z0-9_-]{2,30}(?:\s+[A-Za-z0-9_-]{1,20}){0,2})\s+is\s+(?:an?|the)\s+(?:[A-Za-z0-9_-]+\s+){0,3}(?:app|application|website|platform|service|tool|saas|software)/i);
    if (nameMatch && nameMatch[1]) {
      appName = nameMatch[1].trim();
    }
  }

  const companyDisplay = appName || "[App / Company Name: Needs Confirmation]";

  // 2. Email Extraction
  let email = options?.contactEmail?.trim() || "";
  if (!email) {
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
    if (emailMatch) {
      email = emailMatch[0];
    }
  }
  const emailDisplay = email || "[Contact Email: Needs Confirmation]";

  // 3. Website Extraction
  let website = options?.websiteUrl?.trim() || "";
  if (!website) {
    const urlMatch = text.match(/\bhttps?:\/\/[^\s,;)"']+/i);
    if (urlMatch) {
      website = urlMatch[0];
    }
  }
  const websiteDisplay = website || "[Website / App URL: Needs Confirmation]";

  // 4. Platform Extraction
  const hasMobile = has(/\b(ios|android|iphone|ipad|mobile app|app store|play store)\b/i);
  const hasWeb = has(/\b(website|web app|web application|saas|browser|chrome extension)\b/i);
  let platform = "[Platform: Needs Confirmation]";
  if (hasMobile && hasWeb) {
    platform = "Web & Mobile Application";
  } else if (hasMobile) {
    platform = "Mobile Application (iOS / Android)";
  } else if (hasWeb) {
    platform = "Web Application";
  }

  // 5. Country / Jurisdiction Extraction
  let jurisdiction = "[Jurisdiction / Governing Law: Needs Confirmation]";
  const countryList = [
    "United States",
    "California",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "European Union",
    "India",
    "Singapore",
    "Japan",
    "Ireland",
    "Brazil",
  ];
  for (const c of countryList) {
    if (new RegExp(`\\b${c}\\b`, "i").test(text)) {
      jurisdiction = c;
      break;
    }
  }

  // 6. Data Practices Analysis
  const explicitNoPersonalData = has(
    /\b(does not collect (?:any|personal)|no personal (?:information|data|info)|no user data|anonymous app|does not gather personal)\b/i
  );
  const explicitNoCookies = has(
    /\b(no cookies|does not use cookies|without cookies|no tracking cookies)\b/i
  );
  const explicitNoSell = has(
    /\b(do not sell|never sell|we don't sell|not sold to third parties|no selling of data)\b/i
  );

  // Specific data items mentioned
  const collectedDataItems: { title: string; text: string }[] = [];

  const mentionsEmail = has(/\b(email|email address)\b/i);
  const mentionsName = has(/\b(name|full name|username|user name)\b/i);
  const mentionsPhone = has(/\b(phone|telephone|mobile number|phone number)\b/i);
  const mentionsAddress = has(/\b(physical address|mailing address|postal address|billing address)\b/i);
  const mentionsAccount = has(/\b(account|accounts|profile|sign up|sign in|login|credentials|password)\b/i);

  if (mentionsEmail || mentionsName || mentionsPhone || mentionsAddress || mentionsAccount) {
    const list: string[] = [];
    if (mentionsName) list.push("names / usernames");
    if (mentionsEmail) list.push("email addresses");
    if (mentionsPhone) list.push("phone numbers");
    if (mentionsAddress) list.push("addresses");
    if (mentionsAccount) list.push("account credentials / profile details");
    collectedDataItems.push({
      title: "Personal & Account Information",
      text: `Information directly provided by users, including: ${list.join(", ")}.`,
    });
  }

  const mentionsPhotosMedia = has(/\b(photo|photos|image|images|video|videos|audio|voice|camera|files|uploads)\b/i);
  if (mentionsPhotosMedia) {
    collectedDataItems.push({
      title: "User-Generated Media & Files",
      text: "Photos, images, audio, or files uploaded or generated within the application.",
    });
  }

  const mentionsLocation = has(/\b(location|geolocation|gps|coordinates|precise location)\b/i);
  if (mentionsLocation) {
    collectedDataItems.push({
      title: "Location Information",
      text: "Location and geolocation data used for local services, navigation, or region-based features.",
    });
  }

  const mentionsPayment = has(/\b(payment|payments|credit card|billing|subscription|purchases|transactions?|stripe|paypal)\b/i);
  if (mentionsPayment) {
    collectedDataItems.push({
      title: "Payment & Transaction Records",
      text: "Billing details, subscription records, and transaction receipts processed via payment providers.",
    });
  }

  const mentionsDeviceLogs = has(/\b(device|ip address|log|logs|diagnostics|telemetry|crash|browser)\b/i);
  if (mentionsDeviceLogs) {
    collectedDataItems.push({
      title: "Device & Technical Telemetry",
      text: "Device identifiers, operating system version, IP address, and crash/diagnostic logs.",
    });
  }

  // Third-party service detection
  const detectedThirdParties: { name: string; purpose: string }[] = [];
  const thirdPartyMap: Record<string, string> = {
    "google analytics": "Web and application analytics telemetry",
    posthog: "Product analytics and user event tracking",
    mixpanel: "Event tracking and product metrics",
    firebase: "Authentication, database, and telemetry services",
    supabase: "Database and authentication infrastructure",
    stripe: "Payment processing and subscription billing",
    paypal: "Payment and checkout processing",
    sentry: "Application crash reporting and error diagnostics",
    datadog: "Infrastructure and performance monitoring",
    openai: "Artificial intelligence / machine learning models",
    chatgpt: "AI conversational interface integrations",
    claude: "AI model integrations",
    anthropic: "AI model processing",
    aws: "Cloud hosting and storage infrastructure",
    vercel: "Application deployment and hosting",
    resend: "Transactional email delivery",
    sendgrid: "Email notifications and messaging",
    twilio: "SMS and communication delivery",
    meta: "Social authentication and advertising APIs",
    facebook: "Social login and analytics",
    apple: "Sign in with Apple and App Store billing",
  };

  for (const [key, purpose] of Object.entries(thirdPartyMap)) {
    if (has(new RegExp(`\\b${key}\\b`, "i"))) {
      const formatted = key.charAt(0).toUpperCase() + key.slice(1);
      detectedThirdParties.push({ name: formatted, purpose });
    }
  }

  // Analytics detection
  const mentionsAnalytics = has(/\b(analytics|google analytics|posthog|mixpanel|telemetry|track usage|tracking)\b/i);
  const mentionsCookies = has(/\b(cookie|cookies|local storage|session|sessions)\b/i);

  // Retention detection
  let retentionText = "";
  const retentionMatch = text.match(/\b(retained (?:for )?[^\.,\n]+|stored (?:for )?[^\.,\n]+|\d+\s+(?:days|months|years)|until account deletion|until deleted)\b/i);
  if (retentionMatch) {
    retentionText = retentionMatch[0];
  }

  // Account deletion detection
  let deletionMethodText = "";
  const deletionMatch = text.match(/\b(?:delete (?:account|data) [^\.,\n]+|settings [^\.,\n]+|email [^\.,\n]+ to delete)\b/i);
  if (deletionMatch) {
    deletionMethodText = deletionMatch[0];
  }

  const lastUpdated =
    options?.lastUpdated ||
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const slug =
    options?.customSlug?.trim() ||
    (appName ? slugify(appName) : "my-app-policy");

  const sections: PolicySection[] = [];
  let secNum = 1;

  // 1. Introduction
  const introParagraphs = [
    `Welcome to the Privacy Policy for ${companyDisplay} ("we", "our", or "us"). This policy explains what information is collected, how it is used, and how your privacy is protected when using our ${platform.includes("Needs Confirmation") ? "services" : platform.toLowerCase()}.`,
  ];
  if (text) {
    introParagraphs.push(
      `Service Summary (Provided by User): "${text.length > 280 ? text.substring(0, 280) + "..." : text}"`
    );
  }
  introParagraphs.push(
    `Please review this document carefully. Where details were not provided in your app description, they are explicitly designated with [Needs Confirmation] so they can be confirmed prior to official deployment.`
  );
  sections.push({
    id: "introduction",
    number: secNum++,
    title: "Introduction",
    paragraphs: introParagraphs,
    bulletPoints: [
      { title: "Application / Service Name", text: companyDisplay },
      { title: "Platform / Scope", text: platform },
      { title: "Official Website", text: websiteDisplay },
    ],
  });

  // 2. Information Collected
  const infoParagraphs: string[] = [];
  const infoBullets: { title?: string; text: string }[] = [];

  if (explicitNoPersonalData) {
    infoParagraphs.push(
      "As described in your product specifications, this application does not collect, record, or transmit personal data from its users."
    );
    infoBullets.push({
      title: "No Personal Data Collection",
      text: "The service operates without storing user accounts, identity records, or private personal information.",
    });
  } else if (collectedDataItems.length > 0) {
    infoParagraphs.push(
      "Based on the information you provided, the application collects and processes the following categories of data:"
    );
    collectedDataItems.forEach((item) => {
      infoBullets.push({ title: item.title, text: item.text });
    });
  } else {
    infoParagraphs.push(
      "The submitted description did not specify the exact categories of data gathered by your application."
    );
    infoBullets.push({
      title: "[Data Collection Details: Needs Confirmation]",
      text: "Specify what user information (e.g., email address, account details, uploaded files, device data) is collected by your app, or confirm if no personal data is gathered.",
    });
  }
  sections.push({
    id: "information-collected",
    number: secNum++,
    title: "Information Collected",
    paragraphs: infoParagraphs,
    bulletPoints: infoBullets,
  });

  // 3. How Information Is Used
  const usageParagraphs: string[] = [
    "Information collected by the application is utilized solely to deliver and maintain the functionality described in your submission:",
  ];
  const usageBullets: { title?: string; text: string }[] = [];

  usageBullets.push({
    title: "Core Service Delivery",
    text: `Operating and maintaining the primary functionality of ${companyDisplay}.`,
  });

  if (mentionsAccount || mentionsEmail) {
    usageBullets.push({
      title: "Account Administration & Communications",
      text: "Managing authentication, responding to user inquiries, and sending essential operational notices.",
    });
  }

  if (mentionsPayment) {
    usageBullets.push({
      title: "Order & Subscription Fulfillment",
      text: "Facilitating customer billing, payment verification, and order records.",
    });
  }

  if (mentionsAnalytics || mentionsDeviceLogs) {
    usageBullets.push({
      title: "Performance & Diagnostic Improvements",
      text: "Analyzing stability, diagnosing technical faults, and refining application features.",
    });
  }

  if (collectedDataItems.length === 0 && !mentionsAccount && !mentionsPayment) {
    usageBullets.push({
      title: "[Data Usage Purposes: Needs Confirmation]",
      text: "Clarify any secondary purposes for processing user data, such as product research, customer support, or security monitoring.",
    });
  }

  sections.push({
    id: "how-information-is-used",
    number: secNum++,
    title: "How Information Is Used",
    paragraphs: usageParagraphs,
    bulletPoints: usageBullets,
  });

  // 4. Data Sharing & Third-Party Services
  const sharingParagraphs: string[] = [];
  const sharingBullets: { title?: string; text: string }[] = [];

  if (explicitNoSell) {
    sharingParagraphs.push(
      "We do not sell, rent, trade, or monetize your personal information to third parties or commercial data brokers under any circumstances."
    );
  } else {
    sharingParagraphs.push(
      "Personal data is not sold or rented to third-party advertisers."
    );
  }

  if (detectedThirdParties.length > 0) {
    sharingParagraphs.push(
      "We share information only with third-party service providers necessary to operate the application services described in your submission:"
    );
    detectedThirdParties.forEach((tp) => {
      sharingBullets.push({ title: tp.name, text: tp.purpose });
    });
  } else {
    sharingParagraphs.push(
      "No external third-party integrations, cloud databases, or sub-processors were specified in your app description."
    );
    sharingBullets.push({
      title: "[Third-Party Integrations: Needs Confirmation]",
      text: "Confirm whether external cloud hosts, analytics platforms, or API partners receive user data.",
    });
  }
  sections.push({
    id: "data-sharing",
    number: secNum++,
    title: "Data Sharing & Third-Party Disclosures",
    paragraphs: sharingParagraphs,
    bulletPoints: sharingBullets,
  });

  // 5. Cookies and Analytics
  const cookieParagraphs: string[] = [];
  const cookieBullets: { title?: string; text: string }[] = [];

  if (explicitNoCookies) {
    cookieParagraphs.push(
      "The application does not use cookies, web beacons, or third-party tracking identifiers."
    );
    cookieBullets.push({
      title: "No Tracking Cookies",
      text: "No browser tracking cookies or cross-site tracking scripts are deployed.",
    });
  } else if (mentionsCookies || mentionsAnalytics) {
    cookieParagraphs.push(
      "The service uses cookies, local storage, or analytics tracking to support essential operations and understand usage patterns:"
    );
    if (mentionsCookies) {
      cookieBullets.push({
        title: "Session & Functional Cookies",
        text: "Temporary cookies or local storage keys used to maintain state and user preferences.",
      });
    }
    if (mentionsAnalytics) {
      cookieBullets.push({
        title: "Analytics Measurement",
        text: "Aggregated usage telemetry to analyze app traffic and feature engagement.",
      });
    }
  } else {
    cookieParagraphs.push(
      "Cookie and analytics tracking practices were not explicitly outlined in your description."
    );
    cookieBullets.push({
      title: "[Cookies & Tracking: Needs Confirmation]",
      text: "Indicate whether your app or website uses cookies, local storage, or third-party analytics telemetry.",
    });
  }
  sections.push({
    id: "cookies-and-analytics",
    number: secNum++,
    title: "Cookies and Analytics",
    paragraphs: cookieParagraphs,
    bulletPoints: cookieBullets,
  });

  // 6. Data Security
  sections.push({
    id: "data-security",
    number: secNum++,
    title: "Data Security",
    paragraphs: [
      `We implement reasonable administrative, technical, and physical security measures to protect information handled by ${companyDisplay} against unauthorized access, loss, misuse, or alteration.`,
      `While we take diligent steps to safeguard data, no transmission over the Internet or wireless network can be guaranteed 100% secure.`,
    ],
    bulletPoints: [
      {
        title: "[Security Standards: Needs Confirmation]",
        text: "Confirm if specific security protocols (e.g., TLS encryption in transit, AES-256 encryption at rest) are employed for your data architecture.",
      },
    ],
  });

  // 7. Data Retention
  const retentionParagraphs: string[] = [];
  const retentionBullets: { title?: string; text: string }[] = [];

  if (retentionText) {
    retentionParagraphs.push(
      `Information is retained according to your specified policy: ${retentionText}.`
    );
    retentionBullets.push({
      title: "Retention Schedule",
      text: retentionText,
    });
  } else {
    retentionParagraphs.push(
      "Personal information is retained only for as long as necessary to fulfill the purposes for which it was gathered, satisfy operational requirements, or comply with applicable legal obligations."
    );
    retentionBullets.push({
      title: "[Retention Period: Needs Confirmation]",
      text: "Specify how long user records, transaction logs, or backups are stored before permanent deletion.",
    });
  }
  sections.push({
    id: "data-retention",
    number: secNum++,
    title: "Data Retention",
    paragraphs: retentionParagraphs,
    bulletPoints: retentionBullets,
  });

  // 8. User Rights
  const rightsParagraphs: string[] = [
    "Depending on your location and relevant privacy laws, users have important rights regarding their personal data, including the right to:",
  ];
  const rightsBullets: { title?: string; text: string }[] = [
    { title: "Access & Portability", text: "Request a copy of the personal information stored about you." },
    { title: "Correction", text: "Request correction of inaccurate or incomplete records." },
    { title: "Deletion / Erasure", text: "Request deletion of your personal information or account closure." },
    { title: "Withdraw Consent", text: "Revoke consent for optional data processing at any time." },
  ];

  if (deletionMethodText) {
    rightsBullets.push({
      title: "Account Deletion Procedure",
      text: deletionMethodText,
    });
  } else {
    rightsBullets.push({
      title: "[Account Deletion Method: Needs Confirmation]",
      text: "Provide instructions on how users can delete their accounts or request data erasure (e.g., via in-app button or dedicated email).",
    });
  }

  sections.push({
    id: "user-rights",
    number: secNum++,
    title: "User Rights & Account Deletion",
    paragraphs: rightsParagraphs,
    bulletPoints: rightsBullets,
  });

  // 9. Contact Information
  const contactBullets: { title?: string; text: string }[] = [
    { title: "Application / Entity Name", text: companyDisplay },
    { title: "Website URL", text: websiteDisplay },
    { title: "Designated Privacy Email", text: emailDisplay },
    { title: "Jurisdiction / Governing Law", text: jurisdiction },
  ];
  if (!email || !appName || !website) {
    contactBullets.push({
      title: "[Missing Contact Fields: Needs Confirmation]",
      text: "Please provide the official registered company address and verified contact email for privacy correspondence.",
    });
  }
  sections.push({
    id: "contact-information",
    number: secNum++,
    title: "Contact Information",
    paragraphs: [
      `For inquiries, questions regarding this Privacy Policy, or to exercise your privacy rights, please contact our designated representative:`,
    ],
    bulletPoints: contactBullets,
  });

  // Build Plain Text
  const plainTextLines: string[] = [
    `PRIVACY POLICY FOR ${companyDisplay.toUpperCase()}`,
    `Platform: ${platform}`,
    `Website: ${websiteDisplay}`,
    `Last Updated: ${lastUpdated}`,
    `Jurisdiction: ${jurisdiction}`,
    `--------------------------------------------------`,
    "",
  ];

  // Build Markdown
  const markdownLines: string[] = [
    `# Privacy Policy for ${companyDisplay}`,
    "",
    `**Platform:** ${platform}  `,
    `**Website:** ${website.startsWith("http") ? `[${website}](${website})` : websiteDisplay}  `,
    `**Last Updated:** ${lastUpdated}  `,
    `**Jurisdiction:** ${jurisdiction}  `,
    "",
    "---",
    "",
  ];

  // Build HTML
  let htmlContent = `<div class="privacy-policy">
  <h1>Privacy Policy for ${escapeHtml(companyDisplay)}</h1>
  <p class="meta"><strong>Platform:</strong> ${escapeHtml(platform)}<br>
  <strong>Website:</strong> ${website.startsWith("http") ? `<a href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(website)}</a>` : escapeHtml(websiteDisplay)}<br>
  <strong>Last Updated:</strong> ${escapeHtml(lastUpdated)}<br>
  <strong>Jurisdiction:</strong> ${escapeHtml(jurisdiction)}</p>
  <hr />
`;

  sections.forEach((sec) => {
    plainTextLines.push(`${sec.number}. ${sec.title.toUpperCase()}`);
    sec.paragraphs.forEach((p) => plainTextLines.push(p, ""));
    if (sec.bulletPoints) {
      sec.bulletPoints.forEach((b) => {
        plainTextLines.push(`  * ${b.title ? b.title + ": " : ""}${b.text}`);
      });
      plainTextLines.push("");
    }

    markdownLines.push(`## ${sec.number}. ${sec.title}`);
    markdownLines.push("");
    sec.paragraphs.forEach((p) => {
      markdownLines.push(p);
      markdownLines.push("");
    });
    if (sec.bulletPoints) {
      sec.bulletPoints.forEach((b) => {
        markdownLines.push(`* ${b.title ? `**${b.title}:** ` : ""}${b.text}`);
      });
      markdownLines.push("");
    }

    htmlContent += `  <section id="${escapeHtml(sec.id)}">\n`;
    htmlContent += `    <h2>${sec.number}. ${escapeHtml(sec.title)}</h2>\n`;
    sec.paragraphs.forEach((p) => {
      htmlContent += `    <p>${escapeHtml(p)}</p>\n`;
    });
    if (sec.bulletPoints && sec.bulletPoints.length > 0) {
      htmlContent += `    <ul>\n`;
      sec.bulletPoints.forEach((b) => {
        htmlContent += `      <li>${b.title ? `<strong>${escapeHtml(b.title)}:</strong> ` : ""}${escapeHtml(b.text)}</li>\n`;
      });
      htmlContent += `    </ul>\n`;
    }
    htmlContent += `  </section>\n`;
  });

  htmlContent += `</div>`;

  return {
    companyName: appName || "My Application",
    tradingName: appName || undefined,
    platform,
    websiteUrl: website || "",
    contactEmail: email || "",
    country: jurisdiction.includes("Needs Confirmation") ? "Unspecified" : jurisdiction,
    slug,
    lastUpdated,
    sections,
    plainText: plainTextLines.join("\n"),
    markdown: markdownLines.join("\n"),
    html: htmlContent,
    appleNutritionLabels: [
      {
        category: "Contact Info",
        dataTypes: ["Email Address"],
        collected: Boolean(email),
        linkedToUser: Boolean(email),
        usedForTracking: false,
        purpose: "App Functionality",
      },
    ],
    googlePlayDataSafety: {
      collectedData: collectedDataItems.map((c) => c.title),
      sharedData: detectedThirdParties.map((t) => t.name),
      encryptedInTransit: true,
      deletionMechanism: deletionMethodText || "Email Request or In-App Settings",
      deletionUrl: website ? `${website}/delete-account` : "",
    },
  };
}
