/**
 * Admin — Physician Account Management
 *
 * Lists all physician accounts with:
 *  - Account status badge (Active / Suspended)
 *  - MDCN verification badge  
 *  - SLA breach flag indicator (3+ breaches in last 7 days)
 *  - Active cases count
 *  - Quick actions: tap to view detail, swipe-accessible
 *  - FAB to create a new physician account
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAdminStore } from '../../stores/admin-store';
import type { PhysicianRow, CreatePhysicianInput } from '../../types/admin-types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function AccountBadge({ status }: { status: 'active' | 'suspended' }) {
  const active = status === 'active';
  return (
    <View
      className="px-2 py-0.5 rounded-full"
      style={{ backgroundColor: active ? '#dcfce7' : '#fee2e2' }}
    >
      <Text
        className="text-[10px] font-bold"
        style={{ color: active ? '#166534' : '#991b1b' }}
      >
        {active ? 'ACTIVE' : 'SUSPENDED'}
      </Text>
    </View>
  );
}

function MDCNBadge({ verified, override }: { verified: boolean; override: string }) {
  if (override === 'confirmed' || verified) {
    return (
      <View className="flex-row items-center px-2 py-0.5 rounded-full bg-blue-100">
        <Ionicons name="shield-checkmark" size={10} color="#1d4ed8" />
        <Text className="text-[10px] font-semibold text-blue-700 ml-0.5">MDCN</Text>
      </View>
    );
  }
  if (override === 'rejected') {
    return (
      <View className="flex-row items-center px-2 py-0.5 rounded-full bg-red-100">
        <Ionicons name="shield" size={10} color="#dc2626" />
        <Text className="text-[10px] font-semibold text-red-700 ml-0.5">REJECTED</Text>
      </View>
    );
  }
  return (
    <View className="flex-row items-center px-2 py-0.5 rounded-full bg-amber-100">
      <Ionicons name="shield-outline" size={10} color="#92400e" />
      <Text className="text-[10px] font-semibold text-amber-800 ml-0.5">PENDING</Text>
    </View>
  );
}

// ─── Physician list item ──────────────────────────────────────────────────────

function PhysicianCard({ item, onPress }: { item: PhysicianRow; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white mx-4 mb-3 rounded-2xl p-4"
      style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 }}
      activeOpacity={0.7}
    >
      {/* Header row */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center">
            {/* Flag indicator */}
            {item.flagged && (
              <View className="w-6 h-6 rounded-full bg-red-100 items-center justify-center mr-2">
                <Ionicons name="flag" size={12} color="#dc2626" />
              </View>
            )}
            <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
            {item.email}
          </Text>
          {item.specialization ? (
            <Text className="text-xs text-indigo-600 mt-0.5" numberOfLines={1}>
              {item.specialization}
            </Text>
          ) : null}
        </View>

        <View className="items-end gap-1">
          <AccountBadge status={item.accountStatus} />
          <MDCNBadge verified={item.mdcnVerified} override={item.mdcnOverrideStatus} />
        </View>
      </View>

      {/* Stats row */}
      <View className="flex-row mt-3 pt-3 border-t border-gray-50">
        <View className="flex-row items-center mr-4">
          <Ionicons name="folder-open-outline" size={13} color="#6b7280" />
          <Text className="text-xs text-gray-600 ml-1">
            {item.activeCases} active
          </Text>
        </View>
        <View className="flex-row items-center mr-4">
          <Ionicons name="checkmark-circle-outline" size={13} color="#22c55e" />
          <Text className="text-xs text-gray-600 ml-1">
            {item.totalCompleted} done
          </Text>
        </View>
        {item.slaBreachCountWeek > 0 && (
          <View className="flex-row items-center">
            <Ionicons name="warning-outline" size={13} color={item.slaBreachCountWeek >= 3 ? '#dc2626' : '#f97316'} />
            <Text
              className="text-xs ml-1 font-semibold"
              style={{ color: item.slaBreachCountWeek >= 3 ? '#dc2626' : '#f97316' }}
            >
              {item.slaBreachCountWeek} breach{item.slaBreachCountWeek !== 1 ? 'es' : ''} (7d)
            </Text>
          </View>
        )}
      </View>

      {/* Flagged warning */}
      {item.flagged && (
        <View className="mt-2 flex-row items-center bg-red-50 rounded-lg px-3 py-1.5">
          <Ionicons name="alert-circle" size={13} color="#dc2626" />
          <Text className="text-xs text-red-700 ml-1.5 flex-1" numberOfLines={2}>
            {item.flaggedReason || 'Account flagged for review'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Create physician modal ───────────────────────────────────────────────────

function CreatePhysicianModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const createPhysician = useAdminStore((s) => s.createPhysician);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreatePhysicianInput>({
    name: '',
    email: '',
    password: '',
    specialization: '',
    phone: '',
    yearsOfExperience: '',
    certificateName: '',
    certificateId: '',
  });

  const fields: { key: keyof CreatePhysicianInput; label: string; placeholder: string; secure?: boolean }[] = [
    { key: 'name',              label: 'Full Name *',         placeholder: 'Dr. John Doe' },
    { key: 'email',             label: 'Email *',             placeholder: 'physician@hospital.com' },
    { key: 'password',          label: 'Password *',          placeholder: 'Min. 8 characters', secure: true },
    { key: 'specialization',    label: 'Specialization',      placeholder: 'e.g. Cardiology' },
    { key: 'phone',             label: 'Phone Number',        placeholder: '+234 800 000 0000' },
    { key: 'yearsOfExperience', label: 'Years of Experience', placeholder: '5' },
    { key: 'certificateName',   label: 'Certificate Name',    placeholder: 'MBBS, FWACP…' },
    { key: 'certificateId',     label: 'Certificate ID',      placeholder: 'MDCN/2020/…' },
  ];

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Required Fields', 'Name, email and password are required.');
      return;
    }
    setSaving(true);
    try {
      await createPhysician(form);
      setForm({ name: '', email: '', password: '', specialization: '', phone: '',
        yearsOfExperience: '', certificateName: '', certificateId: '' });
      onCreated();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to create physician');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView className="flex-1 bg-white">
          {/* Header */}
          <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
            <TouchableOpacity onPress={onClose} className="mr-3">
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900 flex-1">New Physician Account</Text>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={saving}
              className="bg-indigo-600 rounded-xl px-4 py-1.5"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-sm">Create</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
            {fields.map((f) => (
              <View key={f.key} className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-1">{f.label}</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-gray-50"
                  placeholder={f.placeholder}
                  placeholderTextColor="#9ca3af"
                  value={form[f.key] ?? ''}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
                  secureTextEntry={f.secure}
                  autoCapitalize={f.key === 'email' ? 'none' : 'words'}
                  keyboardType={f.key === 'email' ? 'email-address' : 'default'}
                />
              </View>
            ))}
            <View className="h-8" />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AdminPhysiciansScreen() {
  const router = useRouter();
  const { physicians, loading, error, fetchPhysicians, triggerFlagCheck } = useAdminStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'flagged'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchPhysicians(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPhysicians();
    setRefreshing(false);
  }, []);

  const handleFlagCheck = async () => {
    try {
      const count = await triggerFlagCheck();
      Alert.alert('Flag Check Complete', `${count} physician${count !== 1 ? 's' : ''} newly flagged.`);
    } catch {
      Alert.alert('Error', 'Flag check failed');
    }
  };

  const filtered = physicians.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.specialization.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'flagged' && p.flagged) ||
      (filterStatus !== 'flagged' && p.accountStatus === filterStatus);

    return matchSearch && matchStatus;
  });

  const FILTER_TABS: { key: typeof filterStatus; label: string }[] = [
    { key: 'all',       label: 'All' },
    { key: 'active',    label: 'Active' },
    { key: 'suspended', label: 'Suspended' },
    { key: 'flagged',   label: 'Flagged' },
  ];

  if (loading && physicians.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 flex-1">Physicians</Text>
        <TouchableOpacity
          onPress={handleFlagCheck}
          className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 mr-2"
        >
          <Text className="text-amber-700 text-xs font-semibold">Flag Check</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          className="w-9 h-9 rounded-full bg-indigo-600 items-center justify-center"
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="px-4 pb-2">
        <View className="flex-row items-center bg-white rounded-2xl px-3 py-2 border border-gray-100">
          <Ionicons name="search" size={16} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-sm text-gray-800"
            placeholder="Search physicians…"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <View className="flex-row px-4 mb-3 gap-2">
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setFilterStatus(tab.key)}
            className={`px-3 py-1.5 rounded-full border ${
              filterStatus === tab.key
                ? 'bg-indigo-600 border-indigo-600'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                filterStatus === tab.key ? 'text-white' : 'text-gray-600'
              }`}
            >
              {tab.label}
              {tab.key === 'flagged' && physicians.filter((p) => p.flagged).length > 0
                ? ` (${physicians.filter((p) => p.flagged).length})`
                : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary line */}
      <Text className="text-xs text-gray-400 px-4 mb-2">
        {filtered.length} of {physicians.length} physician{physicians.length !== 1 ? 's' : ''}
      </Text>

      {error ? (
        <View className="flex-1 items-center justify-center">
          <Ionicons name="cloud-offline-outline" size={40} color="#d1d5db" />
          <Text className="text-gray-400 mt-2">{error}</Text>
          <TouchableOpacity onPress={fetchPhysicians} className="mt-3">
            <Text className="text-indigo-600 font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PhysicianCard
              item={item}
              onPress={() => router.push(`/(admin-tab)/physician-detail?id=${item.id}`)}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="items-center mt-16">
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-sm">No physicians found</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      {/* Create physician modal */}
      <CreatePhysicianModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          Alert.alert('Success', 'Physician account created.');
        }}
      />
    </SafeAreaView>
  );
}
