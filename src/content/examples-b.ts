// Visual examples for concepts 56..110 (stages 2–9). Code is illustrative, data is fake.
import type { Example } from "./example-types";

export const examplesB: Record<number, Example> = {
  56: {
    kind: "flow",
    caption: "עדכון הסכימה רץ כתהליך נפרד לכל ה-Tenants — לא בזמן שהשירות עולה.",
    steps: [
      { label: "גרסה חדשה", sub: "image חדש מוכן לפריסה" },
      { label: "Orchestrator", sub: "ECS Task / Step Function" },
      { label: "DbUp לכל Tenant", sub: "סקריפטים לפי סדר" },
      { label: "פריסת השירות", sub: "בלי migration באתחול" },
    ],
  },
  57: {
    kind: "code",
    lang: "sql",
    caption: "שינוי additive שה-Access הישן לא מרגיש, מול שינויים שאסורים בזמן עבודה מקבילה.",
    code: `-- OK: additive, Access keeps working
ALTER TABLE Payers
  ADD Email NVARCHAR(200) NULL;

-- NOT while Access still reads Payers:
-- EXEC sp_rename 'Payers.Tel', 'Phone';
-- ALTER TABLE Payers DROP COLUMN Fax;`,
  },
  58: {
    kind: "code",
    lang: "sql",
    caption: "Job לילי שמחשב COUNT ו-checksum על הקבלות בשני הצדדים ומדווח אם יש פער.",
    code: `-- nightly job, run on old and new side
SELECT COUNT(*) AS RowsCount,
       CHECKSUM_AGG(CHECKSUM(
         ReceiptNo, Amount)) AS Hash
FROM   Receipts
WHERE  ReceiptDate = @Yesterday;
-- different result => report a gap`,
  },
  59: {
    kind: "flow",
    caption: "חזרה מבוקרת אחרי תקלה: flag, גרסת קונטיינר קודמת, ושחזור נתונים אם צריך.",
    steps: [
      { label: "תקלה בקבלות", sub: "שגיאות אחרי גרסה חדשה" },
      { label: "כיבוי flag", sub: "המסך חוזר ל-Access" },
      { label: "גרסה קודמת", sub: "task definition קודם ב-ECS" },
      { label: "שחזור נתונים", sub: "point-in-time restore" },
    ],
  },
  60: {
    kind: "code",
    lang: "csharp",
    caption: "קריאה ל-Stored Procedure קיים כמו שהוא, דרך RepoDB.",
    code: `var debts = await conn
  .ExecuteQueryAsync<PayerDebt>(
    "dbo.sp_GetPayerDebts",
    new { PayerId = 100234 },
    commandType:
      CommandType.StoredProcedure);`,
  },
  61: {
    kind: "compare",
    caption: "מקוד VBA משותף לכל התחומים — לתיקייה לכל תחום עם interface ציבורי אחד.",
    before: {
      title: "היום · Access",
      lines: [
        "מודולי VBA משותפים לכל התחומים",
        "טופס גבייה קורא ישר לקוד רווחה",
      ],
    },
    after: {
      title: "ב־WEB",
      lines: [
        "פרויקט לכל תחום: Collection, Welfare",
        "כל תחום חושף interface ציבורי אחד",
        "עדיין שירות אחד — פיצול רק בהמשך",
      ],
    },
  },
  62: {
    kind: "code",
    lang: "csharp",
    caption: "ארבע פעולות CRUD על חייב כ-Endpoints סינכרוניים קצרים, בלי Broker.",
    code: `app.MapGet("/payers/{id}", GetPayer);
app.MapPost("/payers", CreatePayer);
app.MapPut("/payers/{id}", UpdatePayer);
app.MapDelete("/payers/{id}", DeletePayer);
// short & synchronous - no Broker`,
  },
  63: {
    kind: "code",
    lang: "csharp",
    caption: "בדיקת תקינות של קבלה בצד השרת עם FluentValidation, לפני השמירה.",
    code: `public class ReceiptValidator
  : AbstractValidator<ReceiptDto>
{
  public ReceiptValidator()
  {
    RuleFor(r => r.Amount).GreaterThan(0);
    RuleFor(r => r.PayerId).NotEmpty();
  }
}`,
  },
  64: {
    kind: "compare",
    caption: "מה שהיום רץ בעמדה דרך ה-Session — עובר ל-Agent קטן שמתחבר החוצה לענן.",
    before: {
      title: "היום · Access",
      lines: [
        "VBA ניגש לקורא הכרטיס בעמדה",
        "קבצים מקומיים דרך tsclient",
        "הכול בתוך Session על השרת",
      ],
    },
    after: {
      title: "ב־WEB",
      lines: [
        "Agent ב-.NET 10 רץ ב-User Session",
        "מתחבר החוצה ב-WSS לענן",
        "חתימה, סורק וקבצים מקומיים",
        "בלי Windows Service בשלב הראשון",
      ],
    },
  },
  65: {
    kind: "flow",
    caption: "בקשת חתימה על קבלה עוברת דרך ה-Gateway, שמנתב אותה ל-Agent הנכון.",
    steps: [
      { label: "דפדפן", sub: "בקשת חתימה לקבלה" },
      { label: "BFF / API", sub: "שולח פקודה ל-Gateway" },
      { label: "Agent Gateway", sub: "SignalR Hub" },
      { label: "ניתוב", sub: "לפי AgentSessionId" },
      { label: "Local Agent", sub: "מבצע ומחזיר סטטוס" },
    ],
  },
  66: {
    kind: "code",
    lang: "csharp",
    caption: "הרשמת Hub בשרת וחיבור אליו מה-Agent עם חבילת ה-Client של SignalR.",
    code: `// server (Gateway)
builder.Services.AddSignalR();
app.MapHub<AgentHub>("/hubs/agent");

// agent: dotnet add package
//   Microsoft.AspNetCore.SignalR.Client
var hub = new HubConnectionBuilder()
  .WithUrl(gatewayUrl).Build();
await hub.StartAsync();`,
  },
  67: {
    kind: "flow",
    caption: "ערוץ השליטה המוצפן: מה-Agent דרך ה-ALB ועד ה-Gateway.",
    steps: [
      { label: "Local Agent", sub: "wss://agent.example.test" },
      { label: "ALB", sub: "listener HTTPS 443" },
      { label: "Target Group", sub: "WebSocket support מופעל" },
      { label: "Agent Gateway", sub: "ECS · SignalR Hub" },
    ],
  },
  68: {
    kind: "flow",
    caption: "שיוך ה-Agent ל-Web Session: רק PairingId עובר בדפדפן, הטוקן מתקבל מהשרת.",
    steps: [
      { label: "Web Session", sub: "הדפדפן מקבל PairingId" },
      { label: "Custom URL", sub: "moaza://pair?id=7f3a" },
      { label: "Local Agent", sub: "שולח PairingId לשרת" },
      { label: "Gateway", sub: "מחליף אותו בטוקן Agent" },
    ],
  },
  69: {
    kind: "code",
    lang: "ini",
    caption: "רישום הפרוטוקול moaza:// ב-Registry תחת HKCR, כך שהדפדפן יוכל להפעיל את ה-Agent.",
    code: `[HKEY_CLASSES_ROOT\\moaza]
@="URL:Moaza Agent"
"URL Protocol"=""

[HKEY_CLASSES_ROOT\\moaza\\shell\\open\\command]
@="C:\\\\EPR\\\\Agent.exe \\"%1\\""

; moaza://pair?id=7f3a9c -> PairingId only
; never an access token in the URL`,
  },
  70: {
    kind: "code",
    lang: "csharp",
    caption: "יצירת code_verifier אקראי ו-code_challenge שהוא ה-SHA256 שלו.",
    code: `var verifier = CryptoRandom
  .CreateUniqueId(32);
var challenge = Base64Url.Encode(
  SHA256.HashData(
    Encoding.ASCII.GetBytes(verifier)));
// send code_challenge (method=S256);
// later code_verifier proves it is us
// IdentityModel.OidcClient does this`,
  },
  71: {
    kind: "code",
    lang: "jsonc",
    caption: "Agent Session: JWT קצר-חיים שקשור למשתמש, ל-Tenant ול-Web Session, ושמור ב-Redis.",
    code: `// JWT payload, TTL 10 minutes
{
  "sub": "user-0042",
  "tenant": "city-demo",
  "agentSessionId": "as-7f3a9c",
  "webSession": "ws-11b2",
  "exp": 1767225600
}
// Redis: agent-session:as-7f3a9c EX 600`,
  },
  72: {
    kind: "code",
    lang: "csharp",
    caption: "הגדרת פעימות SignalR: כמה זמן בלי סימן חיים עד שה-Agent נחשב מנותק.",
    code: `builder.Services.AddSignalR(o =>
{
  o.KeepAliveInterval =
    TimeSpan.FromSeconds(15);
  o.ClientTimeoutInterval =
    TimeSpan.FromSeconds(30);
});
// no sign of life in 30s => offline`,
  },
  73: {
    kind: "flow",
    caption: "אחרי ניתוק ה-Agent מתחבר לבד וממשיך את הפקודה מהמצב האחרון.",
    steps: [
      { label: "ניתוק רשת", sub: "ה-Agent מאבד את ה-WSS" },
      { label: "ניסיון חוזר", sub: "WithAutomaticReconnect" },
      { label: "מחובר שוב", sub: "אירוע Reconnected" },
      { label: "שחזור פקודה", sub: "המשך מהסטטוס האחרון" },
    ],
  },
  74: {
    kind: "compare",
    caption: "Logout שסומך רק על תפוגה, מול רשימת ביטול ב-Redis שנבדקת בכל פקודה.",
    before: {
      title: "רק תפוגה",
      lines: [
        "המשתמש עושה Logout",
        "הטוקן תקף עוד 10 דקות",
        "ה-Agent ממשיך לקבל פקודות",
      ],
    },
    after: {
      title: "עם Revoke",
      lines: [
        "Logout כותב ל-Redis: revoked:as-7f3a",
        "כל פקודה בודקת את הרשימה",
        "החסימה מיידית",
      ],
    },
  },
  75: {
    kind: "flow",
    caption: "פקודה שהגיעה למופע Gateway אחד מגיעה ל-Agent שמחובר למופע אחר דרך Redis.",
    steps: [
      { label: "BFF", sub: "פקודה נוחתת ב-Gateway A" },
      { label: "Gateway A", sub: "ה-Agent לא מחובר אליו" },
      { label: "Redis Backplane", sub: "מפיץ לכל המופעים" },
      { label: "Gateway B", sub: "מחזיק את חיבור ה-Agent" },
      { label: "Local Agent", sub: "מקבל את הפקודה" },
    ],
  },
  76: {
    kind: "code",
    lang: "bash",
    caption: "מפתחות ב-ElastiCache במבנה tenant:{id}, כך שכל רשות מופרדת ונמחקת בקלות.",
    code: `# cluster created with Terraform
# key convention: tenant:{id}:...
SET tenant:city-a:cfg:receipt-fmt "v2"
SET tenant:city-a:agent:as-7f3a "u-42" \\
    EX 600
SCAN 0 MATCH tenant:city-a:*`,
  },
  77: {
    kind: "compare",
    caption: "בעמדה שנמחקת בכל Logout אין איפה לשמור סודות — כל Login יוצר זהות חדשה.",
    before: {
      title: "שגוי",
      lines: [
        "טוקן שמור בתמונת הבסיס",
        "אותו סוד אצל כל העמדות",
      ],
    },
    after: {
      title: "נכון",
      lines: [
        "העמדה עולה נקייה מהתמונה",
        "כל Login יוצר זהות חדשה ל-Agent",
        "Logout מוחק הכול — וזה בסדר",
      ],
    },
  },
  78: {
    kind: "flow",
    caption: "ה-Agent מותקן בתמונת הבסיס בלי סודות, וההזדהות קורית רק בזמן ריצה.",
    steps: [
      { label: "Golden Image", sub: "Agent מותקן · בלי סודות" },
      { label: "עמדה חדשה", sub: "נוצרת מהתמונה" },
      { label: "Login", sub: "Agent עולה ב-User Session" },
      { label: "הזדהות בריצה", sub: "Pairing ← Agent Session" },
    ],
  },
  79: {
    kind: "code",
    lang: "csharp",
    caption: "Polly: ניסיונות חוזרים עם exponential backoff ו-jitter, ומגבלת זמן לפקודת Agent.",
    code: `var pipeline = new ResiliencePipelineBuilder()
  .AddRetry(new() {
    MaxRetryAttempts = 3,
    BackoffType =
      DelayBackoffType.Exponential,
    UseJitter = true })
  .AddTimeout(TimeSpan.FromSeconds(20))
  .Build();`,
  },
  80: {
    kind: "flow",
    caption: "PoC קטן ותחום בזמן, עם קריטריון הצלחה שנקבע מראש.",
    steps: [
      { label: "שאלה", sub: "האם Redis Backplane עובד?" },
      { label: "קריטריון הצלחה", sub: "פקודה עוברת בין 2 מופעים" },
      { label: "תחימה בזמן", sub: "שבועיים · צוות קטן" },
      { label: "החלטה", sub: "אימוץ או חלופה" },
    ],
  },
  81: {
    kind: "code",
    lang: "json",
    caption: "פקודה בערוץ השליטה: JSON קטן עם מזהים בלבד; הקובץ עצמו עובר ב-HTTPS.",
    code: `{
  "type": "SignReceipt",
  "commandId": "c-9f21e7",
  "tenant": "city-demo",
  "receiptNo": 500123,
  "fileUrl": "https://s3.../in?X-Amz-..."
}`,
  },
  82: {
    kind: "flow",
    caption: "סריקת מסמך רווחה: הקובץ עולה ישר ל-S3 ב-HTTPS, וב-SignalR חוזר רק מזהה.",
    steps: [
      { label: "Gateway", sub: "פקודה + Pre-signed URL" },
      { label: "Local Agent", sub: "סורק מסמך רווחה" },
      { label: "PUT ב-HTTPS", sub: "ישר ל-S3 · תוקף 5 דקות" },
      { label: "אישור ב-SignalR", sub: "רק מזהה הקובץ חוזר" },
    ],
  },
  83: {
    kind: "code",
    lang: "csharp",
    caption: "יצירת כתובת זמנית להעלאת PDF של קבלה ל-S3, בלי לחשוף מפתחות גישה.",
    code: `var url = s3.GetPreSignedURL(
  new GetPreSignedUrlRequest
  {
    BucketName = "epr-docs-city-demo",
    Key = "receipts/500123.pdf",
    Verb = HttpVerb.PUT,
    Expires = DateTime.UtcNow.AddMinutes(5)
  });`,
  },
  84: {
    kind: "code",
    lang: "sql",
    caption: "unique index על CommandId: אותה פקודה שהגיעה פעמיים לא יוצרת קבלה כפולה.",
    code: `CREATE UNIQUE INDEX UX_Receipts_CommandId
  ON Receipts(CommandId);

-- the same command arrives twice:
INSERT INTO Receipts(CommandId, Amount)
VALUES ('c-9f21e7', 250.00);
-- 2nd time: duplicate key -> ignored`,
  },
  85: {
    kind: "flow",
    caption: "מצבי החיים של פקודה; הקוד מאפשר רק מעברים מוגדרים ביניהם.",
    steps: [
      { label: "Created", sub: "נשמר בטבלת commands" },
      { label: "Delivered", sub: "הגיע ל-Agent" },
      { label: "Running", sub: "בביצוע בעמדה" },
      { label: "Completed", sub: "או Failed / Expired" },
    ],
  },
  86: {
    kind: "compare",
    caption: "שדה סטטוס אחד מטעה את המשתמש; שני שדות מפרידים בין 'הגיע' ל'הצליח'.",
    before: {
      title: "סטטוס אחד",
      lines: [
        "status = 'נשלח'",
        "המסך מציג: הקבלה נחתמה",
        "בפועל החתימה נכשלה בעמדה",
      ],
    },
    after: {
      title: "מסירה ≠ ביצוע",
      lines: [
        "delivered_at — הפקודה הגיעה ל-Agent",
        "completed_at — החתימה באמת הצליחה",
        "עד אז המסך מציג: בביצוע",
      ],
    },
  },
  87: {
    kind: "flow",
    caption: "פיילוט: רשות קטנה אחת, feature flags, שבועיים של מדידה — ורק אז הרחבה.",
    steps: [
      { label: "בחירת Tenant", sub: "רשות קטנה אחת" },
      { label: "Feature flags", sub: "מסכי WEB רק אצלה" },
      { label: "מדידה", sub: "שבועיים · תקלות וזמנים" },
      { label: "הרחבה", sub: "Tenants נוספים בהדרגה" },
    ],
  },
  88: {
    kind: "compare",
    caption: "בהרצה מקבילה לכל תהליך יש בעלים אחד, ו-Reconciliation יומי משווה בין הצדדים.",
    before: {
      title: "היום · Access",
      lines: [
        "Access כותב קבלות ושוברים",
        "כל התהליכים במקום אחד",
      ],
    },
    after: {
      title: "בתקופת המעבר",
      lines: [
        "WEB כותב קבלות · Access רק קורא",
        "Access ממשיך את הייצוא לבנק",
        "Reconciliation יומי בין הצדדים",
      ],
    },
  },
  89: {
    kind: "compare",
    caption: "במקום קריאה ישירה בין רכיבים — הודעות דרך Broker, בלי שהצדדים מכירים זה את זה.",
    before: {
      title: "היום · Access",
      lines: [
        "הטופס קורא ישר לשליחת המייל",
        "השליחה נופלת — הטופס נתקע",
      ],
    },
    after: {
      title: "ב־WEB",
      lines: [
        "פקודות ← SQS",
        "אירועים ← SNS / EventBridge",
        "השולח לא מכיר את הצרכן",
      ],
    },
  },
  90: {
    kind: "code",
    lang: "csharp",
    caption: "שליחת job של מייל קבלה לתור SQS, עם Visibility Timeout ו-MaxReceiveCount.",
    code: `await sqs.SendMessageAsync(
  new SendMessageRequest
  {
    QueueUrl = emailQueueUrl,
    MessageBody = JsonSerializer.Serialize(
      new { ReceiptNo = 500123 })
  });
// queue: VisibilityTimeout = 60,
//   redrive MaxReceiveCount = 5`,
  },
  91: {
    kind: "code",
    lang: "json",
    caption: "חוק EventBridge לפי detail-type: כל תחום מקבל רק את האירועים שמעניינים אותו.",
    code: `{
  "source": ["epr.collection"],
  "detail-type": ["ReceiptIssued"]
}
// target 1: welfare consumer
// target 2: reports consumer`,
  },
  92: {
    kind: "code",
    lang: "sql",
    caption: "הקבלה וההודעה נשמרות באותה טרנזקציה; worker שולח מה-outbox ל-SQS.",
    code: `BEGIN TRAN;
INSERT INTO Receipts(ReceiptNo, Amount)
  VALUES (500123, 250.00);
INSERT INTO Outbox(Type, Payload)
  VALUES ('ReceiptIssued',
          '{"receiptNo":500123}');
COMMIT;
-- worker: read unsent Outbox rows,
--   send to SQS, set SentAt`,
  },
  93: {
    kind: "flow",
    caption: "הודעה שנכשלת שוב ושוב עוברת ל-DLQ, ו-CloudWatch מתריע על עומק התור.",
    steps: [
      { label: "SQS email-queue", sub: "הודעה נכשלת שוב ושוב" },
      { label: "Redrive policy", sub: "MaxReceiveCount = 5" },
      { label: "DLQ", sub: "email-queue-dlq" },
      { label: "CloudWatch Alarm", sub: "עומק DLQ > 0 ← התראה" },
    ],
  },
  94: {
    kind: "code",
    lang: "csharp",
    caption: "אירוע עסקי 'מסמך נחתם' כ-record, שמתפרסם דרך ה-Outbox ל-EventBridge.",
    code: `public record DocumentSigned(
  Guid DocumentId,
  string TenantId,
  DateTime SignedAt);

// same transaction as the update:
outbox.Add(new DocumentSigned(
  docId, tenantId, DateTime.UtcNow));
// worker publishes to EventBridge`,
  },
  95: {
    kind: "compare",
    caption: "אירוע אחד ב-SNS Topic מגיע לכמה צרכנים, כל אחד דרך SQS משלו.",
    before: {
      title: "בלי Fan-out",
      lines: [
        "גבייה קוראת לשירות הדוחות",
        "ואז לשירות המייל — אחד אחרי השני",
      ],
    },
    after: {
      title: "SNS Topic",
      lines: [
        "גבייה מפרסמת ReceiptIssued פעם אחת",
        "דוחות ומייל — כל אחד עם SQS משלו",
        "צרכן חדש? עוד subscription",
      ],
    },
  },
  96: {
    kind: "flow",
    caption: "שינוי הגדרה ברשות מוחק את המפתחות שלה ב-Redis, והקריאה הבאה טוענת מחדש.",
    steps: [
      { label: "שינוי הגדרות", sub: "מנהל משנה פורמט קבלה" },
      { label: "אירוע שינוי", sub: "ConfigurationChanged" },
      { label: "Handler", sub: "מוחק tenant:{id}:* ב-Redis" },
      { label: "קריאה הבאה", sub: "נטענת מחדש מה-DB" },
    ],
  },
  97: {
    kind: "code",
    lang: "csharp",
    caption: "תהליך רקע לחישוב ריבית לילי כ-BackgroundService שרץ כ-ECS Service נפרד.",
    code: `public class NightlyInterestWorker
  : BackgroundService
{
  protected override async Task
    ExecuteAsync(CancellationToken ct)
  {
    // own ECS Service; schedule via
    // EventBridge Scheduler
  }
}`,
  },
  98: {
    kind: "compare",
    caption: "העברת קבצים לגורם חיצוני: מתיקייה על שרת ה-Access לשירות SFTP מנוהל.",
    before: {
      title: "היום · Access",
      lines: [
        "VBA שומר קובץ בתיקייה על השרת",
        "משם הוא נשלח לבנק",
      ],
    },
    after: {
      title: "ב־WEB",
      lines: [
        "AWS Transfer Family מול הבנק",
        "או SSH.NET בשירות Integration",
      ],
    },
  },
  99: {
    kind: "flow",
    caption: "שליחת קבלה במייל לחייב בצורה אסינכרונית: תור SQS ואז Amazon SES.",
    steps: [
      { label: "הנפקת קבלה", sub: "ה-API מחזיר מיד" },
      { label: "SQS email-queue", sub: "הודעה לשליחה" },
      { label: "Email Worker", sub: "קורא מהתור" },
      { label: "Amazon SES", sub: "SMTP / API ← לחייב" },
    ],
  },
  100: {
    kind: "code",
    lang: "csharp",
    caption: "דוח חובות ארוך: ה-API מחזיר מיד 202 עם operationId, וה-UI עוקב אחרי הסטטוס.",
    code: `app.MapPost("/reports/debts", (req, q) =>
{
  var opId = q.Enqueue(req);
  return Results.Accepted(
    $"/operations/{opId}", new { opId });
});
// UI: poll GET /operations/{opId}
//     or get a SignalR update`,
  },
  101: {
    kind: "compare",
    caption: "שירותים שתלויים זה בזה לחלוטין, מול מעט שירותים מודולריים שמפצלים רק מסיבה.",
    before: {
      title: "Distributed Monolith",
      lines: [
        "שירות קבלות קורא סינכרונית לחייבים",
        "שינוי אחד = פריסת שלושה שירותים",
        "כל החסרונות, אפס יתרונות",
      ],
    },
    after: {
      title: "מתחילים נכון",
      lines: [
        "מעט שירותים מודולריים",
        "פיצול רק בגלל scaling, security,",
        "ownership או release cadence",
      ],
    },
  },
  102: {
    kind: "flow",
    caption: "הפקת שובר PDF בשירות מסמכים נפרד: קלט מ-SQS ופלט ל-S3.",
    steps: [
      { label: "בקשת מסמך", sub: "הפקת שובר PDF" },
      { label: "SQS documents", sub: "הודעה עם פרטי השובר" },
      { label: "Document Service", sub: "ECS Service נפרד" },
      { label: "S3", sub: "PDF מוכן להורדה" },
    ],
  },
  103: {
    kind: "code",
    lang: "csharp",
    caption: "לקוח HTTP לממשק תשלומים חיצוני עם retry, circuit breaker ו-timeout של Polly.",
    code: `builder.Services
  .AddHttpClient<PaymentGatewayClient>()
  .AddResilienceHandler("pay", p => p
    .AddRetry(new HttpRetryStrategyOptions())
    .AddCircuitBreaker(
      new HttpCircuitBreakerStrategyOptions
      { FailureRatio = 0.5 })
    .AddTimeout(TimeSpan.FromSeconds(10)));`,
  },
  104: {
    kind: "flow",
    caption: "העברת לוגיקה מה-SP ל-C# פונקציה-פונקציה: עוטפים, בודקים, ואז מחליפים את הפנים.",
    steps: [
      { label: "SP קיים", sub: "sp_CalcInterest" },
      { label: "עטיפה בשירות", sub: "IInterestService → SP" },
      { label: "בדיקות", sub: "מקבעות את התוצאות היום" },
      { label: "החלפת הפנים", sub: "C# במקום SP · אותן בדיקות" },
    ],
  },
  105: {
    kind: "code",
    lang: "csharp",
    caption: "בדיקת ארכיטקטורה אוטומטית שמכשילה build אם גבייה פונה לפנים של רווחה.",
    code: `[Fact]
public void Collection_not_into_Welfare()
{
  Types().That()
    .ResideInNamespace("Epr.Collection")
    .Should().NotDependOnAny(Types().That()
      .ResideInNamespace(
        "Epr.Welfare.Internal"))
    .Check(Architecture);
}`,
  },
  106: {
    kind: "compare",
    caption: "מתי לא מפצלים מודול לשירות עצמאי, ומתי יש לזה סיבה אמיתית.",
    before: {
      title: "לא סיבה לפצל",
      lines: [
        "\"ככה עושים microservices\"",
        "הקוד נהיה גדול",
      ],
    },
    after: {
      title: "סיבה אמיתית",
      lines: [
        "scaling שונה — שוברים בסוף חודש",
        "דרישת אבטחה — תשלומים",
        "בעלות צוות או קצב release שונה",
      ],
    },
  },
  107: {
    kind: "compare",
    caption: "מחיר השרת הוא רק חלק; TCO כולל רישוי, תחזוקה וכוח אדם.",
    before: {
      title: "מחיר שרת בלבד",
      lines: [
        "עלות VM לחודש",
        "נראה זול — עד שמוסיפים רישוי",
      ],
    },
    after: {
      title: "TCO",
      lines: [
        "רישוי SQL Server",
        "תחזוקת VMs וגיבויים",
        "כוח אדם",
        "השוואה ב-AWS Pricing Calculator",
      ],
    },
  },
  108: {
    kind: "flow",
    caption: "כשל ב-Availability Zone אחד: RDS ו-ECS ממשיכים לעבוד מ-AZ אחר.",
    steps: [
      { label: "כשל ב-AZ a", sub: "שרת ה-DB הראשי נופל" },
      { label: "RDS Multi-AZ", sub: "failover ל-standby ב-AZ b" },
      { label: "ECS", sub: "Tasks ממשיכים ב-AZ אחר" },
      { label: "בדיקת RTO/RPO", sub: "כמה זמן? כמה נתונים?" },
    ],
  },
  109: {
    kind: "code",
    lang: "csharp",
    caption: "מדידת זמן שאילתת חובות עם OpenTelemetry, להשוואת SQL Server מול PostgreSQL.",
    code: `using var act = Source.StartActivity(
  "GetPayerDebts");
act?.SetTag("db.system", "postgresql");
act?.SetTag("tenant", tenantId);
var rows = await repo.GetDebtsAsync(id);
// same query on mssql vs postgresql,
// compare p95 in CloudWatch`,
  },
  110: {
    kind: "compare",
    caption: "T-SQL שלא ירוץ כמו שהוא ב-PostgreSQL; SCT מאתר את אלה, ו-Babelfish היא חלופה.",
    before: {
      title: "SQL Server · T-SQL",
      lines: [
        "SELECT TOP 10 * FROM Payers",
        "ISNULL(Balance, 0)",
        "GETDATE()",
      ],
    },
    after: {
      title: "PostgreSQL",
      lines: [
        "SELECT * FROM payers LIMIT 10",
        "COALESCE(balance, 0)",
        "now()",
      ],
    },
  },
};
