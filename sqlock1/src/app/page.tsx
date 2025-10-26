import Image from "next/image";
import { Button } from "~/components/ui/button";
import teamData from "~/data/team.json";

export default async function Home() {
  const { team } = teamData as {
    team: { name: string; role: string; img: string; linkedin: string }[];
  };

  return (
    <div className="max-w-5xl mx-auto">
      <section className="mb-8">
        <h1 className="text-4xl font-bold">Welcome to SQLock</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          SQLock is a teaching/proof-of-concept web app for detecting,
          preventing, and logging SQL injection attempts. This prototype
          allows users to submit SQL-like text, runs a rule-based detector,
          and records events for later analysis.
        </p>
        <ul className="mt-4 list-disc pl-6 text-muted-foreground">
          <li>Simulate SQL inputs and see detector decisions</li>
          <li>View recorded logs of all inputs and outcomes</li>
          <li>View flagged attempts (challenge/block) for analysis</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Project Details</h2>
        <div className="prose max-w-none text-muted-foreground">
          <p>
            Built with the T3 stack (Next.js, TypeScript, TailwindCSS,
            Prisma, tRPC, NextAuth). The detector is a conservative,
            rule-based engine for educational demonstration.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {team.map((m) => (
            <Button
              key={m.name}
              variant="outline"
              asChild
              className="h-auto justify-start p-4 hover:shadow-md transition-shadow"
            >
              <a
                href={m.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                  <Image src={m.img} alt={m.name} width={64} height={64} />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground">{m.name}</div>
                  <div className="text-sm text-muted-foreground">{m.role}</div>
                </div>
              </a>
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
