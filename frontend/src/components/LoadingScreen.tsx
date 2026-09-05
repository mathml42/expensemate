import "./LoadingScreen.css";

const PERSON_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);

const PAY_DELAYS = [0, 0.8, 1.6];
const RECEIVE_DELAYS = [0.4, 1.7];

export function LoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8">
      <div className="lf-scene">
        <svg className="lf-svg" viewBox="0 0 100 40" aria-hidden="true">
          <path className="lf-track" d="M22 20 C 40 5, 60 5, 78 20" />
          <path className="lf-track" d="M78 20 C 60 35, 40 35, 22 20" />

          {PAY_DELAYS.map((delay) => (
            <g key={`pay-${delay}`}>
              <rect className="lf-bill" x="-3.8" y="-2.1" width="7.6" height="4.2" rx="0.7" fill="url(#lfPayGrad)" />
              <text x="0" y="0.9" textAnchor="middle" className="lf-bill-label">
                ₹
              </text>
              <animateMotion dur="2.4s" begin={`${delay}s`} repeatCount="indefinite" rotate="auto">
                <mpath href="#lfPayPath" />
              </animateMotion>
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.12;0.85;1"
                dur="2.4s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
            </g>
          ))}

          {RECEIVE_DELAYS.map((delay) => (
            <g key={`receive-${delay}`}>
              <rect className="lf-bill" x="-3.8" y="-2.1" width="7.6" height="4.2" rx="0.7" fill="url(#lfReceiveGrad)" />
              <text x="0" y="0.9" textAnchor="middle" className="lf-bill-label">
                ₹
              </text>
              <animateMotion dur="2.6s" begin={`${delay}s`} repeatCount="indefinite" rotate="auto">
                <mpath href="#lfReceivePath" />
              </animateMotion>
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.12;0.85;1"
                dur="2.6s"
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
            </g>
          ))}

          <defs>
            <path id="lfPayPath" d="M22 20 C 40 5, 60 5, 78 20" />
            <path id="lfReceivePath" d="M78 20 C 60 35, 40 35, 22 20" />
            <linearGradient id="lfPayGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fbbf24" />
              <stop offset="1" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="lfReceiveGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#6ee7b7" />
              <stop offset="1" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>

        <div className="lf-node lf-node-left">
          <div className="lf-avatar lf-avatar-left">{PERSON_ICON}</div>
        </div>
        <div className="lf-node lf-node-right">
          <div className="lf-avatar lf-avatar-right">{PERSON_ICON}</div>
        </div>
      </div>

      <p className="text-base text-slate-500 dark:text-slate-400">
        {label}
        <span className="lf-dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </p>
    </div>
  );
}
