import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

import { colors, fontSize, radius } from '@/constants/theme';
import type { FileAsset } from '@/types/authTypes';

interface FileUploadFieldProps {
  label: string;
  onPress: () => void;
  files?: FileAsset[];
  onRemove?: (index: number) => void;
  error?: string;
  multiple?: boolean;
}

export function FileUploadField({
  label,
  onPress,
  files = [],
  onRemove,
  error,
  multiple = false,
}: FileUploadFieldProps) {
  const hasFiles = files.length > 0;

  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize: fontSize.tag,
          color: colors.textSecondary,
          fontWeight: '600',
          marginBottom: 8,
        }}
      >
        {label}
      </Text>

      {hasFiles ? (
        <View
          style={{
            borderWidth: 1,
            borderRadius: radius.md,
            borderColor: error ? colors.error : colors.surfaceBorder,
            backgroundColor: colors.white,
            padding: 12,
          }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {files.map((file, index) => (
              <View
                key={`${file.name}-${index}`}
                style={{ width: 64, height: 64, position: 'relative' }}
              >
                {file.type.startsWith('image/') ? (
                  <Image
                    source={{ uri: file.uri }}
                    style={{ width: 64, height: 64, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 8,
                      backgroundColor: colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: colors.surfaceBorder,
                    }}
                  >
                    <Ionicons name="document-text-outline" size={26} color={colors.textMuted} />
                    <Text
                      style={{
                        fontSize: 9,
                        color: colors.textSubtle,
                        marginTop: 2,
                        fontWeight: '600',
                      }}
                    >
                      PDF
                    </Text>
                  </View>
                )}

                {/* X remove button */}
                <TouchableOpacity
                  onPress={() => onRemove?.(index)}
                  activeOpacity={0.8}
                  style={{
                    position: 'absolute',
                    top: -7,
                    right: -7,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: colors.error,
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                    elevation: 3,
                  }}
                >
                  <Ionicons name="close" size={12} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}

            {/* + Add more button (only for multiple mode) */}
            {multiple && (
              <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: colors.trainerPrimary,
                  backgroundColor: colors.trainerMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={26} color={colors.trainerPrimary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        /* Empty state – tap to choose */
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderRadius: radius.md,
            paddingHorizontal: 16,
            paddingVertical: 16,
            backgroundColor: colors.white,
            borderColor: error ? colors.error : colors.surfaceBorder,
          }}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
            <Ionicons
              name={multiple ? 'documents-outline' : 'document-outline'}
              size={20}
              color={error ? colors.error : colors.primaryBtn}
            />
            <Text style={{ color: colors.textSubtle, flex: 1 }}>
              {`Choose ${multiple ? 'file(s)' : 'file'}`}
            </Text>
          </View>
          <Ionicons name="cloud-upload-outline" size={20} color={colors.primaryBtn} />
        </TouchableOpacity>
      )}

      {error && (
        <Text style={{ fontSize: fontSize.caption, color: colors.error, marginTop: 6 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
