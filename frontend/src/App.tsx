import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  HeartPulse,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { requestOtp, verifyOtp } from "./api";

type Step = "phone" | "otp" | "verified";

function App() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [mouse, setMouse] = useState({ x: 50, y: 35 });
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      setMouse({
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const normalizedPhone = phone.replace(/\D/g, "");

  async function handleContinue() {
    setMessage("");
    if (normalizedPhone.length !== 10) {
      setMessage("Enter a valid 10-digit mobile number.");
      return;
    }

    setBusy(true);
    try {
      await requestOtp(`+91${normalizedPhone}`);
      setStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    const code = otp.join("");
    if (code.length !== 6) {
      setMessage("Enter the 6-digit verification code.");
      return;
    }

    setMessage("");
    setBusy(true);
    try {
      const result = await verifyOtp(`+91${normalizedPhone}`, code);
      localStorage.setItem("jeevan_access_token", result.access_token);
      setStep("verified");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  return (
    <main
      className="app"
      style={{ "--mx": `${mouse.x}%`, "--my": `${mouse.y}%` } as React.CSSProperties}
    >
      <div className="ambient-glow" />
      <div className="grain" />

      <section className="page-shell glass">
        <header className="brand">
          <div className="brand-mark glass">
            <HeartPulse size={48} strokeWidth={1.7} />
          </div>
          <h1>Jeevan</h1>
          <p className="brand-subtitle">Unified Healthcare Router</p>
          <div className="brand-divider"><span /></div>
          <p className="tagline">
            Right Care. Right Place. Right Time.
            <br />
            Always with you.
          </p>
        </header>

        {step === "phone" && (
          <section className="auth-card glass">
            <div className="card-heading">
              <h2>Welcome to Jeevan <span className="heart">♡</span></h2>
              <p>Your healthcare, connected.</p>
            </div>

            <label className="field-label" htmlFor="phone">Mobile number</label>
            <div className="phone-field">
              <button className="country-button" type="button" aria-label="Country code">
                <span>🇮🇳</span>
                <strong>+91</strong>
                <ChevronDown size={15} />
              </button>
              <input
                id="phone"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                placeholder="Enter mobile number"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                onKeyDown={(event) => event.key === "Enter" && handleContinue()}
              />
              <UserRound className="field-icon" size={21} />
            </div>

            <div className="helper">
              <ShieldCheck size={17} />
              <span>We'll send you a secure verification code</span>
            </div>

            {message && <p className="error-message" role="alert">{message}</p>}

            <button className="primary-button" onClick={handleContinue} disabled={busy}>
              {busy ? "Sending code..." : <>Continue <ArrowRight size={21} /></>}
            </button>

            <div className="or-divider"><span>or continue with</span></div>

            <div className="social-grid">
              <button className="social-button" type="button"><span className="google">G</span> Google</button>
              <button className="social-button" type="button"><span className="microsoft">■</span> Microsoft</button>
            </div>

            <SecurityCard />
          </section>
        )}

        {step === "otp" && (
          <section className="auth-card glass">
            <button className="back-button" onClick={() => { setStep("phone"); setMessage(""); }}>
              <ArrowLeft size={17} /> Change number
            </button>

            <div className="otp-heading">
              <h2>Verify your number</h2>
              <p>We've sent a 6-digit verification code to</p>
              <strong>+91 {normalizedPhone.slice(0, 2)}••••••{normalizedPhone.slice(-2)}</strong>
            </div>

            <div className="otp-grid" onPaste={(event) => {
              const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
              if (!pasted) return;
              event.preventDefault();
              setOtp(pasted.padEnd(6, " ").split("").map((x) => x.trim()));
            }}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { otpRefs.current[index] = element; }}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleOtpChange(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>

            <div className="helper">
              <ShieldCheck size={17} />
              <span>Secure verification. OTP expires shortly.</span>
            </div>

            {message && <p className="error-message" role="alert">{message}</p>}

            <button className="primary-button" onClick={handleVerify} disabled={busy}>
              {busy ? "Verifying..." : <>Verify <ArrowRight size={21} /></>}
            </button>

            <p className="resend">Didn't receive the code? <button type="button">Resend</button></p>
            <SecurityCard />
          </section>
        )}

        {step === "verified" && (
          <section className="auth-card glass verified-card">
            <div className="success-icon"><Check size={36} /></div>
            <h2>Verified!</h2>
            <p>Welcome back to Jeevan.</p>
            <button className="primary-button" onClick={() => window.location.href = "/dashboard"}>
              Go to Jeevan <ArrowRight size={21} />
            </button>
          </section>
        )}

        <div className="emergency">
          <span>Emergency?</span>
          <button type="button">Get help now</button>
          <span className="ambulance">✚</span>
        </div>

        <div className="skyline" aria-hidden="true">
          <div className="building b1" />
          <div className="building b2" />
          <div className="hospital">
            <div className="cross">+</div>
            <div className="hospital-door" />
          </div>
          <div className="building b3" />
          <div className="building b4" />
          <div className="street-lights">
            <i /><i /><i /><i />
          </div>
        </div>

        <footer className="footer">
          New to Jeevan? <button type="button">Create an account <ArrowRight size={17} /></button>
        </footer>
      </section>
    </main>
  );
}

function SecurityCard() {
  return (
    <button className="security-card glass" type="button">
      <div className="security-icon"><LockKeyhole size={23} /></div>
      <div>
        <strong>Secure & Private</strong>
        <span>Your health data is protected with enterprise-grade security.</span>
      </div>
      <ArrowRight size={19} />
    </button>
  );
}

export default App;