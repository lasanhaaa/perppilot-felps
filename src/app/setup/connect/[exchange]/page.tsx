"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { SetupShell } from "@/components/shell/setup-shell";
import { CheckCard, ChoiceRow, GuideSteps, LinkRow, Panel, VideoPlayer } from "@/components/flow/rows";
import { EXCHANGES, ExchangeLogo, type ExchangeId } from "@/components/ui/exchange-logo";
import { Icon } from "@/components/ui/icons";
import { ArrowRight, Button, Field, IconButton, Modal, Notice, TextLink } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";

/** Setup · 2 Connect (Figma 2073:5245 and its states 5460 / 5513 / 5745 / 5933). */
export default function ConnectPage() {
  return (
    <Suspense>
      <Connect />
    </Suspense>
  );
}

function Connect() {
  const { exchange } = useParams<{ exchange: ExchangeId }>();
  const from = useSearchParams().get("from");
  const id: ExchangeId = exchange in EXCHANGES ? exchange : "nado";
  const [video, setVideo] = useState(false);
  const isNado = id === "nado";
  const back = from === "create-bot" ? "/create-bot/account" : from === "accounts" ? "/accounts" : "/setup";

  return (
    <SetupShell steps={["Exchange", "Connect", "PIN"]} current={1}>
      <div className="flex w-[1000px] flex-col gap-8">
        <div className="flex items-center gap-5">
          <IconButton href={back} label="Back to exchanges" />
          <ExchangeLogo id={id} size={48} />
          <div className="flex flex-col gap-2">
            <h1 className="t-h36">Connect {EXCHANGES[id].name}</h1>
            <p className="t-b16 text-white/60">
              {isNado ? "Follow the steps on the left. Your wallet connects on the right." : "Follow the steps on the left. Paste your keys on the right."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 items-start gap-5">
          <Panel
            title="How to connect"
            description={isNado ? "Nado connects with the wallet that owns your account. No API keys to copy." : GUIDES[id].intro}
          >
            <Button variant="secondary" className="self-start" iconLeft={<Icon name="play" size={20} />} onClick={() => setVideo(true)}>
              Watch the video tutorial
            </Button>
            <GuideSteps
              steps={(isNado ? NADO_STEPS : GUIDES[id].steps).map((t, i) => ({
                title: t,
                action:
                  i === 0 ? (
                    <TextLink href={isNado ? "https://app.nado.xyz" : GUIDES[id].url}>{isNado ? "Open Nado referral" : `Open ${EXCHANGES[id].name}`}</TextLink>
                  ) : undefined,
              }))}
            />
            <Notice>{isNado ? "Keep USDT0 as collateral, not USDC: Nado auto-borrows otherwise. Up to 5 Nado bots per wallet." : GUIDES[id].tip}</Notice>
          </Panel>
          {isNado ? <NadoPanel from={from} /> : <KeysPanel id={id} from={from} />}
        </div>
      </div>
      {video && (
        <Modal onClose={() => setVideo(false)} width={880}>
          <div className="flex flex-col gap-6 p-10">
            <div className="flex items-start gap-4">
              <div className="flex flex-1 flex-col gap-2">
                <h2 className="t-h24">How to connect {EXCHANGES[id].name}</h2>
                <p className="t-b14 text-white/60">
                  {isNado ? "Every step on video, from signing up with our link to picking your subaccount." : "Every step on video, from creating the keys to pasting them here."}
                </p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setVideo(false)} className="text-white/80 hover:text-white">
                <Icon name="close" size={24} />
              </button>
            </div>
            <VideoPlayer />
          </div>
        </Modal>
      )}
    </SetupShell>
  );
}

const NADO_STEPS = ["Sign up to Nado with our link", "Have your wallet in this browser", "Connect and pick a subaccount", "Keep 1-Click Trading on in Nado"];

type NadoState = "default" | "connecting" | "no-wallet" | "not-referral" | "pick";
type Scenario = "happy" | "no-wallet" | "not-referral";

