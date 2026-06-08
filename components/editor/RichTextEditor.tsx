"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading,
  Type,
  Table as TableIcon,
  Trash2,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({
  value,
  onChange,
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2],
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 border rounded-md bg-background",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    // This effect runs only on client-side after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!isMounted || !editor) {
    return (
      <div className="min-h-50 border rounded-md bg-muted/20 animate-pulse" />
    );
  }

  const addTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const isInTable = editor.isActive("table");

  return (
    <div className="border rounded-md bg-background">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""}
          title="Heading"
        >
          <Heading className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={editor.isActive("paragraph") ? "bg-accent" : ""}
          title="Paragraph"
        >
          <Type className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-accent" : ""}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-accent" : ""}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-accent" : ""}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-accent" : ""}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addTable}
          className={isInTable ? "bg-accent" : ""}
          title="Insert Table"
        >
          <TableIcon className="w-4 h-4" />
        </Button>

        {isInTable && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              title="Add column before"
            >
              <span className="text-xs">Col+</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Add column after"
            >
              <span className="text-xs">Col-</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              title="Add row before"
            >
              <span className="text-xs">Row+</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Add row after"
            >
              <span className="text-xs">Row-</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="text-destructive hover:text-destructive"
              title="Delete table"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Table styles for proper rendering */}
      <style jsx global>{`
        .ProseMirror table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .ProseMirror td,
        .ProseMirror th {
          border: 1px solid #d4d4d8;
          padding: 0.5rem;
          min-width: 4rem;
        }
        .ProseMirror th {
          background-color: #f4f4f5;
          font-weight: 600;
        }
        .ProseMirror .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background: rgba(200, 200, 255, 0.4);
          pointer-events: none;
        }
        .ProseMirror .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: #adf;
          pointer-events: none;
        }
      `}</style>

      <EditorContent editor={editor} />
    </div>
  );
}
