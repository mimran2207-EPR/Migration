import ConceptLab from "./components/ConceptLab";
import InstallButton from "./components/InstallButton";

// The site: concepts of the 2026 development structure, with practice.
export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="muni-gradient text-white shadow-md">
        <div className="flex items-center gap-3 px-4 py-3 md:px-6">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold md:text-2xl">מעבר מאקסס ל־WEB · מושגים</h1>
            <p className="hidden text-sm text-white/85 sm:block">EPR מערכות · מבנה הפיתוח 2026</p>
          </div>
          <InstallButton />
        </div>
      </header>
      <ConceptLab />
    </div>
  );
}
