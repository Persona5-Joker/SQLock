import Image from "next/image";
import { ArrowRight, Shield, Sparkles, Waves } from "lucide-react";
import { Button } from "~/components/ui/button";
import teamData from "~/data/team.json";

export default async function Home() {
  const { team } = teamData as {
    team: { name: string; role: string; img: string; linkedin: string }[];
  };

  const capabilities = [
    {
      icon: Shield,
      title: "Live SQLi Detection",
      description: "Glass-panel console with real-time scoring, inspired by the clarity of Apple diagnostics.",
    },
    {
      icon: Waves,
      title: "Adaptive Telemetry",
      description: "Streaming logs rendered with soft gradients and pill filters for instant triage.",
    },
    {
      icon: Sparkles,
      title: "Education First",
      description: "Guided flows make complex security stories approachable for new analysts.",
    },
  ];

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-[3rem] border border-white/30 p-10 text-center shadow-[0_45px_90px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/40 to-transparent dark:from-white/5 dark:via-white/5" />
        <div className="relative z-10 space-y-6">
          <p className="text-xs uppercase tracking-[0.5em] text-foreground/60">SQLock</p>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-6xl">
            <span className="glow-text">Futuristic SQL security</span> presented as a living product demo.
          </h1>
          <p className="inline-flex items-center justify-center rounded-full border border-white/30 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-foreground/70">
            SQLock, Drop Threats, Not Tables
          </p>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            Invite stakeholders to type live SQL, watch the detector reason in milliseconds, export telemetry, and prove how
            SQLock neutralizes injection attempts without clutter or jargon.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="rounded-full bg-gradient-to-r from-primary via-sky-400 to-indigo-500 px-6 text-sm font-semibold text-white">
              <a href="/input" className="inline-flex items-center gap-2">
                Launch Simulator <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="ghost" className="rounded-full border border-border px-6 text-sm text-foreground/70">
              <a href="/logs">Browse Intelligence</a>
            </Button>
          </div>
        </div>
        <div className="absolute -bottom-24 left-1/2 h-60 w-[80%] -translate-x-1/2 rounded-[50%] bg-gradient-to-r from-primary/15 via-sky-300/20 to-transparent blur-3xl" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {capabilities.map(({ icon: Icon, title, description }) => (
          <div key={title} className="frosted-panel h-full rounded-[2rem] p-6">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[2.5rem] border border-white/30 p-8 shadow-lg backdrop-blur-2xl dark:border-white/10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-primary">Experience</p>
            <h2 className="text-3xl font-semibold text-foreground">How the SQLock demo flows.</h2>
            <p className="text-base text-muted-foreground">
              This environment mirrors the analyst console a client would receive: input capture, policy-grade detection,
              and evidence trails in a few deliberate steps.
            </p>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li>• Compose an intentional or malicious SQL string in the Input view.</li>
              <li>• SQLock classifies it (allow, challenge, block) and logs telemetry instantly.</li>
              <li>• Review decisions, export CSV insights, or trigger the external log sweep.</li>
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/30 p-6 dark:border-white/10">
            <div className="absolute inset-0 opacity-60" style={{ background: "radial-gradient(circle at 20% 20%, rgba(14,165,233,0.35), transparent 45%)" }} />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Live Monitor</span>
                <span className="text-sm text-foreground">Realtime · 60 fps</span>
              </div>
              <div className="neon-divider" />
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Every keystroke posts to Security_Event with a suspicion score and template reference.</p>
                <p>The UI stays silent until it matters—minimal chrome, maximum focus on malicious intent.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Team</p>
            <h2 className="text-3xl font-semibold text-foreground">The Team Behind SQLock</h2>
          </div>
          <Button asChild variant="ghost" className="rounded-full border border-border px-6 text-sm">
            <a href="/logs">View mission log</a>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => (
            <a
              key={member.name}
              href={member.linkedin}
              target="_blank"
              rel="noreferrer"
              className="group rounded-[2rem] border border-white/40 bg-card/70 p-5 shadow-md backdrop-blur-2xl transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl dark:border-white/10"
            >
              <div className="mb-4 flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/50 bg-muted">
                  <Image src={member.img} alt={member.name} fill sizes="56px" className="object-cover" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{member.name}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{member.role}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Tap to connect ↗</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
