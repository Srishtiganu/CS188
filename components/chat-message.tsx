import type { Message } from "ai";
import { User, Bot, FileText, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
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
      className={`flex items-start gap-2 mb-2 select-none ${
        message.role === "user" ? "justify-start" : "justify-start"
      }`}
    >
      <div
        className={`flex items-center justify-center h-6 w-6 rounded-full ${
          message.role === "user" ? "bg-blue-100" : "bg-gray-100"
        }`}
      >
        {message.role === "user" ? (
          <User className="h-3 w-3 text-blue-600" />
        ) : (
          <Bot className="h-3 w-3 text-gray-600" />
        )}
      </div>
      <div
        className={`max-w-[80%] p-2 rounded-lg select-none ${
          message.role === "user" ? "bg-blue-100" : "bg-gray-100"
        }`}
      >
        {renderContent(message.content)}
      </div>
    </div>
  );
}

export default memo(ChatMessage);
