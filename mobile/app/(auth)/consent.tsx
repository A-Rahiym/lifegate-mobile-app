import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from 'components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIVACY_URL = 'https://www.lifegate.com/privacy-policy';
const TERMS_URL = 'https://www.lifegate.com/terms';
const NDPC_URL = 'https://ndpc.gov.ng';

// Section component for clean structure
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View className="mb-5">
    <Text className="mb-2 text-sm font-bold text-[#0EA5A4]">{title}</Text>
    <View>{children}</View>
  </View>
);

const Bullet = ({ text }: { text: string }) => (
  <View className="mb-1 flex-row items-start">
    <Text className="mr-2 text-xs text-gray-500">•</Text>
    <Text className="flex-1 text-xs leading-5 text-gray-700">{text}</Text>
  </View>
);

const Link = ({ label, url }: { label: string; url: string }) => (
  <Text
    className="text-xs font-semibold text-[#0EA5A4] underline"
    onPress={() => Linking.openURL(url)}>
    {label}
  </Text>
);

export default function ConsentScreen() {
  const { role } = useLocalSearchParams<{ role: 'user' | 'professional' }>();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 32;
    if (isAtBottom && !hasScrolledToBottom) setHasScrolledToBottom(true);
  };

  const handleDecline = () => {
    router.back();
  };

  const handleAccept = () => {
    if (!agreed) return;
    if (role === 'professional') {
      router.push('/(auth)/(health-professional)');
    } else {
      router.push('/(auth)/(user)');
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <LinearGradient
        colors={['#0AADA2', '#043B3C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.25 }}
        style={{ flex: 1 }}>
        {/* Header */}
        <View className="flex-row items-center px-4 pb-5 pt-4">
          <Pressable onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={22} color="white" />
          </Pressable>
          <View className="flex-1 items-center">
            <Text className="text-base font-bold text-white">Data Privacy Notice</Text>
            <Text className="mt-0.5 text-xs text-white/70">NDPA 2023 — Please read carefully</Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Content card */}
        <View className="flex-1 overflow-hidden rounded-t-[32px] bg-[#F7FEFD]">
          {/* Scroll-to-read hint */}
          {!hasScrolledToBottom && (
            <View className="flex-row items-center justify-center border-b border-amber-100 bg-amber-50 px-4 py-2">
              <Ionicons name="arrow-down-circle-outline" size={15} color="#D97706" />
              <Text className="ml-1 text-xs font-medium text-amber-700">
                Please scroll to read the full notice before consenting
              </Text>
            </View>
          )}

          <ScrollView
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}
            showsVerticalScrollIndicator={true}>

            {/* Badge */}
            <View className="mb-4 flex-row items-center self-start rounded-full bg-[#EDF9F9] px-3 py-1.5">
              <Ionicons name="shield-checkmark-outline" size={14} color="#0EA5A4" />
              <Text className="ml-1.5 text-xs font-semibold text-[#0EA5A4]">
                Nigeria Data Protection Act 2023
              </Text>
            </View>

            <Text className="mb-1 text-lg font-bold text-gray-900">
              Consent to Process Personal & Health Data
            </Text>
            <Text className="mb-5 text-xs leading-5 text-gray-500">
              Effective Date: January 1, 2025 · Last updated: March 28, 2026
            </Text>

            {/* 1. Data Controller */}
            <Section title="1. Data Controller">
              <Text className="mb-1 text-xs leading-5 text-gray-700">
                <Text className="font-semibold">DSHub</Text> ("we", "us", or "our"), operating the
                LifeGate platform, is the data controller responsible for your personal data. We
                process your data in compliance with the{' '}
                <Text className="font-semibold">Nigeria Data Protection Act 2023 (NDPA)</Text> and
                the Nigeria Data Protection Regulation (NDPR) issued by the Nigeria Data Protection
                Commission (NDPC).
              </Text>
              <Text className="mt-1 text-xs text-gray-500">
                Contact:{' '}
                <Text
                  className="text-[#0EA5A4] underline"
                  onPress={() => Linking.openURL('mailto:privacy@dshub.ng')}>
                  privacy@dshub.ng
                </Text>
              </Text>
            </Section>

            {/* 2. Data Collected */}
            <Section title="2. Personal Data We Collect">
              <Text className="mb-2 text-xs leading-5 text-gray-700">
                We collect the following categories of data when you register and use LifeGate:
              </Text>
              <Text className="mb-1 text-xs font-semibold text-gray-800">
                Standard Personal Data:
              </Text>
              <Bullet text="Full name, email address, phone number" />
              <Bullet text="Date of birth, gender, preferred language" />
              <Bullet text="Account credentials (stored in encrypted form)" />
              <Text className="mb-1 mt-3 text-xs font-semibold text-red-700">
                ⚠ Sensitive / Special Category Data (Health Data):
              </Text>
              <Bullet text="Self-reported health history, symptoms, and medical background" />
              <Bullet text="AI-generated diagnoses and urgency assessments" />
              <Bullet text="Consultation records and physician notes (professionals only)" />
              <Bullet text="Professional certifications and licence numbers (professionals only)" />
            </Section>

            {/* 3. Purpose & Legal Basis */}
            <Section title="3. Purpose & Legal Basis for Processing">
              <Text className="mb-2 text-xs leading-5 text-gray-700">
                Under the NDPA 2023, we rely on the following legal bases:
              </Text>
              <View className="mb-2 rounded-xl border border-teal-100 bg-teal-50 p-3">
                <Text className="mb-1 text-xs font-bold text-teal-800">
                  Explicit Consent (§ 25 NDPA)
                </Text>
                <Text className="text-xs leading-5 text-teal-700">
                  Processing your health data for AI-assisted diagnosis and physician review.
                  You may withdraw this consent at any time.
                </Text>
              </View>
              <View className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <Text className="mb-1 text-xs font-bold text-gray-800">Legitimate Interest</Text>
                <Text className="text-xs leading-5 text-gray-700">
                  Providing, improving, and securing the platform and communicating important
                  service updates.
                </Text>
              </View>
            </Section>

            {/* 4. How Data is Used */}
            <Section title="4. How We Use Your Data">
              <Bullet text="To create and manage your LifeGate account" />
              <Bullet text="To provide AI-powered health assessments and symptom analysis" />
              <Bullet text="To connect patients with licensed physicians for diagnosis review and validation" />
              <Bullet text="To send transactional notifications (OTP codes, security alerts)" />
              <Bullet text="To improve AI model accuracy (only using de-identified data)" />
              <Bullet text="To comply with applicable Nigerian health and data protection laws" />
            </Section>

            {/* 5. Data Sharing */}
            <Section title="5. Who We Share Your Data With">
              <Text className="mb-2 text-xs leading-5 text-gray-700">
                We do <Text className="font-bold">not</Text> sell your personal data. We share
                it only with:
              </Text>
              <Bullet text="Licensed physicians on the LifeGate platform — for consultation and review of AI diagnoses" />
              <Bullet text="AI service providers (e.g. Google Gemini, OpenAI, Anthropic) — for generating health assessments; data is processed under confidentiality agreements" />
              <Bullet text="Cloud infrastructure providers — for secure hosting and data storage" />
              <Bullet text="Nigerian regulatory and law enforcement authorities — only where legally required" />
            </Section>

            {/* 6. Data Retention */}
            <Section title="6. Data Retention">
              <Text className="text-xs leading-5 text-gray-700">
                Your data is retained for as long as your account is active. Upon account deletion,
                personal data is removed within <Text className="font-semibold">90 days</Text>,
                except where retention is required by Nigerian law (e.g. health records may be
                retained for up to <Text className="font-semibold">7 years</Text> under applicable
                health regulations). De-identified, aggregated data may be retained indefinitely for
                research purposes.
              </Text>
            </Section>

            {/* 7. Your Rights */}
            <Section title="7. Your Rights Under the NDPA 2023">
              <Text className="mb-2 text-xs leading-5 text-gray-700">
                The NDPA 2023 grants you the following rights regarding your personal data:
              </Text>
              <Bullet text="Right of Access — obtain a copy of your personal data" />
              <Bullet text="Right to Rectification — correct inaccurate or incomplete data" />
              <Bullet text="Right to Erasure — request deletion of your data (subject to legal obligations)" />
              <Bullet text="Right to Data Portability — receive your data in a machine-readable format" />
              <Bullet text="Right to Object — object to certain processing activities" />
              <Bullet text="Right to Withdraw Consent — at any time, without affecting the lawfulness of prior processing" />
              <Bullet text="Right to Lodge a Complaint — with the Nigeria Data Protection Commission (NDPC)" />
              <Text className="mt-2 text-xs text-gray-500">
                Exercise your rights via{' '}
                <Text
                  className="text-[#0EA5A4] underline"
                  onPress={() => Linking.openURL('mailto:privacy@dshub.ng')}>
                  privacy@dshub.ng
                </Text>
                {' '}or contact the NDPC at{' '}
                <Link label="ndpc.gov.ng" url={NDPC_URL} />.
              </Text>
            </Section>

            {/* 8. Security */}
            <Section title="8. Data Security">
              <Text className="text-xs leading-5 text-gray-700">
                We implement industry-standard security measures including encryption at rest and in
                transit (TLS), role-based access controls, and regular security audits. However, no
                system is completely secure. If you suspect a breach, contact us immediately at{' '}
                <Text
                  className="text-[#0EA5A4] underline"
                  onPress={() => Linking.openURL('mailto:security@dshub.ng')}>
                  security@dshub.ng
                </Text>
                .
              </Text>
            </Section>

            {/* 9. Cross-border */}
            <Section title="9. International Data Transfers">
              <Text className="text-xs leading-5 text-gray-700">
                Your data may be processed on servers outside Nigeria (e.g., by AI providers). Where
                this occurs, we ensure appropriate safeguards are in place consistent with NDPA § 43
                requirements, including standard contractual clauses and adequacy decisions.
              </Text>
            </Section>

            {/* 10. Policy link */}
            <Section title="10. Full Privacy Policy">
              <Text className="text-xs leading-5 text-gray-700">
                This notice is a summary. Our full{' '}
                <Link label="Privacy Policy" url={PRIVACY_URL} />
                {' '}and{' '}
                <Link label="Terms of Service" url={TERMS_URL} />
                {' '}contain additional details about our data practices.
              </Text>
            </Section>

            {/* Consent checkbox */}
            <View className="mt-2 rounded-2xl border border-teal-200 bg-teal-50 p-4">
              <Pressable
                onPress={() => setAgreed((v) => !v)}
                className="flex-row items-start">
                <View
                  className={`mr-3 mt-0.5 h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 ${
                    agreed ? 'border-teal-600 bg-teal-600' : 'border-gray-400 bg-white'
                  }`}>
                  {agreed && <Ionicons name="checkmark" size={13} color="white" />}
                </View>
                <Text className="flex-1 text-xs leading-5 text-gray-800">
                  I have read and understood this Data Privacy Notice. I{' '}
                  <Text className="font-bold">explicitly consent</Text> to DSHub (LifeGate)
                  collecting, processing, and storing my personal data — including sensitive health
                  data — for the purposes described above, in accordance with the{' '}
                  <Text className="font-semibold">Nigeria Data Protection Act 2023</Text>.
                </Text>
              </Pressable>

              {!hasScrolledToBottom && (
                <Text className="mt-2 text-center text-xs text-amber-600">
                  Please scroll to the bottom to enable consent
                </Text>
              )}
            </View>

            <View className="mt-5 gap-3">
              <PrimaryButton
                title="I Consent — Continue"
                onPress={handleAccept}
                disabled={!agreed || !hasScrolledToBottom}
              />
              <Pressable
                onPress={handleDecline}
                className="items-center rounded-2xl border border-gray-300 py-4">
                <Text className="text-sm font-semibold text-gray-600">
                  Decline — Go Back
                </Text>
              </Pressable>
            </View>

            {/* Copyright */}
            <Text className="mt-6 text-center text-xs text-gray-400">
              © {new Date().getFullYear()} LifeGate by DSHub. All rights reserved.
            </Text>
          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
