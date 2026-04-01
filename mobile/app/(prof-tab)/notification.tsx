import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useHealthStore } from 'stores/health-store';
import type { PreventiveAlert, AlertSeverity } from 'types/health-types';

const SEVERITY_CFG: Record<AlertSeverity, { color: string; bg: string; border: string; icon: keyof typeof Ionicons.glyphMap }> = {
  LOW:      { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: 'checkmark-circle-outline' },
  MEDIUM:   { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: 'warning-outline' },
  HIGH:     { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: 'alert-circle-outline' },
  CRITICAL: { color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe', icon: 'pulse-outline' },
};

function timeAgo(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch {
    return '';
  }
}

function NotificationCard({
  alert,
  onPress,
}: {
  alert: PreventiveAlert;
  onPress: (a: PreventiveAlert) => void;
}) {
  const sev = SEVERITY_CFG[alert.severity] ?? SEVERITY_CFG.MEDIUM;
  return (
    <Pressable
      onPress={() => onPress(alert)}
      style={({ pressed }) => ({ opacity: pressed ? 0.87 : 1 })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: alert.isRead ? '#fff' : sev.bg,
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6',
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: sev.color + '18',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
          }}
        >
          <Ionicons name={sev.icon} size={20} color={sev.color} />
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827', flex: 1, marginRight: 6 }} numberOfLines={2}>
              {alert.title}
            </Text>
            {!alert.isRead && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sev.color }} />
            )}
          </View>
          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 3, lineHeight: 17 }} numberOfLines={3}>
            {alert.message}
          </Text>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>
            {timeAgo(alert.createdAt)}  ·  {alert.severity}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function NotificationScreen() {
  const {
    physicianAlerts,
    physicianAlertsLoading,
    physicianAlertsError,
    fetchPhysicianAlerts,
    markPhysicianAlertRead,
    unreadPhysicianAlertCount,
  } = useHealthStore();

  useEffect(() => {
    fetchPhysicianAlerts();
  }, []);

  const onRefresh = useCallback(async () => {
    await fetchPhysicianAlerts();
  }, [fetchPhysicianAlerts]);

  const handleAlertPress = (alert: PreventiveAlert) => {
    markPhysicianAlertRead(alert.id);
    if (alert.diagnosisId) {
      router.push('/(prof-tab)/patientHistory' as never);
    }
  };

  const sorted = [...physicianAlerts].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-12 pb-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#0AADA2" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-xl font-bold text-gray-800 mr-8">
          Notifications
        </Text>
        {unreadPhysicianAlertCount > 0 && (
          <View
            style={{
              backgroundColor: '#dc2626',
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 2,
              position: 'absolute',
              right: 24,
              top: 54,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
              {unreadPhysicianAlertCount} new
            </Text>
          </View>
        )}
      </View>

      {/* Loading */}
      {physicianAlertsLoading && physicianAlerts.length === 0 && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#0AADA2" />
          <Text style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}>Loading notifications…</Text>
        </View>
      )}

      {/* Error */}
      {!physicianAlertsLoading && !!physicianAlertsError && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="cloud-offline-outline" size={48} color="#9ca3af" />
          <Text style={{ marginTop: 12, fontSize: 15, fontWeight: '600', color: '#374151' }}>
            Could not load notifications
          </Text>
          <Pressable
            onPress={fetchPhysicianAlerts}
            style={{ marginTop: 16, backgroundColor: '#0AADA2', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Empty state */}
      {!physicianAlertsLoading && !physicianAlertsError && sorted.length === 0 && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={physicianAlertsLoading} onRefresh={onRefresh} tintColor="#0AADA2" />}
        >
          <View className="items-center justify-center py-16">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Ionicons name="notifications-off" size={32} color="#999" />
            </View>
            <Text className="text-center text-lg font-semibold text-gray-800">
              No notifications
            </Text>
            <Text className="mt-2 text-center text-sm text-gray-500 px-6">
              Escalated or overdue patient cases will appear here.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Notification list */}
      {sorted.length > 0 && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={physicianAlertsLoading} onRefresh={onRefresh} tintColor="#0AADA2" />}
        >
          {sorted.map((alert) => (
            <NotificationCard key={alert.id} alert={alert} onPress={handleAlertPress} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
