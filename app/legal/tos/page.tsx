"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: December 11, 2025
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using CANDID, you agree to be bound by these Terms
              of Service. If you do not agree to these terms, please do not use
              our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              2. Description of Service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              CANDID is a conversational form builder platform that allows users
              to create, distribute, and analyze interactive forms. Our
              AI-powered platform transforms traditional forms into engaging
              conversations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When you create an account, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>
                Accept responsibility for all activities under your account
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to use CANDID to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Collect sensitive personal data without proper consent</li>
              <li>Send spam or unsolicited communications</li>
              <li>Engage in any illegal or fraudulent activities</li>
              <li>Violate the intellectual property rights of others</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              5. Intellectual Property
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              CANDID and its original content, features, and functionality are
              owned by CANDID and are protected by international copyright,
              trademark, and other intellectual property laws. You retain
              ownership of the content you create using our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              6. Subscription and Billing
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Some features of CANDID require a paid subscription. By
              subscribing, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                Pay all applicable fees as described at the time of purchase
              </li>
              <li>Provide accurate billing information</li>
              <li>
                Accept automatic renewal unless you cancel before the renewal
                date
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              7. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              CANDID is provided &quot;as is&quot; without warranties of any
              kind. We shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages resulting from your
              use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account at any time for
              violations of these terms. Upon termination, your right to use the
              service will immediately cease. You may also delete your account
              at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. We will
              notify you of significant changes via email or through the
              platform. Continued use of CANDID after changes constitutes
              acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please
              contact us at{" "}
              <a
                href="mailto:legal@candid.com"
                className="text-[#F56A4D] hover:underline"
              >
                legal@candid.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
