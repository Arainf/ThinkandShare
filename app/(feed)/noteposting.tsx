import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useNavigation } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

import { createNote } from '@/config/noteService';
import { fetchAllTags } from '@/config/tagsService';

// Define interfaces
interface Tag {
  id: string;
  name: string;
  color: string;
  created_at?: string;
}

export default function NotePosting() {
   const navigation = useNavigation();
   const colorScheme = useColorScheme();
   
   // Local state management
   const [step, setStep] = useState(1);
   const [isFormValid, setIsFormValid] = useState(false);
   const [isSaving, setIsSaving] = useState(false);

   const [title, setTitle] = useState('');
   const [content, setContent] = useState('');
   const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
   const [coverImage, setCoverImage] = useState<string | null>(null);
   const [isPublic, setIsPublic] = useState(true);
   const [isKeyboardVisible, setKeyboardVisible] = useState(false);
   const [loadingTags, setLoadingTags] = useState(false);
   const [isTagsModalVisible, setIsTagsModalVisible] = useState(false);
   
   // For available tags from database
   const [availableTags, setAvailableTags] = useState<Tag[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   
   const scrollViewRef = useRef<ScrollView | null>(null);
   const [keyboardHeight, setKeyboardHeight] = useState(0);

   const totalSteps = 2;

   // Load available tags from database
   useEffect(() => {
     const loadTags = async () => {
       try {
         setLoadingTags(true);
         setIsLoading(true);
         const tags = await fetchAllTags();
         console.log('Fetched tags:', tags); // Debug log
         setAvailableTags(tags);
       } catch (error) {
         console.error('Error fetching tags:', error);
         Alert.alert('Error', 'Failed to load tags');
       } finally {
         setLoadingTags(false);
         setIsLoading(false);
       }
     };
     
     loadTags();
   }, []); // Remove step dependency

   useEffect(() => {
     console.log('Available tags updated:', availableTags); // Debug log for state update
   }, [availableTags]);

   // Keyboard listeners
   useEffect(() => {
     const keyboardDidShowListener = Keyboard.addListener(
       'keyboardDidShow',
       (event) => {
         setKeyboardVisible(true);
         setKeyboardHeight(event.endCoordinates.height);
       }
     );
     const keyboardDidHideListener = Keyboard.addListener(
       'keyboardDidHide',
       () => {
         setKeyboardVisible(false);
         setKeyboardHeight(0);
       }
     );

     return () => {
       keyboardDidShowListener.remove();
       keyboardDidHideListener.remove();
     };
   }, []);

   const handleNextStep = () => {
     if (step === 1 && (!title.trim() || !content.trim())) {
       Alert.alert('Error', 'Title and content cannot be empty.');
       return;
     }
     setStep(step + 1);
   };

   const handlePreviousStep = () => {
     if (step > 1) {
       setStep(step - 1);
     } else {
       // If on first step, show confirmation dialog
       handleBackConfirmation();
     }
   };
   
   const handleBackConfirmation = () => {
     // If there's content, show confirmation dialog
     if (title.trim() || content.trim() || coverImage || selectedTagIds.length > 0) {
       Alert.alert(
         'Discard changes?',
         'Your note will be lost if you go back now.',
         [
           {
             text: 'Stay',
             style: 'cancel'
           },
           {
             text: 'Discard',
             style: 'destructive',
             onPress: () => {
               if (navigation.canGoBack()) {
                 navigation.goBack();
               }
             }
           }
         ]
       );
     } else {
       // If no content, just go back
       if (navigation.canGoBack()) {
         navigation.goBack();
       }
     }
   };

   const handlePickImage = async () => {
     try {
       const result = await ImagePicker.launchImageLibraryAsync({
         mediaTypes: ['images'],
         allowsEditing: true,
         quality: 0.8,
         aspect: [16, 9],
       });

       if (!result.canceled) {
         setCoverImage(result.assets[0].uri);
       }
     } catch (error) {
       Alert.alert('Error', 'Failed to pick image');
       console.error(error);
     }
   };

   const handleRemoveImage = () => {
     setCoverImage(null);
   };

   const handleTagSelection = (tagId: string) => {
     setSelectedTagIds(prevTags => 
       prevTags.includes(tagId) 
         ? prevTags.filter(id => id !== tagId)
         : [...prevTags, tagId]
     );
   };

   const handleSaveNote = async () => {
     if (!title.trim() || !content.trim()) {
       Alert.alert('Error', 'Title and content cannot be empty.');
       return;
     }

     try {
       setIsLoading(true);
       
       const noteData = {
         title,
         content,
         tags: selectedTagIds,
         is_public: isPublic,
       };

       // Pass undefined if no coverImage is selected
       const result = await createNote(noteData, coverImage || undefined);
       
       Alert.alert('Success', 'Note saved successfully!');
       navigation.goBack();
     } catch (error) {
       Alert.alert('Error', 'Failed to save note. Please try again.');
       console.error(error);
     } finally {
       setIsLoading(false);
       router.push('/(feed)'); // Redirect to home after saving
     }
   };

   // Check form validity
   useEffect(() => {
    const isValid = title.trim() !== '' && content.trim() !== '';
    setIsFormValid(isValid);
   }, [title, content]);

   // Handle the action button press (Next or Save)
   const handleActionButton = () => {
     if (step < totalSteps) {
       handleNextStep();
     } else {
       handleSaveNote();
     }
   };

   // Button text based on step and saving state
   const nextButtonText = isSaving ? 'Saving...' : (step < totalSteps ? 'Next' : 'Save');

   // Render tag item
   const renderTagItem = (tag: Tag) => {
     const isSelected = selectedTagIds.includes(tag.id);
     return (
       <TouchableOpacity
         key={tag.id}
         style={[
           styles.tagItem,
           isSelected && { backgroundColor: tag.color + '30' }
         ]}
         onPress={() => handleTagSelection(tag.id)}
       >
         <View 
           style={[
             styles.tagDot, 
             { backgroundColor: tag.color }
           ]} 
         />
         <Text style={styles.tagText}>{tag.name}</Text>
         {isSelected && (
           <Feather name="check" size={16} color={tag.color} style={styles.checkIcon} />
         )}
       </TouchableOpacity>
     );
   };

   const TagsModal = () => (
     <Modal
       animationType="slide"
       transparent={true}
       visible={isTagsModalVisible}
       onRequestClose={() => setIsTagsModalVisible(false)}
     >
       <View style={styles.modalContainer}>
         <View style={styles.modalContent}>
           <View style={styles.modalHeader}>
             <Text style={styles.modalTitle}>Select Tags</Text>
             <TouchableOpacity onPress={() => setIsTagsModalVisible(false)}>
               <Feather name="x" size={24} color="#374151" />
             </TouchableOpacity>
           </View>
           
           {loadingTags ? (
             <Text style={styles.loadingText}>Loading tags...</Text>
           ) : (
             <ScrollView style={styles.modalTagList}>
               {availableTags.map(tag => renderTagItem(tag))}
             </ScrollView>
           )}

           <TouchableOpacity 
             style={styles.modalDoneButton}
             onPress={() => setIsTagsModalVisible(false)}
           >
             <Text style={styles.modalDoneButtonText}>Done</Text>
           </TouchableOpacity>
         </View>
       </View>
     </Modal>
   );

   return (
     <KeyboardAvoidingView
       style={styles.container}
       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
       keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
     >

       

       {/* Step Indicator */}
       <View style={styles.stepIndicatorContainer}>
         {Array.from({ length: totalSteps }).map((_, index) => (
           <View 
             key={index}
             style={[
               styles.stepDot, 
               { backgroundColor: index < step ? '#3B82F6' : '#E5E7EB' }
             ]} 
           />
         ))}
       </View>

       <ScrollView 
         ref={scrollViewRef}
         contentContainerStyle={styles.scrollContainer}
         keyboardShouldPersistTaps="handled"
       >
         {step === 1 && (
           <>
             <TextInput
               style={styles.titleInput}
               placeholder="Enter title"
               value={title}
               onChangeText={setTitle}
               placeholderTextColor="#9CA3AF"
               maxLength={100}
             />

             <TextInput
               style={styles.contentInput}
               placeholder="Start writing your note..."
               value={content}
               onChangeText={setContent}
               placeholderTextColor="#9CA3AF"
               multiline={true}
               textAlignVertical="top"
               numberOfLines={10}
               onFocus={() => {
                 scrollViewRef.current?.scrollToEnd({ animated: true });
               }}
             />
           </>
         )}

         {step === 2 && (
           <>
             <TouchableOpacity
               style={styles.imageContainer}
               onPress={coverImage ? undefined : handlePickImage}
             >
               {coverImage ? (
                 <>
                   <Image source={{ uri: coverImage }} style={styles.coverImage} />
                   <View style={styles.imageOverlay}>
                     <TouchableOpacity 
                       style={styles.removeImageButton}
                       onPress={handleRemoveImage}
                     >
                       <Feather name="trash-2" size={20} color="#fff" />
                     </TouchableOpacity>
                   </View>
                 </>
               ) : (
                 <View style={styles.imagePlaceholder}>
                   <Feather name="image" size={30} color="#9CA3AF" />
                   <Text style={styles.imagePlaceholderText}>Add Cover Image</Text>
                 </View>
               )}
             </TouchableOpacity>

             <View style={styles.tagsContainer}>
               <Text style={styles.sectionTitle}>Tags</Text>
               {loadingTags ? (
                 <Text style={styles.loadingText}>Loading tags...</Text>
               ) : (
                 <View style={styles.tagList}>
                   {availableTags.map(tag => renderTagItem(tag))}
                 </View>
               )}
             </View>

             <View style={styles.visibilityContainer}>
               <Text style={styles.sectionTitle}>Visibility</Text>
               <View style={styles.visibilityOptions}>
                 <TouchableOpacity 
                   style={[
                     styles.visibilityOption, 
                     isPublic && styles.visibilityOptionSelected
                   ]}
                   onPress={() => setIsPublic(true)}
                 >
                   <Feather name="globe" size={20} color={isPublic ? "#3B82F6" : "#6B7280"} />
                   <Text style={[
                     styles.visibilityOptionText,
                     isPublic && styles.visibilityOptionSelected
                   ]}>Public</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   style={[
                     styles.visibilityOption,
                     !isPublic && styles.visibilityOptionSelected 
                   ]}
                   onPress={() => setIsPublic(false)}
                 >
                   <Feather name="lock" size={20} color={!isPublic ? "#3B82F6" : "#6B7280"} />
                   <Text style={[
                     styles.visibilityOptionText,
                     !isPublic && styles.visibilityOptionSelected 
                   ]}>Private</Text>
                 </TouchableOpacity>
               </View>
             </View>
           </>
         )}
       </ScrollView>

       {/* Action Button Container with Back and Next/Save buttons */}
       <View style={styles.actionButtonsContainer}>
         {/* Back Button (visible only in step 2) */}
         {step > 1 && (
           <TouchableOpacity
             style={styles.backActionButton}
             onPress={handlePreviousStep}
           >
             <Text style={styles.backActionButtonText}>Back</Text>
           </TouchableOpacity>
         )}
         
         {/* Next/Save Button */}
         <TouchableOpacity
           style={[
             styles.nextActionButton,
             { opacity: isFormValid && !isSaving ? 1 : 0.5 }
           ]}
           onPress={handleActionButton}
           disabled={!isFormValid || isSaving}
         >
           <Text style={styles.nextActionButtonText}>{nextButtonText}</Text>
         </TouchableOpacity>
       </View>
     </KeyboardAvoidingView>
   );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Custom Header Styles
  headerContainer: {
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  headerLeftContainer: {
    width: 50,
    alignItems: 'flex-start',
  },
  headerCenterContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerRightContainer: {
    width: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  backButton: {
    padding: 8,
  },
  // Step Indicator Styles
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#fff',

  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 100, // Extra padding for keyboard and action button
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    padding: 8,
    color: '#111827',
  },
  contentInput: {
    fontSize: 16,
    color: '#111827',
    padding: 8,
    minHeight: 250,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  imageContainer: {
    height: 200,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  removeImageButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#9CA3AF',
  },
  tagsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111827',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  tagText: {
    marginRight: 4,
    color: '#374151',
  },
  checkIcon: {
    marginLeft: 4,
  },
  addTagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  addTagItemText: {
    marginLeft: 4,
    color: '#3B82F6',
  },
  visibilityContainer: {
    marginBottom: 24,
  },
  visibilityOptions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  visibilityOptionSelected: {
    backgroundColor: '#EBF5FF',
    borderColor: '#3B82F6',
  },
  visibilityOptionText: {
    marginLeft: 8,
    color: '#374151',
    fontWeight: '500',
  },
  // Action Buttons Container - Now contains both back and next buttons
  actionButtonsContainer: {
    position: 'absolute',
    right: 16,
    bottom: Platform.OS === 'ios' ? 30 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  backActionButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  backActionButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextActionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nextActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalTagList: {
    maxHeight: 300,
  },
  modalDoneButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tagsButtonContainer: {
    marginBottom: 16,
  },
  tagsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  tagsButtonText: {
    marginLeft: 8,
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
});