"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { HTMLInputTypeAttribute } from "react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "~/components/ui/field";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

type VerificationForm = {
  employeeId: string;
  email: string;
  password: string;
};

type VerificationResult = {
  status: string;
  message: string;
  data?: Array<Record<string, unknown>>;
};

const initialForm: VerificationForm = {
  employeeId: "",
  email: "",
  password: "",
};

const fieldMeta: Array<{
  key: keyof VerificationForm;
  label: string;
  type?: HTMLInputTypeAttribute;
  description?: string;
  autoComplete?: string;
  placeholder?: string;
}> = [
  { key: "employeeId", label: "Employee ID", type: "text", placeholder: "Enter your employee ID", description: "Your unique employee identifier" },
  { key: "email", label: "Email Address", type: "email", autoComplete: "email", placeholder: "your.email@company.com" },
  { key: "password", label: "Password", type: "password", autoComplete: "current-password", placeholder: "Enter your password" },
];

export default function ApplyPage() {
  const [form, setForm] = useState<VerificationForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<VerificationResult | undefined>(undefined);
  const [clientError, setClientError] = useState<string | undefined>(undefined);

  const missingFields = useMemo(() =>
    Object.entries(form)
      .filter(([, value]) => !value.trim())
      .map(([key]) => key),
  [form]);

  const handleChange = (key: keyof VerificationForm) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(undefined);
    setClientError(undefined);
    setSubmitting(true);

    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: form.employeeId,
          email: form.email,
          password: form.password,
        }),
        cache: "no-store",
      });

      const data = (await response.json()) as VerificationResult;
      const status = "status" in data ? data.status : response.ok ? "verified" : "error";
      const message = "message" in data && typeof data.message === "string"
        ? data.message
        : response.ok
          ? "Verification successful."
          : "Verification failed.";

      setResult({ 
        status, 
        message,
        data: data.data // Capture the data field from response
      });
    } catch (error) {
      console.error("Verification failed", error);
      setResult({ status: "error", message: "Unable to verify identity." });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setClientError(undefined);
    setResult(undefined);
  };

  const statusTone = useMemo(() => {
    if (!result) return "";
    if (result.status === "verified") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40";
    if (result.status === "not_found") return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/40";
    return "bg-destructive/10 text-destructive border border-destructive/50";
  }, [result]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Password Reset - Identity Verification</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          To reset your password, please verify your identity by providing your Employee ID and email address. 
          We'll retrieve your account information to confirm your identity before proceeding with the password reset.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FieldSet>
          <FieldLegend>Identity Verification</FieldLegend>
          <FieldGroup>
            {fieldMeta.map(({ key, label, type = "text", description, autoComplete, placeholder }) => (
              <Field key={key}>
                <FieldLabel htmlFor={key}>{label}</FieldLabel>
                <Input
                  id={key}
                  name={key}
                  type={type}
                  autoComplete={autoComplete}
                  value={form[key]}
                  onChange={handleChange(key)}
                  placeholder={placeholder}
                />
                {description ? <FieldDescription>{description}</FieldDescription> : null}
              </Field>
            ))}
          </FieldGroup>
        </FieldSet>

        <FieldError>{clientError}</FieldError>

        {result ? (
          <>
            <div role="status" className={`rounded-md px-4 py-3 text-sm font-medium ${statusTone}`}>
              {result.message}
            </div>
            
            {result.data && result.data.length > 0 ? (
              <div className="mt-4 p-4 bg-muted/50 border border-border rounded-md">
                <h3 className="text-foreground font-semibold mb-3">
                  Employee Information Retrieved
                </h3>
                <div className="space-y-4">
                  {result.data.map((row, idx) => (
                    <div key={idx} className="bg-background/60 p-3 rounded border border-border">
                      <pre className="text-xs text-foreground overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(row, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Verifying..." : "Verify Identity"}
          </Button>
          <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}
