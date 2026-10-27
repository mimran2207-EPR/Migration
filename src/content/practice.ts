// Hands-on practice: real situations from EPR's municipal product (Access → Web migration).
// Each scenario is answered by one concept from private/dev-structure-2026.xlsx (concept number = "#").
export interface Scenario {
  stage: number;          // 0..9, the stage of the concept that answers it
  situation: string;      // a concrete situation in the product, 1–3 sentences, Hebrew
  question: string;       // short question, Hebrew
  options: string[];      // 4 options — concept names in English as in the workbook (e.g. "Thin BFF")
  answer: number;         // index of the correct option
  why: string;            // 1–2 sentences: why this concept, and the concrete technical move (tool/code) from the workbook's "איך מיישמים"
  concepts: number[];     // workbook "#" of the correct concept (and optionally closely related ones)
}

export const scenarios: Scenario[] = [
  // ───────── שלב 0 · מצב קיים ויסודות ─────────
  {
    stage: 0,
    situation: `מודול VBA בגבייה מייצא את רשימת החייבים לקובץ Excel בנתיב \\\\tsclient\\C\\Exports — כלומר ישר לדיסק של המחשב המקומי של הפקיד, מתוך ה-Session על השרת.`,
    question: `באיזה מנגנון מדובר, ומה יחליף אותו ב-Web?`,
    options: [`tsclient`, `UNC Path`, `RDP`, `PdfSigner`],
    answer: 0,
    why: `זה הדרייב הממופה tsclient. מאתרים את כל השימושים בחיפוש המחרוזת tsclient בקוד ה-VBA (אחרי ייצוא ב-SaveAsText), וביעד מחליפים ב-Local Agent + העלאה/הורדה ב-HTTPS.`,
    concepts: [6, 4],
  },
  {
    stage: 0,
    situation: `פקיד גבייה חותם על PDF של קבלה. אישור החתימה יושב על כרטיס בקורא פיזי שמחובר לעמדה שלו.`,
    question: `איזה מושג מתאר את מה שמחזיק את אישור החתימה — ולמה זה לא יכול לרוץ מהדפדפן?`,
    options: [`PdfSigner`, `Smart Card`, `Browser First`, `RDP`],
    answer: 1,
    why: `ה-Smart Card דורש קורא פיזי בעמדה. בקוד ניגשים אליו ב-.NET עם System.Security.Cryptography.X509Certificates או PKCS#11 — דבר שהדפדפן לא יכול, ולכן חייב Local Agent.`,
    concepts: [8, 7, 64],
  },
  {
    stage: 0,
    situation: `מפתח שינה את חישוב יתרת החוב בטופס תשלומים ב-Access, ובעקבות זאת נשבר דוח הדפסת השוברים וגם הייצוא הלילי לבנק.`,
    question: `איזו תכונה של המערכת הקיימת גרמה לזה?`,
    options: [`Legacy System`, `DLL / EXE`, `SQL Server`, `Coupling`],
    answer: 3,
    why: `Coupling גבוה — שינוי ברכיב אחד שובר רכיבים אחרים. אחרי המעבר ל-.NET מודדים אותו בניתוח סטטי (NDepend, SonarQube).`,
    concepts: [12, 13],
  },

  // ───────── שלב 1 · מסך ראשון ─────────
  {
    stage: 1,
    situation: `בקוד ריוויו של מסך חיפוש משלמים מתגלה שמפתח כתב שאילתת SQL עם RepoDB ישירות בתוך ה-Controller של ה-BFF.`,
    question: `איזה עיקרון הופר, ואיך מונעים את זה אוטומטית?`,
    options: [`Thin BFF`, `BFF (Backend for Frontend)`, `Data Access Layer`, `Domain Services`],
    answer: 0,
    why: `לפי Thin BFF ב-BFF יש רק Authentication, Session, composition ומודלים למסך — אפס SQL. אוכפים עם ArchUnitNET או Roslyn Analyzer שמכשיל build אם פרויקט ה-BFF מפנה ל-RepoDB.`,
    concepts: [23, 33],
  },
  {
    stage: 1,
    situation: `מסך "כרטיס משלם" צריך פרטי משלם, יתרת שוברים פתוחים והיסטוריית תשלומים — שלושה Domain services שונים. ה-Angular צריך לקבל תשובה אחת.`,
    question: `מה ה-BFF עושה כאן?`,
    options: [`REST API`, `UI Model / DTO`, `Aggregation / Composition`, `Signals`],
    answer: 2,
    why: `Aggregation / Composition: מריצים את שלוש הקריאות במקביל עם Task.WhenAll וממפים את התוצאות ל-DTO אחד למסך.`,
    concepts: [29, 22, 30],
  },
  {
    stage: 1,
    situation: `הצוות מציע לבנות קודם את כל שכבת הנתונים לכל המערכות, ורק אחר כך מסכים. ההחלטה: לקחת את מסך חיפוש המשלמים בגבייה ולהעלות אותו ל-production מקצה לקצה.`,
    question: `איך נקראת הגישה שנבחרה?`,
    options: [`Spike`, `Strangler Fig Pattern`, `Domain Modules`, `Vertical Slice`],
    answer: 3,
    why: `Vertical Slice — תהליך עסקי אחד מקצה לקצה: Angular component + BFF endpoint + Domain service + גישה ל-SQL, ועולים ל-production.`,
    concepts: [14],
  },

  // ───────── שלב 2 · עבודה היברידית ─────────
  {
    stage: 2,
    situation: `מסך חיפוש המשלמים החדש צריך להתחבר ל-DB של העירייה שהמשתמש שייך אליה — לכל עירייה SQL Server DB משלה.`,
    question: `איזה רכיב מחזיר את מחרוזת החיבור הנכונה?`,
    options: [`Connection Resolver`, `Tenant Registry`, `Connection Pool`, `Secrets Manager`],
    answer: 0,
    why: `Connection Resolver: פונקציה שמקבלת TenantId, קוראת את ההגדרה מה-Tenant Registry, ומביאה את הסוד עצמו מ-Secrets Manager (ב-Registry נשמרת רק הפניה).`,
    concepts: [50, 48, 53],
  },
  {
    stage: 2,
    situation: `ה-Angular שולח ?tenant=12 ב-URL, וה-BFF משתמש בערך הזה כדי לבחור את ה-DB של העירייה.`,
    question: `איזה מנגנון צריך להחליף את זה?`,
    options: [`Multi-Tenancy`, `Tenant Context`, `Web Session`, `Feature Flags`],
    answer: 1,
    why: `TenantId מזוהה בשרת בלבד ואסור לקבל אותו כאמת מהדפדפן. Middleware ב-ASP.NET Core גוזר את ה-TenantId מה-Session ומזריק ITenantContext דרך DI.`,
    concepts: [49, 45],
  },
  {
    stage: 2,
    situation: `עיריית פיילוט אחת צריכה לקבל את מסך התשלומים החדש לפני כל השאר, בלי deploy נפרד, ושאר העיריות ממשיכות במסך ה-Access.`,
    question: `במה משתמשים?`,
    options: [`Pilot`, `Rollback`, `Strangler Fig Pattern`, `Feature Flags`],
    answer: 3,
    why: `Feature Flags לכל לקוח: טבלה ב-Control Plane (או AWS AppConfig), ובקוד if (flags.IsEnabled(x, tenantId)). כיבוי הדגל הוא גם דרך ה-Rollback.`,
    concepts: [43, 42],
  },

  // ───────── שלב 3 · מסכים ללא Agent ─────────
  {
    stage: 3,
    situation: `חישוב סכום השובר כבר קיים כ-SP בתוך ה-DB של כל עירייה. המסך החדש צריך אותו עכשיו, ואין זמן לכתוב אותו מחדש ב-C#.`,
    question: `איך ניגשים לזה בשלב הזה?`,
    options: [`Stored Procedures`, `Business Logic Migration`, `CRUD`, `Data Access Layer`],
    answer: 0,
    why: `בשלב 3 משתמשים ב-Stored Procedures הקיימות כמו שהן: קריאה דרך RepoDB עם ExecuteQueryAsync ו-CommandType.StoredProcedure. ההעברה ל-C# מגיעה בשלב 8.`,
    concepts: [60, 104],
  },
  {
    stage: 3,
    situation: `בטופס עדכון משלם פקיד הזין תעודת זהות לא תקינה וסכום הנחה שלילי, והרשומה נשמרה ב-DB.`,
    question: `מה חסר?`,
    options: [`CRUD`, `Validation`, `Rate Limiting`, `CSRF`],
    answer: 1,
    why: `Validation בשני הצדדים: FluentValidation ב-.NET בשרת, וולידציה מקבילה ב-Angular Reactive Forms בטופס.`,
    concepts: [63],
  },
  {
    stage: 3,
    situation: `קוד הנהלת חשבונות וקוד גבייה יושבים באותו שירות. מפתח מגבייה קורא ישירות למחלקה פנימית של הנהלת חשבונות כדי לרשום פקודת יומן.`,
    question: `איזה מבנה אמור למנוע את זה?`,
    options: [`Deployable Split`, `Domain Services`, `Distributed Monolith`, `Domain Modules`],
    answer: 3,
    why: `Domain Modules: תיקייה/פרויקט לכל תחום עם interface ציבורי אחד, וגבייה קוראת רק לו. פיצול ל-deployable נפרד רק בהמשך.`,
    concepts: [61, 34],
  },

  // ───────── שלב 4 · תשתיות Agent ─────────
  {
    stage: 4,
    situation: `ה-IT רוצה להתקין את ה-Local Agent בתמונת הבסיס של עמדות ה-VDI יחד עם טוקן קבוע, "כדי שיעבוד מיד בכל Login".`,
    question: `איזה מושג מגדיר מה מותר ומה אסור להכניס לתמונה?`,
    options: [`Golden Image`, `Non-persistent VDI`, `Agent Session`, `PKCE`],
    answer: 0,
    why: `ב-Golden Image ה-Agent מותקן אבל בלי סודות; ההזדהות מתבצעת בזמן ריצה. בעמדות Non-persistent כל Login יוצר זהות חדשה.`,
    concepts: [78, 77],
  },
  {
    stage: 4,
    situation: `יש שני מופעים של Agent Gateway מאחורי ה-ALB. ה-BFF שולח פקודת חתימה למופע A, אבל ה-Agent של הפקיד מחובר למופע B — והפקודה לא מגיעה.`,
    question: `מה פותר את זה?`,
    options: [`Heartbeat`, `Agent Gateway`, `Redis Backplane`, `Reconnect`],
    answer: 2,
    why: `Redis Backplane משתף הודעות בין מופעי ה-Gateway: AddSignalR().AddStackExchangeRedis(). לפי המצגת — נדרש PoC.`,
    concepts: [75, 76],
  },
  {
    stage: 4,
    situation: `פקידת רווחה לוחצת Logout בדפדפן, אבל ה-Agent בעמדה עדיין מחזיק טוקן בתוקף ויכול לקבל פקודות עד שהוא יפוג.`,
    question: `מה חסר בצד השרת?`,
    options: [`Heartbeat`, `Agent Session`, `Pairing`, `Revoke`],
    answer: 3,
    why: `Revoke: ביטול מיידי מצד השרת — רשימת ביטול ב-Redis שנבדקת בכל פקודה, ולא מסתמכים על תפוגת ה-JWT בלבד.`,
    concepts: [74, 71],
  },

  // ───────── שלב 5 · תהליכים מקומיים ─────────
  {
    stage: 5,
    situation: `הסורק בעמדה מפיק PDF של 20MB לתיק רווחה, ומפתח מציע לשלוח אותו כ-Base64 בהודעת SignalR לשרת.`,
    question: `באיזה ערוץ הקובץ צריך לעבור?`,
    options: [`Command Channel`, `Pre-signed URL`, `File Channel`, `Idempotency`],
    answer: 2,
    why: `ב-Command Channel עוברות רק הודעות JSON קטנות. הקובץ עולה ב-File Channel: HTTPS ל-S3 עם Pre-signed URL ל-5 דקות (GetPreSignedURL ב-AWS SDK).`,
    concepts: [82, 83, 81],
  },
  {
    stage: 5,
    situation: `ה-Agent אישר שקיבל את פקודת החתימה על הקבלה, והמסך הציג "נחתם". בפועל ה-PdfSigner נכשל כי הכרטיס לא היה בקורא.`,
    question: `איזו הבחנה פוספסה?`,
    options: [`Delivery vs Execution`, `State Machine`, `Heartbeat`, `Retry / Timeout`],
    answer: 0,
    why: `אישור מסירה אינו אישור ביצוע. שומרים שני שדות נפרדים — delivered_at ו-completed_at — ומציגים "נחתם" רק אחרי completed.`,
    concepts: [86, 85],
  },
  {
    stage: 5,
    situation: `ה-Agent חתם והעלה את הקבלה, ואז הרשת נפלה לפני שהשרת קיבל אישור. הפקודה נשלחה שוב — והקבלה נרשמה פעמיים.`,
    question: `איזו תכונה הייתה מונעת את הכפילות?`,
    options: [`Retry / Timeout`, `Idempotency`, `Outbox Pattern`, `State Machine`],
    answer: 1,
    why: `Idempotency: CommandId ייחודי לכל פקודה + unique index ב-DB על הקליטה, כך שביצוע חוזר לא יוצר רשומה שנייה.`,
    concepts: [84],
  },

  // ───────── שלב 6 · מעבר Tenants ─────────
  {
    stage: 6,
    situation: `צריך לבחור את העירייה הראשונה שתעבור לגבייה החדשה. ההצעה: מועצה קטנה, להדליק לה את הדגלים ולמדוד שבועיים.`,
    question: `איך נקרא השלב הזה?`,
    options: [`Parallel Run`, `Rollback`, `Pilot`, `Strangler Fig Pattern`],
    answer: 2,
    why: `Pilot: בוחרים Tenant קטן, מפעילים לו feature flags, ומודדים שבועיים לפני הרחבה.`,
    concepts: [87, 43],
  },
  {
    stage: 6,
    situation: `בעיריית הפיילוט פקידים קולטים תשלומים במסך ה-Web, ובמקביל Access עדיין מריץ את תהליך השוברים הלילי על אותו DB.`,
    question: `מה נדרש כדי שתקופה כזו תעבוד בבטחה?`,
    options: [`Reconciliation`, `Parallel Run`, `Schema Compatibility`, `Pilot`],
    answer: 1,
    why: `Parallel Run: הישן והחדש עובדים על אותם נתונים — עם Reconciliation יומי ובעלות ברורה על כל תהליך (מי כותב מה).`,
    concepts: [88, 58],
  },
  {
    stage: 6,
    situation: `מנהל מוצר מבקש להדליק את מסך התשלומים החדש לכל 40 העיריות ביום ראשון הבא, בבת אחת.`,
    question: `איזה שלב מדלגים עליו?`,
    options: [`Feature Flags`, `Multi-Tenancy`, `Parallel Run`, `Pilot`],
    answer: 3,
    why: `קודם Pilot על Tenant קטן אחד עם feature flags ומדידה של שבועיים, ורק אחר כך הרחבה לשאר העיריות.`,
    concepts: [87],
  },

  // ───────── שלב 7 · ממשקי Legacy ואסינכרוניות ─────────
  {
    stage: 7,
    situation: `Job של הפקת שוברים קורס באמצע. הודעה אחת ב-SQS (שובר עם נתון פגום) נכשלת שוב ושוב וחוזרת לתור בלי סוף.`,
    question: `לאן ההודעה צריכה להגיע, ואיך יודעים על זה?`,
    options: [`DLQ (Dead Letter Queue)`, `SQS`, `Workers / Schedulers`, `Fan-out`],
    answer: 0,
    why: `DLQ: מגדירים redrive policy ב-SQS עם MaxReceiveCount, וההודעה עוברת לתור צדדי; התראת CloudWatch על עומק ה-DLQ.`,
    concepts: [93, 90],
  },
  {
    stage: 7,
    situation: `תשלום נשמר ב-DB, אבל השירות קרס רגע לפני ששלח ל-SQS את ההודעה לשליחת קבלה במייל — והמשלם לא קיבל קבלה.`,
    question: `איזה דפוס מונע את זה?`,
    options: [`Domain Events`, `Outbox Pattern`, `DLQ (Dead Letter Queue)`, `SMTP`],
    answer: 1,
    why: `Outbox Pattern: שומרים את ההודעה בטבלת outbox באותה טרנזקציה עם התשלום, ו-worker קורא ממנה ושולח ל-SQS.`,
    concepts: [92, 90],
  },
  {
    stage: 7,
    situation: `הפקת שוברים חודשית ל-30,000 משלמים לוקחת 15 דקות, ובקשת ה-HTTP מהמסך נופלת על timeout.`,
    question: `איך בונים את זה נכון?`,
    options: [`Workers / Schedulers`, `Message Broker`, `Async by Design`, `Document Service`],
    answer: 2,
    why: `Async by Design: ה-API מחזיר 202 Accepted + operationId, העבודה רצה ברקע, וה-UI עושה polling או מקבל עדכון ב-SignalR.`,
    concepts: [100, 97],
  },

  // ───────── שלב 8 · לוגיקת DB ─────────
  {
    stage: 8,
    situation: `חישוב ריבית והצמדה על חובות בגבייה הוא SP של 800 שורות, שאף אחד לא יכול לבדוק או לשנות בביטחון. רוצים להעביר אותו ל-C#.`,
    question: `מה התהליך הנכון?`,
    options: [`Stored Procedures`, `Business Logic Migration`, `Modular Monolith`, `Domain Services`],
    answer: 1,
    why: `Business Logic Migration פונקציה-פונקציה: עוטפים את ה-SP בשירות, כותבים בדיקות, ורק אז מחליפים את הפנים בקוד C#.`,
    concepts: [104, 60],
  },
  {
    stage: 8,
    situation: `ארכיטקט מציע לפצל כבר עכשיו את הנהלת חשבונות, רווחה וגבייה ל-12 microservices נפרדים.`,
    question: `מהי נקודת הפתיחה המומלצת?`,
    options: [`Deployable Split`, `Distributed Monolith`, `Modular Monolith`, `Domain Modules`],
    answer: 2,
    why: `Modular Monolith: Solution עם פרויקט לכל מודול + בדיקת ארכיטקטורה אוטומטית שמונעת הפניות אסורות. פיצול מוקדם מסתכן ב-Distributed Monolith.`,
    concepts: [105, 101],
  },
  {
    stage: 8,
    situation: `מודול הפקת המסמכים צורך CPU כבד בסוף כל חודש ומאט את מסכי המשלמים שרצים באותו שירות.`,
    question: `מה מצדיק כאן הוצאה של המודול לשירות עצמאי?`,
    options: [`Modular Monolith`, `Distributed Monolith`, `Business Logic Migration`, `Deployable Split`],
    answer: 3,
    why: `Deployable Split רק כשיש סיבה אמיתית — וכאן הקריטריון הוא scaling שונה. המודול יוצא לשירות נפרד לפריסה.`,
    concepts: [106, 102],
  },

  // ───────── שלב 9 · בחינת RDS ─────────
  {
    stage: 9,
    situation: `ההנהלה שואלת אם מעבר מ-SQL Server על VMs ל-RDS זול יותר, ומישהו השווה רק את מחיר ה-instance.`,
    question: `מה צריך להשוות בפועל?`,
    options: [`TCO (Total Cost of Ownership)`, `HA (High Availability)`, `Latency`, `Compatibility Assessment`],
    answer: 0,
    why: `TCO: רישוי, תשתית, תחזוקה וכוח אדם. משווים ב-AWS Pricing Calculator מול עלות רישוי SQL Server ותחזוקת ה-VMs.`,
    concepts: [107],
  },
  {
    stage: 9,
    situation: `ה-SPs של הגבייה כתובים ב-T-SQL. לפני החלטה על PostgreSQL צריך לדעת אם הם ירוצו שם.`,
    question: `איזו בדיקה עושים?`,
    options: [`Latency`, `Compatibility Assessment`, `Schema Compatibility`, `TCO (Total Cost of Ownership)`],
    answer: 1,
    why: `Compatibility Assessment עם AWS Schema Conversion Tool (SCT), ו-Babelfish כאפשרות תאימות ל-T-SQL.`,
    concepts: [110],
  },
  {
    stage: 9,
    situation: `עירייה גדולה דורשת שהגבייה תמשיך לעבוד גם אם Availability Zone שלם של AWS נופל.`,
    question: `באיזו דרישה מדובר ואיך עונים עליה?`,
    options: [`Latency`, `Rollback`, `HA (High Availability)`, `TCO (Total Cost of Ownership)`],
    answer: 2,
    why: `HA: RDS Multi-AZ ו-ECS על כמה Availability Zones, עם בדיקת RTO/RPO.`,
    concepts: [108],
  },
];