function NadoPanel({ from }: { from: string | null }) {
  const router = useRouter();
  const { addAccount, state: store } = useStore();
  const [name, setName] = useState("");
  const [referral, setReferral] = useState(false);
  const [state, setState] = useState<NadoState>("default");
  const [scenario, setScenario] = useState<Scenario>("happy");
  const [sub, setSub] = useState("Main (default)");
  const [fee, setFee] = useState(true);

  const connect = () => {
    setState("connecting");
    setTimeout(() => setState(scenario === "happy" ? "pick" : scenario), 900);
  };
  const finish = () => {
    addAccount({ id: "acc-user-nado", name: name.trim() || "Main trading account", exchange: "nado", available: 1320, subaccount: sub });
    router.push(afterConnect(from, store.pin));
  };

  const nameField = <Field label="Account name" placeholder="e.g. Main trading account" value={name} onChange={setName} />;

  if (state === "pick")
    return (
      <Panel title="Pick the subaccount to trade" description="Your wallet is connected. Nothing is signed yet." className="anim-fade">
        {nameField}
        <div className="flex h-[58px] items-center gap-3 rounded-sm border border-line bg-raised px-4">
          <Icon name="wallet" size={24} />
          <span className="t-b16m">Wallet</span>
          <span className="t-b14 text-white/30">0x7a1c…9F42</span>
          <span className="flex-1" />
          <span className="t-b14 flex items-center gap-1.5 text-success">
            <Icon name="check" size={16} />
            Connected
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="t-l12 text-white/30">Subaccount</span>
          {["Main (default)", "Subaccount 1"].map((s) => (
            <ChoiceRow key={s} label={s} selected={sub === s} onClick={() => setSub(s)} />
          ))}
        </div>
        <CheckCard
          checked={fee}
          onChange={setFee}
          title="Authorize the Nado builder fee"
          description="PerpPilot charges its fee through the exchange builder program. Nothing is withdrawn from your account; the fee is added to each order the bot places."
        />
        <Button disabled={!fee} onClick={finish} iconRight={<ArrowRight />}>
          Connect account
        </Button>
      </Panel>
    );

  return (
    <Panel title="Connect your Nado wallet" description="Use the wallet that owns your Nado account.">
      {nameField}
      {state === "not-referral" ? (
        <>
          <Notice tone="error">
            This wallet isn&apos;t under the PerpPilot referral. 0x7a1c…9F42 needs a Nado account created, or first funded, through our link.
          </Notice>
          <div className="flex flex-col gap-2">
            <Button iconRight={<Icon name="external-link" size={16} />} onClick={() => window.open("https://app.nado.xyz", "_blank")}>
              Open Nado referral
            </Button>
            <Button variant="secondary" onClick={() => setState("pick")}>
              Refresh
            </Button>
          </div>
        </>
      ) : (
        <>
          <CheckCard
            checked={referral}
            onChange={setReferral}
            title="My Nado account was made with PerpPilot’s link"
            description="Created, or first funded, through our referral. Not yet? Do step 1 first."
          />
          {state === "no-wallet" ? (
            <div className="anim-fade flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Notice tone="error">No wallet found in this browser. Install one of these extensions, then try again.</Notice>
                <LinkRow title="MetaMask" meta="Browser extension" href="https://metamask.io/download" />
                <LinkRow title="Rabby" meta="Browser extension" href="https://rabby.io" />
                <LinkRow title="Coinbase Wallet" meta="Browser extension" href="https://www.coinbase.com/wallet/downloads" />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setState("pick")}>
                  Use WalletConnect
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setScenario("happy");
                    connect();
                  }}
                >
                  Try again
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button disabled={!referral || state === "connecting"} onClick={connect} iconLeft={state === "connecting" ? <Spinner /> : <Icon name="wallet" size={20} />}>
                {state === "connecting" ? "Waiting for your wallet…" : "Connect browser wallet"}
              </Button>
              <Button variant="secondary" disabled={!referral || state === "connecting"} onClick={() => setState("pick")}>
                Use WalletConnect
              </Button>
              <p className="t-b14 text-white/30">
                {referral
                  ? "A browser wallet is an extension like MetaMask, Rabby or Coinbase Wallet. On your phone, use WalletConnect."
                  : "Tick the referral box to continue. A browser wallet is an extension like MetaMask, Rabby or Coinbase Wallet."}
              </p>
            </div>
          )}
        </>
      )}
      <ScenarioPicker value={scenario} onChange={(s) => setScenario(s)} />
    </Panel>
  );
}

