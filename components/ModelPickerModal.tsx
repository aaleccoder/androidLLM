import React, { Dispatch, SetStateAction, useState } from 'react';
import { Modal, Pressable, View, Text, TextInput, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Zap, Search, X } from 'lucide-react-native';
import { openRouterService, OpenRouterModel } from '../services/openRouterService';

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
  handleAddOpenRouterModel: (model: ModelOption) => void;
  openRouterModels: ModelOption[];
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
  handleAddOpenRouterModel,
  openRouterModels,
}) => {
  // --- OpenRouter models modal state ---
  const [isModelsModalOpen, setIsModelsModalOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState<string>('');

  // Fetch models from OpenRouter
  const handleShowModels = async () => {
    setIsModelsModalOpen(true);
    setIsModelsLoading(true);
    setModelsError(null);
    try {
      const models = await openRouterService.fetchAvailableModels();
      setAvailableModels(models);
    } catch (err: any) {
      setModelsError(err.message || 'Failed to fetch models. Please check your connection or API key.');
    } finally {
      setIsModelsLoading(false);
    }
  };

  // Add and switch to OpenRouter model
  const handleAddAndSwitchModel = (model: OpenRouterModel) => {
    const modelOption: ModelOption = {
      id: model.id,
      displayName: model.name,
      provider: 'openrouter'
    };
    handleAddOpenRouterModel(modelOption);
    setIsModelsModalOpen(false);
    setModelSearch('');
  };

  const filteredModelsAvailable = availableModels.filter((model) => {
    const search = modelSearch.trim().toLowerCase();
    if (!search) return true;
    return (
      model.name.toLowerCase().includes(search) ||
      model.id.toLowerCase().includes(search) ||
      model.description.toLowerCase().includes(search)
    );
  });

  const isModelAdded = (modelId: string) => {
    return openRouterModels.some(m => m.id === modelId);
  };

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
          <View className="rounded-t-2xl p-4 bg-background">
            <View className="space-y-4">
              <View className={`flex-row items-center space-x-2 p-3 rounded-lg bg-primary/20`}>
                <Search size={16} color="#EBE9FC" />
                <TextInput
                  className={`flex-1 text-base text-text font-sans`}
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
                  className={`flex-row items-center space-x-2 p-3 rounded-lg bg-primary my-2`}
                >
                  <Zap size={16} color="#EBE9FC" />
                  <Text className={`text-base text-text font-sans`}>
                    {getModelDisplayName(option)}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={handleShowModels}
                className={`flex-row items-center justify-center space-x-2 p-3 rounded-3xl bg-accent mt-4`}
              >
                <Zap size={16} color="#181818" />
                <Text className={`text-base text-primary font-sans font-medium`}>
                  Browse All OpenRouter Models
                </Text>
              </TouchableOpacity>

              {filteredModels.length === 0 && (
                <View className="p-4">
                  <Text className={`text-center text-text opacity-60 font-sans`}>
                    No models found
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>

      {/* Browse All OpenRouter Models Modal */}
      <Modal
        visible={isModelsModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModelsModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-2xl p-4 max-h-[80%] bg-zinc-900">
            <View className="flex-row items-center mb-2">
              <Text className="text-xl font-bold flex-1 text-white font-sans">Available OpenRouter Models</Text>
              <TouchableOpacity
                onPress={() => { setIsModelsModalOpen(false); setModelSearch(''); }}
                className="p-2 ml-2"
                accessibilityLabel="Close models list"
              >
                <Text className="text-lg font-bold text-white font-sans">×</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              value={modelSearch}
              onChangeText={setModelSearch}
              placeholder="Search models by name, id, or description..."
              placeholderTextColor="#a1a1aa"
              className="mb-3 px-3 py-2 rounded-lg border bg-zinc-800 border-zinc-700 text-white font-sans"
              autoFocus
              accessibilityLabel="Search models"
              returnKeyType="search"
            />
            
            {isModelsLoading ? (
              <ActivityIndicator size="large" color="#22c55e" className="mt-8" />
            ) : modelsError ? (
              <Text className="text-red-500 mt-4 font-sans">{modelsError}</Text>
            ) : filteredModelsAvailable.length === 0 ? (
              <Text className="text-center mt-8 text-zinc-400 font-sans">No models found.</Text>
            ) : (
              <FlatList
                data={filteredModelsAvailable}
                keyExtractor={item => item.id}
                style={{ marginTop: 8 }}
                renderItem={({ item }) => (
                  <View className="mb-4 p-3 rounded-lg bg-zinc-800">
                    <Text className="font-semibold text-base text-white font-sans">{item.name}</Text>
                    <Text className="text-xs mb-1 text-zinc-400 font-sans">{item.id}</Text>
                    <Text className="text-sm mb-1 text-zinc-300 font-sans">{item.description}</Text>
                    <Text className="text-xs text-zinc-400 font-sans">Context: {item.context_length} tokens</Text>
                    <Text className="text-xs text-zinc-400 font-sans">Prompt: ${item.pricing.prompt} | Completion: ${item.pricing.completion}</Text>
                    <TouchableOpacity
                      onPress={() => handleAddAndSwitchModel(item)}
                      className={`mt-2 px-3 py-1 rounded bg-blue-600 ${isModelAdded(item.id) ? 'opacity-60' : ''}`}
                      disabled={isModelAdded(item.id)}
                      accessibilityLabel={`Add and switch to model ${item.name}`}
                    >
                      <Text className="text-white text-center text-sm font-semibold font-sans">
                        {isModelAdded(item.id) ? 'Added' : 'Add & Switch'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

export default ModelPickerModal;
