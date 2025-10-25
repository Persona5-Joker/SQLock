import Image from "next/image";
import { HydrateClient } from "~/trpc/server";
import teamData from "~/data/team.json";

export default async function Home() {
  const { team } = teamData as {
    team: { name: string; role: string; img: string; linkedin: string }[];
  };

  return (
    <HydrateClient>
      <main className="min-h-screen bg-gray-50 text-gray-900">
        <div className="max-w-5xl mx-auto p-8">
          <section className="mb-8">
            <h1 className="text-4xl font-bold">Welcome to SQLock</h1>
            <p className="mt-4 text-lg text-gray-400">
              SQLock is a teaching/proof-of-concept web app for detecting,
              preventing, and logging SQL injection attempts. This prototype
              allows users to submit SQL-like text, runs a rule-based detector,
              and records events for later analysis.
            </p>
            <ul className="mt-4 list-disc pl-6 text-gray-400">
              <li>Simulate SQL inputs and see detector decisions</li>
              <li>View recorded logs of all inputs and outcomes</li>
              <li>View flagged attempts (challenge/block) for analysis</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Project Details</h2>
            <div className="prose max-w-none text-gray-400">
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
                <a
                  key={m.name}
                  href={m.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 rounded-md border p-4 team-card hover:shadow-lg transition no-underline"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    <Image src={m.img} alt={m.name} width={64} height={64} />
                  </div>
                  <div>
                    <div className="font-semibold text-white-900">{m.name}</div>
                    <div className="text-sm text-gray-400">{m.role}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          
        </div>
      </main>
    </HydrateClient>
  );
}
