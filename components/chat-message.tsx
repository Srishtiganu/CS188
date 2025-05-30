import type { Message } from "ai";
import { User, Bot, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ComponentPropsWithoutRef } from "react";
import { memo } from "react";

interface ChatMessageProps {
  message: Message;
}

function ChatMessage({ message }: ChatMessageProps) {
  // Helper function to render message content
  const renderContent = (content: any) => {
    if (typeof content === "string") {
      return (
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
          {content}
        </ReactMarkdown>
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
