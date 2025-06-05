import type { Message } from "ai";
import { User, Bot, FileText, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex"; //to support latex rendering
import "katex/dist/katex.min.css";

import type { ComponentPropsWithoutRef } from "react";
import { memo, useState } from "react";

interface ChatMessageProps {
  message: Message;
}

function ChatMessage({ message }: ChatMessageProps) {
  const [isContextExpanded, setIsContextExpanded] = useState(false);

  // Helper function to render message content
  const renderContent = (content: any) => {
    if (typeof content === "string") {
      // Check if the content contains selected text context
      const hasContext = content.includes("Selected text from PDF:");
      let mainContent = content;
      let contextContent = "";

      if (hasContext) {
        const parts = content.split("Selected text from PDF:");
        mainContent = parts[0].trim();
        contextContent = parts[1].trim();
      }

      return (
        <div>
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              p: ({ children }) => (
                <p className="mb-1.5 last:mb-0 text-sm">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-4 mb-1.5 text-sm">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-4 mb-1.5 text-sm">{children}</ol>
              ),
              li: ({ children }) => <li className="mb-0.5">{children}</li>,
              code: (
                props: ComponentPropsWithoutRef<"code"> & { inline?: boolean }
              ) => {
                const { inline, children, ...rest } = props;
                if (inline) {
                  return (
                    <code
                      className="px-1 py-0.5 bg-gray-200 rounded text-xs"
                      {...rest}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <pre className="p-2 bg-gray-800 text-white rounded-md overflow-x-auto text-xs my-1.5">
                    <code className="block" {...rest}>
                      {children}
                    </code>
                  </pre>
                );
              },
            }}
          >
            {mainContent}
          </ReactMarkdown>

          {hasContext && (
            <div className="mt-2">
              <button
                onClick={() => setIsContextExpanded(!isContextExpanded)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
              >
                <FileText className="h-3 w-3" />
                <span>Selected context</span>
                {isContextExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              {isContextExpanded && (
                <div className="mt-1.5 p-2 bg-blue-50 rounded-md text-xs text-gray-700">
                  {contextContent}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (Array.isArray(content)) {
      return content.map((item, index) => {
        if (item.type === "text") {
          return <div key={index}>{renderContent(item.text)}</div>;
        }
        if (item.type === "file") {
          return (
            <div
              key={index}
              className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 p-1.5 rounded-md mb-1.5"
            >
              <FileText className="h-3 w-3" />
              <span>Attached file: {item.mimeType}</span>
            </div>
          );
        }
        return null;
      });
    }

    return <p className="text-xs text-gray-500 italic">Empty message</p>;
  };

  return (
    <div
      className={`mb-5 select-none ${
        message.role === "user"
          ? "flex justify-end"
          : "flex flex-col items-start"
      }`}
    >
      {/* Bot name label - above everything for non-user messages */}
      {message.role !== "user" && (
        <div className="text-sm text-gray-400 mb-1 font-medium ml-9">
          PaperClip
        </div>
      )}

      {message.role === "user" ? (
        /* User message - simple right-aligned layout */
        <div className="bg-orange-100 p-3 rounded-xl max-w-[80%] select-none">
          {renderContent(message.content)}
        </div>
      ) : (
        /* AI message - complex layout with profile picture */
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0"></div>
          <div className="p-0 max-w-[95%] select-none">
            {renderContent(message.content)}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ChatMessage);
