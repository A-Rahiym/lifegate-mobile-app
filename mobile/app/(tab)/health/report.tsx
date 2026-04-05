import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { useHealthStore } from 'stores/health-store';
import { useAuthStore } from 'stores/auth/auth-store';
import type { HealthTimelineEntry } from 'types/health-types';

// ─── Constants ────────────────────────────────────────────────────────────────

const URGENCY_COLOR: Record<string, string> = {
  LOW: '#16a34a', MEDIUM: '#d97706', HIGH: '#dc2626', CRITICAL: '#7c3aed',
};
const URGENCY_BG: Record<string, string> = {
  LOW: '#f0fdf4', MEDIUM: '#fffbeb', HIGH: '#fef2f2', CRITICAL: '#faf5ff',
};
const URGENCY_BORDER: Record<string, string> = {
  LOW: '#bbf7d0', MEDIUM: '#fde68a', HIGH: '#fecaca', CRITICAL: '#ddd6fe',
};
const URGENCY_LABEL: Record<string, string> = {
  LOW: 'Low Risk', MEDIUM: 'Moderate', HIGH: 'High Risk', CRITICAL: 'Critical',
};
const STATUS_COLOR: Record<string, string> = {
  Pending: '#d97706', Active: '#2563eb', Completed: '#16a34a',
};

type ExportFormat = 'pdf' | 'png' | 'jpeg';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return iso; }
}

function deriveOverallStatus(entries: HealthTimelineEntry[]) {
  const active = entries.filter((e) => e.status !== 'Completed');
  const check = active.length > 0 ? active[0] : entries[0];
  if (!check) return { label: 'Stable', color: '#16a34a' };
  if (check.urgency === 'CRITICAL') return { label: 'Critical', color: '#7c3aed' };
  if (check.urgency === 'HIGH') return { label: 'High Risk', color: '#dc2626' };
  if (check.urgency === 'MEDIUM') return { label: 'Monitor', color: '#d97706' };
  return { label: 'Stable', color: '#16a34a' };
}

function detectRecurring(entries: HealthTimelineEntry[]): Set<string> {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const k = (e.condition || e.title).toLowerCase().trim();
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const set = new Set<string>();
  counts.forEach((n, k) => { if (n >= 2) set.add(k); });
  return set;
}

function urgencyDistribution(entries: HealthTimelineEntry[]) {
  const dist: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  entries.forEach((e) => { dist[e.urgency] = (dist[e.urgency] ?? 0) + 1; });
  return dist;
}

// ─── HTML Report Generator ───────────────────────────────────────────────────

