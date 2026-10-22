"use client";

import { useState } from "react";
import { LanguageToggle } from "@/components/shell/language-switcher";
import { PageBody, PageHeader } from "@/components/shell/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, PinInput, Section, TextField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { currentUser } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n";
import { usePlatformData } from "@/lib/platform-data";

export function SettingsView() {
  const { t } = useI18n();
  const { reset, accounts, bots, savePin } = usePlatformData();
  const [saved, setSaved] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [alerts, setAlerts] = useState({ outOfRange: true, stopped: true, changelog: false });

  return (
    <>
      <PageHeader title={t("profile.settings")} subtitle="Your profile, language, security and notifications." />
      <PageBody className="grid max-w-[880px] gap-4">
        <Section title="Profile" description="Shown on your account and in support tickets.">
          <form
            className="grid gap-5 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSaved(true);
            }}
            onChange={() => setSaved(false)}
          >
            <TextField label="Name" name="name" defaultValue={currentUser.name} autoComplete="name" />
            <TextField label="E-mail" name="email" type="email" defaultValue={currentUser.email} autoComplete="email" />
            <div className="flex items-center gap-4 sm:col-span-2">
              <Button type="submit">Save changes</Button>
              {saved && <span role="status" className="animate-fade-in text-[14px] text-brand">Saved</span>}
            </div>
          </form>
        </Section>

        <Section className="[&>header]:mb-0" title={t("nav.language")} description="The platform is available in English and German." action={<LanguageToggle />} />

        <Section title="Security" description="Your 6 digit PIN confirms new bots and changes to exchange keys.">
          <Button variant="secondary" icon="settings" onClick={() => setPinOpen(true)}>
            Change PIN
          </Button>
        </Section>

        <Section title="Notifications" description="E-mail alerts about your bots.">
          <div className="flex flex-col gap-4">
            <Checkbox checked={alerts.outOfRange} onChange={(v) => setAlerts((a) => ({ ...a, outOfRange: v }))}>
              A bot moves out of range
            </Checkbox>
            <Checkbox checked={alerts.stopped} onChange={(v) => setAlerts((a) => ({ ...a, stopped: v }))}>
              A bot stops or errors
            </Checkbox>
            <Checkbox checked={alerts.changelog} onChange={(v) => setAlerts((a) => ({ ...a, changelog: v }))}>
              Product updates and new exchanges
            </Checkbox>
          </div>
        </Section>

        <Section title="Start over" description={`Removes the ${accounts.length} accounts and ${bots.length} bots saved in this browser, so the platform is back to a first visit.`}>
          <Button variant="secondary" disabled={!accounts.length && !bots.length} onClick={reset}>
            Reset account data
          </Button>
        </Section>

        <div>
          <ButtonLink href="/login" variant="ghost" icon="log-out">
            {t("profile.logout")}
          </ButtonLink>
        </div>
      </PageBody>

      <Modal
        open={pinOpen}
        onClose={() => {
          setPinOpen(false);
          setPin("");
        }}
        title="Change PIN"
        description="Enter a new 6 digit PIN."
      >
        <div className="flex flex-col gap-6">
          <PinInput value={pin} onChange={setPin} autoFocus />
          <Button
            size="lg"
            disabled={pin.length < 6}
            onClick={() => {
              savePin();
              setPinOpen(false);
              setPin("");
            }}
          >
            Save PIN
          </Button>
        </div>
      </Modal>
    </>
  );
}
