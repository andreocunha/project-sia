import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center gap-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-4xl font-bold">Home</h1>
      <Link href="/desafio-tecnico-sia" className="text-blue-500 underline">
        Ver Desafio Técnico SIA
      </Link>
    </div>
  );
}
