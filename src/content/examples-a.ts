// Visual examples for concepts 1..55 (stages 0–2). Keyed by concept number.
import type { Example } from "./example-types";

export const examplesA: Record<number, Example> = {
  1: {
    kind: "compare",
    caption: "איך הפקיד נכנס לעבודה היום דרך RDP, ומה מחליף את זה ב־WEB.",
    before: {
      title: "היום · RDP",
      lines: ["פותחים Remote Desktop", "Session על ה-Terminal Server", "Access רץ בתוך ה-Session"],
    },
    after: {
      title: "ב־WEB",
      lines: ["פותחים דפדפן ב-HTTPS", "אין Session על שרת Windows", "RDP רק למה שעוד לא הומר"],
    },
  },
  2: {
    kind: "code",
    lang: "powershell",
    caption: "מיפוי העומס על שרתי ה-RDS לפני ההחלפה ההדרגתית ב-ECS Fargate.",
    code: `# map load on the RDS hosts
Get-RDSessionHost -CollectionName "Gvia"
$c = "\\Terminal Services\\Active Sessions"
Get-Counter -Counter $c -SampleInterval 60
# compare with Performance Monitor CPU`,
  },
  3: {
    kind: "code",
    lang: "vba",
    caption: "סקריפט VBA שממפה את כל הטפסים והמודולים בקובץ ה-Access.",
    code: `' list every form and module in the app
Dim o As AccessObject
For Each o In CurrentProject.AllForms
  Debug.Print "Form: " & o.Name
Next
For Each o In CurrentProject.AllModules
  Debug.Print "Module: " & o.Name
Next`,
  },
  4: {
    kind: "flow",
    caption: "הדרך מקוד VBA בתוך Access למפה של מה שעובר ל-C#.",
    steps: [
      { label: "מודולי VBA", sub: "בתוך קובץ ה-Access" },
      { label: "SaveAsText", sub: "קובץ טקסט לכל מודול" },
      { label: "grep / Python", sub: "מיפוי פונקציות ותלויות" },
      { label: "C# ב-.NET", sub: "הלוגיקה העסקית בשרת" },
    ],
  },
  5: {
    kind: "code",
    lang: "sql",
    caption: "שאילתה שמורה מ-Access (חובות פתוחים) שהועברה ל-stored procedure.",
    code: `-- was: Access query qryOpenDebts
CREATE PROCEDURE dbo.usp_GetOpenDebts
  @PayerId INT
AS
SELECT VoucherId, Amount, DueDate
FROM dbo.Vouchers
WHERE PayerId = @PayerId AND Paid = 0;`,
  },
  6: {
    kind: "compare",
    caption: "ייצוא רשימת חייבים לדיסק של הפקיד: דרך tsclient היום, דרך Local Agent ביעד.",
    before: {
      title: "היום · tsclient",
      lines: ["VBA כותב ל-\\\\tsclient\\C\\Exports", "ה-Session ניגש לדיסק המקומי"],
    },
    after: {
      title: "ב־WEB",
      lines: ["Local Agent בעמדת הפקיד", "העלאה והורדה ב-HTTPS"],
    },
  },
  7: {
    kind: "code",
    lang: "csharp",
    caption: "ה-Local Agent מפעיל את PdfSigner בעמדה עם ארגומנטים קבועים ומבוקרים.",
    code: `// Local Agent: run PdfSigner, fixed args
var psi = new ProcessStartInfo
{
  FileName = @"C:\\EPR\\PdfSigner.exe",
  ArgumentList = { "--in", receiptPdf },
  UseShellExecute = false
};
using var p = Process.Start(psi)!;
await p.WaitForExitAsync();`,
  },
  8: {
    kind: "flow",
    caption: "חתימה על קבלה עם Smart Card: הדפדפן לא יכול, ולכן זה עובר דרך Local Agent.",
    steps: [
      { label: "דפדפן", sub: "בקשה לחתום על קבלה" },
      { label: "Local Agent", sub: "שירות .NET בעמדה" },
      { label: "קורא כרטיסים", sub: "X509Certificates / PKCS#11" },
      { label: "PDF חתום", sub: "חוזר למסך הקבלה" },
    ],
  },
  9: {
    kind: "code",
    lang: "sql",
    caption: "מה יושב ב-DB של לקוח: ספירת אובייקטים ורשימת ה-procedures.",
    code: `-- what lives in this tenant DB?
SELECT type_desc, COUNT(*) AS cnt
FROM sys.objects
GROUP BY type_desc;

SELECT name FROM sys.procedures
ORDER BY name;`,
  },
  10: {
    kind: "compare",
    caption: "ארכיון הקבלות עובר מנתיב רשת UNC לדלי S3.",
    before: {
      title: "היום · UNC Path",
      lines: ["\\\\fs01\\archive\\receipts", "staging וארכיון על שרת קבצים"],
    },
    after: {
      title: "ב־AWS · S3",
      lines: ["s3://epr-archive/tenant-101/", "העברה חד-פעמית: DataSync / s3 sync"],
    },
  },
  11: {
    kind: "code",
    lang: "cmd",
    caption: "בדיקה באילו DLL תלוי רכיב EXE קיים לפני שמחליטים מה לעשות בו.",
    code: `REM which DLLs does the legacy EXE need?
dumpbin /dependents C:\\EPR\\bin\\GviaCalc.exe

REM sample output:
REM   KERNEL32.dll
REM   GviaCore.dll`,
  },
  12: {
    kind: "compare",
    caption: "שינוי בחישוב יתרת חוב: שובר שלושה דברים היום, נוגע במקום אחד ביעד.",
    before: {
      title: "היום · Coupling גבוה",
      lines: ["חישוב יתרה בתוך טופס תשלומים", "שינוי שובר את דוח השוברים", "וגם את הייצוא הלילי לבנק"],
    },
    after: {
      title: "ב־.NET",
      lines: ["חישוב יתרה בשירות אחד", "דוח וייצוא קוראים ל-interface", "NDepend / SonarQube מודדים"],
    },
  },
  13: {
    kind: "flow",
    caption: "טיפול במערכת Legacy בגישת Strangler: עוטפים ומחליפים בהדרגה, לא כותבים מחדש.",
    steps: [
      { label: "Access הקיים", sub: "עובד, אבל קשה לשינוי" },
      { label: "עטיפה", sub: "ניתוב סביב המערכת" },
      { label: "החלפה הדרגתית", sub: "מסך אחרי מסך" },
      { label: "כיבוי Access", sub: "כשאין בו עוד שימוש" },
    ],
  },
  14: {
    kind: "flow",
    caption: "Vertical Slice של מסך חיפוש משלמים: כל השכבות לתהליך אחד, עד production.",
    steps: [
      { label: "Angular component", sub: "מסך חיפוש משלמים" },
      { label: "BFF endpoint", sub: "GET /api/payers/search" },
      { label: "Domain service", sub: "PayerService" },
      { label: "SQL Server", sub: "ה-DB של ה-Tenant" },
      { label: "production", sub: "מסך אחד עובד באמת" },
    ],
  },
  15: {
    kind: "code",
    lang: "bash",
    caption: "התקנת Angular CLI ויצירת פרויקט ה-Web הראשון.",
    code: `npm install -g @angular/cli
ng new gvia-web
cd gvia-web
ng serve   # http://localhost:4200`,
  },
  16: {
    kind: "compare",
    caption: "טעות הקלדה בשם שדה: ב-JavaScript מתגלה אצל הפקיד, ב-TypeScript בעורך.",
    before: {
      title: "JavaScript",
      lines: ["payer.balnce → undefined", "השגיאה מתגלה בזמן ריצה"],
    },
    after: {
      title: "TypeScript · strict",
      lines: ["Property 'balnce' does not exist", "נתפס בזמן כתיבה, לפני deploy"],
    },
  },
  17: {
    kind: "code",
    lang: "typescript",
    caption: "Signals: סכום החובות מתעדכן במסך אוטומטית כשרשימת החובות משתנה.",
    code: `import { signal, computed, effect }
  from '@angular/core';

const debts = signal<number[]>([]);
const total = computed(() =>
  debts().reduce((a, b) => a + b, 0));
effect(() => console.log(total()));
debts.set([120, 80]); // screen updates`,
  },
  18: {
    kind: "compare",
    caption: "אותה קומפוננטה עם NgModule ובלעדיו — פחות קוד תשתית.",
    before: {
      title: "קודם · NgModule",
      lines: ["PayersModule עם declarations", "imports / exports בכל מודול"],
    },
    after: {
      title: "Standalone",
      lines: ["ng g component payer-search", "imports ישירות בקומפוננטה", "בלי NgModule בכלל"],
    },
  },
  19: {
    kind: "code",
    lang: "bash",
    caption: "הקמת פרויקט Vue 3 עם Vite ו-Pinia לצורך ה-Spike מול Angular.",
    code: `npm create vite@latest gvia-vue -- \\
  --template vue-ts
cd gvia-vue
npm install pinia
npm run dev`,
  },
  20: {
    kind: "flow",
    caption: "מבנה Spike: שאלה אחת, מדדים מראש, אותו מסך בשתי טכנולוגיות.",
    steps: [
      { label: "שאלה אחת", sub: "Angular או Vue?" },
      { label: "מדדים מראש", sub: "שורות קוד, זמן, GenAI" },
      { label: "אותו מסך פעמיים", sub: "חיפוש משלמים בשתיהן" },
      { label: "החלטה", sub: "לפי המדדים" },
    ],
  },
  21: {
    kind: "code",
    lang: "bash",
    caption: "בדיקת גרסת ה-SDK ויצירת פרויקט Web API ראשון ב-.NET.",
    code: `dotnet --list-sdks
dotnet new webapi -n Epr.Gvia.Bff
cd Epr.Gvia.Bff
dotnet run`,
  },
  22: {
    kind: "code",
    lang: "csharp",
    caption: "Controller של BFF למסך כרטיס משלם: קורא לשני שירותים ומחזיר ViewModel אחד.",
    code: `[ApiController, Route("api/payer-card")]
public class PayerCardController(
  IPayerService payers,
  IVoucherService vouchers) : ControllerBase
{
  [HttpGet("{id}")]
  public async Task<CardVm> Get(int id) =>
    new(await payers.GetAsync(id),
        await vouchers.GetOpenAsync(id));
}`,
  },
  23: {
    kind: "compare",
    caption: "מה מותר ומה אסור בתוך ה-BFF, ואיך אוכפים את זה ב-build.",
    before: {
      title: "BFF עבה · אסור",
      lines: ["SQL עם RepoDB בתוך Controller", "חישוב יתרת חוב ב-BFF"],
    },
    after: {
      title: "Thin BFF",
      lines: ["Auth, Session, composition", "מודלים למסך בלבד", "ArchUnitNET מכשיל build"],
    },
  },
  24: {
    kind: "code",
    lang: "csharp",
    caption: "חיבור ה-BFF לספק זהות ב-OIDC, עם Cookie אחרי ההתחברות.",
    code: `builder.Services
  .AddAuthentication(o => {
    o.DefaultScheme = "Cookies";
    o.DefaultChallengeScheme = "oidc";
  })
  .AddCookie("Cookies")
  .AddOpenIdConnect("oidc", o => {
    o.Authority = "https://idp.example.test";
    o.ClientId = "gvia-web";
  });`,
  },
  25: {
    kind: "code",
    lang: "csharp",
    caption: "Cookie של Session מאובטח: HttpOnly, Secure ו-SameSite=Strict.",
    code: `builder.Services.AddAuthentication()
  .AddCookie(o => {
    o.Cookie.HttpOnly = true;
    o.Cookie.SecurePolicy =
      CookieSecurePolicy.Always;
    o.Cookie.SameSite = SameSiteMode.Strict;
    o.ExpireTimeSpan = TimeSpan.FromHours(8);
  });`,
  },
  26: {
    kind: "code",
    lang: "csharp",
    caption: "רק מי שבתפקיד מנהל גבייה יכול לבטל קבלה — הרשאה לפי תפקיד.",
    code: `builder.Services.AddAuthorization(o =>
  o.AddPolicy("CanCancelReceipt", p =>
    p.RequireRole("CollectionManager")));

[Authorize(Policy = "CanCancelReceipt")]
[HttpPost("receipts/{id}/cancel")]
public IActionResult Cancel(int id) => Ok();`,
  },
  27: {
    kind: "flow",
    caption: "התקפת CSRF על ביטול קבלה, ואיך טוקן antiforgery חוסם אותה.",
    steps: [
      { label: "אתר זדוני", sub: "טופס נסתר ששולח POST" },
      { label: "דפדפן הפקיד", sub: "מצרף Cookie אוטומטית" },
      { label: "BFF", sub: "ValidateAntiForgeryToken" },
      { label: "הבקשה נחסמת", sub: "אין טוקן תקין" },
    ],
  },
  28: {
    kind: "code",
    lang: "csharp",
    caption: "הגבלת חיפוש משלמים ל-100 בקשות בדקה.",
    code: `builder.Services.AddRateLimiter(o =>
  o.AddFixedWindowLimiter("search", w => {
    w.PermitLimit = 100;
    w.Window = TimeSpan.FromMinutes(1);
  }));

app.UseRateLimiter();
app.MapGet("/api/payers", Search)
   .RequireRateLimiting("search");`,
  },
  29: {
    kind: "flow",
    caption: "מסך כרטיס משלם: ה-BFF מאחד שלוש קריאות לתשובה אחת.",
    steps: [
      { label: "Angular", sub: "GET /api/payer-card/7" },
      { label: "BFF", sub: "Task.WhenAll במקביל" },
      { label: "3 Domain services", sub: "משלם · שוברים · תשלומים" },
      { label: "DTO אחד", sub: "PayerCardDto למסך" },
    ],
  },
  30: {
    kind: "compare",
    caption: "מודל הנתונים בטבלה מול ה-DTO שהמסך באמת צריך.",
    before: {
      title: "מודל DB · dbo.Payers",
      lines: ["Id, Name, BankAcct, Notes…", "CreatedBy, UpdatedAt, ועוד"],
    },
    after: {
      title: "DTO למסך",
      lines: ["record PayerRowDto", "Id, Name, Balance, Status", "מיפוי ידני או Mapperly"],
    },
  },
  31: {
    kind: "code",
    lang: "csharp",
    caption: "משאב קבלות ב-Minimal APIs עם תיעוד OpenAPI אוטומטי.",
    code: `app.MapGet("/api/receipts/{id}", Get);
app.MapPost("/api/receipts", Create);
app.MapPut("/api/receipts/{id}", Update);
app.MapDelete("/api/receipts/{id}", Cancel);

app.MapOpenApi(); // Swagger / OpenAPI`,
  },
  32: {
    kind: "code",
    lang: "csharp",
    caption: "שליפת השוברים הפתוחים של משלם עם RepoDB.",
    code: `// dotnet add package RepoDB.SqlServer
await using var conn =
  new SqlConnection(connString);

var open = await conn.QueryAsync<Voucher>(
  v => v.PayerId == payerId && !v.Paid);`,
  },
  33: {
    kind: "flow",
    caption: "רק שכבת ה-Data Access מדברת עם מסד הנתונים; כל השאר עוברים דרכה.",
    steps: [
      { label: "BFF", sub: "לא מכיר driver של DB" },
      { label: "Domain service", sub: "קורא ל-IPayerRepository" },
      { label: "Data Access", sub: "פרויקט נפרד · RepoDB" },
      { label: "SQL Server", sub: "רק השכבה הזו נוגעת בו" },
    ],
  },
  34: {
    kind: "code",
    lang: "csharp",
    caption: "שירות Domain לכל תחום (גבייה, רווחה) בפרויקט נפרד, מדברים דרך interfaces.",
    code: `// Epr.Gvia.Collection (class library)
public interface IDebtService
{
  Task<decimal> GetBalanceAsync(int payerId);
}

// Epr.Welfare (class library)
public interface IWelfareFileService
{
  Task<FileDto> GetAsync(int fileId);
}`,
  },
  35: {
    kind: "flow",
    caption: "מ-image ועד קונטיינר רץ ב-ECS.",
    steps: [
      { label: "Docker image", sub: "שמור ב-ECR" },
      { label: "Task Definition", sub: "image, CPU, זיכרון, פורט" },
      { label: "ECS Service", sub: "כמה עותקים להריץ" },
      { label: "קונטיינרים רצים", sub: "פריסה ב-Terraform / CDK" },
    ],
  },
  36: {
    kind: "code",
    lang: "hcl",
    caption: "שירות ה-BFF ב-ECS במצב Fargate — בלי שרתים לנהל.",
    code: `resource "aws_ecs_service" "bff" {
  name          = "gvia-bff"
  cluster       = aws_ecs_cluster.main.id
  task_definition =
    aws_ecs_task_definition.bff.arn
  launch_type   = "FARGATE"
  desired_count = 2
}`,
  },
  37: {
    kind: "flow",
    caption: "ה-ALB מנתב לפי path ל-Target Group של השירות המתאים.",
    steps: [
      { label: "דפדפן", sub: "https://gvia.example.test" },
      { label: "ALB · Listener", sub: "פורט 443" },
      { label: "Listener Rule", sub: "/api/* → BFF" },
      { label: "Target Group", sub: "קונטיינרים של ה-BFF" },
    ],
  },
  38: {
    kind: "code",
    lang: "bash",
    caption: "בנייה ודחיפה של image של ה-BFF ל-ECR.",
    code: `docker build -t gvia-bff:1.4 .
aws ecr get-login-password |
  docker login --username AWS \\
    --password-stdin $REGISTRY
docker tag gvia-bff:1.4 $REGISTRY/gvia-bff:1.4
docker push $REGISTRY/gvia-bff:1.4`,
  },
  39: {
    kind: "flow",
    caption: "בקשה עוברת DNS ב-Route 53 וסינון ב-WAF לפני שהיא מגיעה לשרת.",
    steps: [
      { label: "Route 53", sub: "Hosted Zone · DNS" },
      { label: "WAF Web ACL", sub: "חוסם תעבורה זדונית" },
      { label: "ALB", sub: "מחובר ל-Web ACL" },
      { label: "BFF", sub: "מקבל רק תעבורה מסוננת" },
    ],
  },
  40: {
    kind: "compare",
    caption: "איפה רץ כל תהליך: היום הכול על השרת, ביעד הכול בדפדפן חוץ מהמקומי באמת.",
    before: {
      title: "היום · Access",
      lines: ["כל תהליך רץ ב-Session על השרת", "גישה מקומית דרך tsclient"],
    },
    after: {
      title: "Browser First",
      lines: ["חיפוש, קבלות, דוחות — בדפדפן", "רק Smart Card → Local Agent"],
    },
  },
  41: {
    kind: "compare",
    caption: "הרשאות רחבות מול הרשאות מינימליות לכל רכיב.",
    before: {
      title: "הרשאות רחבות",
      lines: ["IAM Role אחד לכל השירותים", "Shell חופשי ב-Agent", "סוד בתוך ה-URL"],
    },
    after: {
      title: "Least Privilege",
      lines: ["IAM Role נפרד לכל ECS Task", "Agent מריץ פקודות מוגדרות", "אין סודות ב-URL"],
    },
  },
  42: {
    kind: "compare",
    caption: "Strangler Fig: חלק מהמסכים כבר ב-Web, השאר עדיין ב-Access.",
    before: {
      title: "היום · Access",
      lines: ["גבייה, רווחה, דוחות — הכול", "Access אחד דרך RDP"],
    },
    after: {
      title: "בתקופת המעבר",
      lines: ["חיפוש משלמים, קבלות → Web", "שאר המסכים נשארים ב-Access", "ניתוב לפי feature flag"],
    },
  },
  43: {
    kind: "code",
    lang: "csharp",
    caption: "מסך הקבלות ב-Web נפתח רק ללקוחות שהמתג דלוק אצלם.",
    code: `// row in Control Plane: feature_flags
var on = flags.IsEnabled(
  "web-receipts", tenant.TenantId);

if (on) return Redirect("/web/receipts");
// off for this tenant: stays in Access`,
  },
  44: {
    kind: "compare",
    caption: "שתי דרכים ל-Multi-Tenancy — ומה נבחר כאן: DB נפרד לכל לקוח.",
    before: {
      title: "DB משותף · לא אצלנו",
      lines: ["טבלה אחת לכל הרשויות", "WHERE TenantId בכל שאילתה"],
    },
    after: {
      title: "כאן · DB לכל Tenant",
      lines: ["gvia_101, gvia_102, …", "Tenant Registry מרכזי"],
    },
  },
  45: {
    kind: "compare",
    caption: "מאיפה מגיע ה-TenantId: לעולם לא מהדפדפן, תמיד מהשרת.",
    before: {
      title: "אסור",
      lines: ["?tenantId=101 ב-URL או ב-body", "הדפדפן יכול לשנות אותו"],
    },
    after: {
      title: "נכון",
      lines: ["TenantId נגזר בשרת מה-Session", "ערך מהדפדפן — מתעלמים"],
    },
  },
  46: {
    kind: "code",
    lang: "sql",
    caption: "טבלת הלקוחות ב-Control Plane: מי הלקוח, איפה ה-DB ובאיזו גרסה.",
    code: `CREATE TABLE tenants (
  tenant_id      int  PRIMARY KEY,
  name           text NOT NULL,
  db_secret_ref  text NOT NULL,
  schema_version int  NOT NULL
);
-- also: users, schema_versions,
--       integration_config`,
  },
  47: {
    kind: "compare",
    caption: "ההפרדה בין שכבת הבקרה לשכבת הנתונים העסקיים.",
    before: {
      title: "Control Plane",
      lines: ["RDS PostgreSQL אחד", "tenants, users, גרסאות"],
    },
    after: {
      title: "Data Plane",
      lines: ["SQL Server על VMs", "DB וקישור נפרדים לכל Tenant", "בלי join ל-Control Plane"],
    },
  },
  48: {
    kind: "code",
    lang: "csharp",
    caption: "קריאת הגדרות לקוח מה-Registry עם cache ב-Redis תחת המפתח tenant:{id}.",
    code: `var key = $"tenant:{tenantId}";
var json = await redis.StringGetAsync(key);
if (json.IsNullOrEmpty)
{
  var t = await rds.GetTenantAsync(tenantId);
  await redis.StringSetAsync(key,
    Serialize(t), TimeSpan.FromMinutes(10));
}`,
  },
  49: {
    kind: "flow",
    caption: "איך כל בקשה מקבלת את זהות הלקוח בצד השרת.",
    steps: [
      { label: "בקשה נכנסת", sub: "עם Cookie של Session" },
      { label: "Middleware", sub: "גוזר TenantId מה-Session" },
      { label: "ITenantContext", sub: "מוזרק דרך DI" },
      { label: "Domain service", sub: "עובד מול הלקוח הנכון" },
    ],
  },
  50: {
    kind: "flow",
    caption: "מ-TenantId למחרוזת חיבור: Registry להפניה, Secrets Manager לסוד.",
    steps: [
      { label: "TenantId", sub: "מתוך Tenant Context" },
      { label: "Tenant Registry", sub: "שרת, DB, הפניה לסוד" },
      { label: "Secrets Manager", sub: "סיסמת החיבור" },
      { label: "Connection string", sub: "ל-DB של אותו Tenant" },
    ],
  },
  51: {
    kind: "code",
    lang: "csharp",
    caption: "מחרוזת חיבור שונה לכל לקוח יוצרת Pool נפרד, מוגבל ב-Max Pool Size.",
    code: `// different string = separate ADO.NET pool
var a = "Server=sql01;Database=gvia_101;" +
        "Max Pool Size=50;";
var b = "Server=sql01;Database=gvia_102;" +
        "Max Pool Size=50;";`,
  },
  52: {
    kind: "code",
    lang: "hcl",
    caption: "יצירת ה-RDS PostgreSQL של ה-Control Plane ב-Terraform.",
    code: `resource "aws_db_instance" "control" {
  identifier        = "epr-control-plane"
  engine            = "postgres"
  instance_class    = "db.t4g.medium"
  allocated_storage = 50
  storage_encrypted = true
}`,
  },
  53: {
    kind: "compare",
    caption: "ב-Registry נשמרת רק הפניה לסוד; הסיסמה עצמה ב-Secrets Manager.",
    before: {
      title: "לא נכון",
      lines: ["Password=… בתוך מחרוזת החיבור", "שמורה בטבלת ה-Registry"],
    },
    after: {
      title: "Secrets Manager",
      lines: ["ב-Registry: db_secret_ref בלבד", "נשלף בקוד עם AWSSDK", "rotation אוטומטי"],
    },
  },
  54: {
    kind: "code",
    lang: "hcl",
    caption: "מפתח KMS נפרד לכל משאב: ארכיון הקבלות ב-S3, RDS ו-Secrets.",
    code: `resource "aws_kms_key" "receipts_s3" {
  description         = "S3 receipts archive"
  enable_key_rotation = true
}
# separate keys as well:
#   aws_kms_key.rds
#   aws_kms_key.secrets`,
  },
  55: {
    kind: "flow",
    caption: "גרסת הסכימה של לקוח מתעדכנת רק בסוף migration שהצליח.",
    steps: [
      { label: "migration רץ", sub: "על ה-DB של Tenant 101" },
      { label: "כל הסקריפטים עברו", sub: "בלי שגיאות" },
      { label: "עדכון tenants", sub: "schema_version = 42" },
      { label: "Control Plane יודע", sub: "מי כבר עודכן ומי לא" },
    ],
  },
};
