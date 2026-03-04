import { View, Text, ScrollView, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { ReportStatus } from '../types/professional-types';
import { PatientReportCard } from './PatientReportCard';

interface ReportListProps {
  reports: any[];
  selectedFilter: ReportStatus | 'All';
  onFilterChange: (filter: ReportStatus | 'All') => void;
  onReportPress?: (reportId: string) => void;
  loading?: boolean;
}

const FILTERS: (ReportStatus | 'All')[] = ['Pending', 'Active', 'Completed', 'All'];

export const ReportList = ({
  reports,
  selectedFilter,
  onFilterChange,
  onReportPress,
  loading = false,
}: ReportListProps) => {

  return (
    <View className="flex-1">
      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-6 py-4"
        contentContainerStyle={{ gap: 16 }}
      >
        {FILTERS.map(filter => (
          <Pressable
            key={filter}
            onPress={() => onFilterChange(filter)}
            className={`px-4 py-2 rounded-full border ${
              selectedFilter === filter
                ? 'bg-teal-600 border-teal-600'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                selectedFilter === filter ? 'text-white' : 'text-gray-700'
              }`}
            >
              {filter}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Reports list */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0AADA2" />
        </View>
      ) : reports.length > 0 ? (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PatientReportCard
              report={item}
              onPress={() => onReportPress?.(item.id)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          scrollEnabled={true}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-500 text-base text-center">
            No reports found
          </Text>
        </View>
      )}
    </View>
  );
};
