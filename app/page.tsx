import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="relative w-full h-screen flex items-center justify-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-4xl font-bold">Hello World!</h1>
    </div>
  );
}