/** Presenter control: choose which wallet outcome the prototype shows. */
function ScenarioPicker({ value, onChange }: { value: Scenario; onChange: (s: Scenario) => void }) {
  const opts: [Scenario, string][] = [
    ["happy", "Wallet found"],
    ["no-wallet", "No wallet"],
    ["not-referral", "Not under referral"],
  ];
  return (
    <div className="flex items-center gap-2 rounded-sm border border-dashed border-white/15 px-3 py-2">
      <span className="t-l12 text-white/30">Prototype</span>
      {opts.map(([v, l]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn("t-b14 rounded-sm px-2 py-0.5", v === value ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Spinner() {
  return <span className="spin inline-block size-4 rounded-full border-2 border-white/20 border-t-white/70" />;
}

/* ---------- API-key exchanges (no 2027 frame yet: same layout as Nado) ---------- */

const GUIDES: Record<Exclude<ExchangeId, "nado">, { intro: string; steps: string[]; tip: string; url: string; fields: { label: string; placeholder: string }[] }> = {
  hyperliquid: {
    intro: "Hyperliquid connects with an API wallet. You create it once in Hyperliquid and paste it here.",
    steps: ["Open Hyperliquid and log in", "Go to More › API and create an API wallet", "Authorize it and copy the private key", "Paste the address and key on the right"],
    tip: "The API wallet can trade but can't withdraw. Keep USDC on Hyperliquid as margin.",
    url: "https://app.hyperliquid.xyz/API",
    fields: [
      { label: "Main wallet address", placeholder: "0x…" },
      { label: "API wallet private key", placeholder: "Paste the private key" },
    ],
  },
  lighter: {
    intro: "Lighter connects with an API key. You create it in Lighter and paste it here.",
    steps: ["Open Lighter and log in", "Open Settings › API keys", "Create a key and copy the private key and index", "Paste them on the right"],
    tip: "Lighter has no trading fees for standard accounts, so small bots work well here.",
    url: "https://app.lighter.xyz",
    fields: [
      { label: "Account index", placeholder: "e.g. 12345" },
      { label: "API key index", placeholder: "e.g. 2" },
      { label: "API private key", placeholder: "Paste the private key" },
    ],
  },
  extended: {
    intro: "Extended needs an API key and your Stark keys. It takes about 5 minutes.",
    steps: ["Open Extended and log in", "Go to API Management and create a key", "Show the Stark keys and the vault number", "Paste all four values on the right"],
    tip: "Copy the Stark private key right away: Extended shows it only once.",
    url: "https://app.extended.exchange/api-management",
    fields: [
      { label: "API key", placeholder: "Paste the API key" },
      { label: "Stark public key", placeholder: "0x…" },
      { label: "Stark private key", placeholder: "0x…" },
      { label: "Vault number", placeholder: "e.g. 100231" },
    ],
  },
};

function KeysPanel({ id, from }: { id: Exclude<ExchangeId, "nado">; from: string | null }) {
  const router = useRouter();
  const { addAccount, state: store } = useStore();
  const g = GUIDES[id];
  const [name, setName] = useState("");
  const [vals, setVals] = useState<string[]>(g.fields.map(() => ""));
  const [checking, setChecking] = useState(false);
  const filled = vals.every((v) => v.trim().length > 0);
  return (
    <Panel title={`Paste your ${EXCHANGES[id].name} keys`} description="Keys are encrypted with your PIN. PerpPilot can trade, never withdraw.">
      <Field label="Account name" placeholder="e.g. Main trading account" value={name} onChange={setName} />
      {g.fields.map((f, i) => (
        <Field
          key={f.label}
          label={f.label}
          placeholder={f.placeholder}
          value={vals[i]}
          onChange={(v) => setVals((s) => s.map((x, j) => (j === i ? v : x)))}
        />
      ))}
      <div className="flex flex-col gap-2">
        <Button
          disabled={checking}
          iconLeft={checking ? <Spinner /> : undefined}
          iconRight={checking ? undefined : <ArrowRight />}
          onClick={() => {
            setChecking(true);
            setTimeout(() => {
              addAccount({ id: `acc-user-${id}`, name: name.trim() || "Main trading account", exchange: id, available: 860 });
              router.push(afterConnect(from, store.pin));
            }, 900);
          }}
        >
          {checking ? "Checking your keys…" : "Connect account"}
        </Button>
        {!filled && <p className="t-b14 text-white/30">Prototype: you can continue with empty fields.</p>}
      </div>
    </Panel>
  );
}

/** Where to go once an account is connected. */
function afterConnect(from: string | null, hasPin: boolean) {
  if (from === "create-bot") return "/create-bot/account";
  if (from === "accounts") return "/accounts";
  return hasPin ? "/setup/ready" : "/setup/pin";
}
