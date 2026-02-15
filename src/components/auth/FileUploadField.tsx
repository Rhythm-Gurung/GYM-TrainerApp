import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface FileUploadFieldProps {
  label: string;
  onPress: () => void;
  fileName?: string;
  error?: string;
  multiple?: boolean;
}

export function FileUploadField({
  label,
  onPress,
  fileName,
  error,
  multiple = false,
}: FileUploadFieldProps) {
  return (
    <View className="mb-6">
      <Text className="text-gray-700 font-medium mb-2">{label}</Text>
      <TouchableOpacity
        className={`flex-row items-center justify-between border rounded-lg px-4 py-4 bg-white ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center flex-1">
          <Ionicons
            name={multiple ? 'documents-outline' : 'document-outline'}
            size={20}
            color={error ? '#F87171' : '#73C2FB'}
            className="mr-3"
          />
          <Text
            className={`flex-1 ${fileName ? 'text-gray-900' : 'text-gray-400'}`}
            numberOfLines={1}
          >
            {fileName || `Choose ${multiple ? 'files' : 'file'}`}
          </Text>
        </View>
        <Ionicons name="cloud-upload-outline" size={20} color="#73C2FB" />
      </TouchableOpacity>
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
}
