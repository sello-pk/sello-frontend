import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { 
    FiBold, FiItalic, FiUnderline, FiList, FiAlignLeft, 
    FiAlignCenter, FiAlignRight, FiLink, FiImage, FiCode 
} from 'react-icons/fi';
import { BiHeading, BiListOl, BiSolidQuoteAltLeft } from 'react-icons/bi';
import { useEffect } from 'react';

import { useRef } from 'react';

const MenuBar = ({ editor }) => {
    const fileInputRef = useRef(null);

    if (!editor) {
        return null;
    }

    const addImage = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                editor.chain().focus().setImage({ src: e.target.result }).run();
            };
            reader.readAsDataURL(file);
        }
        // Reset input so the same file can be selected again if needed
        event.target.value = '';
    };

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        // cancelled
        if (url === null) {
            return;
        }

        // empty
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // update
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1 bg-gray-50 rounded-t-lg">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
            />
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200 text-primary-500' : 'text-gray-600'}`}
                title="Bold"
                type="button"
            >
                <FiBold size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200 text-primary-500' : 'text-gray-600'}`}
                title="Italic"
                type="button"
            >
                <FiItalic size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-200 text-primary-500' : 'text-gray-600'}`}
                title="Underline"
                type="button"
            >
                <FiUnderline size={18} />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>

            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-primary-500' : 'text-gray-600'}`}
                title="Heading 2"
                type="button"
            >
                <BiHeading size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-200 text-primary-500' : 'text-gray-600'}`}
                title="Bullet List"
                type="button"
            >
                <FiList size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-200 text-primary-500' : 'text-gray-600'}`}
                title="Ordered List"
                type="button"
            >
                <BiListOl size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-gray-200 text-primary-500' : 'text-gray-600'}`}
                title="Blockquote"
                type="button"
            >
                <BiSolidQuoteAltLeft size={18} />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>

            <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200 text-primary-500' : 'text-gray-600'}`}
                title="Align Left"
                type="button"
            >
                <FiAlignLeft size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200 text-primary-500' : 'text-gray-600'}`}
                title="Align Center"
                type="button"
            >
                <FiAlignCenter size={18} />
            </button>
            <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200 text-primary-500' : 'text-gray-600'}`}
                title="Align Right"
                type="button"
            >
                <FiAlignRight size={18} />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>

            <button
                onClick={setLink}
                className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-200 text-primary-500' : 'text-gray-600'}`}
                title="Link"
                type="button"
            >
                <FiLink size={18} />
            </button>
            <button
                onClick={addImage}
                className="p-2 rounded hover:bg-gray-200 text-gray-600"
                title="Image"
                type="button"
            >
                <FiImage size={18} />
            </button>
        </div>
    );
};

const TiptapEditor = ({ value = "", onChange, placeholder }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Image,
            Link.configure({
                openOnClick: false,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: value || "",
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
                'data-placeholder': placeholder || "Write your blog post content here...",
            },
        },
    });

    // Update content if value changes externally (e.g. initial load or edit mode)
    useEffect(() => {
        if (editor && value !== undefined) {
            const currentContent = editor.getHTML();
            // Only update if the content is actually different
            // This prevents cursor jumping when typing
            if (currentContent !== value) {
                // Use setContent with emitUpdate: false to prevent triggering onChange
                editor.commands.setContent(value || "", false);
            }
        }
    }, [value, editor]);

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
            <style>{`
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #adb5bd;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .ProseMirror {
                    min-height: 300px;
                    outline: none;
                }
                .ProseMirror ul {
                    list-style-type: disc !important;
                    padding-left: 1.5em !important;
                }
                .ProseMirror ol {
                    list-style-type: decimal !important;
                    padding-left: 1.5em !important;
                }
                .ProseMirror blockquote {
                    border-left: 3px solid #e5e7eb;
                    padding-left: 1rem;
                    font-style: italic;
                }
                .ProseMirror h2 {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin-top: 1em;
                    margin-bottom: 0.5em;
                }
                .ProseMirror a {
                    color: #3b82f6;
                    text-decoration: underline;
                }
                .ProseMirror img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 0.5rem;
                }
                .ProseMirror strong {
                    font-weight: bold !important;
                }
                .ProseMirror em {
                    font-style: italic !important;
                }
                .ProseMirror u {
                    text-decoration: underline !important;
                }
            `}</style>
        </div>
    );
};

export default TiptapEditor;
