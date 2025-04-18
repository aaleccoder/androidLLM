import React, { Dispatch, SetStateAction } from 'react';
import { Modal, Pressable, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Zap, Search, X } from 'lucide-react-native';

type ModelOption = {
  id: string;
  displayName: string;
  provider: 'gemini' | 'openrouter';
};

type ModelPickerModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredModels: ModelOption[];
  onModelChange: (model: ModelOption) => void;
  currentModel: ModelOption;
  connectionStatus: 'connected' | 'error' | 'unknown';
  showAddModel: boolean;
  setShowAddModel: Dispatch<SetStateAction<boolean>>;
  newModelName: string;
  setNewModelName: Dispatch<SetStateAction<string>>;
  handleAddOpenRouterModel: () => void;
};

const getModelDisplayName = (model: ModelOption) => {
  return `${model.displayName} (${model.provider === 'gemini' ? 'Gemini' : 'OpenRouter'})`;
};

const ModelPickerModal: React.FC<ModelPickerModalProps> = ({
  visible,
  onRequestClose,
  searchQuery,
  setSearchQuery,
  filteredModels,
  onModelChange,
  currentModel,
  connectionStatus,
  showAddModel,
  setShowAddModel,
  newModelName,
  setNewModelName,
  handleAddOpenRouterModel,
}) => {
  return (
    <Modal
      visible={visible}
      onRequestClose={onRequestClose}
      transparent={true}
      animationType="slide"
    >
      <Pressable 
        className="flex-1 bg-black/50"
        onPress={onRequestClose}
      >
        <View className="flex-1 justify-end">
          <View className={`rounded-t-2xl p-4 bg-background`}>
            <View className="space-y-4">
              <View className={`flex-row items-center space-x-2 p-3 rounded-lg bg-background`}>
                <Search size={16} color="#EBE9FC" />
                <TextInput
                  className={`flex-1 text-base text-text`}
                  placeholder="Search models..."
                  placeholderTextColor='#a3a3a3'
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={16} color="#EBE9FC" />
                  </TouchableOpacity>
                )}
              </View>

              {filteredModels.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => onModelChange(option)}
                  className={`flex-row items-center space-x-2 p-3 rounded-lg bg-background my-2`}
                >
                  <Zap size={16} color="#EBE9FC" />
                  <Text className={`text-base text-text`}>
                    {getModelDisplayName(option)}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => setShowAddModel(true)}
                className={`flex-row items-center space-x-2 p-3 rounded-lg border border-accent bg-primary my-2`}
              >
                <Zap size={16} color="#61BA82" />
                <Text className={`text-base text-accent`}>
                  + Add OpenRouter Model
                </Text>
              </TouchableOpacity>

              {filteredModels.length === 0 && (
                <View className="p-4">
                  <Text className={`text-center text-text opacity-60`}>
                    No models found
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
      <Modal
        visible={showAddModel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModel(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className={`w-[90%] rounded-2xl p-5 bg-primary`}>
            <Text className={`text-lg font-bold mb-3 text-text`}>Add OpenRouter Model</Text>
            <TextInput
              value={newModelName}
              onChangeText={setNewModelName}
              placeholder="Enter model name (e.g. mistral-7b)"
              placeholderTextColor='#666'
              className={`px-4 py-3 text-base rounded-lg bg-background text-text`}
              autoFocus
            />
            <View className="flex-row justify-end space-x-3 mt-4">
              <TouchableOpacity
                onPress={() => setShowAddModel(false)}
                className={`px-4 py-2 rounded-lg bg-background`}
              >
                <Text className='text-text'>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddOpenRouterModel}
                className="px-4 py-2 rounded-lg bg-accent"
              >
                <Text className="text-text">Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

export default ModelPickerModal;
