import type { BusinessPlan, MediaAsset, Section } from '@/features/editor/lib/types/plan';
import type { EditorActions } from '@/features/editor/lib/hooks/useEditorStore';

/**
 * Handles file drop events for SectionEditor
 */
export function handleFileDrop(
  e: React.DragEvent,
  dragOverTarget: 'logo' | 'attachment' | null,
  isMetadataSection: boolean,
  section: Section | null,
  plan: BusinessPlan | null,
  actions: {
    updateTitlePage: EditorActions['updateTitlePage'];
    addMedia: EditorActions['addMedia'];
    addAppendix: EditorActions['addAppendix'];
  }
) {
  e.preventDefault();
  e.stopPropagation();

  const files = Array.from(e.dataTransfer.files);
  if (files.length === 0) return;

  // Handle logo upload (first image file)
  if (dragOverTarget === 'logo' && isMetadataSection && plan) {
    const imageFile = files.find(file => file.type.startsWith('image/'));
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          actions.updateTitlePage({ ...plan.titlePage, logoUrl: reader.result });
        }
      };
      reader.readAsDataURL(imageFile);
    }
    return;
  }

  // Handle general file attachments
  files.forEach((file) => {
    if (file.type.startsWith('image/')) {
      // Handle image as media asset - only if we have a section
      if (section) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const mediaAsset: MediaAsset = {
              id: `media_${Date.now()}`,
              type: 'image',
              title: file.name,
              uri: reader.result,
              description: `Uploaded: ${file.name}`,
              sectionId: section.id
            };
            actions.addMedia(section.id, mediaAsset);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // If no section, add as appendix instead
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const appendix = {
              id: `appendix_${Date.now()}`,
              title: file.name,
              description: `Uploaded image: ${file.name}`,
              fileUrl: reader.result
            };
            actions.addAppendix(appendix);
          }
        };
        reader.readAsDataURL(file);
      }
    } else {
      // Handle other files as appendices
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const appendix = {
            id: `appendix_${Date.now()}`,
            title: file.name,
            description: `Uploaded file: ${file.name}`,
            fileUrl: reader.result
          };
          actions.addAppendix(appendix);
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

