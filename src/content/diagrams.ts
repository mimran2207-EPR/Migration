// Architecture picture per stage: layers top → bottom, nodes linked to workbook concepts ("#").
export interface DiagramNode { label: string; sub?: string; concept?: number }
export interface DiagramLayer { label: string; nodes: DiagramNode[] }
export interface StageDiagram { stage: number; caption: string; layers: DiagramLayer[] }

export const diagrams: StageDiagram[] = [
  // ───────── שלב 0 · מצב קיים ויסודות ─────────
  {
    stage: 0,
    caption: `הפקיד מתחבר ב-RDP ל-Terminal Server, שם Access ו-VBA מריצים את הלוגיקה מול SQL Server וקבצי רשת.`,
    layers: [
      {
        label: `תחנת משתמש`,
        nodes: [
          { label: `RDP`, sub: `Session על השרת`, concept: 1 },
          { label: `tsclient`, sub: `דרייב לדיסק המקומי`, concept: 6 },
          { label: `PdfSigner`, sub: `חתימה דיגיטלית על PDF`, concept: 7 },
          { label: `Smart Card`, sub: `קורא פיזי בעמדה`, concept: 8 },
        ],
      },
      {
        label: `Terminal Server`,
        nodes: [
          { label: `RDS Host`, sub: `כל המשתמשים במקביל`, concept: 2 },
          { label: `DLL / EXE`, sub: `רכיבים מקומפלים קיימים`, concept: 11 },
        ],
      },
      {
        label: `Access + VBA`,
        nodes: [
          { label: `Microsoft Access`, sub: `UI + תהליך + אינטגרציה`, concept: 3 },
          { label: `VBA`, sub: `רוב הלוגיקה העסקית`, concept: 4 },
          { label: `Macros / Queries`, sub: `שאילתות ופקודות שמורות`, concept: 5 },
        ],
      },
      {
        label: `SQL Server וקבצים`,
        nodes: [
          { label: `SQL Server`, sub: `DB נפרד לכל לקוח`, concept: 9 },
          { label: `UNC Path`, sub: `קבצי שרת, staging, ארכיון`, concept: 10 },
        ],
      },
      {
        label: `מאפייני המערכת`,
        nodes: [
          { label: `Legacy System`, sub: `עובדת אך קשה לשינוי`, concept: 13 },
          { label: `Coupling`, sub: `שינוי אחד שובר אחרים`, concept: 12 },
        ],
      },
    ],
  },

  // ───────── שלב 1 · מסך ראשון ─────────
  {
    stage: 1,
    caption: `מסך Angular עובר דרך WAF ו-ALB ל-Thin BFF, שמרכיב תשובה מ-Domain Services שניגשים ל-SQL דרך RepoDB.`,
    layers: [
      {
        label: `דפדפן · Angular`,
        nodes: [
          { label: `Angular`, sub: `Framework ה-UI`, concept: 15 },
          { label: `TypeScript`, sub: `strict: true`, concept: 16 },
          { label: `Signals`, sub: `reactivity בלי Zone.js`, concept: 17 },
          { label: `Standalone`, sub: `Components ללא NgModule`, concept: 18 },
        ],
      },
      {
        label: `קצה AWS`,
        nodes: [
          { label: `Route 53 / WAF`, sub: `DNS + חומת אש`, concept: 39 },
          { label: `Rate Limiting`, sub: `הגבלת קצב בקשות`, concept: 28 },
          { label: `ALB`, sub: `ניתוב לפי path`, concept: 37 },
          { label: `OIDC`, sub: `הזדהות מול ספק זהות`, concept: 24 },
        ],
      },
      {
        label: `Thin BFF · ASP.NET Core`,
        nodes: [
          { label: `Thin BFF`, sub: `אפס לוגיקה עסקית, אפס SQL`, concept: 23 },
          { label: `Web Session`, sub: `Cookie HttpOnly`, concept: 25 },
          { label: `CSRF`, sub: `AddAntiforgery()`, concept: 27 },
          { label: `Aggregation`, sub: `Task.WhenAll → DTO אחד`, concept: 29 },
        ],
      },
      {
        label: `שירותים · ECS`,
        nodes: [
          { label: `Domain Services`, sub: `הלוגיקה העסקית`, concept: 34 },
          { label: `Data Access Layer`, sub: `השכבה היחידה מול ה-DB`, concept: 33 },
          { label: `RepoDB`, sub: `QueryAsync<T>()`, concept: 32 },
          { label: `Fargate`, sub: `קונטיינרים בלי שרתים`, concept: 36 },
        ],
      },
      {
        label: `מסד נתונים`,
        nodes: [
          { label: `SQL Server`, sub: `ה-DB הקיים של הלקוח`, concept: 9 },
        ],
      },
    ],
  },

  // ───────── שלב 2 · עבודה היברידית ─────────
  {
    stage: 2,
    caption: `Feature Flags מנתבים כל Tenant בין Access ל-Web; השרת מאתר את ה-DB שלו דרך ה-Registry וסודות מוצפנים.`,
    layers: [
      {
        label: `לקוח · Access ו-Web יחד`,
        nodes: [
          { label: `Tenant`, sub: `לקוח/ארגון יחיד`, concept: 45 },
          { label: `Strangler Fig`, sub: `החלפה חלק-חלק`, concept: 42 },
          { label: `Feature Flags`, sub: `מתג לכל לקוח`, concept: 43 },
          { label: `Rollback`, sub: `כיבוי flag + גרסה קודמת`, concept: 59 },
        ],
      },
      {
        label: `שרת · .NET`,
        nodes: [
          { label: `Tenant Context`, sub: `TenantId מה-Session`, concept: 49 },
          { label: `Connection Resolver`, sub: `מחרוזת חיבור לפי Tenant`, concept: 50 },
          { label: `Connection Pool`, sub: `pool נפרד לכל Tenant`, concept: 51 },
          { label: `DB Migrations`, sub: `Migration Orchestrator`, concept: 56 },
        ],
      },
      {
        label: `Control Plane`,
        nodes: [
          { label: `Control Plane`, sub: `מי הלקוחות ואיפה ה-DB`, concept: 46 },
          { label: `Tenant Registry`, sub: `טבלה + cache ב-Redis`, concept: 48 },
          { label: `RDS PostgreSQL`, sub: `DB מנוהל ל-Control Plane`, concept: 52 },
          { label: `Schema Version`, sub: `גרסת סכימה לכל Tenant`, concept: 55 },
        ],
      },
      {
        label: `סודות והצפנה`,
        nodes: [
          { label: `Secrets Manager`, sub: `ב-Registry רק הפניה`, concept: 53 },
          { label: `KMS`, sub: `מפתחות הצפנה`, concept: 54 },
        ],
      },
      {
        label: `Data Plane`,
        nodes: [
          { label: `Data Plane`, sub: `SQL Server on VMs`, concept: 47 },
          { label: `Multi-Tenancy`, sub: `DB נפרד לכל Tenant`, concept: 44 },
          { label: `Schema Compatibility`, sub: `שינויים additive בלבד`, concept: 57 },
          { label: `Reconciliation`, sub: `השוואה לילית ישן/חדש`, concept: 58 },
        ],
      },
    ],
  },

  // ───────── שלב 3 · מסכים ללא Agent ─────────
  {
    stage: 3,
    caption: `מסך Angular שולח פעולת CRUD דרך ה-BFF למודול Domain, שמאמת קלט וקורא ל-Stored Procedures הקיימות.`,
    layers: [
      {
        label: `דפדפן`,
        nodes: [
          { label: `מסך Angular`, sub: `Reactive Forms`, concept: 15 },
        ],
      },
      {
        label: `שרת · BFF`,
        nodes: [
          { label: `Thin BFF`, sub: `העברה בלבד, בלי לוגיקה`, concept: 23 },
        ],
      },
      {
        label: `שירות Domain`,
        nodes: [
          { label: `Domain Modules`, sub: `תיקייה/פרויקט לכל תחום`, concept: 61 },
          { label: `Validation`, sub: `FluentValidation`, concept: 63 },
          { label: `CRUD`, sub: `סינכרוני, בלי Broker`, concept: 62 },
        ],
      },
      {
        label: `גישה לנתונים`,
        nodes: [
          { label: `RepoDB`, sub: `CommandType.StoredProcedure`, concept: 32 },
        ],
      },
      {
        label: `SQL Server`,
        nodes: [
          { label: `Stored Procedures`, sub: `הקיימות, כמו שהן`, concept: 60 },
          { label: `SQL Server`, sub: `DB של ה-Tenant`, concept: 9 },
        ],
      },
    ],
  },

  // ───────── שלב 4 · תשתיות Agent ─────────
  {
    stage: 4,
    caption: `ה-Local Agent בעמדה משויך ל-Web Session ומתחבר החוצה ב-WSS ל-Agent Gateway, שמשתף מצב דרך Redis.`,
    layers: [
      {
        label: `סביבת VDI`,
        nodes: [
          { label: `Non-persistent VDI`, sub: `נמחקת בכל Logout`, concept: 77 },
          { label: `Golden Image`, sub: `Agent מותקן, בלי סודות`, concept: 78 },
        ],
      },
      {
        label: `עמדת משתמש`,
        nodes: [
          { label: `Local Agent`, sub: `.NET 10 ב-User Session`, concept: 64 },
          { label: `Custom URL Scheme`, sub: `moaza:// עם PairingId`, concept: 69 },
          { label: `Pairing`, sub: `שיוך Agent ל-Web Session`, concept: 68 },
          { label: `PKCE`, sub: `code_verifier + challenge`, concept: 70 },
        ],
      },
      {
        label: `ערוץ WSS`,
        nodes: [
          { label: `WSS`, sub: `WebSocket מוצפן דרך ALB`, concept: 67 },
          { label: `Heartbeat`, sub: `ping כל 30 שניות`, concept: 72 },
          { label: `Reconnect`, sub: `WithAutomaticReconnect()`, concept: 73 },
          { label: `Retry / Timeout`, sub: `Polly + timeout לפקודה`, concept: 79 },
        ],
      },
      {
        label: `Agent Gateway · ענן`,
        nodes: [
          { label: `Agent Gateway`, sub: `ניתוב לפי AgentSessionId`, concept: 65 },
          { label: `SignalR`, sub: `MapHub<AgentHub>()`, concept: 66 },
          { label: `Agent Session`, sub: `JWT עם TTL קצר`, concept: 71 },
          { label: `Revoke`, sub: `רשימת ביטול ב-Redis`, concept: 74 },
        ],
      },
      {
        label: `Redis`,
        nodes: [
          { label: `Redis Backplane`, sub: `שיתוף בין מופעי Gateway`, concept: 75 },
          { label: `ElastiCache Redis`, sub: `Redis מנוהל ב-AWS`, concept: 76 },
          { label: `PoC`, sub: `נדרש ל-Backplane`, concept: 80 },
        ],
      },
    ],
  },

  // ───────── שלב 5 · תהליכים מקומיים ─────────
  {
    stage: 5,
    caption: `פקודה יוצאת מהדפדפן דרך ערוץ הפקודות ל-Agent, והקובץ עצמו עובר ב-HTTPS ל-S3 עם Pre-signed URL.`,
    layers: [
      {
        label: `דפדפן`,
        nodes: [
          { label: `מסך Web`, sub: `יוזם פקודה ומציג סטטוס` },
        ],
      },
      {
        label: `Agent Gateway`,
        nodes: [
          { label: `Command Channel`, sub: `JSON קטן ב-SignalR/WSS`, concept: 81 },
          { label: `State Machine`, sub: `Created → Completed/Failed`, concept: 85 },
          { label: `Idempotency`, sub: `CommandId + unique index`, concept: 84 },
        ],
      },
      {
        label: `עמדת משתמש`,
        nodes: [
          { label: `Local Agent`, sub: `חתימה, סורק, קבצים`, concept: 64 },
          { label: `Delivery ≠ Execution`, sub: `delivered_at / completed_at`, concept: 86 },
        ],
      },
      {
        label: `S3 · ערוץ קבצים`,
        nodes: [
          { label: `File Channel`, sub: `העלאה/הורדה ב-HTTPS`, concept: 82 },
          { label: `Pre-signed URL`, sub: `תוקף של 5 דקות`, concept: 83 },
        ],
      },
    ],
  },

  // ───────── שלב 6 · מעבר Tenants ─────────
  {
    stage: 6,
    caption: `לקוח Pilot מופעל ב-Feature Flags, ובזמן ה-Parallel Run הישן והחדש עובדים על אותו DB עם השוואה יומית.`,
    layers: [
      {
        label: `לקוח`,
        nodes: [
          { label: `Pilot`, sub: `Tenant קטן ראשון`, concept: 87 },
        ],
      },
      {
        label: `ניתוב`,
        nodes: [
          { label: `Feature Flags`, sub: `הפעלה לפי Tenant`, concept: 43 },
          { label: `Tenant Registry`, sub: `הגדרות הלקוח`, concept: 48 },
        ],
      },
      {
        label: `שתי מערכות`,
        nodes: [
          { label: `Web החדש`, sub: `Angular + .NET` },
          { label: `Microsoft Access`, sub: `הישן, עדיין פעיל`, concept: 3 },
          { label: `Parallel Run`, sub: `בעלות ברורה מי כותב מה`, concept: 88 },
        ],
      },
      {
        label: `Data Plane`,
        nodes: [
          { label: `SQL Server`, sub: `אותם נתונים לשניהם`, concept: 9 },
          { label: `Reconciliation`, sub: `השוואה יומית`, concept: 58 },
        ],
      },
    ],
  },

  // ───────── שלב 7 · ממשקי Legacy ואסינכרוניות ─────────
  {
    stage: 7,
    caption: `שירות Domain שומר הודעה ב-Outbox, ה-Broker מפזר אותה ל-Workers, והם מבצעים SFTP, דואר ועדכון cache.`,
    layers: [
      {
        label: `שירות Domain`,
        nodes: [
          { label: `Async by Design`, sub: `202 Accepted + operationId`, concept: 100 },
          { label: `Domain Events`, sub: `למשל: מסמך נחתם`, concept: 94 },
          { label: `Outbox Pattern`, sub: `הודעה + נתונים בטרנזקציה`, concept: 92 },
          { label: `Distributed Monolith`, sub: `הכשל שנמנעים ממנו`, concept: 101 },
        ],
      },
      {
        label: `Message Broker`,
        nodes: [
          { label: `Message Broker`, sub: `רכיבים לא מכירים זה את זה`, concept: 89 },
          { label: `SQS`, sub: `תור לפקודות`, concept: 90 },
          { label: `SNS / EventBridge`, sub: `פרסום אירועים`, concept: 91 },
          { label: `Fan-out`, sub: `הודעה לכמה צרכנים`, concept: 95 },
        ],
      },
      {
        label: `Workers · ECS`,
        nodes: [
          { label: `Workers / Schedulers`, sub: `BackgroundService`, concept: 97 },
          { label: `Document Service`, sub: `קלט SQS, פלט S3`, concept: 102 },
          { label: `Integration Service`, sub: `retry, circuit breaker`, concept: 103 },
          { label: `DLQ`, sub: `הודעות שנכשלו שוב ושוב`, concept: 93 },
        ],
      },
      {
        label: `יעדים`,
        nodes: [
          { label: `SFTP`, sub: `AWS Transfer Family`, concept: 98 },
          { label: `SMTP`, sub: `Amazon SES`, concept: 99 },
          { label: `Cache Invalidation`, sub: `מחיקת tenant:{id} ב-Redis`, concept: 96 },
        ],
      },
    ],
  },

  // ───────── שלב 8 · לוגיקת DB ─────────
  {
    stage: 8,
    caption: `הלוגיקה עוברת מ-VBA ומ-Stored Procedures לקוד C# במודולים, ומפוצלת לשירות עצמאי רק כשיש סיבה.`,
    layers: [
      {
        label: `מקור הלוגיקה היום`,
        nodes: [
          { label: `VBA`, sub: `מודולים בתוך Access`, concept: 4 },
          { label: `Stored Procedures`, sub: `לוגיקה בתוך SQL Server`, concept: 60 },
        ],
      },
      {
        label: `העברה`,
        nodes: [
          { label: `Logic Migration`, sub: `עוטפים, בודקים, מחליפים`, concept: 104 },
        ],
      },
      {
        label: `שירות .NET אחד`,
        nodes: [
          { label: `Modular Monolith`, sub: `גבולות פנימיים ברורים`, concept: 105 },
          { label: `Domain Modules`, sub: `interface ציבורי לכל תחום`, concept: 61 },
        ],
      },
      {
        label: `שירות עצמאי`,
        nodes: [
          { label: `Deployable Split`, sub: `scaling, אבטחה, בעלות`, concept: 106 },
        ],
      },
    ],
  },

  // ───────── שלב 9 · בחינת RDS ─────────
  {
    stage: 9,
    caption: `שכבת הגישה לנתונים נשארת, ומעליה בוחנים עלות, זמינות, זמני תגובה ותאימות SQL לפני מעבר ל-RDS.`,
    layers: [
      {
        label: `שירותי .NET`,
        nodes: [
          { label: `Data Access Layer`, sub: `נקודת ההחלפה היחידה`, concept: 33 },
        ],
      },
      {
        label: `שאלות הבחינה`,
        nodes: [
          { label: `TCO`, sub: `רישוי, תשתית, תחזוקה`, concept: 107 },
          { label: `HA`, sub: `Multi-AZ, RTO/RPO`, concept: 108 },
          { label: `Latency`, sub: `CloudWatch, OpenTelemetry`, concept: 109 },
        ],
      },
      {
        label: `בדיקת תאימות`,
        nodes: [
          { label: `Compatibility`, sub: `SCT + Babelfish`, concept: 110 },
        ],
      },
      {
        label: `מסד נתונים`,
        nodes: [
          { label: `SQL Server`, sub: `היום: על VMs`, concept: 9 },
          { label: `RDS PostgreSQL`, sub: `המועמד`, concept: 52 },
        ],
      },
    ],
  },
];