function buildReportHTML(
  patientName: string,
  entries: HealthTimelineEntry[],
  reportDate: string
): string {
  const status = deriveOverallStatus(entries);
  const dist = urgencyDistribution(entries);
  const abnormal = entries.filter((e) => e.urgency === 'HIGH' || e.urgency === 'CRITICAL');
  const escalated = entries.filter((e) => e.escalated);
  const completed = entries.filter((e) => e.status === 'Completed').length;
  const recurringSet = detectRecurring(entries);
  const preview = entries.slice(0, 15);

  const entryRows = preview
    .map(
      (e) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#374151;">${e.condition || e.title}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;font-size:12px;">
        <span style="color:${URGENCY_COLOR[e.urgency]};font-weight:700;">${URGENCY_LABEL[e.urgency]}</span>
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;font-size:12px;color:${STATUS_COLOR[e.status] ?? '#6b7280'};font-weight:600;">${e.status}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;">${formatDate(e.createdAt)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;font-size:12px;">${e.escalated ? '<span style="color:#7c3aed;font-weight:700;">Yes</span>' : '<span style="color:#9ca3af;">No</span>'}</td>
    </tr>`
    )
    .join('');

  const concernRows = abnormal
    .slice(0, 5)
    .map(
      (e) => `
    <div style="margin-bottom:10px;padding:12px;background:${URGENCY_BG[e.urgency]};border:1px solid ${URGENCY_BORDER[e.urgency]};border-radius:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;font-weight:700;color:#111827;">${e.condition || e.title}</span>
        <span style="font-size:11px;font-weight:700;color:${URGENCY_COLOR[e.urgency]};background:${URGENCY_COLOR[e.urgency]}18;padding:2px 8px;border-radius:20px;">${URGENCY_LABEL[e.urgency]}</span>
      </div>
      <p style="font-size:12px;color:#6b7280;margin:6px 0 0;">${e.description || 'No description provided.'}</p>
      <span style="font-size:11px;color:#9ca3af;">${formatDate(e.createdAt)}</span>
    </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; background: #f9fafb; color: #111827; }
  .page { max-width: 800px; margin: 0 auto; padding: 32px 24px; background: #fff; }
  h2 { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #f3f4f6; }
  .section { margin-bottom: 28px; }
  .badge { display:inline-block;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px; }
  table { width:100%;border-collapse:collapse; }
  th { padding:10px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;background:#f9fafb;border-bottom:1px solid #e5e7eb; }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:20px 24px;margin-bottom:24px;background:linear-gradient(135deg,#0AADA2,#0d7c74);border-radius:16px;color:#fff;">
    <div>
      <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">LifeGate · Health Report</div>
      <div style="font-size:22px;font-weight:800;">${patientName}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:4px;">Generated ${reportDate}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:rgba(255,255,255,0.75);font-weight:600;text-transform:uppercase;letter-spacing:.8px;">Overall Status</div>
      <div style="font-size:20px;font-weight:800;color:#fff;margin-top:2px;">${status.label}</div>
    </div>
  </div>

  <!-- Summary Stats -->
  <div class="section">
    <h2>Summary</h2>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      ${[
        { label: 'Total Cases', value: entries.length, color: '#0891b2' },
        { label: 'Active', value: entries.filter((e: HealthTimelineEntry) => e.status !== 'Completed').length, color: '#d97706' },
        { label: 'Completed', value: completed, color: '#16a34a' },
        { label: 'Abnormal', value: abnormal.length, color: '#dc2626' },
        { label: 'Escalated', value: escalated.length, color: '#7c3aed' },
      ]
        .map(
          (s) => `<div style="flex:1;min-width:120px;padding:14px;background:#f9fafb;border-radius:12px;text-align:center;border:1px solid #f3f4f6;">
        <div style="font-size:26px;font-weight:800;color:${s.color};">${s.value}</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px;font-weight:500;">${s.label}</div>
      </div>`
        )
        .join('')}
    </div>
  </div>

  <!-- Urgency Distribution -->
  <div class="section">
    <h2>Severity Distribution</h2>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      ${(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const)
        .map(
          (u) => `<div style="flex:1;min-width:100px;padding:12px;background:${URGENCY_BG[u]};border:1px solid ${URGENCY_BORDER[u]};border-radius:12px;text-align:center;">
        <div style="font-size:22px;font-weight:800;color:${URGENCY_COLOR[u]};">${dist[u]}</div>
        <div style="font-size:11px;color:${URGENCY_COLOR[u]};font-weight:600;margin-top:2px;">${URGENCY_LABEL[u]}</div>
      </div>`
        )
        .join('')}
    </div>
  </div>

  <!-- Key Concerns -->
  ${
    abnormal.length > 0
      ? `<div class="section">
    <h2>⚠ Key Concerns (Abnormal Entries)</h2>
    ${concernRows}
  </div>`
      : ''
  }

  <!-- Symptom History Table -->
  <div class="section">
    <h2>Symptom History ${entries.length > 15 ? `(Latest 15 of ${entries.length})` : ''}</h2>
    <table>
      <thead><tr>
        <th>Condition</th><th>Severity</th><th>Status</th><th>Date</th><th>Escalated</th>
      </tr></thead>
      <tbody>${entryRows}</tbody>
    </table>
  </div>

  <!-- Footer -->
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #f3f4f6;text-align:center;">
    <p style="font-size:11px;color:#9ca3af;">This report is generated from data recorded in the LifeGate health platform.</p>
    <p style="font-size:11px;color:#9ca3af;margin-top:4px;">It is not a substitute for professional medical advice, diagnosis, or treatment.</p>
    <p style="font-size:12px;font-weight:700;color:#0AADA2;margin-top:8px;">LifeGate · AI-Powered Health Intelligence</p>
  </div>

</div>
</body>
</html>`;
}

// ─── Report Section Components ────────────────────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={14} color="#0AADA2" />
      </View>
      <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827', textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</Text>
    </View>
  );
}

function StatCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 2, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}

function EntryRow({ entry, isRecurring }: { entry: HealthTimelineEntry; isRecurring: boolean }) {
  const color = URGENCY_COLOR[entry.urgency] ?? '#6b7280';
  const isAbnormal = entry.urgency === 'HIGH' || entry.urgency === 'CRITICAL';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9fafb', gap: 10 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginTop: 4, flexShrink: 0 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }} numberOfLines={1}>
          {entry.condition || entry.title}
        </Text>
        <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{formatDate(entry.createdAt)}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', flexShrink: 0 }}>
        <View style={{ backgroundColor: color + '18', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color }}>{URGENCY_LABEL[entry.urgency]}</Text>
        </View>
        {isAbnormal && (
          <View style={{ backgroundColor: '#fef2f2', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#dc2626' }}>⚠</Text>
          </View>
        )}
        {isRecurring && (
          <View style={{ backgroundColor: '#fffbeb', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#d97706' }}>↻</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Export Button ────────────────────────────────────────────────────────────

function ExportButton({
  icon,
  label,
  sublabel,
  color,
  onPress,
  loading,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel: string;
  color: string;
  onPress: () => void;
  loading: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: pressed ? color + '18' : '#f9fafb',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: color + '33',
        opacity: loading ? 0.6 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name={icon} size={22} color={color} />
      )}
      <Text style={{ fontSize: 11, fontWeight: '700', color, marginTop: 5 }}>{label}</Text>
      <Text style={{ fontSize: 9, color: '#9ca3af', marginTop: 1 }}>{sublabel}</Text>
    </Pressable>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HealthReportScreen() {
  const { patientTimeline } = useHealthStore();
  const { user } = useAuthStore();

  const viewShotRef = useRef<ViewShot>(null);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const patientName = user?.name ?? 'Patient';
  const reportDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const recurringSet = useMemo(() => detectRecurring(patientTimeline), [patientTimeline]);
  const dist = useMemo(() => urgencyDistribution(patientTimeline), [patientTimeline]);
  const abnormal = useMemo(() => patientTimeline.filter((e) => e.urgency === 'HIGH' || e.urgency === 'CRITICAL'), [patientTimeline]);
  const status = useMemo(() => deriveOverallStatus(patientTimeline), [patientTimeline]);
  const completed = patientTimeline.filter((e) => e.status === 'Completed').length;
  const active = patientTimeline.filter((e) => e.status !== 'Completed').length;
  const escalatedCount = patientTimeline.filter((e) => e.escalated).length;
  const preview = patientTimeline.slice(0, 20);

  const exportPDF = useCallback(async () => {
    try {
      setExporting('pdf');
      const html = buildReportHTML(patientName, patientTimeline, reportDate);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Health Report (PDF)' });
      } else {
        Alert.alert('Saved', `Report saved to: ${uri}`);
      }
    } catch (err) {
      Alert.alert('Export Failed', 'Could not generate the PDF report. Please try again.');
    } finally {
      setExporting(null);
    }
  }, [patientName, patientTimeline, reportDate]);

  const exportImage = useCallback(async (format: 'png' | 'jpeg') => {
    try {
      setExporting(format);
      const ref = viewShotRef.current;
      if (!ref) throw new Error('No view ref');
      // @ts-ignore - capture method exists at runtime
      const uri: string = await ref.capture();
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
          dialogTitle: `Share Health Report (${format.toUpperCase()})`,
        });
      } else {
        Alert.alert('Saved', `Image saved to: ${uri}`);
      }
    } catch (err) {
      Alert.alert('Export Failed', `Could not capture the report as ${format.toUpperCase()}.`);
    } finally {
      setExporting(null);
    }
  }, []);

  const hasSharingAvailable = Platform.OS !== 'web';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }} edges={['top']}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <Pressable onPress={() => router.back()} style={{ padding: 6, marginRight: 8, borderRadius: 20, backgroundColor: '#f3f4f6' }} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color="#374151" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>Health Report</Text>
          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Preview · Export as PDF, PNG or JPEG</Text>
        </View>
        <Pressable
          onPress={exportPDF}
          disabled={exporting !== null}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0AADA2', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}
        >
          {exporting === 'pdf' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="download-outline" size={15} color="#fff" />
          )}
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>PDF</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* === Report Preview === */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1 }}
          style={{ backgroundColor: '#fff' }}
        >
          {/* Report Title Banner */}
          <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 12, borderRadius: 18, overflow: 'hidden' }}>
            <View style={{ backgroundColor: '#0AADA2', padding: 20 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>
                LifeGate · Health Report
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 4 }}>{patientName}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Generated {reportDate}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: '600' }}>Status</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 1 }}>{status.label}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Summary strip */}
          <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row' }}>
              {[
                { label: 'Total', value: patientTimeline.length, color: '#0891b2' },
                { label: 'Active', value: active, color: '#d97706' },
                { label: 'Completed', value: completed, color: '#16a34a' },
              ].map((s, i, arr) => (
                <View key={s.label} style={{ flex: 1, borderRightWidth: i < arr.length - 1 ? 1 : 0, borderRightColor: '#f3f4f6' }}>
                  <StatCell {...s} />
                </View>
              ))}
            </View>
            <View style={{ height: 1, backgroundColor: '#f3f4f6' }} />
            <View style={{ flexDirection: 'row' }}>
              {[
                { label: 'Abnormal', value: abnormal.length, color: '#dc2626' },
                { label: 'Escalated', value: escalatedCount, color: '#7c3aed' },
                { label: 'Recurring', value: patientTimeline.filter((e) => recurringSet.has((e.condition || e.title).toLowerCase().trim())).length, color: '#ea580c' },
              ].map((s, i, arr) => (
                <View key={s.label} style={{ flex: 1, borderRightWidth: i < arr.length - 1 ? 1 : 0, borderRightColor: '#f3f4f6' }}>
                  <StatCell {...s} />
                </View>
              ))}
            </View>
          </View>

          {/* Severity Distribution */}
          <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', padding: 14 }}>
            <SectionHeader title="Severity Distribution" icon="bar-chart-outline" />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((u) => {
                const total = patientTimeline.length || 1;
                const pct = Math.round((dist[u] / total) * 100);
                return (
                  <View key={u} style={{ flex: 1, alignItems: 'center', backgroundColor: URGENCY_BG[u], borderRadius: 12, borderWidth: 1, borderColor: URGENCY_BORDER[u], padding: 10 }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: URGENCY_COLOR[u] }}>{dist[u]}</Text>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: URGENCY_COLOR[u], marginTop: 2 }}>{URGENCY_LABEL[u]}</Text>
                    <Text style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Key Concerns */}
          {abnormal.length > 0 && (
            <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#fecaca', padding: 14 }}>
              <SectionHeader title="Key Concerns" icon="warning-outline" />
              {abnormal.slice(0, 5).map((e) => (
                <View key={e.id} style={{ marginBottom: 8, padding: 10, backgroundColor: URGENCY_BG[e.urgency], borderRadius: 10, borderWidth: 1, borderColor: URGENCY_BORDER[e.urgency] }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', flex: 1 }} numberOfLines={1}>{e.condition || e.title}</Text>
                    <View style={{ backgroundColor: URGENCY_COLOR[e.urgency] + '22', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: URGENCY_COLOR[e.urgency] }}>{URGENCY_LABEL[e.urgency]}</Text>
                    </View>
                  </View>
                  {!!e.description && (
                    <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }} numberOfLines={2}>{e.description}</Text>
                  )}
                  <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>{formatDate(e.createdAt)}</Text>
                </View>
              ))}
              {abnormal.length > 5 && (
                <Text style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>+ {abnormal.length - 5} more abnormal entries in full report</Text>
              )}
            </View>
          )}

          {/* Symptom Log */}
          <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', padding: 14 }}>
            <SectionHeader title={`Symptom Log${patientTimeline.length > 20 ? ` (Latest 20 of ${patientTimeline.length})` : ''}`} icon="list-outline" />
            {preview.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#9ca3af' }}>No records found</Text>
              </View>
            ) : (
              preview.map((e) => (
                <EntryRow
                  key={e.id}
                  entry={e}
                  isRecurring={recurringSet.has((e.condition || e.title).toLowerCase().trim())}
                />
              ))
            )}
          </View>

          {/* Disclaimer */}
          <View style={{ marginHorizontal: 16, marginBottom: 16, padding: 14, backgroundColor: '#f9fafb', borderRadius: 14 }}>
            <Text style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', lineHeight: 16 }}>
              This report is generated from LifeGate health data and is not a substitute for professional medical advice, diagnosis, or treatment.
            </Text>
          </View>
        </ViewShot>
      </ScrollView>

      {/* Export Actions Bar (fixed bottom) */}
      {hasSharingAvailable && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6',
          paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28,
        }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, textAlign: 'center' }}>
            Export Report As
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ExportButton
              icon="document-text-outline"
              label="PDF"
              sublabel="Full report"
              color="#0AADA2"
              onPress={exportPDF}
              loading={exporting === 'pdf'}
            />
            <ExportButton
              icon="image-outline"
              label="PNG"
              sublabel="Lossless image"
              color="#2563eb"
              onPress={() => exportImage('png')}
              loading={exporting === 'png'}
            />
            <ExportButton
              icon="camera-outline"
              label="JPEG"
              sublabel="Compressed image"
              color="#7c3aed"
              onPress={() => exportImage('jpeg')}
              loading={exporting === 'jpeg'}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
