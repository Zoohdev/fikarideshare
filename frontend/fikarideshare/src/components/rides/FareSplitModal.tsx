import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface ParticipantShare {
  userId: string;
  percentage: number;
  amount: number;
}

interface FareSplitModalProps {
  visible: boolean;
  onClose: () => void;
  totalFare: number;
  currency: string;
  participants: Participant[];
  onConfirm: (shares: ParticipantShare[]) => void;
}

type SplitType = 'equal' | 'custom';

export const FareSplitModal: React.FC<FareSplitModalProps> = ({
  visible,
  onClose,
  totalFare,
  currency,
  participants,
  onConfirm,
}) => {
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [customPercentages, setCustomPercentages] = useState<
    Record<string, string>
  >({});

  // Calculate shares based on split type
  const shares = useMemo((): ParticipantShare[] => {
    if (splitType === 'equal') {
      const equalShare = totalFare / participants.length;
      return participants.map((p) => ({
        userId: p.id,
        percentage: 100 / participants.length,
        amount: equalShare,
      }));
    } else {
      // Custom split
      const shares: ParticipantShare[] = [];
      let remaining = totalFare;
      const sortedParticipants = [...participants];

      sortedParticipants.forEach((p, index) => {
        const percentageStr = customPercentages[p.id] || '0';
        const percentage = parseFloat(percentageStr) || 0;

        let amount: number;
        if (index === sortedParticipants.length - 1) {
          // Last participant gets remainder
          amount = remaining;
        } else {
          amount = (totalFare * percentage) / 100;
          remaining -= amount;
        }

        shares.push({
          userId: p.id,
          percentage,
          amount: Math.round(amount * 100) / 100,
        });
      });

      return shares;
    }
  }, [splitType, customPercentages, participants, totalFare]);

  // Validate custom percentages sum to 100
  const isValidCustomSplit = useMemo(() => {
    if (splitType !== 'custom') return true;

    const total = Object.values(customPercentages).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );
    return Math.abs(total - 100) < 0.01;
  }, [splitType, customPercentages]);

  const handleCustomPercentageChange = (userId: string, value: string) => {
    // Allow only numbers and decimals
    const cleaned = value.replace(/[^0-9.]/g, '');
    setCustomPercentages((prev) => ({ ...prev, [userId]: cleaned }));
  };

  const handleConfirm = () => {
    if (!isValidCustomSplit) {
      Alert.alert('Invalid Split', 'Percentages must add up to 100%');
      return;
    }

    onConfirm(shares);
  };

  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  const renderParticipant = ({ item }: { item: Participant }) => {
    const share = shares.find((s) => s.userId === item.id);

    return (
      <View style={styles.participantRow}>
        <View style={styles.participantInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.participantName}>{item.name}</Text>
        </View>

        {splitType === 'equal' ? (
          <View style={styles.shareInfo}>
            <Text style={styles.percentage}>
              {share?.percentage.toFixed(1)}%
            </Text>
            <Text style={styles.amount}>
              {formatCurrency(share?.amount || 0)}
            </Text>
          </View>
        ) : (
          <View style={styles.customInput}>
            <TextInput
              style={styles.percentageInput}
              keyboardType="decimal-pad"
              placeholder="0"
              value={customPercentages[item.id] || ''}
              onChangeText={(value) =>
                handleCustomPercentageChange(item.id, value)
              }
            />
            <Text style={styles.percentSign}>%</Text>
            <Text style={styles.customAmount}>
              {formatCurrency(share?.amount || 0)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Split Fare</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Fare</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalFare)}</Text>
        </View>

        {/* Split Type Toggle */}
        <View style={styles.splitTypeContainer}>
          <TouchableOpacity
            style={[
              styles.splitTypeButton,
              splitType === 'equal' && styles.splitTypeActive,
            ]}
            onPress={() => setSplitType('equal')}
          >
            <Icon
              name="equal"
              size={20}
              color={splitType === 'equal' ? '#007AFF' : '#666'}
            />
            <Text
              style={[
                styles.splitTypeText,
                splitType === 'equal' && styles.splitTypeTextActive,
              ]}
            >
              Equal Split
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.splitTypeButton,
              splitType === 'custom' && styles.splitTypeActive,
            ]}
            onPress={() => setSplitType('custom')}
          >
            <Icon
              name="tune"
              size={20}
              color={splitType === 'custom' ? '#007AFF' : '#666'}
            />
            <Text
              style={[
                styles.splitTypeText,
                splitType === 'custom' && styles.splitTypeTextActive,
              ]}
            >
              Custom Split
            </Text>
          </TouchableOpacity>
        </View>

        {/* Validation Warning */}
        {splitType === 'custom' && !isValidCustomSplit && (
          <View style={styles.warningBanner}>
            <Icon name="alert-circle" size={16} color="#FF9500" />
            <Text style={styles.warningText}>
              Percentages must add up to 100%
            </Text>
          </View>
        )}

        {/* Participants List */}
        <FlatList
          data={participants}
          renderItem={renderParticipant}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.participantsList}
        />

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !isValidCustomSplit && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!isValidCustomSplit}
        >
          <Text style={styles.confirmButtonText}>Confirm Split</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f8f9fa',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  splitTypeContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  splitTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  splitTypeActive: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  splitTypeText: {
    fontSize: 14,
    color: '#666',
  },
  splitTypeTextActive: {
    color: '#007AFF',
    fontWeight: '500',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
  },
  participantsList: {
    padding: 16,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  participantName: {
    fontSize: 16,
    color: '#333',
  },
  shareInfo: {
    alignItems: 'flex-end',
  },
  percentage: {
    fontSize: 14,
    color: '#666',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  customInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageInput: {
    width: 50,
    height: 36,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 14,
  },
  percentSign: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  customAmount: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    minWidth: 70,
    textAlign: 'right',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginBottom: 34,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

