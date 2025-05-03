import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';

export default function PostContent({ content }: { content: string }) {
  const richTextRef = useRef(null);

  return (
    <View style={styles.container}>
      <RichEditor
        ref={richTextRef}
        initialContentHTML={content}
        style={styles.richEditor}
        disabled={true} // Disable editing for rendering purposes
      />
      <RichToolbar
        editor={richTextRef}
        actions={[actions.setBold, actions.setItalic, actions.insertImage]}
        disabled={true} // Disable toolbar for rendering purposes
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  richEditor: {
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
  },
});