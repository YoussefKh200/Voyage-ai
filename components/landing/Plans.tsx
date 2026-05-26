import Link from "next/link";

const PLANS = [
  {
    name: "Normal",
    price: "$0/mo",
    description: "Perfect for casual planners who want AI-assisted trip outlines.",
    features: ["Unlimited trip ideas", "Itinerary export", "Standard support"],
    cta: "/signup",
    badge: "Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12/mo",
    description: "Best for frequent travelers who want smarter route optimization.",
    features: ["Priority AI planning", "Budget optimization", "Saved plans"],
    cta: "/signup",
    badge: "Popular",
    highlight: true,
  },
  {
    name: "Lux",
    price: "$29/mo",
    description: "For luxury adventures with concierge-level recommendations.",
    features: ["Private plan concierge", "Premium city guides", "VIP support"],
    cta: "/signup",
    badge: "Premium",
    highlight: false,
  },
];

export function Plans() {
  return (
    <section id="plans" className="py-28 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(212,168,83,0.04), transparent 70%)", filter: "blur(60px)" }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#d4a853] text-xs font-semibold tracking-[0.2em] uppercase mb-4">Plans</p>
          <h2 className="font-display text-5xl md:text-6xl font-bold text-white mb-5">
            Choose the right plan{" "}
            <span className="gradient-text italic">for your trip.</span>
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto">
            From free personal itinerary creation to luxury concierge-level trips, we have a plan for every traveler.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`glass rounded-[2.5rem] border p-8 shadow-2xl shadow-black/15 transition-all duration-300 hover:shadow-[#d4a853]/10 ${
                plan.highlight
                  ? "border-[#d4a853]/40 lg:scale-105 lg:shadow-2xl lg:shadow-[#d4a853]/20"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/40">{plan.badge}</p>
                  <h3 className="mt-3 text-3xl font-semibold text-white">{plan.name}</h3>
                </div>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/60">
                  {plan.price}
                </span>
              </div>

              {/* Description */}
              <p className="mt-6 text-white/60">{plan.description}</p>

              {/* Features */}
              <ul className="mt-8 space-y-3 text-sm text-white/70">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="mt-1 text-[#d4a853]">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href={plan.cta}
                className={`mt-10 inline-flex w-full items-center justify-center rounded-3xl px-6 py-3 text-sm font-semibold transition ${
                  plan.highlight
                    ? "bg-gradient-to-r from-[#d4a853] to-[#e2714b] text-black hover:brightness-110"
                    : "border border-white/20 text-white hover:bg-white/5"
                }`}
              >
                Choose {plan.name}
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison note */}
        <div className="text-center mt-14">
          <p className="text-white/40 text-sm">
            All plans include access to core AI planning features.{" "}
            <Link href="/plans" className="text-[#d4a853] hover:text-[#e2714b] transition">
              Compare full features →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
